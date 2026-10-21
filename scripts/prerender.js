// Runs after the two Vite builds (see "build" in package.json). Renders every
// route in src/routes.js to its own HTML file in dist/, with that page's title,
// description and canonical URL, then writes the sitemap from the same list.

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const { render, routes, notFoundRoute, canonicalUrl, pageFiles } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
)

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
  const pageTags = [...fontPreloads, ...preloadsFor(route.path)]
  const headTags = indexable ? [...pageTags, adSenseTag] : pageTags
  html = replaceTag(html, /\n {2}<\/head>/, `\n    ${headTags.join('\n    ')}\n  </head>`)
  html = replaceTag(html, /\n {2}<\/body>/, `\n    ${analyticsTag}\n  </body>`)

  const body = await render(route.path)
  const isNotFoundPage = body.includes('Page not found')
  if (indexable === isNotFoundPage) {
    throw new Error(`${route.path} rendered the wrong page. Check the pages map in src/App.jsx.`)
  }
  return replaceTag(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`)
}

// The AdSense publisher ID lives in one place: public/ads.txt.
const adsTxt = await readFile(path.join(root, 'public', 'ads.txt'), 'utf8')
const publisherId = adsTxt.match(/^google\.com,\s*(pub-\d+)\s*,/m)?.[1]
if (!publisherId) throw new Error('No Google publisher ID found in public/ads.txt')

// Loads Google AdSense, which also shows the consent message published in the
// AdSense account to visitors who need to see it. Real pages only: the 404
// page has no content, so it carries no ads.
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
// body. It goes on every page, the 404 page included, so broken links show up
// in the counts.
const analyticsTag = `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${WEB_ANALYTICS_TOKEN}"}'></script>`

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

for (const route of routes) {
  // "/" becomes dist/index.html and "/about" becomes dist/about.html. Cloudflare
  // Pages serves about.html at "/about". It would serve about/index.html at
  // "/about/" and redirect "/about" there, which is not the address we use.
  const file = path.join(dist, route.path === '/' ? 'index.html' : `${route.path}.html`)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, await buildPage(template, route, { indexable: true }))
}

// Cloudflare Pages serves dist/404.html, with a 404 status, for any URL that
// has no file. Without it, Pages would answer every unknown URL with the homepage.
await writeFile(
  path.join(dist, '404.html'),
  await buildPage(template, notFoundRoute, { indexable: false }),
)

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${canonicalUrl(route)}</loc></url>`),
  '</urlset>',
  '',
].join('\n')
await writeFile(path.join(dist, 'sitemap.xml'), sitemap)

await rm(ssrDir, { recursive: true, force: true })

console.log(`Prerendered ${routes.length} pages, 404.html and sitemap.xml`)
