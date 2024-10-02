module.exports.register = function () {
    this
        .on('contextStarted', () => {
            console.time('AxonIQ Documentation built in')
        })
        .on('contextClosed', () => {
            console.timeEnd('AxonIQ Documentation built in')
        })
}
