'use strict'

/**
 * Antora extension that marks component versions as prerelease based on their
 * origin branch name. This allows the lunr search extension (with
 * `index_latest_only: true`) to exclude development branches from the search
 * index without requiring `prerelease: true` to be set in each repo's
 * antora.yml (which would bleed into release branches created from them).
 *
 * Configuration in the playbook:
 *
 *   antora:
 *     extensions:
 *     - require: ./extensions/prerelease-branches.js
 *       prerelease_branches:
 *         - main
 *         - master
 */
module.exports.register = function ({ config }) {
  const prereleaseBranches = config.prerelease_branches || ['main', 'master']

  this.on('contentAggregated', ({ contentAggregate }) => {
    const logger = this.getLogger('prerelease-branches')
    for (const componentVersionBucket of contentAggregate) {
      if (!componentVersionBucket.origins?.length) continue
      const prereleaseBranch = componentVersionBucket.origins.find((origin) =>
        prereleaseBranches.includes(origin.refname)
      )
      if (prereleaseBranch && !componentVersionBucket.prerelease) {
        componentVersionBucket.prerelease = true
        logger.info(
          `Marked ${componentVersionBucket.name} ${componentVersionBucket.version} as prerelease (branch: ${prereleaseBranch.refname})`
        )
      }
    }
  })
}
