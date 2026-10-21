// Tests for reading tax codes (readTaxCode.js). Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a published example or rule on gov.uk, checked on 21 October 2026
//   [own working] worked out by hand from those rules
//
// Sources:
//   https://www.gov.uk/tax-codes/what-your-tax-code-means
//   https://www.gov.uk/tax-codes/emergency-tax-codes
//   https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
//   https://www.gov.uk/hmrc-internal-manuals/paye-manual/paye11095

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readTaxCode, taxRatesFor } from './readTaxCode.js'

const read = (text) => readTaxCode(text).value

test('tax code [gov.uk] 1257L is the standard £12,570 tax-free allowance', () => {
  // "1257L is the tax code currently used for most people who have one job or
  // pension. You're entitled to the standard tax-free Personal Allowance of £12,570."
  assert.deepEqual(read('1257L'), {
    text: '1257L',
    country: null,
    kind: 'allowance',
    number: 1257,
    letter: 'L',
    allowance: 12570,
    emergency: null,
  })
})

test('tax code [gov.uk] 1100L leaves £11,000 tax-free', () => {
  // gov.uk's example: medical insurance worth £1,570 is taken from the £12,570
  // allowance, "leaving you with a tax-free amount of £11,000 ... your tax code is 1100L".
  assert.equal(read('1100L').allowance, 11000)
})

test('tax code [gov.uk] M, N and T codes give the tax-free pay in their number', () => {
  for (const letter of ['M', 'N', 'T']) {
    const code = read(`1383${letter}`)
    assert.equal(code.kind, 'allowance', letter)
    assert.equal(code.letter, letter)
    assert.equal(code.allowance, 13830)
  }
})

test('tax code [gov.uk] 0T, S0T and C0T give no tax-free pay', () => {
  for (const [text, country] of [
    ['0T', null],
    ['S0T', 'scotland'],
    ['C0T', 'wales'],
  ]) {
    const code = read(text)
    assert.equal(code.kind, 'allowance', text)
    assert.equal(code.allowance, 0, text)
    assert.equal(code.country, country, text)
  }
})

test('tax code [gov.uk] BR, D0 and D1 tax everything at one rate', () => {
  // England and Northern Ireland: basic, higher and additional rate.
  assert.equal(read('BR').band, 'basic')
  assert.equal(read('D0').band, 'higher')
  assert.equal(read('D1').band, 'additional')
  for (const text of ['BR', 'D0', 'D1']) assert.equal(read(text).kind, 'flat')
})

test('tax code [gov.uk] the Scottish codes SBR and SD0 to SD3', () => {
  // SBR basic, SD0 intermediate, SD1 higher, SD2 advanced, SD3 top.
  const bands = { SBR: 'basic', SD0: 'intermediate', SD1: 'higher', SD2: 'advanced', SD3: 'top' }
  for (const [text, band] of Object.entries(bands)) {
    assert.equal(read(text).band, band, text)
    assert.equal(read(text).country, 'scotland', text)
  }
})

test('tax code [gov.uk] the Welsh codes CBR, CD0 and CD1', () => {
  const bands = { CBR: 'basic', CD0: 'higher', CD1: 'additional' }
  for (const [text, band] of Object.entries(bands)) {
    assert.equal(read(text).band, band, text)
    assert.equal(read(text).country, 'wales', text)
  }
})

test('tax code [gov.uk] NT means no tax', () => {
  assert.equal(read('NT').kind, 'noTax')
})

test('tax code [gov.uk] S and C at the start mean the Scottish and Welsh rates', () => {
  assert.equal(read('S1257L').country, 'scotland')
  assert.equal(read('S1257L').allowance, 12570)
  assert.equal(read('C1257L').country, 'wales')
  assert.equal(read('C1257L').allowance, 12570)
})

