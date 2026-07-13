'use strict'

// Curated drawer navigation — the fixed editorial skeleton. Docs-team owned.
// Order of `sections` = order in the drawer, always present (unless hideWhenEmpty).
// Each `include` is a MATCHER against Antora's own navigation (built from each
// repo's nav.adoc), NOT a hand-written link list:
//   { component: 'name' }                     — that component's nav entries
//   { componentGlob: '*-extension-reference' } — every matching component (auto)
//   { ..., urlContains: ['/commands/', ...] }  — keep only entries under those paths
//   { ..., excludeUrlContains: ['/reference'] } — drop entries under those paths
// New pages appear automatically once they are in their repo's nav.adoc.
// See NAV-PLAN.md.

module.exports = {
  sections: [
    {
      title: 'Getting started',
      include: [
        // The home nav's "Reference Guides" hub is dropped here — it's now its
        // own top-level section below.
        { component: 'home', excludeUrlContains: ['/home/reference'] },
        // Tutorials nest under their own component title (matches breadcrumbs),
        // e.g. "Building An Axon Framework Application From Scratch".
        { component: 'axon-framework-5-getting-started', groupByComponent: true },
        { component: 'bikerental-demo', groupByComponent: true },
      ],
    },
    {
      // Familiar per-product tree (matches the classic reference nav): each
      // product's full nav nested under its own title. Redundant on purpose —
      // the semantic sections below re-surface the same pages by theme for
      // discovery, but engineers keep the complete product tree they expect.
      title: 'Reference guides',
      include: [
        { component: 'axon-framework-reference', groupByComponent: true },
        { component: 'axon-server-reference', groupByComponent: true },
        { component: 'synapse-reference', groupByComponent: true },
        { component: 'axoniq-platform-reference', groupByComponent: true },
      ],
    },
    {
      title: 'Core concepts',
      include: [
        { component: 'axon-framework-reference', urlContains: ['/messaging-concepts/', '/commands/', '/events/', '/queries/'] },
      ],
    },
    {
      title: 'Operations',
      include: [
        { component: 'axon-framework-reference', urlContains: ['/testing/', '/tuning/', '/monitoring/', '/spring-boot', '/modules/', '/conversion/'] },
      ],
    },
    {
      title: 'Migration (AF4 → AF5)',
      include: [
        { component: 'axon-framework-reference', urlContains: ['/migration/'] },
      ],
    },
    {
      title: 'Guides',
      include: [
        { component: 'identifier-generation-guide' },
        { component: 'message-handler-customization-guide' },
        { component: 'meta-annotations-guide' },
      ],
    },
    {
      title: 'Extensions',
      include: [
        // Each extension collapses under its own group (its title) instead of
        // dumping every extension's pages as flat top-level items.
        { componentGlob: '*-extension-reference', groupByComponent: true },
      ],
    },
    {
      title: 'Release notes',
      include: [
        { component: 'axon-framework-reference', urlContains: ['/release-notes/', '/known-issues'] },
      ],
    },
  ],
}
