const express = require('express');
const app = express()
app.use(express.static('build/site'))

app.listen(3000, () => {
    console.log(`Started serving files on port 3000!`)
})
