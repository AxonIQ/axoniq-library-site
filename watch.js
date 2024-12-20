const express = require('express');
const app = express()
const chokidar = require('chokidar');
const childProcess = require("child_process");

const watcher = chokidar.watch('localLinks', {ignored: /^\./, persistent: true});

let building = false
let triggeredDuringBuild = false
const rebuild = (path) => {
    console.log(`File ${path} has been changed, rebuilding site...`)
    if (building) {
        console.log("Triggered during build, waiting for build to finish...")
        triggeredDuringBuild = true
        return
    }
    triggeredDuringBuild = false
    building = true;
    const process = childProcess.spawn("npx", ["antora", "playbook-dev.yaml"], {stdio: 'inherit'})
    process.on("exit", (code) => {
        if (code === 0) {
            console.log("Site rebuilt successfully!")
        } else {
            console.error("Failed to rebuild site!")
        }
        building = false
        if (triggeredDuringBuild) {
            rebuild()
        }
    })
}

watcher
    .on('change', rebuild)
    .on('unlink', rebuild)
    .on('error', rebuild)

app.use(express.static('build/site'))

app.listen(3000, () => {
    console.log(`Started serving files on port 3000!`)
})
rebuild("none")
