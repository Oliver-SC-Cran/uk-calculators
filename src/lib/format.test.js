// Tests for number formatting (format.js). Run with: npm test
// The expected values are [own working]: they follow from the rules in the file.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  caretAfterGrouping,
  formatAmount,
  formatDeduction,
  formatNumber,
  groupDigits,
} from './format.js'

test('format [own working] commas go into numbers as they are typed', () => {
  assert.equal(groupDigits('35000'), '35,000')
  assert.equal(groupDigits('1234567.5'), '1,234,567.5')
  assert.equal(groupDigits('1,2345'), '12,345')
  assert.equal(groupDigits('999'), '999')
  assert.equal(groupDigits('£35000'), '£35,000')
  assert.equal(groupDigits('35000.'), '35,000.')
  assert.equal(groupDigits(''), '')
  assert.equal(groupDigits(null), '')
})

test('format [own working] text that is not a plain number is left as typed', () => {
  for (const text of ['-5000', '12a', '1.2.3', '5%', '007', 'abc']) {
    assert.equal(groupDigits(text), text)
  }
})

test('format [own working] the caret stays after the digit it was after', () => {
  // Typing 9 after "1,2" in "1,234,567" gives "1,2934,567", grouped "12,934,567".
  assert.equal(caretAfterGrouping('12,934,567', '1,2934,567', 4), 4)
  // Typing a fourth digit at the end moves the caret past the new comma.
  assert.equal(caretAfterGrouping('3,500', '3500', 4), 5)
  // Deleting a digit from the front.
  assert.equal(caretAfterGrouping('5,000', '5000', 0), 0)
  // With nothing before the caret it goes before the first digit, after any £.
  assert.equal(caretAfterGrouping('£35,000', '£35000', 1), 1)
})

test('format [own working] amounts taken off have a minus sign, but never −£0', () => {
  assert.equal(formatDeduction(4486), '−£4,486')
  assert.equal(formatDeduction(149.4933, { pence: true }), '−£149.49')
  assert.equal(formatDeduction(0), '£0')
  assert.equal(formatDeduction(0.4), '£0')
  assert.equal(formatDeduction(0.004, { pence: true }), '£0.00')
  assert.equal(formatDeduction(-3), '£0')
})

test('format [own working] each unit in the working', () => {
  assert.equal(formatAmount(28720.08), '£28,720')
  assert.equal(formatAmount(28720.08, 'gbpPence'), '£28,720.08')
  assert.equal(formatAmount(0.2, 'percent'), '20%')
  assert.equal(formatAmount(1, 'weeks'), '1 week')
  assert.equal(formatAmount(39, 'weeks'), '39 weeks')
  assert.equal(formatAmount(2, 'years'), '2 years')
  assert.equal(formatAmount(1, 'months'), '1 month')
  assert.equal(formatAmount(37.5, 'number'), '37.5')
  assert.equal(formatAmount(1950, 'number'), '1,950')
  assert.equal(formatAmount(true, 'yesNo'), 'Yes')
  assert.equal(formatAmount(false, 'yesNo'), 'No')
  assert.equal(formatNumber(12.346), '12.35')
})
