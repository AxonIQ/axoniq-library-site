const {writeFileSync, readFileSync, readdirSync} = require("fs");

const template = `
<!DOCTYPE html>
<meta charset="utf-8">
<script>location="__TARGET_FILE__"</script>
<meta http-equiv="refresh" content="0; url=__TARGET_FILE__">
<meta name="robots" content="noindex">
<title>Redirect Notice</title>
<h1>Redirect Notice</h1>
<p>The page you requested has been relocated to <a href="__TARGET_FILE__">__TARGET_FILE__</a>.</p>
`


readdirSync("build/site", {recursive: true}).forEach(file => {
    if (file.endsWith("index.html") && file !== "index.html") {
        const parts = file.split("/");
        const directoryName = parts[parts.length - 2]
        const targetDirectory = parts.slice(0, parts.length - 3).join("/")

        console.log(file, directoryName, targetDirectory)
        const redirect = template.replaceAll("__TARGET_FILE__", directoryName + "/")
        writeFileSync("build/site/" + targetDirectory + ".html", redirect, {flag: 'w'})

    }
})