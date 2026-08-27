'use strict'

// nav-assembler — assembles the drawer navigation from Antora's own navigation
// model instead of hand-authored markup. See NAV-PLAN.md.
//
// Version-aware: it emits ONE drawer partial per component-version
// (nav-cv-<component>-<version>) plus a default (nav-generated). The drawer for a
// given page is chosen at render time by the `navPartial` helper from the page's
// component + version, so older versions render their own nav (e.g. the legacy
// "older releases" tree) exactly as the original theme did via page.navigation.
//
// Within a drawer, the curated sections (nav-manifest.js, docs-team owned) apply
// where the focused component's nav fits them; when a version's nav doesn't fit
// any category (legacy lines), that version's own nav is rendered directly.

const manifest = require('../nav-manifest.js')

function register () {
  const logger = this.getLogger('nav-assembler')

  this.on('navigationBuilt', ({ contentCatalog, navigationCatalog, uiCatalog }) => {
    try {
      let count = 0
      contentCatalog.getComponents().forEach((c) => {
        ;(c.versions || []).forEach((v) => {
          const html = buildDrawerHtml(contentCatalog, navigationCatalog, { component: c.name, version: v.version })
          putPartial(uiCatalog, partialKey(c.name, v.version), html)
          count++
        })
      })
      // Default drawer (latest everything) for anything without a specific match.
      putPartial(uiCatalog, 'nav-generated', buildDrawerHtml(contentCatalog, navigationCatalog, null))
      logger.info('assembled ' + count + ' version-aware drawers (+ default)')
    } catch (e) {
      logger.error('nav-assembler failed: ' + (e && e.stack ? e.stack : e))
    }
  })
}

// ---- partial registration -------------------------------------------------

function sanitize (s) { return String(s == null ? '' : s).replace(/[^a-z0-9]+/gi, '-').toLowerCase() }
function partialKey (component, version) { return 'nav-cv-' + sanitize(component + '-' + version) }

function putPartial (uiCatalog, stem, html) {
  const path = 'partials/' + stem + '.hbs'
  const existing = uiCatalog.findByType('partial').find((f) => f.path === path)
  if (existing) existing.contents = Buffer.from(html)
  else uiCatalog.addFile({ contents: Buffer.from(html), path, stem, type: 'partial' })
}

// ---- component resolution -------------------------------------------------

