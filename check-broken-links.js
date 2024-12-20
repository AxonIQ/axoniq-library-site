const blc = require('broken-link-checker');
const express = require('express');
const fs = require('fs');

const app = express()
app.use(express.static('build/site'))


const server = app.listen(3000, () => {
    console.log(`Started serving files on port 3000!`)
})

String.prototype.trimUrl = function () {
    return this.replaceAll("http://localhost:3000", "")
}

const brokenLinks = []
const siteChecker = new blc.SiteChecker({
        excludeExternalLinks: true,
        honorRobotExclusions: false,
        maxSocketsPerHost: 3,
        maxSockets: 10,
    }, {
        link: (result) => {
            if (result.broken && result.url.resolved) {
                let statusCode = result.http.response.statusCode;
                console.log(`Broken link: ${result.url.resolved?.trimUrl()} (${statusCode}) on page ${result.base.resolved?.trimUrl()}`)
                brokenLinks.push(result.url.resolved.trimUrl())
            }
        },
        end: () => {
            server.close()
            if (brokenLinks.length > 0) {
                process.exitCode = 1
            }
        }
    }
)

siteChecker.enqueue("http://localhost:3000/home/index.html")