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
  percent,
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

test('format [own working] percentages in page copy have one decimal place', () => {
  assert.equal(percent(0.09), '9%')
  assert.equal(percent(0.045), '4.5%')
  assert.equal(percent(0.12345), '12.3%')
  assert.equal(percent(0), '0%')
  assert.equal(percent(1), '100%')
  assert.equal(percent(0.00045), '0%')
  // A half rounds up, although 0.2275, 0.5005 and 0.1005 are stored as a
  // little less: keeping £2,275 of a £10,000 rise, and a 10.05% limit.
  assert.equal(percent(2275 / 10000), '22.8%')
  assert.equal(percent(0.5005), '50.1%')
  assert.equal(percent(10.05 / 100), '10.1%')
  assert.equal(percent(0.2274999), '22.7%')
  // Every share from 0% to 100% in steps of 0.005 percentage points, rounded
  // half up to one place.
  for (let step = 0; step <= 20000; step += 1) {
    assert.equal(percent((step * 5) / 100000), `${Math.floor((step + 10) / 20) / 10}%`)
  }
})

test('format [own working] percentages in the working have up to three decimal places', () => {
  // A monthly interest rate: 4.5% ÷ 12 = 0.375%.
  assert.equal(formatAmount(0.045 / 12, 'percent'), '0.375%')
  // 4% ÷ 12 = 0.3333...%, and 4.25% ÷ 12 = 0.354166...%.
  assert.equal(formatAmount(0.04 / 12, 'percent'), '0.333%')
  assert.equal(formatAmount(0.0425 / 12, 'percent'), '0.354%')
  // 5.25% ÷ 12 = 0.4375%, a half, which rounds up.
  assert.equal(formatAmount(0.0525 / 12, 'percent'), '0.438%')
  // 0.1% ÷ 12 = 0.00833...%.
  assert.equal(formatAmount(0.001 / 12, 'percent'), '0.008%')
  // A share of tax, and whole rates, which keep no trailing zeros.
  assert.equal(formatAmount(0.94579196, 'percent'), '94.579%')
  assert.equal(formatAmount(0.7996, 'percent'), '79.96%')
  assert.equal(formatAmount(0.2, 'percent'), '20%')
  assert.equal(formatAmount(0.045, 'percent'), '4.5%')
  assert.equal(formatAmount(0, 'percent'), '0%')
  // Every yearly rate from 0.01% to 15% in steps of 0.01, divided by 12, to
  // three places, rounded half up.
  for (let hundredths = 1; hundredths <= 1500; hundredths += 1) {
    const thousandths = Math.floor((hundredths * 20 + 12) / 24)
    assert.equal(formatAmount(hundredths / 10000 / 12, 'percent'), `${thousandths / 1000}%`)
  }
})
