// Builds the site the three ways it gets built, each in its own copy of the
// files, and checks the pages and the sitemap. Run with: npm test
//
// - On your own computer, with no Cloudflare variables.
// - A Cloudflare Pages preview of another branch.
// - The live site: Cloudflare Pages building main.
//
// Only the live site may carry Google AdSense and Cloudflare Web Analytics
// (see scripts/prerender.js). Expected values are [own working].
import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { cp, mkdtemp, readdir, readFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { pageFiles } from './pageFiles.js'
import { canonicalUrl, routes } from './routes.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const copies = []
after(() => Promise.all(copies.map((copy) => rm(copy, { recursive: true, force: true }))))

// This repository's git folder, so a copy can read the history for the
// sitemap's dates. null where there is no git.
function gitDir() {
  try {
    return execFileSync('git', ['rev-parse', '--absolute-git-dir'], {
      cwd: root,
      encoding: 'utf8',
    }).trim()
  } catch {
    return null
  }
}

/** Runs npm run build in a fresh copy, and gives back every file it wrote to dist/. */
async function build(cloudflare) {
  const copy = await mkdtemp(path.join(tmpdir(), 'uk-calculators-build-'))
  copies.push(copy)
  for (const entry of [
    'index.html',
    'package.json',
    'vite.config.js',
    'public',
    'scripts',
    'src',
  ]) {
    await cp(path.join(root, entry), path.join(copy, entry), { recursive: true })
  }
  await symlink(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir')
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('CF_PAGES')),
  )
  const git = gitDir()
  if (git) env.GIT_DIR = git
  await promisify(execFile)('npm', ['run', 'build'], { cwd: copy, env: { ...env, ...cloudflare } })

  const dist = path.join(copy, 'dist')
  const files = new Map()
  for (const name of await readdir(dist, { recursive: true })) {
    if (/\.(html|xml|js)$/.test(name))
      files.set(name, await readFile(path.join(dist, name), 'utf8'))
  }
  return files
}

const [local, preview, live] = await Promise.all([
  build({}),
  build({ CF_PAGES: '1', CF_PAGES_BRANCH: 'ads-and-housekeeping' }),
  build({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }),
])

const pageFile = (route) => (route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`)
const pagesOf = (files) => [...files].filter(([name]) => name.endsWith('.html'))
const headOf = (html) => html.slice(0, html.indexOf('</head>'))

const adsTxt = await readFile(path.join(root, 'public', 'ads.txt'), 'utf8')
const publisherId = adsTxt.match(/^google\.com,\s*(pub-\d+)\s*,/m)[1]
const adSenseTag = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${publisherId}" crossorigin="anonymous"></script>`
const analyticsTag =
  '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js"'
const anyThirdParty = /googlesyndication|adsbygoogle|cloudflareinsights|ca-pub-|data-cf-beacon/

test('build [own working] a build on your own computer has no AdSense or Web Analytics tag', () => {
  assert.equal(pagesOf(local).length, routes.length + 1)
  for (const [name, html] of pagesOf(local)) assert.doesNotMatch(html, anyThirdParty, name)
})

test('build [own working] a Cloudflare preview of another branch has neither tag', () => {
  assert.equal(pagesOf(preview).length, routes.length + 1)
  for (const [name, html] of pagesOf(preview)) assert.doesNotMatch(html, anyThirdParty, name)
})

test('build [own working] the live site has AdSense in the head of every real page', () => {
  for (const route of routes) {
    const html = live.get(pageFile(route))
    assert.ok(headOf(html).includes(adSenseTag), `${route.path} has no AdSense tag in its head`)
    assert.equal(html.split('adsbygoogle.js').length, 2, `${route.path} has more than one`)
  }
  // The 404 page has no content, so it carries no ads.
  assert.doesNotMatch(live.get('404.html'), /adsbygoogle/)
})

test('build [own working] the live site has Web Analytics on every page, the 404 page too', () => {
  for (const [name, html] of pagesOf(live)) {
    const body = html.slice(html.indexOf('<body>'))
    assert.ok(body.includes(analyticsTag), `${name} has no Web Analytics tag`)
    assert.equal(html.split('beacon.min.js').length, 2, `${name} has more than one`)
  }
})

test('build [own working] a share link leaves the address before AdSense can load', () => {
  for (const [files, name] of [
    [local, 'local'],
    [live, 'live'],
  ]) {
    const script = [...files.keys()].find((file) =>
      /^assets\/clearShareLink-[\w-]{8}\.js$/.test(file),
    )
    assert.ok(script, `${name}: no clearShareLink file in dist/assets`)
    assert.match(files.get(script), /window\.shareLinkHash = window\.location\.hash/)
    const tag = `<script src="/${script}"></script>`
    for (const route of routes) {
      const head = headOf(files.get(pageFile(route)))
      if (!route.sharedLinks) {
        assert.ok(!head.includes(tag), `${name}: ${route.path} does not need it`)
        continue
      }
      // A plain tag, with no async, defer or type, runs as soon as the browser
      // reaches it, and AdSense's tag comes after it.
      assert.ok(head.includes(tag), `${name}: ${route.path} is missing it`)
      if (name === 'live') assert.ok(head.indexOf(tag) < head.indexOf(adSenseTag), route.path)
    }
  }
})

test('build [own working] every sitemap address has the date its page shows', () => {
  const sitemap = local.get('sitemap.xml')
  for (const route of routes) {
    const entry = sitemap.match(
      new RegExp(`<url><loc>${canonicalUrl(route)}</loc>(?:<lastmod>([\\d-]+)</lastmod>)?</url>`),
    )
    assert.ok(entry, `${route.path} is not in the sitemap`)
    const lastmod = entry[1]
    const html = local.get(pageFile(route))
    const shown = [...html.matchAll(/<time dateTime="([\d-]+)">/g)].map((match) => match[1])
    if (shown.length > 0) {
      // The latest one, as a calculator page can show its own and its guide's.
      assert.equal(lastmod, shown.sort().at(-1), route.path)
    } else if (lastmod !== undefined) {
      // A page that shows no date has the date of the last commit to its file.
      const file = `src/pages/${pageFiles[route.path]}.jsx`
      const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
        cwd: root,
        encoding: 'utf8',
      }).trim()
      assert.equal(lastmod, committed, route.path)
    }
    if (lastmod !== undefined) assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, route.path)
  }
})
