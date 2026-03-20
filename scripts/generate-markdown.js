#!/usr/bin/env node

/**
 * generate-markdown.js
 *
 * Converts all built Antora HTML pages to clean Markdown (.md) files and
 * generates llm-full.txt by concatenating them in nav order.
 *
 * Key design decisions:
 *  - Extracts only <article class="doc"> — no nav, header, footer, or chrome
 *  - Pre-processes HTML with cheerio before conversion (admonitions, code blocks)
 *  - Converts HTML → Markdown fully in-process via node-html-markdown
 *  - Uses cheerio DOM parsing for nav sidebar 
 *  - Uses pure Node.js file discovery (no shell find)
 *
 * Page order for llm-full.txt is determined in two passes:
 *  1. Local content/ components → ordered via their nav.adoc files
 *  2. Remote repo components    → ordered by parsing the nav sidebar
 *     embedded in each built HTML page (works locally and in CI)
 *
 * llm.txt / llms.txt are manually maintained at the repo root and
 * copied into build/site/ by this script.
 * +
 *
 * Usage:
 *   npm run build:md
 *   node scripts/generate-markdown.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const cheerio             = require('cheerio');
const { NodeHtmlMarkdown } = require('node-html-markdown');

const SCRIPTS_DIR  = __dirname;
const REPO_DIR     = path.resolve(SCRIPTS_DIR, '..');
const SITE_DIR     = path.resolve(SCRIPTS_DIR, '../build/site');
const CONTENT_DIR  = path.resolve(SCRIPTS_DIR, '../content');
const BASE_URL     = 'https://docs.axoniq.io';
const LLM_FULL_OUT = path.join(SITE_DIR, 'llm-full.txt');
const LLM_SRC      = path.join(REPO_DIR, 'llm.txt');
const LLM_OUT      = path.join(SITE_DIR, 'llm.txt');
const LLMS_OUT     = path.join(SITE_DIR, 'llms.txt');

// ─────────────────────────────────────────────────────────────
// Markdown converter — configured once, reused for every page
// ─────────────────────────────────────────────────────────────

const nhm = new NodeHtmlMarkdown(
  {
    keepDataImages: false,
    useLinkReferenceDefinitions: false,
    useInlineLinks: true,
  },
  {
    // Antora wraps every paragraph in <div class="paragraph"> — unwrap it
    'div': {
      spaceIfReplace: false,
      postprocess: ({ node, options }) => undefined,
    },
  }
);

// ─────────────────────────────────────────────────────────────
// HTML pre-processing + conversion
// ─────────────────────────────────────────────────────────────

/**
 * Pre-process admonition blocks (NOTE / TIP / WARNING / CAUTION / IMPORTANT).
 *
 * Antora renders these as a table with an icon cell and a content cell.
 * We replace the whole structure with a clean <blockquote> so the
 * markdown converter produces readable output.
 *
 * Before:
 *   <div class="admonitionblock warning">
 *     <table><tr>
 *       <td class="icon"><i class="fa icon-warning" title="Warning"></i></td>
 *       <td class="content">...</td>
 *     </tr></table>
 *   </div>
 *
 * After:
 *   <blockquote><p><strong>⚠️ WARNING</strong></p>...content...</blockquote>
 */
const ADMONITION_TYPES = ['note', 'tip', 'warning', 'caution', 'important'];
const ADMONITION_EMOJI = { note: '📝', tip: '💡', warning: '⚠️', caution: '🔥', important: '❗' };

function preprocessAdmonitions($, article) {
  article.find('.admonitionblock').each((_, el) => {
    const classes = ($(el).attr('class') || '').split(/\s+/);
    const type    = classes.find(c => ADMONITION_TYPES.includes(c)) || 'note';
    const emoji   = ADMONITION_EMOJI[type] || '';
    const content = $(el).find('td.content').html() || '';
    $(el).replaceWith(
      `<blockquote><p><strong>${emoji} ${type.toUpperCase()}</strong></p>${content}</blockquote>`
    );
  });
}

/**
 * Clean up code listing blocks.
 *
 * Antora wraps <pre><code> in two extra divs (.listingblock > .content).
 * We strip those wrappers and ensure the code element has a clean
 * language-xxx class so node-html-markdown emits a fenced code block.
 *
 * We also strip callout markers (<i class="conum">) and their paired
 * bold numbers (<b>(N)</b>) from code text so code samples stay clean.
 */
