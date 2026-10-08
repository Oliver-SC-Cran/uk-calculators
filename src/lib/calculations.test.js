// Tests for every calculator, for the 2026/27 figures. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example, published rule or official calculator result
//                 on gov.uk, checked on 8 October 2026
//   [own working] worked out by hand from the published rates and rules
//
// When the figures change in April, re-check the [gov.uk] values at the links
// in each section before changing the expected numbers.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculateISAAllowance,
  calculateMortgageOverpayment,
  calculateRedundancyPay,
  calculateStudentLoanRepayment,
  calculateTakeHome,
  checkMinimumWage,
  taperedPersonalAllowance,
} from './calculations.js'

const near = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 0.005, `${message ?? ''} got ${actual}, expected ${expected}`)

// ---------------------------------------------------------------------------
// Take-home pay
// https://www.gov.uk/income-tax-rates
// https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
// ---------------------------------------------------------------------------

test('take-home [gov.uk] £35,000 pays basic rate tax on £22,430', () => {
  // gov.uk example: "You paid basic rate tax at 20% on £22,430 (£35,000 minus £12,570)."
  near(calculateTakeHome(35000).incomeTax, 22430 * 0.2)
})

test('take-home [own working] tax and NI at each band boundary', () => {
  const cases = [
    // salary, income tax, National Insurance
    [0, 0, 0],
    [12570, 0, 0], // all inside the personal allowance
    [12571, 0.2, 0.08], // first taxable pound
    [50270, 7540, 3016], // top of the basic rate band: £37,700 at 20%, and at 8%
    [50271, 7540.4, 3016.02], // first pound at 40% tax and 2% NI
    [100000, 27432, 4010.6], // £7,540 + £49,730 at 40%
    [100002, 27433.2, 4010.64], // £2 over: £1 of allowance lost, so £3 more is taxed at 40%
    [125140, 42516, 4513.4], // allowance gone: £7,540 + £87,440 at 40%
    [125141, 42516.45, 4513.42], // first pound at 45%
    [1000000, 436203, 22010.6], // £42,516 + £874,860 at 45%
  ]
  for (const [salary, tax, ni] of cases) {
    const result = calculateTakeHome(salary)
    near(result.incomeTax, tax, `income tax on ${salary}:`)
    near(result.nationalInsurance, ni, `NI on ${salary}:`)
    near(result.takeHomeAnnual, salary - tax - ni, `take-home on ${salary}:`)
  }
})

