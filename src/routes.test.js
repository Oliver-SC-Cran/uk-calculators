// Checks on the page list in routes.js. Run with: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canonicalUrl, findRoute, notFoundRoute, routes } from './routes.js'

test('routes: every page has its own title and description', () => {
  const titles = new Set(routes.map((route) => route.title))
  const descriptions = new Set(routes.map((route) => route.description))
  assert.equal(titles.size, routes.length)
  assert.equal(descriptions.size, routes.length)
})

test('routes: titles and descriptions fit in a search result and have no dashes', () => {
  for (const { path, title, description } of routes) {
    assert.ok(title.length <= 75, `${path} title is ${title.length} characters`)
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
