var figlet = require('figlet');

module.exports.register = () => {

    figlet('AxonIQ Library', {font: 'Soft'}, function(err, data) {
        if (err) {
            console.log('Something went wrong while printing the banner...');
            console.dir(err);
            return;
        }
        console.log("\n\n")
        console.log(data)
        console.log("\n\n")
    });
}