function preprocessCodeBlocks($, article) {
  article.find('.listingblock').each((_, el) => {
    const code = $(el).find('code');
    const lang = code.attr('data-lang') || '';

    // Strip callout icons and their paired bold numbers from code content
    code.find('i.conum').remove();
    code.find('b').each((__, b) => {
      if (/^\(\d+\)$/.test($(b).text().trim())) $(b).remove();
    });

    // Set a clean language class; remove all other attributes
    code.attr('class', lang ? `language-${lang}` : null);
    code.removeAttr('data-lang');

    const pre = $(el).find('pre');
    pre.removeAttr('class'); // drop highlightjs classes
    $(el).replaceWith(pre);
  });
}

/**
 * Extract the article content from an Antora HTML page, pre-process it,
 * and convert it to clean GFM Markdown.
 *
 * Returns null if the page has no <article class="doc"> (e.g. 404 page).
 */
function pageToMarkdown(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $    = cheerio.load(html);

  const article = $('article.doc');
  if (!article.length) return null;

  // ── Remove UI chrome that shouldn't appear in markdown ───────
  article.find('nav.pagination').remove();       // prev / next page links
  article.find('.edit-this-page').remove();      // "Edit this page" link
  article.find('.page-actions').remove();        // actions toolbar

  // ── Strip Antora heading anchor links ────────────────────────
  // Antora adds <a class="anchor" href="#..."></a> inside every heading.
  // These produce noisy [](#anchor) in the markdown output.
  article.find('h1 a.anchor, h2 a.anchor, h3 a.anchor, h4 a.anchor, h5 a.anchor, h6 a.anchor').remove();

  // ── Pre-process Antora-specific structures ────────────────────
  preprocessAdmonitions($, article);
  preprocessCodeBlocks($, article);

  const cleanHtml = article.html();
  if (!cleanHtml || !cleanHtml.trim()) return null;

  return nhm.translate(cleanHtml).trim();
}

// ─────────────────────────────────────────────────────────────
// Path helpers
// ─────────────────────────────────────────────────────────────

/**
 * Given a component name, module name, and adoc page path,
 * return the expected index.html path in build/site.
 *
 * Antora URL rules:
 *   ROOT module  → site/{comp}/{page}/index.html  (no module segment)
 *   Other module → site/{comp}/{module}/{page}/index.html
 *   index.adoc   → no page segment (just the directory)
 */
function xrefToHtmlPath(componentName, moduleName, adocPath) {
  const withoutExt = adocPath.replace(/\.adoc$/, '');
  const isIndex    = withoutExt === 'index' || withoutExt.endsWith('/index');
  const pagePart   = isIndex
    ? withoutExt.replace(/(\/index|^index)$/, '')
    : withoutExt;

  const isRoot = !moduleName || moduleName === 'ROOT';
  const parts  = [SITE_DIR, componentName];
  if (!isRoot)         parts.push(moduleName);
  if (pagePart !== '') parts.push(pagePart);
  parts.push('index.html');

  return path.join(...parts);
}

/** Convert a built index.html path to its .md output path (sibling file). */
function htmlToMdPath(htmlPath) {
  const rel     = path.relative(SITE_DIR, htmlPath);  // e.g. "axon-server-installation/developer/ubuntu/index.html"
  const pageDir = path.dirname(rel);                   // e.g. "axon-server-installation/developer/ubuntu"

  if (pageDir === '.') return path.join(SITE_DIR, 'index.md');

  const parent   = path.dirname(pageDir);
  const pageName = path.basename(pageDir);
  return path.join(SITE_DIR, parent, pageName + '.md');
}

/** Convert a built index.html path to its canonical public URL. */
function htmlToUrl(htmlPath) {
  const rel     = path.relative(SITE_DIR, htmlPath);
  const pageDir = path.dirname(rel);
  if (pageDir === '.') return BASE_URL + '/';
  return `${BASE_URL}/${pageDir.replace(/\\/g, '/')}/`;
}

// ─────────────────────────────────────────────────────────────
// File discovery — pure Node.js, no shell subprocess
// ─────────────────────────────────────────────────────────────

/**
 * Recursively find all index.html files under dir.
 * Skips directories starting with _ (Antora static assets) or .
 */
function findIndexFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findIndexFiles(fullPath, results);
    } else if (entry.name === 'index.html') {
      results.push(fullPath);
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// Nav parsing — source nav.adoc (local content/ components)
// ─────────────────────────────────────────────────────────────

/**
 * Parse a nav.adoc file and return an array of { moduleName, adocPath }.
 *
 * Handled xref formats:
 *   xref:page.adoc[Title]           → ROOT module
 *   xref:module:page.adoc[Title]    → named module
 *   xref:comp:module:page.adoc[T]   → cross-component → skipped
 *   https://...                     → external link  → skipped
 */
function parseNavAdoc(content) {
  const entries = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^\*+\s+xref:([^\[]+)\[/);
    if (!m) continue;
    const parts = m[1].trim().split(':');
    if (parts.length === 1) {
      entries.push({ moduleName: 'ROOT', adocPath: parts[0] });
    } else if (parts.length === 2) {
      entries.push({ moduleName: parts[0], adocPath: parts[1] });
    }
    // 3+ parts = cross-component xref → skip
  }
  return entries;
}

// ─────────────────────────────────────────────────────────────
// Nav parsing — built HTML sidebar (remote repo components)
// ─────────────────────────────────────────────────────────────

/**
 * Parse the nav sidebar embedded in a built Antora HTML page using
 * cheerio for reliable DOM traversal (not regex string matching).
 *
 * Returns ordered index.html paths for the component in nav order.
 */
function parseHtmlNav(htmlFilePath) {
  const html = fs.readFileSync(htmlFilePath, 'utf8');
  const $    = cheerio.load(html);

  const navContainer = $('.nav-container');
  const component    = navContainer.attr('data-component');
  const version      = navContainer.attr('data-version');

  if (!component) return [];

  const rootDir = version
    ? path.join(SITE_DIR, component, version)
    : path.join(SITE_DIR, component);

  const orderedPaths = [];
  const seen         = new Set();

  navContainer.find('a.nav-link').each((_, el) => {
    let href = $(el).attr('href') || '';
    href = href.replace(/#.*$/, '').replace(/^\.\//, ''); // strip fragment + leading ./

    const resolved = href === '' || href.endsWith('/')
      ? path.join(rootDir, href, 'index.html')
      : path.join(rootDir, href);

    if (!seen.has(resolved) && fs.existsSync(resolved)) {
      seen.add(resolved);
      orderedPaths.push(resolved);
    }
  });

  return orderedPaths;
}

// ─────────────────────────────────────────────────────────────
// Build ordered page list (two-pass)
// ─────────────────────────────────────────────────────────────

const orderedHtmlPaths = [];
const seenHtmlPaths    = new Set();

// ── Pass 1: local content/ components via nav.adoc ───────────

const contentDirs = fs.readdirSync(CONTENT_DIR)
  .map(d => path.join(CONTENT_DIR, d))
  .filter(d => fs.statSync(d).isDirectory());

for (const compDir of contentDirs) {
  const antoraYmlPath = path.join(compDir, 'antora.yml');
  if (!fs.existsSync(antoraYmlPath)) continue;

  const yml       = fs.readFileSync(antoraYmlPath, 'utf8');
  const nameMatch = yml.match(/^name:\s*(.+)$/m);
  if (!nameMatch) continue;
  const componentName = nameMatch[1].trim();

  // Extract nav file list from antora.yml
  const navRelPaths = [];
  let inNav = false;
  for (const line of yml.split('\n')) {
    if (/^nav:/.test(line))                  { inNav = true;  continue; }
    if (inNav && /^\s+-\s+(.+)$/.test(line)) { navRelPaths.push(line.match(/^\s+-\s+(.+)$/)[1].trim()); }
    else if (inNav && /^\w/.test(line))      { inNav = false; }
  }

  for (const navRelPath of navRelPaths) {
    const navFile = path.join(compDir, navRelPath);
    if (!fs.existsSync(navFile)) continue;

    for (const { moduleName, adocPath } of parseNavAdoc(fs.readFileSync(navFile, 'utf8'))) {
      const htmlPath = xrefToHtmlPath(componentName, moduleName, adocPath);
      if (fs.existsSync(htmlPath) && !seenHtmlPaths.has(htmlPath)) {
        seenHtmlPaths.add(htmlPath);
        orderedHtmlPaths.push(htmlPath);
      }
    }
  }
}

// ── Pass 2: remote repo components via built HTML nav ─────────

const allHtmlFiles = findIndexFiles(SITE_DIR).sort();

// Group pages not yet ordered by their component+version key.
// We use a lightweight regex on the raw string here (not a full parse)
// since we only need two attribute values — not a full DOM traversal.
const remoteGroups = new Map();
for (const htmlPath of allHtmlFiles) {
  if (seenHtmlPaths.has(htmlPath)) continue;
  const raw = fs.readFileSync(htmlPath, 'utf8');
  const m   = raw.match(/data-component="([^"]+)"\s+data-version="([^"]*)"/);
  const key = m ? `${m[1]}@${m[2]}` : '__ungrouped__';
  if (!remoteGroups.has(key)) remoteGroups.set(key, new Set());
  remoteGroups.get(key).add(htmlPath);
}

for (const [, groupPaths] of remoteGroups) {
  // Use the first page of the group to read the nav sidebar order
  const navOrdered = parseHtmlNav([...groupPaths][0]);

  for (const htmlPath of navOrdered) {
    if (!seenHtmlPaths.has(htmlPath) && groupPaths.has(htmlPath)) {
      seenHtmlPaths.add(htmlPath);
      orderedHtmlPaths.push(htmlPath);
    }
  }
  // Append any group pages that weren't found in the nav
  for (const htmlPath of groupPaths) {
    if (!seenHtmlPaths.has(htmlPath)) {
      seenHtmlPaths.add(htmlPath);
      orderedHtmlPaths.push(htmlPath);
    }
  }
}

// Final fallback: pages discovered on disk but missed by both passes
for (const htmlPath of allHtmlFiles) {
  if (!seenHtmlPaths.has(htmlPath)) {
    seenHtmlPaths.add(htmlPath);
    orderedHtmlPaths.push(htmlPath);
  }
}

// ─────────────────────────────────────────────────────────────
// Convert HTML → Markdown for every page
// ─────────────────────────────────────────────────────────────

let success = 0;
let failed  = 0;
const generatedPages = []; // { mdPath, htmlUrl, title }

for (const htmlPath of orderedHtmlPaths) {
  const mdPath  = htmlToMdPath(htmlPath);
  const htmlUrl = htmlToUrl(htmlPath);
  const relPath = path.relative(SITE_DIR, mdPath);

  try {
    const markdown = pageToMarkdown(htmlPath);

    if (!markdown) {
      console.log(`⏭️  Skipped (no article content): ${path.relative(SITE_DIR, htmlPath)}`);
      failed++;
      continue;
    }

    fs.mkdirSync(path.dirname(mdPath), { recursive: true });
    fs.writeFileSync(mdPath, markdown);

    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title      = titleMatch ? titleMatch[1].trim() : path.basename(path.dirname(htmlPath));

    console.log(`✅  ${relPath}`);
    generatedPages.push({ mdPath, htmlUrl, title });
    success++;
  } catch (err) {
    console.log(`❌  Failed: ${relPath} — ${err.message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────
// Build llm-full.txt
// ─────────────────────────────────────────────────────────────

console.log('\nBuilding llm-full.txt...');

const chunks = [];

for (const { mdPath, htmlUrl, title } of generatedPages) {
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  chunks.push(
    `${'='.repeat(80)}`,
    `# ${title}`,
    `URL: ${htmlUrl}`,
    `${'='.repeat(80)}`,
    '',
    mdContent,
    '',
  );
}

fs.writeFileSync(LLM_FULL_OUT, chunks.join('\n'));
console.log(`✅  llm-full.txt (${generatedPages.length} pages)`);

// ─────────────────────────────────────────────────────────────
// Copy manually maintained llm.txt → build/site/
// ─────────────────────────────────────────────────────────────

console.log('\nCopying llm.txt...');

if (fs.existsSync(LLM_SRC)) {
  const content = fs.readFileSync(LLM_SRC, 'utf8');
  fs.writeFileSync(LLM_OUT,  content);
  fs.writeFileSync(LLMS_OUT, content);
  console.log('✅  llm.txt / llms.txt');
} else {
  console.warn('⚠️  llm.txt not found at repo root — skipping');
}

console.log(`\nDone: ${success} pages converted, ${failed} skipped/failed.`);
console.log(`Output: ${SITE_DIR}`);