test('tax code [gov.uk] the emergency codes from gov.uk', () => {
  // HMRC's rates for employers list 1257L W1, 1257L M1 and 1257L X from
  // 6 April 2026. The emergency codes page gives S875L M1 and C663L X too.
  for (const [text, emergency] of [
    ['1257L W1', 'W1'],
    ['1257L M1', 'M1'],
    ['1257L X', 'X'],
  ]) {
    const code = read(text)
    assert.equal(code.emergency, emergency, text)
    assert.equal(code.allowance, 12570, text)
    assert.equal(code.text, text)
  }
  assert.deepEqual(
    [read('S875L M1').country, read('S875L M1').allowance, read('S875L M1').emergency],
    ['scotland', 8750, 'M1'],
  )
  assert.deepEqual(
    [read('C663L X').country, read('C663L X').allowance, read('C663L X').emergency],
    ['wales', 6630, 'X'],
  )
  // gov.uk also lists NONCUM, which some payroll software shows.
  assert.equal(read('1257L NONCUM').emergency, 'NONCUM')
})

test('tax code [gov.uk] K154, the code in HMRC’s worked example', () => {
  // PAYE11095: an allowance of £12,570 less £14,120 of deductions is -£1,550,
  // which becomes K154. The code's number times £10 is added to pay.
  const code = read('K154')
  assert.equal(code.kind, 'k')
  assert.equal(code.number, 154)
  assert.equal(code.allowance, -1540)
  assert.equal(read('SK154').country, 'scotland')
  assert.equal(read('CK154 M1').emergency, 'M1')
})

test('tax code [own working] spaces, slashes and lower case are allowed', () => {
  assert.equal(read(' 1257l ').text, '1257L')
  assert.equal(read('1257LW1').text, '1257L W1')
  assert.equal(read('1257L/M1').text, '1257L M1')
  assert.equal(read('s1257l m1').text, 'S1257L M1')
  assert.equal(read('k 475').text, 'K475')
  assert.equal(read('sd1').text, 'SD1')
  assert.equal(read('BR X').text, 'BR X')
  // Leading zeros are dropped from the code as written.
  assert.equal(read('0257L').text, '257L')
})

test('tax code [own working] blank is fine, and means no code', () => {
  for (const text of ['', '   ', null, undefined]) {
    assert.deepEqual(readTaxCode(text), { value: null, error: null })
  }
})

test('tax code [own working] codes that do not exist get a message', () => {
  const ask = 'Enter a tax code such as 1257L, or leave it blank.'
  for (const text of [
    'L',
    'X',
    'W1',
    'K0',
    'K',
    'D2', // only Scotland has D2 and D3
    'CD2',
    'SD4',
    'SNT', // gov.uk lists NT with no S or C
    '12345L', // more digits than a code has
    '1257Y', // a letter that is not used
    'S',
    'hello',
    '<script>',
    '1'.repeat(20),
  ]) {
    assert.deepEqual(readTaxCode(text), { value: null, error: ask }, text)
  }
  // Digits with no letter get a message of their own.
  assert.equal(
    readTaxCode('1257').error,
    'Add the letter at the end of your tax code, such as the L in 1257L.',
  )
})

test('tax code [own working] which rates apply: the code first, then where you live', () => {
  const none = { scottish: false, welsh: false }
  assert.deepEqual(taxRatesFor(null, 'restOfUk'), none)
  assert.deepEqual(taxRatesFor(null, 'scotland'), { scottish: true, welsh: false })
  assert.deepEqual(taxRatesFor(read('1257L'), 'restOfUk'), none)
  assert.deepEqual(taxRatesFor(read('1257L'), 'scotland'), { scottish: true, welsh: false })
  assert.deepEqual(taxRatesFor(read('S1257L'), 'restOfUk'), { scottish: true, welsh: false })
  assert.deepEqual(taxRatesFor(read('C1257L'), 'restOfUk'), { scottish: false, welsh: true })
  assert.deepEqual(taxRatesFor(read('C1257L'), 'scotland'), { scottish: false, welsh: true })
})
