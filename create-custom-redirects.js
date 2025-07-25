const axios = require('axios');
const {XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
const express = require('express');
const childProcess = require('child_process');
const fs = require('fs');
const {program} = require('commander');
const {rimraf} = require("rimraf");


/**
 * This script will create redirects for the legacy documentation URLs to the new documentation URLs.
 * It will also create a "latest" alias for the latest version of the Framework and Server reference documentation.
 *
 * All redirects will be checked for 404 errors, and the script will fail if any of the redirects are invalid.
 */


program
    .version('0.0.1', '-v, --version')
    .usage('[OPTIONS]...')
    .option('-b --build', 'Trigger Full Antora build')
    .parse(process.argv);
const options = program.opts()

/**
 * The site maps to check for redirects. It will have two kind of mappings:
 * - Full replace mappings, which will replace the URL with the target URL
 * - Rewrite mappings, which will rebase the url to a different location
 */
const sitemaps = [
    fs.readFileSync("old-sitemap.xml", "utf-8"),
]

const additionalOverrides = {
    "/axoniq-playbook-main/main/": "/playbook/"
}
/**
 * The mappings for the redirects, in which each url that starts with the key will be rewritten.
 * For example, "/axon-framework/modeling" will be rewritten to "/axon-framework-reference/latest/modeling"
 */
const rewriteMappings = {
    "/axon-framework/": `/axon-framework-reference/latest/`,
    "/extensions/spring-amqp": "/amqp-extension-reference/latest",
    "/extensions/jgroups": "/jgroups-extension-reference/latest",
    "/extensions/jobrunrpro": "/jobrunr-pro-extension-reference/latest",
    "/extensions/kafka": "/kafka-extension-reference/latest",
    "/extensions/kotlin": "/kotlin-extension-reference/latest",
    "/extensions/mongo": "/mongodb-extension-reference/latest",
    "/extensions/reactor/reactive-gateways": "/reactor-extension-reference/latest/reactor-gateways",
    "/extensions/reactor": "/reactor-extension-reference/latest",
    "/extensions/spring-aot": "/spring-aot-extension-reference/latest",
    "/extensions/spring-cloud": "/spring-cloud-extension-reference/latest",
    "/extensions/tracing": "/tracing-extension-reference/latest",
    "/appendices/rdbms-tuning": "/axon-framework-reference/latest/tuning/rdbms-tuning",
    "/appendices/message-handler-tuning": "/message-handler-customization-guide/latest",
    "/appendices/meta-annotations": "/meta-annotations-guide/latest",
    "/appendices/identifier-generation": "/identifier-generation-guide/latest",
    "/appendices/query-reference": "/axon-server-query-language-guide",
}

/**
 * The mappings for the redirects, in which each url that starts with the key will be replaced with the target URL.
 * For example, "/architecture-overview" will be replaced with "https://www.axoniq.io/concepts/cqrs-and-event-sourcing"
 */
const fullReplaceMappings = {
    "/architecture-overview": "https://www.axoniq.io/concepts/cqrs-and-event-sourcing",
    "/axon-server-introduction": "https://www.axoniq.io/products/axon-server",
    "/axon-server/": `/axon-server-reference/latest/`,
    "/release-notes/rn-axon-framework": `https://docs.axoniq.io/axon-framework-reference/latest/release-notes`,
    "/release-notes/rn-axon-server": `/axon-server-reference/latest/release-notes/`,
    "/release-notes/rn-extensions/rn-jgroups": "/jgroups-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-amqp": "/amqp-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-jobrunrpro": "/jobrunr-pro-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-multi-tenancy": "/multitenancy-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-kotlin": "/kotlin-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-kafka": "/kafka-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-mongo": "/mongodb-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-reactor": "/reactor-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-spring-aot": "/spring-aot-extension-reference/latest/release-notes/",
    "/release-notes/rn-extensions/rn-springcloud": "/spring-cloud-extension-reference/latest/release-notes/",
    // Redirect any unknown release notes to extension overview
    "/release-notes/rn-extensions": "/axon-framework-extensions/",
    // The quickstart no longer exists, redirect to the demo
    "/getting-started/quick-start": "/bikerental-demo/main",
    "/axon-server/migration": `/axon-server-reference/latest/axon-server/migration`,
    // This page no longer exists, redirect to its parent
    "/axon-framework/axon-framework-commands/modeling": "/axon-framework-reference/latest/axon-framework-commands",
}

// Redirect all unknown URLs to the home page
const redirectFallback = "/home/"

/**
 * Antora won't let us use the actual version and a "latest" modifier in the URL on Github Pages.
 * This script will create a "latest" alias for the latest version of the Framework and Server reference documentation.
 * This alias will redirect using a 301 to the actual version.
 */
const latestDefinitions = [
    {
        baseFolder: "axon-framework-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "message-handler-customization-guide",
        latestVersion: "4.11"
    },
    {
        baseFolder: "meta-annotations-guide",
        latestVersion: "4.11"
    },
    {
        baseFolder: "identifier-generation-guide",
        latestVersion: "4.11"
    },
    {
        baseFolder: "deadlines-guide",
        latestVersion: "4.11"
    },
    {
        baseFolder: "dead-letter-queue-guide",
        latestVersion: "4.11"
    },
    {
        baseFolder: "axon-server-reference",
        latestVersion: "v2025.1"
    },
    {
        baseFolder: "amqp-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "jgroups-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "jobrunr-pro-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "multitenancy-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "kotlin-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "kafka-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "mongodb-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "reactor-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "spring-aot-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "spring-cloud-extension-reference",
        latestVersion: "4.11"
    },
    {
        baseFolder: "tracing-extension-reference",
        latestVersion: "4.11"
    },
]
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


String.prototype.padRight = function (len) {
    if (this.length >= len) {
        return this;
    }
    return this + " ".repeat(len - this.length);
}


const parser = new XMLParser();

async function run() {

    const baseUrlForChecks = "http://localhost:3001"
    if (options.build) {
        await rimraf("build")
        childProcess.execSync("npx antora playbook.yaml", {stdio: 'inherit'})
    }

    latestDefinitions.forEach(definition => {
        console.log("Generating latest urls for " + definition.baseFolder + " now")
        fs.readdirSync(`build/site/${definition.baseFolder}/${definition.latestVersion}`, {recursive: true}).forEach(v => {
            if (v.endsWith(".html")) {
                console.log("Generating latest redirect for " + v)
                const folderName = v.replaceAll("index.html", "");
                fs.mkdirSync(`build/site/${definition.baseFolder}/latest/${folderName}`, {recursive: true})
                fs.writeFileSync(`build/site/${definition.baseFolder}/latest/${v}`, redirectTemplate.replaceAll("__TARGET_FILE__", `/${definition.baseFolder}/${definition.latestVersion}/` + folderName))
            } else {
            }
        })
    })


    async function checkUrlStatus(url) {
        let fullUrl = url
        if (url.startsWith("/")) {
            fullUrl = baseUrlForChecks + url
        }

        return await axios.get(fullUrl).then(response => {
            return response.status
        }).catch(error => {
            return error.response?.status ?? -1
        })
    }

    function determineRedirectUrlBasedOnMappings(url) {
        for (const [from, to] of Object.entries(fullReplaceMappings)) {
            if (url.startsWith(from)) {
                return to
            }
        }

        for (const [from, to] of Object.entries(rewriteMappings)) {
            if (url.startsWith(from)) {
                return url.replaceAll(from, to)
            }
        }

        return redirectFallback
    }

    const createRedirect = (oldUrl, newUrl) => {
        const fileContent = redirectTemplate.replaceAll("__TARGET_FILE__", newUrl)
        const path = "build/site" + oldUrl;
        const fileName = path + "/index.html";
        if (fs.existsSync(fileName)) {
            console.log("no need to create redirect for " + oldUrl + " => " + newUrl + " in " + path)
            return
        }
        fs.mkdir(path, {recursive: true}, (err) => {
            if (err) {
                console.error("Error creating directory: ", err)
            } else {
                fs.writeFileSync(fileName, fileContent)
                console.log("Created redirect for " + oldUrl + " => " + newUrl + " in " + path)
            }
        })
    }

    for (const sitemap of sitemaps) {
        const allUrls = parser.parse(sitemap).urlset.url
            .map(url => url.loc.split("/reference-guide")[1])
            .filter(url => url !== "/")
            .map(url => ({url, redirect: determineRedirectUrlBasedOnMappings(url)}))

        let invalidUrls = []
        for (const url of allUrls) {
            const status = await checkUrlStatus(url.redirect);
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
            createRedirect("/reference-guide" + url.url, url.redirect)
        })
    }

    Object.keys(additionalOverrides).forEach(oldUrl => {
        createRedirect(oldUrl, additionalOverrides[oldUrl])
    })

    server.close()

}

run()