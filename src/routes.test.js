// Checks on the page list in routes.js. Run with: npm test
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { pageFiles } from './pageFiles.js'
import { canonicalUrl, findRoute, notFoundRoute, routes } from './routes.js'

test('routes: every page has its own title and description', () => {
  const titles = new Set(routes.map((route) => route.title))
  const descriptions = new Set(routes.map((route) => route.description))
  assert.equal(titles.size, routes.length)
  assert.equal(descriptions.size, routes.length)
})

test('routes: titles and descriptions fit in a search result and have no dashes', () => {
  for (const { path, title, description } of routes) {
    assert.ok(title.length <= 65, `${path} title is ${title.length} characters`)
    assert.ok(description.length >= 70, `${path} description is too short`)
    assert.ok(description.length <= 165, `${path} description is ${description.length} characters`)
    assert.doesNotMatch(title + description, /[–—]/, `${path} contains a dash`)
  }
})

test('routes: canonical URLs use the live domain with no trailing slash', () => {
  assert.equal(canonicalUrl(findRoute('/')), 'https://ukmoneycalculators.co.uk/')
  assert.equal(
    canonicalUrl(findRoute('/isa-calculator')),
    'https://ukmoneycalculators.co.uk/isa-calculator',
  )
  assert.equal(findRoute('/isa-calculator/').path, '/isa-calculator')
  assert.equal(findRoute('/nope'), notFoundRoute)
})

test('routes: every page, and the 404 page, has its own file in src/pages', () => {
  for (const { path } of [...routes, notFoundRoute]) {
    const file = pageFiles[path]
    assert.ok(file, `${path} needs a line in src/pageFiles.js`)
    const url = new URL(`./pages/${file}.jsx`, import.meta.url)
    assert.ok(existsSync(url), `src/pages/${file}.jsx is missing`)
  }
  assert.equal(
    Object.keys(pageFiles).length,
    routes.length + 1,
    'src/pageFiles.js lists a page not in routes.js',
  )
})

test('routes: sharedLinks marks exactly the pages that switch share links on', () => {
  // The privacy policy lists the calculators with share links from routes.js,
  // so a page that switches them on must be marked there too.
  for (const route of [...routes, notFoundRoute]) {
    const url = new URL(`./pages/${pageFiles[route.path]}.jsx`, import.meta.url)
    const switchedOn = /sharedLinks: true/.test(readFileSync(url, 'utf8'))
    assert.equal(Boolean(route.sharedLinks), switchedOn, `${route.path} sharedLinks`)
    if (switchedOn) assert.ok(route.name, `${route.path} needs a name for the privacy policy`)
  }
})
