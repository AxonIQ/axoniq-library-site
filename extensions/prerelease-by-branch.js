/**
 * Determines whether a component version is a prerelease based on the branch it comes from, rather than the
 * prerelease flag in its antora.yml. Release branches are created from main/master, and therefore inherit
 * the prerelease flag meant for the development version.
 *
 * - Versions from release branches are released. A release branch ends with a version followed by ".x"
 *   (e.g. "axon-5.4.x"), or matches the regular expression in the `release_branch_pattern` extension option.
 * - Versions from other branches (e.g. main or master) are prereleases, but only for components that also have
 *   versions from release branches. Components that are only published from main are left untouched.
 * - Versions that don't look like a version number (e.g. "axonserver-ee-2025.2.x") are left untouched, as marking
 *   them as released would make Antora consider them the latest version.
 */
module.exports.register = function ({ config }) {
    const logger = this.getLogger('prerelease-by-branch')
    const releaseBranchPattern = new RegExp(config.releaseBranchPattern ?? '-\\d+(\\.\\d+)*\\.x$')
    const versionPattern = /^v?\d+(\.\d+)*$/

    const isReleaseOrigin = (origin) => origin.reftype === 'tag' || releaseBranchPattern.test(origin.refname)

    this.on('contentAggregated', ({ contentAggregate }) => {
        const componentsWithReleases = new Set(contentAggregate
            .filter(({ origins }) => origins.every(isReleaseOrigin))
            .map(({ name }) => name))

        for (const componentVersion of contentAggregate) {
            const { name, version, origins } = componentVersion
            if (!componentsWithReleases.has(name)) continue
            const isRelease = origins.every(isReleaseOrigin)
            if (isRelease && !versionPattern.test(String(version))) {
                logger.info(`Leaving prerelease flag of ${name}@${version} as is, as it isn't a version number`)
                continue
            }
            const prerelease = !isRelease
            if (Boolean(componentVersion.prerelease) !== prerelease) {
                const refs = origins.map((origin) => origin.refname).join(', ')
                logger.info(`Marking ${name}@${version} as ${prerelease ? 'prerelease' : 'released'} (from ${refs})`)
                componentVersion.prerelease = prerelease
            }
        }
    })
}
