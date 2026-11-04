// Verifies the npm packages used by the helper scripts (serve.js, watch.js, check-broken-links.js,
// create-custom-redirects.js) still load and expose the API those scripts rely on.
// The Antora build covers only a few dependencies, so major bumps of the rest would otherwise go unnoticed.
const assert = require('node:assert/strict');
const http = require('node:http');

async function main() {
    const express = require('express');
    const app = express();
    app.use(express.static('.'));
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const {port} = server.address();
    const response = await fetch(`http://localhost:${port}/package.json`);
    assert.equal(response.status, 200, 'express.static should serve files');
    await new Promise((resolve) => server.close(resolve));

    const chokidar = require('chokidar');
    const watcher = chokidar.watch('.', {ignored: /^\./, persistent: true});
    assert.equal(typeof watcher.on, 'function', 'chokidar.watch should return a watcher');
    await watcher.close();

    const {program} = require('commander');
    program.option('-b --build', 'Trigger Full Antora build').parse(['node', 'script', '-b']);
    assert.equal(program.opts().build, true, 'commander should parse options');

    const {XMLParser, XMLBuilder, XMLValidator} = require('fast-xml-parser');
    assert.equal(new XMLParser().parse('<a><b>1</b></a>').a.b, 1, 'fast-xml-parser should parse');
    assert.equal(typeof XMLBuilder, 'function');
    assert.equal(typeof XMLValidator.validate, 'function');

    const {rimraf} = require('rimraf');
    assert.equal(typeof rimraf, 'function', 'rimraf should export a function');

    assert.equal(typeof require('axios').get, 'function', 'axios.get should exist');
    assert.equal(typeof require('broken-link-checker').SiteChecker, 'function', 'broken-link-checker.SiteChecker should exist');

    const figlet = require('figlet');
    assert.ok(figlet.textSync('Axoniq').length > 0, 'figlet should render text');

    console.log('Tooling smoke test passed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
