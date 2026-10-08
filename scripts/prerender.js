// Runs after the two Vite builds (see "build" in package.json). Renders every
// route in src/routes.js to its own HTML file in dist/, with that page's title,
// description and canonical URL, then writes the sitemap from the same list.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const { render, routes, notFoundRoute, canonicalUrl } = await import(
  pathToFileURL(path.join(ssrDir, 'entry-server.js')).href
)

const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

// Swaps one placeholder tag from index.html, and fails the build if it is missing.
function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`index.html is missing a tag matching ${pattern}`)
  return html.replace(pattern, () => replacement)
}

function buildPage(template, route, { indexable }) {
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
    indexable ? `<link rel="canonical" href="${url}" />` : '<meta name="robots" content="noindex" />',
  )
  html = replaceTag(
    html,
    /\s*<meta property="og:url"[^>]*>/,
    indexable ? `\n    <meta property="og:url" content="${url}" />` : '',
  )
  html = replaceTag(html, /\s*<!-- The tags below.*?-->/s, '')

  const body = render(route.path)
  const isNotFoundPage = body.includes('Page not found')
  if (indexable === isNotFoundPage) {
    throw new Error(`${route.path} rendered the wrong page. Check the pages map in src/App.jsx.`)
  }
  return replaceTag(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`)
}

const template = await readFile(path.join(dist, 'index.html'), 'utf8')

for (const route of routes) {
  // "/" becomes dist/index.html, "/about" becomes dist/about/index.html.
  const file = path.join(dist, route.path, 'index.html')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, buildPage(template, route, { indexable: true }))
}

// Vercel serves dist/404.html, with a 404 status, for any URL that has no file.
await writeFile(
  path.join(dist, '404.html'),
  buildPage(template, notFoundRoute, { indexable: false }),
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
