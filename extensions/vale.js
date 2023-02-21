module.exports.register = function ({ config }) {
    const execSync = require('child_process').execSync;
    const { valeConfig } = config
    const logger = this.getLogger('vale-extension')

    this.on('sitePublished', () => {

        var command = "vale --no-wrap --sort build";
        if (valeConfig) {
            command = `vale --no-wrap --sort --config ${valeConfig} build`;
        }

        logger.info("checking for writing style issues...");
        logger.debug(`running "${command}"`);
        var time = new Date();
        try {
            code = execSync(command, {stdio: 'inherit'});
        } catch (err) {
            logger.debug(err);
            this.stop(1);
        } finally {
            time = (new Date() - time) / 1000
            logger.info("writing style check completed in %s seconds", time);
        }
    })
}


