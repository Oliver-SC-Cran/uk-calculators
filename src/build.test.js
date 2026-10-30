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
import { cp, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { pageFiles } from './pageFiles.js'
import { canonicalUrl, findRoute, routes } from './routes.js'

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

/**
 * Runs npm run build:site in a fresh copy, and gives back every file it wrote to
 * dist/. Only the build on your own computer reads this repository's history:
 * a Cloudflare build may fetch more of it (scripts/prerender.js), and that must
 * not happen to your own copy. edit, if given, changes the copy before the build.
 */
async function build(cloudflare, edit) {
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
  if (edit) await edit(copy)
  await symlink(path.join(root, 'node_modules'), path.join(copy, 'node_modules'), 'dir')
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('CF_PAGES')),
  )
  const git = gitDir()
  if (git && !cloudflare.CF_PAGES) env.GIT_DIR = git
  // Otherwise git finds no repository, not even one in a folder above the copy.
  else env.GIT_CEILING_DIRECTORIES = path.dirname(copy)
  // build:site, not build, which runs these tests first and so would start
  // them again in every copy.
  await promisify(execFile)('npm', ['run', 'build:site'], {
    cwd: copy,
    env: { ...env, ...cloudflare },
  })

  const dist = path.join(copy, 'dist')
  const files = new Map()
  for (const name of await readdir(dist, { recursive: true })) {
    if (/\.(html|xml|js)$/.test(name))
      files.set(name, await readFile(path.join(dist, name), 'utf8'))
  }
  return files
}

// One guide dated later than any commit, as when a guide is added or updated
// after the homepage and the guides index last changed.
const LATER = '2099-12-31'
const firstGuide = routes.find((route) => route.guide)
async function dateFirstGuideLater(copy) {
  const file = path.join(copy, 'src', 'pages', `${pageFiles[firstGuide.path]}.jsx`)
  const source = await readFile(file, 'utf8')
  const edited = source.replace(/const LAST_UPDATED = '[\d-]+'/, `const LAST_UPDATED = '${LATER}'`)
  assert.notEqual(edited, source, `${file} has no LAST_UPDATED date to change`)
  await writeFile(file, edited)
}

const [local, preview, live, laterGuide] = await Promise.all([
  build({}),
  build({ CF_PAGES: '1', CF_PAGES_BRANCH: 'ads-and-housekeeping' }),
  build({ CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }),
  build({}, dateFirstGuideLater),
])

const pageFile = (route) => (route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`)
const pagesOf = (files) => [...files].filter(([name]) => name.endsWith('.html'))
const headOf = (html) => html.slice(0, html.indexOf('</head>'))
const datesShown = (html) =>
  [...html.matchAll(/<time dateTime="([\d-]+)">/g)].map((match) => match[1])
const lastmodIn = (sitemap, route) =>
  sitemap.match(
    new RegExp(`<url><loc>${canonicalUrl(route)}</loc>(?:<lastmod>([\\d-]+)</lastmod>)?</url>`),
  )

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
    const entry = lastmodIn(sitemap, route)
    assert.ok(entry, `${route.path} is not in the sitemap`)
    const lastmod = entry[1]
    const html = local.get(pageFile(route))
    const shown = datesShown(html)
    if (shown.length > 0) {
      // The latest one, as a calculator page can show its own and its guide's.
      assert.equal(lastmod, shown.sort().at(-1), route.path)
    } else if (lastmod !== undefined) {
      // A page that shows no date has the date of the last commit to its file,
      // or the newest date of the guides it lists (the homepage and the guides
      // index) if that is later.
      const file = `src/pages/${pageFiles[route.path]}.jsx`
      const committed = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
        cwd: root,
        encoding: 'utf8',
      }).trim()
      const listed = routes
        .filter((guide) => guide.guide && html.includes(`href="${guide.path}"`))
        .flatMap((guide) => datesShown(local.get(pageFile(guide))))
      assert.equal(lastmod, [committed, ...listed].sort().at(-1), route.path)
    }
    if (lastmod !== undefined) assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, route.path)
  }
})

// Cloudflare Pages clones only the latest commit, and npm run build runs these
// tests there before building. In a clone like that git cannot tell when the
// homepage's own file last changed, so it gets no date and the next test has
// nothing to check. The build itself then fetches the history it needs.
function historyTooShort() {
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: root,
      encoding: 'utf8',
    }).trim()
    return (
      shallow === 'true' && lastmodIn(local.get('sitemap.xml'), findRoute('/'))[1] === undefined
    )
  } catch {
    return false
  }
}

test(
  'build [own working] the homepage and the guides index take the date of their newest guide',
  {
    skip:
      (!gitDir() && 'needs the git history') ||
      (historyTooShort() && 'needs more of the git history than this shallow clone has'),
  },
  () => {
    // In this build the first guide is dated later than any commit, so the two
    // pages that list it take its date, though neither page's own file changed.
    const sitemap = laterGuide.get('sitemap.xml')
    const listing = [firstGuide, findRoute('/'), findRoute('/guides')]
    for (const route of routes) {
      const lastmod = lastmodIn(sitemap, route)?.[1]
      assert.equal(lastmod === LATER, listing.includes(route), `${route.path} is dated ${lastmod}`)
    }
    // In the real build too, neither page is dated before the newest guide.
    const real = local.get('sitemap.xml')
    const newestGuide = routes
      .filter((route) => route.guide)
      .map((route) => lastmodIn(real, route)[1])
      .sort()
      .at(-1)
    for (const route of [findRoute('/'), findRoute('/guides')]) {
      const lastmod = lastmodIn(real, route)[1]
      assert.ok(lastmod >= newestGuide, `${route.path} is dated ${lastmod}, before ${newestGuide}`)
    }
  },
)

test('build [own working] no calculator says it was updated before its own guide', () => {
  // The date at the top of a calculator page is when the page last changed, so
  // it is never older than the "Last updated" date on the guide under it.
  for (const route of routes) {
    const html = local.get(pageFile(route))
    const top = html.match(/calc-head__meta[^]*?<time dateTime="([\d-]+)"/)?.[1]
    if (!top) continue
    const guide = [...html.matchAll(/Last updated: (?:<!-- -->)?<time dateTime="([\d-]+)"/g)]
    for (const [, date] of guide) {
      assert.ok(top >= date, `${route.path} says Updated ${top} but its guide says ${date}`)
    }
  }
})

test('build [own working] the homepage links to every calculator', () => {
  // The homepage lists the calculators by hand, in groups (src/pages/Home.jsx).
  const home = local.get('index.html')
  for (const route of routes.filter((each) => each.name && !each.guide)) {
    assert.ok(home.includes(`href="${route.path}"`), `the homepage does not link to ${route.path}`)
  }
})

test('build [own working] Cloudflare builds with the Node.js version in .node-version', async () => {
  // .node-version pins the Node.js version Cloudflare Pages builds with. Cloudflare
  // also reads NODE_VERSION and .nvmrc, and does not say which wins, so on
  // Cloudflare (CF_PAGES=1) this fails the build if any other version is used.
  const pinned = (await readFile(path.join(root, '.node-version'), 'utf8')).trim()
  assert.match(
    pinned,
    /^\d+\.\d+\.\d+$/,
    '.node-version should be an exact version, such as 26.13.0',
  )
  if (process.env.CF_PAGES === '1') assert.equal(process.version, `v${pinned}`)
})
