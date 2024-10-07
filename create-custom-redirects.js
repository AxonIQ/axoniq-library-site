const axios = require('axios');
const {XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
const express = require('express');
const childProcess = require('child_process');
const fs = require('fs');

const latestFrameworkVersion = "4.10"
const latestServerVersion = "v2024.1"
const latestDefinitions = [
    {
        baseFolder: "axon-framework-reference",
        latestVersion: latestFrameworkVersion
    },
    {
        baseFolder: "axon-server-reference",
        latestVersion: latestServerVersion
    }
]


const commander = require('commander');
const {rimraf} = require("rimraf");
const app = express()
app.use(express.static('build/site'))
const server = app.listen(3001, () => {
    console.log(`Started serving files on port 3001!`)
})

const redirectTemplate = `
<!DOCTYPE html>
<meta charset="utf-8">
<script>location="__TARGET_FILE__"</script>
<meta http-equiv="refresh" content="0; url=__TARGET_FILE__">
<meta name="robots" content="noindex">
<title>Redirect Notice</title>
<h1>Redirect Notice</h1>
<p>The page you requested has been relocated to <a href="__TARGET_FILE__">__TARGET_FILE__</a>.</p>
`

commander
    .version('0.0.1', '-v, --version')
    .usage('[OPTIONS]...')
    .option('-c --check', 'Checks the urls')
    .option('-b --build', 'Trigger Antora build')
    .option('-l --local', 'Will run against the locally built Antora')
    .parse(process.argv);

async function run() {

    const options = commander.opts()

    let baseUrlForChecks = "https://docs.axoniq.io"
    if (options.local) {
        // Run the script against the local Antora build
        console.log("Running against local Antora")
        baseUrlForChecks = "http://localhost:3001"

        if(options.build) {
            await rimraf("build")
            childProcess.execSync("npx antora playbook.yaml", {stdio: 'inherit'})
        }
    }

    const parser = new XMLParser();

    const standardReplaceMapping = {
        "/axon-framework/": `/axon-framework-reference/${latestFrameworkVersion}/`,
        "/axon-server/introduction": `/axon-server-reference/${latestServerVersion}/`,
        "/axon-server/": `/axon-server-reference/${latestServerVersion}/axon-server/`,
        "/extensions/spring-amqp": "/amqp-extension-reference",
        "/extensions/jgroups": "/jgroups-extension-reference",
        "/extensions/jobrunrpro": "/jobrunr-pro-extension-reference/main",
        "/extensions/kafka": "/kafka-extension-reference",
        "/extensions/kotlin": "/kotlin-extension-reference",
        "/extensions/mongo": "/mongodb-extension-reference",
        "/extensions/reactor/reactive-gateways": "/reactor-extension-reference/reactor-gateways",
        "/extensions/reactor": "/reactor-extension-reference",
        "/extensions/spring-aot": "/spring-aot-extension-reference/main",
        "/extensions/spring-cloud": "/spring-cloud-extension-reference",
        "/extensions/tracing": "/tracing-extension-reference",
        "/appendices/rdbms-tuning": "/rdbms-tuning-guide/",
        "/appendices/message-handler-tuning": "/message-handler-tuning-guide",
        "/appendices/meta-annotations": "/meta-annotations-guide",
        "/appendices/identifier-generation": "/identifier-generation-guide",
        "/appendices/query-reference": "/axon-server-query-language-guide",
    }

    function determineRedirect(url) {
        if (url.startsWith("/architecture-overview")) {
            // We don't have these pages yet. Redirect to the concepts page for now
            return "https://www.axoniq.io/concepts/cqrs-and-event-sourcing"
        }

        if (url.startsWith("/axon-server-introduction")) {
            return "https://www.axoniq.io/products/axon-server"
        }

        if (url.startsWith("/release-notes/rn-axon-framework")) {
            return `https://docs.axoniq.io/axon-framework-reference/${latestFrameworkVersion}/release-notes`
        }

        if (url.startsWith("/release-notes/rn-axon-server")) {
            return `/axon-server-reference/${latestServerVersion}/release-notes/`
        }
        // The release notes for the extensions are not available yet. Redirect to the extensions page for now
        if (url.startsWith("/release-notes/rn-extensions")) {
            return "/axon-framework-extensions/"
        }
        // The release notes for the extensions are not available yet. Redirect to the extensions page for now
        if (url.startsWith("/getting-started/quick-start")) {
            return "/bikerental-demo/main"
        }
        // The release notes for the extensions are not available yet. Redirect to the extensions page for now
        if (url.startsWith("/axon-server/migration")) {
            return `/axon-server-reference/${latestServerVersion}/axon-server/migration`
        }

        // This page no longer exists
        if (url.startsWith("/axon-framework/axon-framework-commands/modeling")) {
            return determineRedirect("/axon-framework/axon-framework-commands")
        }

        for (const [from, to] of Object.entries(standardReplaceMapping)) {
            if (url.startsWith(from)) {
                return url.replaceAll(from, to)
            }
        }


        return "/home/"
    }

    String.prototype.padRight = function (len) {
        if (this.length >= len) {
            return this;
        }
        return this + " ".repeat(len - this.length);
    }

    async function checkUrlValid(url) {
        let fullUrl = url
        if (url.startsWith("/")) {
            fullUrl = baseUrlForChecks + url
        }

        return await axios.get(fullUrl).then(response => {
            return response.status
        }).catch(error => {
            return error.response?.status
        })
    }

    axios.get("https://legacydocs.axoniq.io/reference-guide/sitemap.xml").then(async response => {
        let data = parser.parse(response.data);
        const allUrls = data.urlset.url
            .map(url => url.loc.split("/reference-guide")[1])
            .filter(url => url !== "/")
            .map(url => ({url, redirect: determineRedirect(url)}))

        let invalidUrls = []
        for (const url of allUrls) {
            const status = await checkUrlValid(url.redirect);
            if (status !== 200) {
                invalidUrls.push({...url, status})
            }
            console.log(url.url.padRight(100), "=>", url.redirect.padRight(100), " => ", status)
        }

        if (invalidUrls.length > 0) {
            console.error("Invalid urls found:")
            invalidUrls.forEach(url => {
                console.error(url.url + " => " + url.redirect + " => " + url.status)
            })
            process.exitCode = 1
            process.exit()
        }

        console.log("All urls are valid")
        allUrls.forEach(url => {
            const fileContent = redirectTemplate.replaceAll("__TARGET_FILE__", url.redirect)
            const path = "build/site/reference-guide" + url.url;
            const fileName = path + "/index.html";
            if(fs.existsSync(fileName)) {
                console.log("no need to create redirect for " + url.url + " => " + url.redirect + " in " + path)
                return
            }
            fs.mkdir(path, {recursive: true}, (err) => {
            if (err) {
              console.error("Error creating directory: ", err)
            } else {
                fs.writeFileSync(fileName, fileContent)
                console.log("Created redirect for " + url.url + " => " + url.redirect + " in " + path)
            }
          })
        })

        latestDefinitions.forEach(definition => {
            console.log("Generating latest urls for " + definition.baseFolder + " now")
            fs.readdirSync(`build/site/${definition.baseFolder}/${definition.latestVersion}`, {recursive: true}).forEach(v => {
                if(v.endsWith(".html")) {
                    console.log("Generating latest redirect for " + v)
                    fs.writeFileSync(`build/site/${definition.baseFolder}/latest/${v}`, redirectTemplate.replaceAll("__TARGET_FILE__", `/${definition.baseFolder}/${definition.latestVersion}/` + v.replaceAll("index.html", "")))
                } else {
                    fs.mkdirSync(`build/site/${definition.baseFolder}/latest/${v}`, {recursive: true})
                }
            })
        })

        server.close()
    })

}

run()