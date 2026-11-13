// Renders calculator pages with figures already in them, and reads the HTML.
// Run with: npm test
//
// The tests in src/lib/ call the calculations directly. These go through the
// page, which is where tax code D1 with Scotland chosen once gave "£NaN": the
// page picks the rates from the code and the "Where you live" answer before
// it calls the calculation. Expected values are [own working].
//
// Pages are JSX, so Vite loads them, the way the dev server does.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { REGIONS } from './components/choices.js'
import { formatGBP } from './lib/format.js'
import { readTaxCode, taxRatesFor } from './lib/readTaxCode.js'
import { calculateTakeHomePay } from './lib/takeHome.js'

const root = fileURLToPath(new URL('..', import.meta.url))

let vite
let renderPage
before(async () => {
  vite = await createServer({
    root,
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, ws: false, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  const { StartingLink } = await vite.ssrLoadModule('/src/components/useCalculatorState.js')
  /** The HTML of a page in src/pages/, started from the # part of a share link. */
  renderPage = async (file, path, link) => {
    const { default: Page } = await vite.ssrLoadModule(`/src/pages/${file}.jsx`)
    return renderToString(
      createElement(
        StaticRouter,
        { location: path },
        createElement(StartingLink.Provider, { value: link }, createElement(Page)),
      ),
    )
  }
})
after(() => vite?.close())

// Every code that taxes all pay at one rate, or with no tax-free pay, and an
// emergency form of some. gov.uk lists them on "What your tax code means".
const ONE_RATE_CODES = [
  'BR',
  'D0',
  'D1',
  'NT',
  '0T',
  'SBR',
  'SD0',
  'SD1',
  'SD2',
  'SD3',
  'S0T',
  'CBR',
  'CD0',
  'CD1',
  'C0T',
  'D1 W1',
  '0T M1',
  'SD1 X',
]

// What must never be on a page, whatever is entered.
const NOT_A_FIGURE = /NaN|undefined|Infinity/

const PAGES = [
  { file: 'SalaryCalculator', path: '/salary-calculator', pay: 'pay' },
  { file: 'PayRiseCalculator', path: '/pay-rise-calculator', pay: 'currentSalary' },
]

for (const { file, path, pay } of PAGES) {
  test(`${path} [own working] shows only figures for every one-rate tax code in every region`, async () => {
    for (const region of Object.keys(REGIONS)) {
      for (const code of ONE_RATE_CODES) {
        for (const amount of [0, 60000, 250000]) {
          const link = `#${new URLSearchParams({ [pay]: amount, region, taxCode: code })}`
          const html = await renderPage(file, path, link)
          const label = `${path}${link}`
          // The page did start from the link, and could read the code.
          assert.ok(html.includes(`value="${code}"`), `${label} does not show the tax code`)
          assert.ok(!html.includes('Enter a tax code such as'), `${label} could not read the code`)
          const found = NOT_A_FIGURE.exec(html)
          assert.equal(
            found,
            null,
            `${label} shows "${found?.[0]}": ${html.slice(Math.max(0, (found?.index ?? 0) - 120), (found?.index ?? 0) + 60)}`,
          )
        }
      }
    }
  })
}

test('/salary-calculator [own working] shows the take-home pay the calculation gives', async () => {
  for (const region of Object.keys(REGIONS)) {
    for (const code of ONE_RATE_CODES) {
      const taxCode = readTaxCode(code).value
      const expected = calculateTakeHomePay({
        pay: 60000,
        taxCode,
        ...taxRatesFor(taxCode, region),
      })
      const link = `#${new URLSearchParams({ pay: 60000, region, taxCode: code })}`
      const html = await renderPage('SalaryCalculator', '/salary-calculator', link)
      assert.ok(
        html.includes(formatGBP(expected.takeHomeAnnual)),
        `${link} does not show ${formatGBP(expected.takeHomeAnnual)} a year`,
      )
    }
  }
})

test('pages [own working] a page with no link renders as it is built', async () => {
  // The starting figures are the ones the built HTML holds.
  const html = await renderPage('SalaryCalculator', '/salary-calculator', null)
  assert.equal(NOT_A_FIGURE.exec(html), null)
  assert.ok(html.includes('value="35,000"'))
})
