// Worked examples for the 2026/27 figures. Run with: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateRedundancyPay, calculateStudentLoanRepayment } from './calculations.js'

const weeks = (age, yearsOfService) =>
  calculateRedundancyPay({ age, yearsOfService, weeklyPay: 600 }).totalWeeks

test('redundancy: age 45 with 10 years on £600 a week gets 12 weeks, £7,200', () => {
  // Years started at ages 44, 43, 42, 41 count 1.5 weeks each (6 weeks).
  // Years started at ages 40 down to 35 count 1 week each (6 weeks).
  const result = calculateRedundancyPay({ age: 45, yearsOfService: 10, weeklyPay: 600 })
  assert.equal(result.totalWeeks, 12)
  assert.equal(result.pay, 7200)
})

test('redundancy: weeks match the gov.uk ready reckoner around the age bands', () => {
  assert.equal(weeks(22, 2), 1) // both years started under 22
  assert.equal(weeks(23, 2), 1.5) // one year started at 22
  assert.equal(weeks(24, 2), 2)
  assert.equal(weeks(41, 2), 2) // both years started under 41
  assert.equal(weeks(42, 2), 2.5) // one year started at 41
  assert.equal(weeks(43, 2), 3)
  assert.equal(weeks(61, 20), 30) // the maximum
})

test('student loan: a Welsh student who started in 2024 is on Plan 2, not Plan 5', () => {
  // On £30,000 in 2026/27, Plan 2 is 9% of (£30,000 - £29,385) = £55.35 a year.
  // Plan 5 (England only) would be 9% of (£30,000 - £25,000) = £450 a year.
  const repay = (plan) =>
    calculateStudentLoanRepayment({ grossAnnual: 30000, plan, hasPostgraduateLoan: false })
  assert.equal(Number(repay('plan2').totalAnnual.toFixed(2)), 55.35)
  assert.equal(Number(repay('plan2').totalMonthly.toFixed(2)), 4.61)
  assert.equal(repay('plan5').totalAnnual, 450)
  assert.equal(repay('plan5').totalMonthly, 37.5)
})

test('redundancy: the 2026/27 maximum is 30 weeks at the £751 cap, £22,530', () => {
  const result = calculateRedundancyPay({ age: 64, yearsOfService: 25, weeklyPay: 1000 })
  assert.equal(result.pay, 22530)
})
