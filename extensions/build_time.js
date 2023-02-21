module.exports.register = function () {
    this
        .on('contextStarted', () => {
            console.time('AxonIQ Library built in')
        })
        .on('contextClosed', () => {
            console.timeEnd('AxonIQ Library built in')
        })
}
