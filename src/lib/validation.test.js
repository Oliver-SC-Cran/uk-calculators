// Tests for the input checks in validation.js. Run with: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseNumber } from './validation.js'

test('parseNumber: plain numbers are read as they are [own working]', () => {
  assert.deepEqual(parseNumber('35000'), { value: 35000, error: null })
  assert.deepEqual(parseNumber('11.50'), { value: 11.5, error: null })
  assert.deepEqual(parseNumber('0'), { value: 0, error: null })
  assert.deepEqual(parseNumber('.5'), { value: 0.5, error: null })
  assert.deepEqual(parseNumber('4.'), { value: 4, error: null })
})

test('parseNumber: commas, spaces, a pound sign and a percent sign are allowed [own working]', () => {
  assert.equal(parseNumber('£35,000').value, 35000)
  assert.equal(parseNumber(' 35 000 ').value, 35000)
  assert.equal(parseNumber('1,234,567.89').value, 1234567.89)
  assert.equal(parseNumber('5%').value, 5)
  assert.equal(parseNumber('£35,000').error, null)
})

test('parseNumber: a blank field that is needed asks for it by name [own working]', () => {
  assert.deepEqual(parseNumber('', { name: 'your salary' }), {
    value: 0,
    error: 'Enter your salary.',
  })
  assert.equal(parseNumber('   ', { name: 'your age' }).error, 'Enter your age.')
  assert.equal(parseNumber(undefined, { name: 'your age' }).error, 'Enter your age.')
})

test('parseNumber: a blank optional field counts as zero with no error [own working]', () => {
  assert.deepEqual(parseNumber('', { optional: true }), { value: 0, error: null })
})

test('parseNumber: text that is not a number is refused, not read as zero [own working]', () => {
  for (const text of ['abc', '12abc', '1e5', '1.2.3', '--5', '£', '.', 'NaN', 'Infinity']) {
    const result = parseNumber(text)
    assert.equal(result.value, 0, text)
    assert.equal(result.error, 'Enter a number that is 0 or more.', text)
  }
})

test('parseNumber: negative numbers get the range message [own working]', () => {
  assert.equal(parseNumber('-5').error, 'Enter a number that is 0 or more.')
  assert.equal(parseNumber('−5').error, 'Enter a number that is 0 or more.')
  assert.equal(parseNumber('-5', { min: -10 }).value, -5)
})

test('parseNumber: both ends of a range are allowed and just outside is not [own working]', () => {
  const rules = { min: 0, max: 100 }
  assert.equal(parseNumber('0', rules).error, null)
  assert.equal(parseNumber('100', rules).error, null)
  assert.equal(parseNumber('100.01', rules).error, 'Enter a number between 0 and 100.')
  assert.equal(parseNumber('-0.01', rules).error, 'Enter a number between 0 and 100.')
  assert.equal(parseNumber('abc', rules).error, 'Enter a number between 0 and 100.')
})

test('parseNumber: a minimum above zero is named in the message [own working]', () => {
  assert.equal(parseNumber('0', { min: 1, max: 168 }).error, 'Enter a number between 1 and 168.')
  assert.equal(parseNumber('0', { min: 1 }).error, 'Enter a number that is 1 or more.')
  assert.equal(parseNumber('1', { min: 1 }).error, null)
})

test('parseNumber: whole number fields refuse decimals [own working]', () => {
  const rules = { min: 0, max: 120, whole: true }
  assert.equal(parseNumber('45', rules).value, 45)
  assert.equal(parseNumber('45.5', rules).error, 'Enter a whole number between 0 and 120.')
  assert.equal(parseNumber('2.5', { whole: true }).error, 'Enter a whole number that is 0 or more.')
})

test('parseNumber: very high values are read, and large limits are written with commas [own working]', () => {
  assert.equal(parseNumber('999999999999').value, 999999999999)
  assert.equal(parseNumber('9'.repeat(400)).error, 'Enter a number that is 0 or more.')
  assert.equal(
    parseNumber('5', { min: 1000, max: 2000000 }).error,
    'Enter a number between 1,000 and 2,000,000.',
  )
})
