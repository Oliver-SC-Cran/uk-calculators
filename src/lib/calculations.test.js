// Worked examples for the 2026/27 figures. Run with: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculateRedundancyPay,
  calculateStudentLoanRepayment,
  calculateTakeHome,
  taperedPersonalAllowance,
} from './calculations.js'

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

// These are the worked examples shown in the take-home pay guide.
test('take-home pay: the 2026/27 worked examples in the guide', () => {
  const pounds = (salary) => {
    const result = calculateTakeHome(salary)
    return [
      result.incomeTax,
      result.nationalInsurance,
      result.takeHomeAnnual,
      result.takeHomeMonthly,
    ].map(Math.round)
  }
  assert.deepEqual(pounds(25000), [2486, 994, 21520, 1793])
  assert.deepEqual(pounds(30000), [3486, 1394, 25120, 2093])
  assert.deepEqual(pounds(35000), [4486, 1794, 28720, 2393])
  assert.deepEqual(pounds(60000), [11432, 3211, 45357, 3780])
})

test('take-home pay: the personal allowance tapers away above £100,000', () => {
  assert.equal(taperedPersonalAllowance(100000), 12570)
  assert.equal(taperedPersonalAllowance(110000), 7570)
  assert.equal(taperedPersonalAllowance(125140), 0)
  // £100 more at £110,000 costs £60 in income tax and £2 in NI.
  const before = calculateTakeHome(110000)
  const after = calculateTakeHome(110100)
  assert.equal(Math.round(after.incomeTax - before.incomeTax), 60)
  assert.equal(Math.round(after.takeHomeAnnual - before.takeHomeAnnual), 38)
})

test('take-home pay: income tax above £100,000 taxes the lost allowance at 40%', () => {
  const tax = (salary) => Math.round(calculateTakeHome(salary).incomeTax)
  assert.equal(tax(100000), 27432) // £37,700 at 20% + £49,730 at 40%
  assert.equal(tax(110000), 33432) // £37,700 at 20% + £64,730 at 40%
  assert.equal(tax(125140), 42516) // £37,700 at 20% + £87,440 at 40%
  assert.equal(tax(150000), 53703) // as above + £24,860 at 45%
})