test('take-home [own working] the worked examples shown in the guide', () => {
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

test('take-home [own working] the personal allowance taper', () => {
  assert.equal(taperedPersonalAllowance(100000), 12570)
  assert.equal(taperedPersonalAllowance(100001), 12570) // £1 over is not yet a full £2
  assert.equal(taperedPersonalAllowance(100002), 12569)
  assert.equal(taperedPersonalAllowance(110000), 7570)
  assert.equal(taperedPersonalAllowance(125139), 1)
  assert.equal(taperedPersonalAllowance(125140), 0)
  assert.equal(taperedPersonalAllowance(500000), 0)
  // £100 more at £110,000 costs £60 in income tax and £2 in NI.
  const before = calculateTakeHome(110000)
  const after = calculateTakeHome(110100)
  near(after.incomeTax - before.incomeTax, 60)
  near(after.takeHomeAnnual - before.takeHomeAnnual, 38)
})

test('take-home [own working] a pay rise never reduces take-home pay', () => {
  let previous = -1
  for (let salary = 0; salary <= 200000; salary += 250) {
    const { takeHomeAnnual } = calculateTakeHome(salary)
    assert.ok(takeHomeAnnual > previous, `take-home fell at ${salary}`)
    previous = takeHomeAnnual
  }
})

test('take-home [own working] blank or negative input counts as zero', () => {
  for (const input of [-5000, NaN, undefined]) {
    const result = calculateTakeHome(input)
    assert.equal(result.grossAnnual, 0)
    assert.equal(result.incomeTax, 0)
    assert.equal(result.nationalInsurance, 0)
    assert.equal(result.takeHomeAnnual, 0)
    assert.equal(result.effectiveRate, 0)
  }
})

// ---------------------------------------------------------------------------
// Statutory redundancy pay
// https://www.gov.uk/calculate-your-redundancy-pay
// ---------------------------------------------------------------------------

test('redundancy [gov.uk] matches the official calculator', () => {
  // Results from the gov.uk calculator for a redundancy date of 1 June 2026.
  // null means the calculator did not show a separate Northern Ireland figure.
  const cases = [
    // age, years, weekly pay, weeks, £ in GB, £ in Northern Ireland
    [45, 10, 600, 12, 7200, 7200],
    [22, 2, 600, 1, 600, 600], // both years started under 22
    [23, 2, 600, 1.5, 900, 900], // one year started at 22
    [24, 2, 600, 2, 1200, 1200],
    [41, 2, 600, 2, 1200, 1200], // both years started under 41
    [42, 2, 600, 2.5, 1500, 1500], // one year started at 41
    [43, 3, 600, 4, 2400, 2400],
    [17, 2, 300, 1, 300, 300],
    [18, 2, 300, 1, 300, 300],
    [19, 4, 300, 2, 600, 600],
    [20, 5, 400, 2.5, 1000, 1000], // service started at exactly 15
    [21, 5, 400, 2.5, 1000, 1000],
    [30, 12, 500, 10, 5000, 5000],
    [35, 2.9, 600, 2, 1200, 1200], // part years do not count
    [35, 2, 0, 2, 0, 0],
    [35, 3, 751, 3, 2253, 2253], // exactly on the GB weekly cap
    [35, 3, 752, 3, 2253, 2256], // £1 over the GB cap, still under the NI cap
    [40, 20, 751, 19, 14269, 14269],
    [41, 20, 751, 19.5, 14644, null], // £14,644.50 rounded down
    [50, 20, 800, 24.5, 18399, null], // £18,399.50 rounded down
    [55, 30, 450.5, 27, 12163, null], // only the last 20 years count
    [45, 30, 400, 22, 8800, 8800],
    [30, 5, 500, 5, 2500, 2500], // guide example
    [58, 25, 900, 28.5, 21403, null], // guide example: capped pay, last 20 years only
    [61, 20, 600, 30, 18000, 18000], // the most weeks you can get
    [64, 25, 1000, 30, 22530, 23490], // the maximum payment
    [70, 45, 900, 30, 22530, 23490],
    [100, 20, 500, 30, 15000, 15000],
    [42, 2, 450.7, 2.5, 1126, null], // £1,126.75 rounded down
    [23, 2, 450.3, 1.5, 675, null], // £675.45 rounded down
    [45, 10, 333.33, 12, 3999, null], // £3,999.96 rounded down
  ]
  for (const [age, yearsOfService, weeklyPay, weeks, gb, ni] of cases) {
    const label = `age ${age}, ${yearsOfService} years, £${weeklyPay} a week`
    const inGB = calculateRedundancyPay({ age, yearsOfService, weeklyPay })
    assert.equal(inGB.qualifies, true, label)
    assert.equal(inGB.totalWeeks, weeks, `${label}: weeks`)
    assert.equal(inGB.pay, gb, `${label}: GB pay`)
    if (ni !== null) {
      const inNI = calculateRedundancyPay({ age, yearsOfService, weeklyPay, region: 'NI' })
      assert.equal(inNI.pay, ni, `${label}: Northern Ireland pay`)
    }
  }
})

test('redundancy [gov.uk] under 2 full years does not qualify', () => {
  // The official calculator gives no payment for 1 or 1.99 years.
  for (const yearsOfService of [0, 1, 1.99]) {
    const result = calculateRedundancyPay({ age: 35, yearsOfService, weeklyPay: 600 })
    assert.equal(result.qualifies, false)
    assert.equal(result.reason, 'too-few-years')
  }
})

test('redundancy [gov.uk] service that started before age 15 is rejected', () => {
  // The official calculator returns an error for each of these.
  for (const [age, yearsOfService] of [[16, 2], [17, 3], [18, 5], [20, 6], [20, 10], [45, 31]]) {
    const result = calculateRedundancyPay({ age, yearsOfService, weeklyPay: 400 })
    assert.equal(result.qualifies, false, `age ${age}, ${yearsOfService} years`)
    assert.equal(result.reason, 'service-too-long')
  }
})

test('redundancy [own working] pay cap flag and odd inputs', () => {
  const atCap = calculateRedundancyPay({ age: 35, yearsOfService: 3, weeklyPay: 751 })
  assert.equal(atCap.weeklyPayWasCapped, false)
  const overCap = calculateRedundancyPay({ age: 35, yearsOfService: 3, weeklyPay: 751.01 })
  assert.equal(overCap.weeklyPayWasCapped, true)
  assert.equal(overCap.weeklyPayUsed, 751)
  // Negative or blank pay counts as zero.
  assert.equal(calculateRedundancyPay({ age: 35, yearsOfService: 3, weeklyPay: -100 }).pay, 0)
  assert.equal(calculateRedundancyPay({ age: 35, yearsOfService: 3, weeklyPay: NaN }).pay, 0)
  // Blank age or years.
  assert.equal(calculateRedundancyPay({ age: 0, yearsOfService: 0, weeklyPay: 600 }).qualifies, false)
  assert.equal(calculateRedundancyPay({ age: 0, yearsOfService: 5, weeklyPay: 600 }).qualifies, false)
})

// ---------------------------------------------------------------------------
// ISA and Lifetime ISA allowance
// https://www.gov.uk/individual-savings-accounts/how-isas-work
// https://www.gov.uk/lifetime-isa
// ---------------------------------------------------------------------------

const isa = (overrides) =>
  calculateISAAllowance({ cashISA: 0, stocksISA: 0, lisa: 0, age: 30, ...overrides })

test('ISA [gov.uk] the published examples fit inside the £20,000 allowance', () => {
  // Example 1: £15,000 cash and £2,000 stocks and shares leaves £3,000, which
  // the example puts in an innovative finance ISA.
  assert.equal(isa({ cashISA: 15000, stocksISA: 2000 }).remainingAllowance, 3000)
  // Example 3: £10,000 and £3,000 in two cash ISAs plus £7,000 in stocks and shares.
  const example3 = isa({ cashISA: 13000, stocksISA: 7000 })
  assert.equal(example3.remainingAllowance, 0)
  assert.equal(example3.overallOverLimit, false)
})

test('ISA [gov.uk] Lifetime ISA limit, bonus and ages', () => {
  // "You can put in up to £4,000 each year, until you're 50."
  // "The government will add a 25% bonus to your savings, up to a maximum of £1,000 per year."
  assert.equal(isa({ lisa: 4000 }).lisaBonus, 1000)
  // gov.uk example: "initial savings of £800 will earn a 25% government bonus of £200".
  assert.equal(isa({ lisa: 800 }).lisaBonus, 200)
  // "The Lifetime ISA limit of £4,000 counts towards your annual ISA limit."
  assert.equal(isa({ lisa: 4000 }).remainingAllowance, 16000)
  // "You must be 18 or over but under 40 to open a Lifetime ISA."
  assert.equal(isa({ lisa: 4000, age: 17 }).lisaEligibleToOpen, false)
  assert.equal(isa({ lisa: 4000, age: 18 }).lisaEligibleToOpen, true)
  assert.equal(isa({ lisa: 4000, age: 39 }).lisaEligibleToOpen, true)
  assert.equal(isa({ lisa: 4000, age: 40 }).lisaEligibleToOpen, false)
  // Paying in stops at 50.
  assert.equal(isa({ lisa: 4000, age: 49 }).lisaBonus, 1000)
  assert.equal(isa({ lisa: 4000, age: 50 }).lisaBonus, 0)
  assert.equal(isa({ lisa: 4000, age: 50 }).remainingAllowance, 20000)
  // "You must be 18 or over to open an ISA."
  assert.equal(isa({ age: 17 }).tooYoungForISA, true)
  assert.equal(isa({ age: 18 }).tooYoungForISA, false)
  assert.equal(isa({ lisa: 4000, age: 17 }).lisaBonus, 0)
})

test('ISA [own working] limits and odd inputs', () => {
  assert.equal(isa({}).remainingAllowance, 20000)
  // Exactly on the limit is fine. £1 over is not.
  assert.equal(isa({ cashISA: 20000 }).overallOverLimit, false)
  assert.equal(isa({ cashISA: 20000 }).remainingAllowance, 0)
  assert.equal(isa({ cashISA: 20001 }).overallOverLimit, true)
  assert.equal(isa({ cashISA: 20001 }).remainingAllowance, 0)
  assert.equal(isa({ cashISA: 16000, lisa: 4000 }).overallOverLimit, false)
  assert.equal(isa({ cashISA: 16001, lisa: 4000 }).overallOverLimit, true)
  // A Lifetime ISA amount over £4,000 is capped, and only £4,000 uses allowance.
  const overLisa = isa({ lisa: 6000 })
  assert.equal(overLisa.lisaOverLimit, true)
  assert.equal(overLisa.lisaCapped, 4000)
  assert.equal(overLisa.lisaBonus, 1000)
  assert.equal(overLisa.remainingAllowance, 16000)
  assert.equal(isa({ lisa: 4000 }).lisaOverLimit, false)
  // Very large amounts.
  assert.equal(isa({ stocksISA: 5000000 }).remainingAllowance, 0)
  // Negative or blank amounts count as zero, so they cannot add allowance.
  const negative = isa({ cashISA: -5000, stocksISA: NaN, lisa: -100 })
  assert.equal(negative.totalContributions, 0)
  assert.equal(negative.remainingAllowance, 20000)
  assert.equal(negative.lisaBonus, 0)
})

// ---------------------------------------------------------------------------
// Minimum wage
// https://www.gov.uk/national-minimum-wage-rates
// ---------------------------------------------------------------------------

const wage = (age, hourlyRate = 20, isApprentice = false) =>
  checkMinimumWage({ age, hourlyRate, isApprentice })

test('minimum wage [gov.uk] rates from 1 April 2026 by age', () => {
  // Table on gov.uk: 21 and over £12.71, 18 to 20 £10.85, under 18 £8, apprentice £8.
  assert.equal(wage(16).applicableRate, 8)
  assert.equal(wage(17).applicableRate, 8)
  assert.equal(wage(18).applicableRate, 10.85)
  assert.equal(wage(20).applicableRate, 10.85)
  assert.equal(wage(21).applicableRate, 12.71)
  assert.equal(wage(67).applicableRate, 12.71)
})

test('minimum wage [gov.uk] apprentices and school leaving age', () => {
  // gov.uk example: "An apprentice aged 21 in the first year of their
  // apprenticeship is entitled to a minimum hourly rate of £8."
  assert.equal(wage(21, 9, true).applicableRate, 8)
  assert.equal(wage(17, 9, true).applicableRate, 8)
  // Workers "must be at least school leaving age to get the National Minimum Wage".
  assert.equal(wage(15).entitled, false)
  assert.equal(wage(16).entitled, true)
})

test('minimum wage [own working] shortfall, typical pay and odd inputs', () => {
  const underpaid = wage(22, 11.5)
  assert.equal(underpaid.isUnderpaid, true)
  assert.equal(underpaid.shortfall, 1.21) // £12.71 minus £11.50, to the penny
  assert.equal(wage(22, 12.7).shortfall, 0.01)
  // Paid exactly the minimum, or more, is not underpaid.
  assert.equal(wage(22, 12.71).isUnderpaid, false)
  assert.equal(wage(22, 12.71).shortfall, 0)
  assert.equal(wage(22, 500).isUnderpaid, false)
  assert.equal(wage(19, 10.85).isUnderpaid, false)
  assert.equal(wage(19, 10.84).isUnderpaid, true)
  // 37.5 hours a week at £12.71 is £476.625 a week and £24,784.50 a year.
  near(wage(30).weeklyAtMinimum, 476.625)
  near(wage(30).annualAtMinimum, 24784.5)
  // Zero, negative or blank pay is the full rate short.
  assert.equal(wage(22, 0).shortfall, 12.71)
  assert.equal(wage(22, -3).shortfall, 12.71)
  assert.equal(wage(22, NaN).shortfall, 12.71)
  // Blank age.
  assert.equal(wage(0).entitled, false)
  assert.equal(wage(NaN).entitled, false)
})

// ---------------------------------------------------------------------------
// Student loan repayments
// https://www.gov.uk/repaying-your-student-loan/what-you-pay
// ---------------------------------------------------------------------------

const loan = (grossAnnual, plan, hasPostgraduateLoan = false) =>
  calculateStudentLoanRepayment({ grossAnnual, plan, hasPostgraduateLoan })

test('student loan [gov.uk] the published worked examples', () => {
  // "You're on Plan 1 and have an income of £33,000 a year ... £2,750 - £2,241 = £509.
  // 9% of £509 = £45.81. This means the amount you'd repay each month would be £45."
  assert.equal(loan(33000, 'plan1').totalMonthly, 45)
  // "You're on Plan 4 and have an income of £36,000 a year ... 9% of £184 = £16.56 ... £16."
  assert.equal(loan(36000, 'plan4').totalMonthly, 16)
  // "You have a Postgraduate Loan and a Plan 2 loan and have an income of £30,000 a year
  // ... 6% of £750 = £45 ... 9% of £52 = £4.68. This means ... each month would be £49."
  const both = loan(30000, 'plan2', true)
  assert.equal(both.postgradMonthly, 45)
  assert.equal(both.undergradMonthly, 4)
  assert.equal(both.totalMonthly, 49)
  assert.equal(both.totalAnnual, 588)
})

test('student loan [gov.uk] monthly thresholds for each plan', () => {
  // gov.uk lists £2,241, £2,448, £2,816, £2,083 and £1,750 a month. Someone paid
  // exactly the threshold repays nothing. Someone paid £100 a month more repays
  // 9% of £100 (6% for a Postgraduate Loan).
  const monthlyThresholds = { plan1: 2241, plan2: 2448, plan4: 2816, plan5: 2083 }
  for (const [plan, threshold] of Object.entries(monthlyThresholds)) {
    assert.equal(loan(threshold * 12, plan).totalMonthly, 0, plan)
    assert.equal(loan((threshold + 100) * 12, plan).totalMonthly, 9, plan)
  }
  assert.equal(loan(1750 * 12, 'none', true).totalMonthly, 0)
  assert.equal(loan(1850 * 12, 'none', true).totalMonthly, 6)
})

test('student loan [own working] a Welsh student who started in 2024 is on Plan 2', () => {
  // On £30,000, Plan 2 is 9% of £52 a month, which rounds down to £4.
  // Plan 5 (England only) would be 9% of £417 a month, which rounds down to £37.
  assert.equal(loan(30000, 'plan2').totalMonthly, 4)
  assert.equal(loan(30000, 'plan5').totalMonthly, 37)
})

test('student loan [own working] thresholds, rounding and odd inputs', () => {
  // On the annual threshold, or just above it, the repayment rounds down to £0.
  assert.equal(loan(29385, 'plan2').totalMonthly, 0)
  assert.equal(loan(29500, 'plan2').totalMonthly, 0) // 9% of £10.33 is 93p
  assert.equal(loan(29520, 'plan2').totalMonthly, 1) // 9% of £12 is £1.08
  assert.equal(loan(25000, 'plan5').totalMonthly, 0)
  assert.equal(loan(40000, 'plan5').totalMonthly, 112) // guide example: 9% of £1,250.33 is £112.53
  assert.equal(loan(21200, 'none', true).totalMonthly, 1) // 6% of £16.67 is £1.00
  // Below every threshold.
  assert.equal(loan(18000, 'plan1', true).totalMonthly, 0)
  assert.equal(loan(0, 'plan2', true).totalMonthly, 0)
  // A high salary: £10,000 a month.
  const high = loan(120000, 'plan2', true)
  assert.equal(high.undergradMonthly, 679) // 9% of £7,552 is £679.68
  assert.equal(high.postgradMonthly, 495) // 6% of £8,250
  assert.equal(high.totalAnnual, (679 + 495) * 12)
  // No loan, an unknown plan, or a negative or blank salary.
  assert.equal(loan(60000, 'none').totalMonthly, 0)
  assert.equal(loan(60000, 'plan9').totalMonthly, 0)
  assert.equal(loan(-30000, 'plan2', true).totalMonthly, 0)
  assert.equal(loan(NaN, 'plan2', true).totalMonthly, 0)
})

// ---------------------------------------------------------------------------
// Mortgage overpayment
// gov.uk has no mortgage calculator, so everything here is own working. The
// monthly payments are standard repayment-mortgage figures.
// ---------------------------------------------------------------------------

const mortgage = (balance, annualRatePercent, remainingYears, monthlyOverpayment = 0) =>
  calculateMortgageOverpayment({ balance, annualRatePercent, remainingYears, monthlyOverpayment })

test('mortgage [own working] standard monthly payments', () => {
  near(Math.round(mortgage(200000, 4.5, 25).standardPayment * 100) / 100, 1111.66)
  near(Math.round(mortgage(100000, 5, 25).standardPayment * 100) / 100, 584.59)
  near(Math.round(mortgage(150000, 6, 30).standardPayment * 100) / 100, 899.33)
})

test('mortgage [own working] no overpayment changes nothing', () => {
  for (const [balance, rate, years] of [[200000, 4.5, 25], [85000, 7.25, 12], [10000000, 3, 40]]) {
    const result = mortgage(balance, rate, years, 0)
    assert.equal(result.newTermMonths, years * 12)
    assert.equal(result.monthsSaved, 0)
    assert.ok(result.interestSaved < 0.01, `interest saved was ${result.interestSaved}`)
  }
})

test('mortgage [own working] £200 a month extra on £200,000 at 4.5% over 25 years', () => {
  const result = mortgage(200000, 4.5, 25, 200)
  near(Math.round(result.newPayment * 100) / 100, 1311.66)
  // From the loan formula: months = -ln(1 - balance x rate / payment) / ln(1 + rate).
  const rate = 4.5 / 100 / 12
  const months = Math.ceil(-Math.log(1 - (200000 * rate) / result.newPayment) / Math.log(1 + rate))
  assert.equal(months, 227)
  assert.equal(result.newTermMonths, 227)
  assert.equal(result.monthsSaved, 73)
  // Everything paid is either the balance or interest. The last payment is
  // smaller than the rest, so the total is between 226 and 227 full payments.
  const totalPaid = 200000 + result.newTotalInterest
  assert.ok(totalPaid > 226 * result.newPayment && totalPaid <= 227 * result.newPayment)
  near(result.interestSaved, result.standardTotalInterest - result.newTotalInterest)
})

test('mortgage [own working] zero interest', () => {
  const plain = mortgage(120000, 0, 10, 0)
  assert.equal(plain.standardPayment, 1000)
  assert.equal(plain.standardTotalInterest, 0)
  const overpaid = mortgage(120000, 0, 10, 200)
  assert.equal(overpaid.newTermMonths, 100)
  assert.equal(overpaid.monthsSaved, 20)
  assert.equal(overpaid.interestSaved, 0)
})

test('mortgage [own working] bigger overpayments always save more', () => {
  let previous = mortgage(200000, 4.5, 25, 0)
  for (let overpayment = 50; overpayment <= 3000; overpayment += 50) {
    const result = mortgage(200000, 4.5, 25, overpayment)
    assert.ok(result.interestSaved > previous.interestSaved, `at ${overpayment}`)
    assert.ok(result.newTermMonths <= previous.newTermMonths, `at ${overpayment}`)
    previous = result
  }
})

test('mortgage [own working] an overpayment bigger than the balance clears it in a month', () => {
  const result = mortgage(5000, 6, 10, 10000)
  assert.equal(result.newTermMonths, 1)
  near(result.newTotalInterest, 25) // one month of interest: £5,000 at 0.5%
})

test('mortgage [own working] odd inputs', () => {
  // Nothing to calculate without a balance and a term.
  assert.equal(mortgage(0, 4.5, 25, 200), null)
  assert.equal(mortgage(-1000, 4.5, 25, 200), null)
  assert.equal(mortgage(NaN, 4.5, 25, 200), null)
  assert.equal(mortgage(200000, 4.5, 0, 200), null)
  // A negative overpayment or rate counts as zero.
  assert.equal(mortgage(200000, 4.5, 25, -500).monthsSaved, 0)
  assert.equal(mortgage(200000, 4.5, 25, -500).newTermMonths, 300)
  assert.equal(mortgage(120000, -3, 10, 0).standardPayment, 1000)
  // A very large mortgage still gives finite numbers.
  const large = mortgage(10000000, 5.5, 35, 5000)
  assert.ok(Number.isFinite(large.interestSaved) && large.interestSaved > 0)
  // A nonsense rate gives no result, not "NaN".
  assert.equal(mortgage(200000, 1e9, 25, 0), null)
})

test('mortgage [own working] the worked examples shown in the guide', () => {
  const summary = (...inputs) => {
    const result = mortgage(...inputs)
    return [result.standardPayment, result.newTermMonths, result.monthsSaved, result.interestSaved].map(
      Math.round,
    )
  }
  assert.deepEqual(summary(200000, 4.5, 25, 200), [1112, 227, 73, 36280])
  assert.deepEqual(summary(150000, 5, 20, 100), [990, 205, 35, 14256])
  assert.deepEqual(summary(300000, 4, 30, 500), [1432, 220, 140, 92414])
})