function globToRe (glob) {
  return new RegExp('^' + glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
}

// Resolve the versions to use for an include. When a matched component IS the
// focused one, use the focused version (version-awareness); otherwise the latest
// version that actually has navigation.
function resolveComponents (contentCatalog, navigationCatalog, inc, focus) {
  const out = []
  contentCatalog.getComponents().forEach((c) => {
    var match = (inc.component && c.name === inc.component) ||
      (inc.componentGlob && globToRe(inc.componentGlob).test(c.name))
    if (!match) return
    var chosen
    if (focus && c.name === focus.component && (navigationCatalog.getNavigation(c.name, focus.version) || []).length) {
      chosen = focus.version
    } else {
      var candidates = []
      if (c.latest && c.latest.version != null) candidates.push(c.latest.version)
      ;(c.versions || []).forEach((v) => { if (candidates.indexOf(v.version) < 0) candidates.push(v.version) })
      chosen = candidates.find((v) => (navigationCatalog.getNavigation(c.name, v) || []).length)
      if (chosen == null) chosen = candidates[0]
    }
    if (chosen != null) out.push({ name: c.name, version: chosen, title: c.title || c.name })
  })
  return out
}

// ---- Antora nav item -> {title, url, children} ----------------------------

function text (s) { return String(s == null ? '' : s).replace(/<[^>]+>/g, '').trim() }

// A nav entry authored with the `[.advanced-framework]` role renders with that
// class in item.content. text() strips all markup, so detect the marker here and
// carry it as a flag; renderItem re-applies the class on the rebuilt entry.
function hasAdvanced (s) { return /\badvanced-framework\b/.test(String(s == null ? '' : s)) }

function normalize (item) {
  return { title: text(item.content), url: item.url || null, advanced: hasAdvanced(item.content), children: (item.items || []).map(normalize) }
}

function subtreeUrls (node) {
  var urls = node.url ? [node.url] : []
  ;(node.children || []).forEach((c) => { urls = urls.concat(subtreeUrls(c)) })
  return urls
}

function matchesUrl (node, needles) {
  if (!needles || !needles.length) return true
  return subtreeUrls(node).some((u) => needles.some((n) => u.indexOf(n) >= 0))
}

// Flattened top-level items (untitled menus are unwrapped) — used for category
// matching, which keys off individual entries' urls.
function topLevelItems (navigationCatalog, name, version) {
  var out = []
  ;(navigationCatalog.getNavigation(name, version) || []).forEach((menu) => {
    var entries = (menu.items && menu.items.length) ? menu.items : [menu]
    entries.forEach((it) => {
      if (!it || (!it.content && !it.url && !(it.items || []).length)) return
      var node = normalize(it)
      if (node.title || node.url || node.children.length) out.push(node)
    })
  })
  return out
}

// Menu-preserving tree — a titled menu (e.g. "Axon Framework 4.x") becomes a
// group; an untitled menu is unwrapped. Used for the legacy/own-nav fallback so
// the version's own grouping (4.x / 3.x / …) is kept.
function menuGroups (navigationCatalog, name, version) {
  var out = []
  ;(navigationCatalog.getNavigation(name, version) || []).forEach((menu) => {
    var node = normalize(menu)
    if (!node.title && node.children.length) out = out.concat(node.children)
    else if (node.title || node.url || node.children.length) out.push(node)
  })
  return out
}

function collectItems (contentCatalog, navigationCatalog, inc, focus, report) {
  var items = []
  resolveComponents(contentCatalog, navigationCatalog, inc, focus).forEach(({ name, version, title }) => {
    var perComponent = topLevelItems(navigationCatalog, name, version)
      .filter((n) => matchesUrl(n, inc.urlContains))
      .filter((n) => !inc.excludeUrlContains || !matchesUrl(n, inc.excludeUrlContains))
    if (!perComponent.length) return
    if (focus && name === focus.component) report.focusContributed = true
    if (inc.groupByComponent) items.push({ title: title, url: null, children: perComponent })
    else items = items.concat(perComponent)
  })
  return items
}

// ---- HTML (matches the existing drawer markup contract) -------------------

function esc (s) { return String(s).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])) }
function attr (s) { return String(s).replace(/[&"<>]/g, (m) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }[m])) }

function renderItem (node, counter) {
  var label = esc(node.title)
  // title gives a native tooltip on hover; the browser renders it in the top
  // layer, so it is never clipped by the drawer's overflow (unlike a CSS bubble).
  if (node.advanced) label = '<span class="advanced-framework" title="Axoniq Framework">' + label + '</span>'
  if (node.children && node.children.length) {
    var id = 'nav-' + (counter.n++)
    var href = node.url ? ' data-href="' + attr(node.url) + '"' : ''
    // When the parent item has its own page, make the label a real link nested
    // inside <summary>: browsers give a focusable/interactive descendant (a real
    // <a href>) priority over the <details> disclosure toggle, so clicking the
    // label navigates while clicking elsewhere in the row still expands/
    // collapses. Pure grouping headers (no url) keep the plain, non-navigable
    // <span> — there's nowhere for them to go.
    var labelHtml = node.url
      ? '<a class="nav-parent-link" href="' + attr(node.url) + '"><span>' + label + '</span></a>'
      : '<span>' + label + '</span>'
    var inner = node.children.map((c) => renderItem(c, counter)).join('')
    return '<li><details class="nav-group" data-nav-id="' + id + '">' +
      '<summary class="nav-link nav-parent"' + href + '>' + labelHtml + '</summary>' +
      '<ul class="nav-tree">' + inner + '</ul></details></li>'
  }
  if (node.url) return '<li><a class="nav-link" data-href="' + attr(node.url) + '" href="' + attr(node.url) + '">' + label + '</a></li>'
  return '<li><span class="nav-link nav-text">' + label + '</span></li>'
}

function sectionHtml (title, items, counter) {
  return '<section class="nav-section">' +
    '<h3 class="nav-section-title">' + esc(title) + '</h3>' +
    '<ul class="nav-tree">' + items.map((it) => renderItem(it, counter)).join('') + '</ul>' +
    '</section>\n'
}

function buildDrawerHtml (contentCatalog, navigationCatalog, focus) {
  var counter = { n: 0 }
  var report = { focusContributed: false }
  var sections = ''
  manifest.sections.forEach((section) => {
    var items = []
    ;(section.include || []).forEach((inc) => { items = items.concat(collectItems(contentCatalog, navigationCatalog, inc, focus, report)) })
    // Skip empty sections: on current versions the categories are populated (so
    // always shown); on versions that don't fit them (legacy), they'd be empty
    // and are hidden in favour of the focused version's own nav.
    if (!items.length) return
    sections += sectionHtml(section.title, items, counter)
  })
  var lead = ''
  // Version doesn't fit the curated categories (e.g. legacy "older releases"):
  // lead with the focused version's own nav directly, like production, then the
  // cross-product sections below for discovery.
  if (focus && !report.focusContributed) {
    var own = menuGroups(navigationCatalog, focus.component, focus.version)
    if (own.length) {
      var comp = contentCatalog.getComponent(focus.component)
      lead = sectionHtml((comp && comp.title) || focus.component, own, counter)
    }
  }
  return '{{!-- GENERATED by lib/nav-assembler.js — version-aware. Do not edit. --}}\n' + lead + sections
}

module.exports = { register }
