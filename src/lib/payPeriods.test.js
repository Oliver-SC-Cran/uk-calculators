// Tests for switching what pay is entered for (payPeriods.js), and the same
// for a Lifetime ISA payment and a pension contribution. Run with: npm test
// The expected values are [own working]: they follow from the rules in each file.
//
// A field shows an amount to the penny and keeps it exact (setExact in
// useCalculatorState), and each switch is worked out from what the person
// typed, so switching away and back never changes the figure.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { amountText } from './format.js'
import { switchContribution } from './lifetimeIsa.js'
import { payFor, switchPayPer, yearlyPayFrom } from './payPeriods.js'
import { switchPension } from './pensions.js'

// A pay field: the exact amount it holds, what was typed, and what it is for.
const typedPay = (amount, per) => ({ amount, per, typed: undefined })
function switchTo(field, to, settings) {
  const { amount, typed } = switchPayPer({
    amount: field.amount,
    from: field.per,
    to,
    settings,
    typed: field.typed,
  })
  return { amount, per: to, typed }
}

test('pay periods [own working] pay for each period, shown to the penny', () => {
  // £35,000 a year is £2,916.67 a month, £673.08 a week, £134.62 a day for 5
  // days a week and £17.95 an hour for 37.5 hours.
  const settings = { hoursPerWeek: 37.5, daysPerWeek: 5 }
  assert.equal(amountText(payFor('month', 35000, settings)), '2916.67')
  assert.equal(amountText(payFor('week', 35000, settings)), '673.08')
  assert.equal(amountText(payFor('day', 35000, settings)), '134.62')
  assert.equal(amountText(payFor('hour', 35000, settings)), '17.95')
  assert.equal(amountText(payFor('year', 35002.5, settings)), '35002.5')
  // No hours or days to share it over, or nothing entered.
  assert.equal(payFor('hour', 35000, { hoursPerWeek: 0 }), 0)
  assert.equal(payFor('day', 35000, { daysPerWeek: 0 }), 0)
  assert.equal(payFor('month', NaN), 0)
})

test('pay periods [own working] switching away and back never changes the pay', () => {
  const amounts = [45000, 35000, 35000.55, 12570, 100001.01, 1234567.89, 17.955, 0.01, 0]
  const settingsList = [
    { hoursPerWeek: 37.5, daysPerWeek: 5 },
    { hoursPerWeek: 22.5, daysPerWeek: 3 },
    { hoursPerWeek: 40, daysPerWeek: 0.5 },
    { hoursPerWeek: 1, daysPerWeek: 7 },
    { hoursPerWeek: 168, daysPerWeek: 4.5 },
  ]
  const routes = [
    ['year', 'month', 'week', 'day', 'hour', 'year'],
    ['year', 'hour', 'week', 'year'],
    ['month', 'day', 'month'],
    ['week', 'hour', 'day', 'month', 'year', 'week'],
    ['hour', 'year', 'hour'],
    ['day', 'week', 'month', 'week', 'day'],
  ]
  for (const settings of settingsList) {
    for (const start of amounts) {
      for (const route of routes) {
        let field = typedPay(start, route[0])
        const yearly = yearlyPayFrom(start, route[0], settings)
        for (const to of route.slice(1)) {
          field = switchTo(field, to, settings)
          // On the way, the pay comes to the same year, to a trillionth of it.
          const now = yearlyPayFrom(field.amount, to, settings)
          const close = Math.abs(now - yearly) <= yearly * 1e-12
          assert.ok(close, `${start} ${route.join(' > ')} at ${to}`)
        }
        // Back where it began, it is exactly what was typed.
        assert.equal(
          field.amount,
          start,
          `${start} ${route.join(' > ')} ${JSON.stringify(settings)}`,
        )
      }
    }
  }
  // The example in switchPayPer: £45,000 a year is £865.38 a week on screen,
  // and back to a year is exactly £45,000.
  const week = switchTo(typedPay(45000, 'year'), 'week', {})
  assert.equal(amountText(week.amount), '865.38')
  assert.equal(switchTo(week, 'year', {}).amount, 45000)
})

test('pay periods [own working] new hours start again from the pay on screen', () => {
  // £45,000 a year at 37.5 hours is £23.08 an hour. At 40 hours the same
  // hourly pay comes to £48,000 a year, so back to a year shows £48,000.
  const before = { hoursPerWeek: 37.5, daysPerWeek: 5 }
  const after = { hoursPerWeek: 40, daysPerWeek: 5 }
  const hourly = switchTo(typedPay(45000, 'year'), 'hour', before)
  assert.equal(amountText(hourly.amount), '23.08')
  const year = switchTo(hourly, 'year', after)
  assert.equal(Math.round(year.amount * 100) / 100, 48000)
  // Hours do not matter between a year and a month, so a change there keeps
  // what was typed.
  const month = switchTo(typedPay(45000, 'year'), 'month', before)
  assert.equal(switchTo(month, 'year', after).amount, 45000)
})

test('pay periods [own working] a Lifetime ISA payment between monthly and yearly', () => {
  // £1,000 a year is £83.33 a month on screen, and back to a year is £1,000.
  const switchFrom = (field, to) => ({
    ...switchContribution({ amount: field.amount, from: field.frequency, to, typed: field.typed }),
    frequency: to,
  })
  for (const start of [1000, 200, 333.33, 333.34, 4000, 1234.56, 0.01, 0]) {
    for (const frequency of ['monthly', 'yearly']) {
      let field = { amount: start, frequency, typed: undefined }
      for (const to of ['yearly', 'monthly', 'yearly', 'monthly']) field = switchFrom(field, to)
      if (frequency === 'yearly') field = switchFrom(field, 'yearly')
      assert.equal(field.amount, start, `${start} ${frequency}`)
    }
  }
  const month = switchFrom({ amount: 1000, frequency: 'yearly' }, 'monthly')
  assert.equal(amountText(month.amount), '83.33')
})

test('pay periods [own working] a pension between a percentage and pounds', () => {
  // 7% of £45,123 is £263.2175 a month, shown as £263.22. Back to a
  // percentage is 7% again, and weekly and back to monthly is £263.22 again.
  const pay = 45123
  let field = { amount: 7, unit: 'percent', payDays: 12, typed: undefined }
  const to = (toUnit, toPayDays) => {
    const next = switchPension({ ...field, pay, toUnit, toPayDays })
    field = { amount: next.amount, unit: toUnit, payDays: toPayDays, typed: next.typed }
  }
  to('amount', 12)
  assert.equal(amountText(field.amount), '263.22')
  to('amount', 52)
  assert.equal(amountText(field.amount), '60.74')
  to('amount', 12)
  to('percent', 12)
  assert.equal(field.amount, 7)
  // A new pay starts again from the contribution on screen.
  const other = switchPension({ ...field, pay: 50000, toUnit: 'amount', toPayDays: 12 })
  assert.equal(Math.round(other.amount * 100) / 100, 291.67)
})
