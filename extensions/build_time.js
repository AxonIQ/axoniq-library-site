module.exports.register = function () {
    this
        .on('contextStarted', () => {
            console.time('Axoniq Documentation built in')
        })
        .on('contextClosed', () => {
            console.timeEnd('Axoniq Documentation built in')
        })
}
