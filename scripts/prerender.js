// Runs after the two Vite builds (see "build" in package.json). Renders every
// route in src/routes.js to its own HTML file in dist/, with that page's title,
// description and canonical URL, then writes the sitemap from the same list.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const { render, routes, notFoundRoute, canonicalUrl, pageFiles } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
)

// Ads and visitor statistics belong on the live site only. Cloudflare Pages
// sets CF_PAGES to 1 and CF_PAGES_BRANCH to the branch it is building (see
// "Environment variables" in Cloudflare's build configuration docs), and main
// is the live site. Preview builds of other branches, and builds on your own
// computer, get neither script. src/build.test.js checks all three.
const production = process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH === 'main'

const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

// Swaps one placeholder tag from index.html, and fails the build if it is missing.
function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`index.html is missing a tag matching ${pattern}`)
  return html.replace(pattern, () => replacement)
}

async function buildPage(template, route, { indexable }) {
  const title = escapeHtml(route.title)
  const description = escapeHtml(route.description)
  const url = canonicalUrl(route)

  let html = template
  html = replaceTag(html, /<title>.*?<\/title>/, `<title>${title}</title>`)
  html = replaceTag(
    html,
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`,
  )
  html = replaceTag(
    html,
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${title}" />`,
  )
  html = replaceTag(
    html,
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${description}" />`,
  )
  html = replaceTag(
    html,
    /<link rel="canonical"[^>]*>/,
    indexable
      ? `<link rel="canonical" href="${url}" />`
      : '<meta name="robots" content="noindex" />',
  )
  html = replaceTag(
    html,
    /\s*<meta property="og:url"[^>]*>/,
    indexable ? `\n    <meta property="og:url" content="${url}" />` : '',
  )
  html = replaceTag(html, /\s*<!-- The tags below.*?-->/s, '')
  const headTags = [
    ...fontPreloads,
    ...preloadsFor(route.path),
    // Before the AdSense tag, so it runs first. See src/clearShareLink.js.
    ...(route.sharedLinks ? [clearShareLinkTag] : []),
    ...(production && indexable ? [adSenseTag] : []),
  ]
  html = replaceTag(html, /\n {2}<\/head>/, `\n    ${headTags.join('\n    ')}\n  </head>`)
  if (production) html = replaceTag(html, /\n {2}<\/body>/, `\n    ${analyticsTag}\n  </body>`)

  const body = await render(route.path)
  const isNotFoundPage = body.includes('Page not found')
  if (indexable === isNotFoundPage) {
    throw new Error(`${route.path} rendered the wrong page. Check the pages map in src/App.jsx.`)
  }
  return {
    html: replaceTag(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`),
    updated: latestUpdatedDate(body),
    guidesLinked: guides.filter((guide) => body.includes(`href="${guide.path}"`)),
  }
}

// The standalone guides, which the homepage and the guides index list.
const guides = routes.filter((route) => route.guide)

// The latest "Updated" or "Last updated" date a page shows, as 'YYYY-MM-DD',
// or null if it shows none. A calculator page can show two: its own, at the
// top, and its guide's. Both come from <time dateTime> (CalculatorLayout.jsx
// and LastUpdated.jsx). React may put <!-- --> between the word and the date.
function latestUpdatedDate(body) {
  const dates = [...body.matchAll(/updated:?(?:<!-- -->)?\s*<time dateTime="([\d-]+)"/gi)]
  return (
    dates
      .map((match) => match[1])
      .sort()
      .at(-1) ?? null
  )
}

// The date of the last commit that changed a file, as 'YYYY-MM-DD', for pages
// that show no date. null if git cannot tell. In a shallow clone, one with only
// the latest commits, the oldest commit looks as if it added every file, so a
// date from that commit is not used.
const shallowCommits = new Set()
async function readShallowCommits() {
  shallowCommits.clear()
  try {
    const shallowFile = path.resolve(root, git('rev-parse', '--git-path', 'shallow'))
    if (!existsSync(shallowFile)) return
    const text = await readFile(shallowFile, 'utf8')
    for (const commit of text.split('\n').filter(Boolean)) shallowCommits.add(commit)
  } catch {
    // No git here, such as a copy of the files. Pages without a date get none.
  }
}
await readShallowCommits()

function git(...args) {
  // GIT_TERMINAL_PROMPT=0 stops git waiting for a password that never comes.
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  const options = { cwd: root, encoding: 'utf8', stdio: 'pipe', env, timeout: 120_000 }
  return execFileSync('git', args, options).trim()
}

function lastCommitDate(file) {
  try {
    const [commit, date] = git('log', '-1', '--format=%H %cs', '--', file).split(' ')
    return commit && !shallowCommits.has(commit) ? date : null
  } catch {
    return null
  }
}

// Cloudflare Pages clones only the latest commit (a preview's sitemap showed
// this on 29 October 2026), so there the build fetches the rest of the history
// when a page needs it. The repository is small, so this takes seconds. If it
// fails, those pages get no lastmod and the build carries on.
async function fetchFullHistory() {
  if (process.env.CF_PAGES !== '1' || shallowCommits.size === 0) return
  const before = new Set(shallowCommits)
  let problem = ''
  try {
    git('fetch', '--unshallow', '--quiet')
  } catch (error) {
    problem = `: ${error.message.split('\n')[0]}`
  }
  // git can finish without an error and still fetch nothing, such as when the
  // clone has no remote, so check whether the oldest commits it has changed.
  await readShallowCommits()
  const fetched = [...before].some((commit) => !shallowCommits.has(commit))
  console.log(
    fetched
      ? 'Fetched the git history for the sitemap dates'
      : `Could not fetch the git history${problem}`,
  )
}

// The AdSense publisher ID lives in one place: public/ads.txt.
const adsTxt = await readFile(path.join(root, 'public', 'ads.txt'), 'utf8')
const publisherId = adsTxt.match(/^google\.com,\s*(pub-\d+)\s*,/m)?.[1]
if (!publisherId) throw new Error('No Google publisher ID found in public/ads.txt')

// Loads Google AdSense, which also shows the consent message published in the
// AdSense account to visitors who need to see it. Real pages on the live site
// only: the 404 page has no content, so it carries no ads. It stays a plain tag
// in the head, where AdSense looks for it when it checks the site.
const adSenseTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${publisherId}" crossorigin="anonymous"></script>`

// Cloudflare Web Analytics counts page views without cookies. This token only
// says which site the counts belong to. It is not a secret: it is printed in
// the HTML of every page, like the AdSense publisher ID, so it is safe to keep
// here. It comes from Web Analytics in the Cloudflare dashboard, where the site
// is set to "Enable with JS Snippet installation" so that Cloudflare does not
// add a second copy of the tag by itself.
const WEB_ANALYTICS_TOKEN = '074d4e07fc9847858772a08fa95d9bd3'
if (!/^[0-9a-f]{32}$/.test(WEB_ANALYTICS_TOKEN)) {
  throw new Error('The Cloudflare Web Analytics token should be 32 letters and numbers')
}

// The tag as Cloudflare's documentation gives it, placed at the end of the
// body. It goes on every page of the live site, the 404 page included, so
// broken links show up in the counts.
const analyticsTag = `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${WEB_ANALYTICS_TOKEN}"}'></script>`

// Takes a share link's figures out of the address bar before any other script
// runs (see src/clearShareLink.js). It is a plain script, not a module, so the
// browser runs it as soon as it reaches it. Its comments are left out, and its
// name carries a hash of what is left, like Vite's own files, so browsers can
// keep it for a year (see public/_headers).
const clearShareLink = (await readFile(path.join(root, 'src', 'clearShareLink.js'), 'utf8'))
  .replace(/^\s*\/\/.*\n/gm, '')
  .trim()
const clearShareLinkHash = createHash('sha256').update(clearShareLink).digest('base64url')
const clearShareLinkFile = `assets/clearShareLink-${clearShareLinkHash.slice(0, 8)}.js`
await writeFile(path.join(dist, clearShareLinkFile), `${clearShareLink}\n`)
const clearShareLinkTag = `<script src="/${clearShareLinkFile}"></script>`

// The two font files are fetched early, so text does not wait for the
// stylesheet to ask for them. Vite adds a hash to each file name.
const assets = await readdir(path.join(dist, 'assets'))
const fontPreloads = ['sora', 'figtree'].map((font) => {
  const file = assets.find((name) => name.startsWith(`${font}-latin-wght-normal`))
  if (!file) throw new Error(`No ${font} font file found in dist/assets`)
  return `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />`
})

// Each page has its own JavaScript file (see src/pageLoader.js), and that file may
// use files shared with other pages. Vite lists them in its manifest. Each
// page asks for them in its head, so they load alongside the main file rather
// than after it. The manifest is then deleted, so it is not published.
const manifestDir = path.join(dist, '.vite')
const manifest = JSON.parse(await readFile(path.join(manifestDir, 'manifest.json'), 'utf8'))
await rm(manifestDir, { recursive: true, force: true })

function preloadsFor(routePath) {
  const files = []
  const visit = (key) => {
    // index.html is the main file, which the page already loads.
    if (key === 'index.html') return
    const chunk = manifest[key]
    if (!chunk) throw new Error(`Vite built no file for ${key}. Check src/pageFiles.js.`)
    if (files.includes(chunk.file)) return
    files.push(chunk.file)
    for (const next of chunk.imports ?? []) visit(next)
  }
  visit(`src/pages/${pageFiles[routePath]}.jsx`)
  return files.map((file) => `<link rel="modulepreload" crossorigin href="/${file}" />`)
}

const template = await readFile(path.join(dist, 'index.html'), 'utf8')

// When each page last changed, for the sitemap: the date it shows, or for a
// page that shows none, the date of the last commit to its file in src/pages,
// or the newest date of the guides it links to if that is later.
const lastChanged = new Map()
const guidesOnPage = new Map()

for (const route of routes) {
  // "/" becomes dist/index.html and "/about" becomes dist/about.html. Cloudflare
  // Pages serves about.html at "/about". It would serve about/index.html at
  // "/about/" and redirect "/about" there, which is not the address we use.
  const file = path.join(dist, route.path === '/' ? 'index.html' : `${route.path}.html`)
  await mkdir(path.dirname(file), { recursive: true })
  const { html, updated, guidesLinked } = await buildPage(template, route, { indexable: true })
  await writeFile(file, html)
  lastChanged.set(route, updated)
  guidesOnPage.set(route, guidesLinked)
}
const pageSource = (route) => `src/pages/${pageFiles[route.path]}.jsx`
const showNoDate = routes.filter((route) => !lastChanged.get(route))
if (showNoDate.some((route) => !lastCommitDate(pageSource(route)))) await fetchFullHistory()
for (const route of showNoDate) {
  // The homepage and the guides index list the guides from src/routes.js, so
  // adding or updating a guide changes them without changing their own file.
  // They take the newest "Last updated" date of the guides they list when that
  // is later. If git cannot tell when the page's own file last changed, the
  // page still gets no date, as that file may have changed after every guide.
  const committed = lastCommitDate(pageSource(route))
  const listed = guidesOnPage.get(route).map((guide) => lastChanged.get(guide))
  lastChanged.set(route, committed && [committed, ...listed].filter(Boolean).sort().at(-1))
}

// Cloudflare Pages serves dist/404.html, with a 404 status, for any URL that
// has no file. Without it, Pages would answer every unknown URL with the homepage.
const notFoundPage = await buildPage(template, notFoundRoute, { indexable: false })
await writeFile(path.join(dist, '404.html'), notFoundPage.html)

const sitemapEntry = (route) => {
  const date = lastChanged.get(route)
  const lastmod = date ? `<lastmod>${date}</lastmod>` : ''
  return `  <url><loc>${canonicalUrl(route)}</loc>${lastmod}</url>`
}
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(sitemapEntry),
  '</urlset>',
  '',
].join('\n')
await writeFile(path.join(dist, 'sitemap.xml'), sitemap)

await rm(ssrDir, { recursive: true, force: true })

console.log(`Prerendered ${routes.length} pages, 404.html and sitemap.xml`)
console.log(
  production
    ? 'Built for the live site, with the AdSense and Web Analytics tags'
    : 'Not built for the live site, so there is no AdSense or Web Analytics tag',
)
const undated = routes.filter((route) => !lastChanged.get(route)).map((route) => route.path)
if (undated.length > 0) {
  console.log(`No date found for ${undated.join(', ')}, so the sitemap has no lastmod for them`)
}
