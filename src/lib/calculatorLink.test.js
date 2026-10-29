// Tests for share links (calculatorLink.js). Run with: npm test
// The expected values are [own working]: they follow from the rules in the file.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import { linkHash, readLinkHash, takeLinkHash } from './calculatorLink.js'

// The same shapes useCalculatorState's numberInput, choiceInput, checkboxInput
// and dateInput make. Rules are left out, as links do not use them.
const inputs = {
  salary: { kind: 'number', initial: '35000' },
  region: { kind: 'choice', initial: 'restOfUk', choices: ['restOfUk', 'scotland'] },
  postgrad: { kind: 'checkbox', initial: false },
  due: { kind: 'date', initial: '2027-03-01' },
  start: { kind: 'date', initial: null },
  taxCode: { kind: 'text', initial: '' },
}
const starting = {
  salary: '35000',
  region: 'restOfUk',
  postgrad: false,
  due: '2027-03-01',
  start: null,
  taxCode: '',
}

test('share link [own working] only what differs from the starting values goes in the link', () => {
  assert.equal(linkHash(inputs, starting), '')
  assert.equal(linkHash(inputs, { ...starting, salary: '60000' }), '#salary=60000')
  assert.equal(
    linkHash(inputs, { ...starting, region: 'scotland', postgrad: true, due: '2027-06-15' }),
    '#region=scotland&postgrad=1&due=2027-06-15',
  )
})

test('share link [own working] typed £ signs, commas, spaces and % signs are left out', () => {
  assert.equal(linkHash(inputs, { ...starting, salary: ' £60,000 ' }), '#salary=60000')
  assert.equal(linkHash(inputs, { ...starting, salary: '5%' }), '#salary=5')
  // A field that was emptied goes in empty, so it opens empty.
  assert.equal(linkHash(inputs, { ...starting, salary: '' }), '#salary=')
})

test('share link [own working] reading a link gives back what was written', () => {
  const values = {
    ...starting,
    salary: '60000',
    region: 'scotland',
    postgrad: true,
    start: '2026-11-01',
  }
  assert.deepEqual(readLinkHash(linkHash(inputs, values), inputs), {
    salary: '60000',
    region: 'scotland',
    postgrad: true,
    start: '2026-11-01',
  })
})

test('share link [own working] a link to part of a page, or no link, is not read', () => {
  assert.equal(readLinkHash('', inputs), null)
  assert.equal(readLinkHash('#calculators', inputs), null)
  assert.equal(readLinkHash('#settings', inputs), null)
  assert.equal(readLinkHash(undefined, inputs), null)
  assert.equal(readLinkHash('#other=1', inputs), null)
})

test('share link [own working] a tax code goes in as typed and comes back the same', () => {
  const values = { ...starting, taxCode: 'S1257L M1' }
  assert.equal(linkHash(inputs, values), '#taxCode=S1257L+M1')
  assert.deepEqual(readLinkHash('#taxCode=S1257L+M1', inputs), { taxCode: 'S1257L M1' })
  assert.deepEqual(readLinkHash('#taxCode=1257L%2FW1', inputs), { taxCode: '1257L/W1' })
  // Anything but letters, digits, spaces and slashes is ignored.
  assert.equal(readLinkHash('#taxCode=%3Cscript%3E', inputs), null)
  assert.equal(readLinkHash('#taxCode=1257L%26x%3D1', inputs), null)
  assert.equal(readLinkHash(`#taxCode=${'A'.repeat(17)}`, inputs), null)
})

test('share link [own working] values the inputs could not hold are ignored', () => {
  assert.deepEqual(
    readLinkHash(
      '#salary=<script>&region=wales&postgrad=yes&due=2026-02-29&start=tomorrow&extra=1',
      inputs,
    ),
    null,
  )
  // Each one is judged by itself, so a good value is still read.
  assert.deepEqual(readLinkHash('#salary=-5&region=scotland', inputs), { region: 'scotland' })
  assert.deepEqual(readLinkHash('#salary=1234567890123', inputs), null)
  assert.deepEqual(readLinkHash('#salary=12.5&postgrad=0', inputs), {
    salary: '12.5',
    postgrad: false,
  })
})

test('share link [own working] an exact amount goes into the link in full', () => {
  // Pay for a week worked out from £45,000 a year is written in full, so the
  // link gives the same pay. Up to 17 decimal places are read back.
  assert.equal(linkHash(inputs, { ...starting, salary: '865.384615385' }), '#salary=865.384615385')
  assert.deepEqual(readLinkHash('#salary=865.384615385', inputs), { salary: '865.384615385' })
  assert.deepEqual(readLinkHash('#salary=865.3846153846154', inputs), {
    salary: '865.3846153846154',
  })
  assert.equal(readLinkHash('#salary=1.123456789012345678', inputs), null)
})

// A stand-in for the browser's window: an address, and history.replaceState,
// which changes the address the way a browser does.
function fakeWindow(address) {
  const win = {
    location: new URL(address),
    history: {
      state: { idx: 0 },
      replaceState(state, unused, url) {
        win.history.state = state
        win.location = new URL(url, win.location)
      },
    },
  }
  win.window = win
  return win
}

// What src/clearShareLink.js does when a built page is opened at an address.
// It runs in the page before any other script.
const clearShareLink = readFileSync(new URL('../clearShareLink.js', import.meta.url), 'utf8')
function openBuiltPage(address) {
  const win = fakeWindow(address)
  vm.runInNewContext(clearShareLink, win)
  return win
}

const sharedLink = 'https://ukmoneycalculators.co.uk/salary-calculator#salary=47321&taxCode=1185L'

test('share link [own working] the figures leave the address before any other script runs', () => {
  const win = openBuiltPage(sharedLink)
  // What Google's ad script, or any other, would read from the address.
  assert.equal(win.location.href, 'https://ukmoneycalculators.co.uk/salary-calculator')
  assert.deepEqual(win.history.state, { idx: 0 })
  // The calculator still gets them, once.
  const hash = takeLinkHash(win)
  assert.equal(hash, '#salary=47321&taxCode=1185L')
  assert.deepEqual(readLinkHash(hash, inputs), { salary: '47321', taxCode: '1185L' })
  assert.equal(takeLinkHash(win), '')
  assert.equal(win.shareLinkHash, undefined)
})

test('share link [own working] a link to part of a page, or no # part, is left alone', () => {
  const home = openBuiltPage('https://ukmoneycalculators.co.uk/#calculators')
  assert.equal(home.location.href, 'https://ukmoneycalculators.co.uk/#calculators')
  assert.equal(takeLinkHash(home), '')
  assert.equal(home.location.href, 'https://ukmoneycalculators.co.uk/#calculators')
  const plain = openBuiltPage('https://ukmoneycalculators.co.uk/salary-calculator')
  assert.equal(plain.shareLinkHash, undefined)
  assert.equal(takeLinkHash(plain), '')
})

test('share link [own working] on the dev server the calculator takes the figures out itself', () => {
  // The dev server does not run src/clearShareLink.js.
  const win = fakeWindow(`${sharedLink.replace('#', '?utm_source=email#')}`)
  assert.equal(takeLinkHash(win), '#salary=47321&taxCode=1185L')
  assert.equal(
    win.location.href,
    'https://ukmoneycalculators.co.uk/salary-calculator?utm_source=email',
  )
  assert.deepEqual(win.history.state, { idx: 0 })
  assert.equal(takeLinkHash(win), '')
})
