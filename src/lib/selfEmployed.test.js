// Tests for the self-employed tax calculator, for 2026/27. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example or published rule on gov.uk, checked on 9 October 2026
//   [own working] worked out by hand from the published rates and rules
//
// https://www.gov.uk/self-employed-national-insurance-rates
// https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income
// https://www.gov.uk/understand-self-assessment-bill/payments-on-account
// https://www.gov.uk/repaying-your-student-loan/what-you-pay
// https://www.gov.uk/expenses-if-youre-self-employed

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculateClass4NationalInsurance,
  calculateStudentLoanForYear,
  calculateTakeHome,
} from './calculations.js'
import { calculateSelfEmployedTax } from './selfEmployed.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const soleTrader = (income, extra = {}) => calculateSelfEmployedTax({ income, ...extra })

// ---------------------------------------------------------------------------
// Class 4 National Insurance
// ---------------------------------------------------------------------------

test('self-employed [gov.uk] Class 4 is 6% over £12,570 up to £50,270, then 2%', () => {
  // "For tax year 2026 to 2027 you'll pay: 6% on profits over £12,570 up to £50,270,
  // 2% on profits over £50,270"
  near(calculateClass4NationalInsurance(22570), 600) // 6% of £10,000
  near(calculateClass4NationalInsurance(60270), 2262 + 200) // 6% of £37,700 + 2% of £10,000
})

test('self-employed [own working] Class 4 at each boundary', () => {
  const cases = [
    [0, 0],
    [7105, 0], // the small profits threshold: nothing to pay
    [12570, 0], // top of the 0% band
    [12571, 0.06], // first pound charged
    [50270, 2262], // 6% of £37,700
    [50271, 2262.02], // first pound at 2%
    [100000, 3256.6], // £2,262 + 2% of £49,730
    [1000000, 21256.6],
  ]
  for (const [profit, expected] of cases) {
    near(calculateClass4NationalInsurance(profit), expected, `Class 4 on ${profit}:`)
  }
  assert.equal(calculateClass4NationalInsurance(-500), 0)
  assert.equal(calculateClass4NationalInsurance(NaN), 0)
})

// ---------------------------------------------------------------------------
// A sole trader with no other income
// ---------------------------------------------------------------------------

test('self-employed [gov.uk] profit is income minus allowable expenses', () => {
  // "if your turnover is £40,000 and you claim £10,000 in allowable expenses, you'll
  // only pay Income Tax on the remaining £30,000 - known as your taxable profit"
  assert.equal(soleTrader(40000, { expenses: 10000 }).profit, 30000)
})

test('self-employed [own working] a sole trader on £30,000 profit', () => {
  const result = soleTrader(30000)
  near(result.incomeTax, 3486) // 20% of £17,430
  near(result.class4, 1045.8) // 6% of £17,430
  assert.equal(result.studentLoan, 0)
  near(result.totalBill, 4531.8)
  near(result.takeHomeAnnual, 25468.2)
  near(result.takeHomeMonthly, 2122.35)
  near(result.setAsideMonthly, 377.65)
  // Income tax is the same as an employee pays on £30,000.
  near(result.incomeTax, calculateTakeHome(30000).incomeTax)
  // Nothing from a job, so the whole allowance and basic rate band are free.
  assert.equal(result.allowanceLeftForProfit, 12570)
  assert.equal(result.basicRateBandLeft, 37700)
})

test('self-employed [own working] income tax and Class 4 at each band boundary', () => {
  const cases = [
    // profit, income tax, Class 4
    [0, 0, 0],
    [12570, 0, 0],
    [12571, 0.2, 0.06],
    [50270, 7540, 2262],
    [50271, 7540.4, 2262.02],
    [100000, 27432, 3256.6],
    [100002, 27433.2, 3256.64], // £1 of allowance lost
    [125140, 42516, 3759.4], // allowance gone
    [125141, 42516.45, 3759.42],
  ]
  for (const [profit, tax, class4] of cases) {
    const result = soleTrader(profit)
    near(result.incomeTax, tax, `income tax on ${profit}:`)
    near(result.class4, class4, `Class 4 on ${profit}:`)
    near(result.totalBill, tax + class4)
    near(result.takeHomeAnnual, profit - tax - class4)
  }
})

// ---------------------------------------------------------------------------
// The trading allowance
// ---------------------------------------------------------------------------

test('self-employed [gov.uk] trading income of £1,000 or less is covered in full', () => {
  // "You can get up to £1,000 each tax year in tax-free allowances for ... trading income".
  // "If your annual gross trading income is £1,000 or less ... you may not have to tell HMRC".
  for (const income of [1, 800, 1000]) {
    const result = soleTrader(income, { useTradingAllowance: true })
    assert.equal(result.profit, 0, `income ${income}`)
    assert.equal(result.totalBill, 0)
    assert.equal(result.underTradingAllowance, true)
  }
  assert.equal(soleTrader(1001, { useTradingAllowance: true }).profit, 1)
  assert.equal(soleTrader(1001, { useTradingAllowance: true }).underTradingAllowance, false)
})

test('self-employed [own working] the trading allowance instead of expenses', () => {
  // £5,000 of income less the £1,000 allowance is £4,000 of profit, inside the personal allowance.
  const alone = soleTrader(5000, { useTradingAllowance: true })
  assert.equal(alone.deducted, 1000)
  assert.equal(alone.profit, 4000)
  assert.equal(alone.totalBill, 0)
  // The allowance is not money spent, so all £5,000 is kept.
  assert.equal(alone.takeHomeAnnual, 5000)
  // With real expenses of £1,000 the profit is the same but only £4,000 is kept.
  assert.equal(soleTrader(5000, { expenses: 1000 }).takeHomeAnnual, 4000)
  // The allowance replaces expenses. It is not added to them.
  assert.equal(soleTrader(5000, { useTradingAllowance: true, expenses: 3000 }).profit, 4000)
  // With a £30,000 job, the same £4,000 is taxed at 20%.
  const withJob = soleTrader(5000, { useTradingAllowance: true, employmentIncome: 30000 })
  near(withJob.incomeTax, 800)
  assert.equal(withJob.class4, 0) // profit is under £12,570
  // Expenses under £1,000: the allowance would give a lower profit.
  assert.equal(soleTrader(5000, { expenses: 400 }).tradingAllowanceWouldBeBetter, true)
  assert.equal(soleTrader(5000, { expenses: 1500 }).tradingAllowanceWouldBeBetter, false)
  // Expenses cannot be more than income. Losses are not covered.
  assert.equal(soleTrader(2000, { expenses: 5000 }).profit, 0)
})

// ---------------------------------------------------------------------------
// A job plus self-employment
// ---------------------------------------------------------------------------

test('self-employed [own working] a £25,000 job plus £10,000 side income', () => {
  const result = soleTrader(10000, { employmentIncome: 25000 })
  // The job uses the whole £12,570 allowance, so every pound of profit is taxed at 20%.
  assert.equal(result.allowanceUsedByJob, 12570)
  assert.equal(result.allowanceLeftForProfit, 0)
  assert.equal(result.basicRateBandLeft, 25270) // £50,270 - £25,000
  near(result.taxOnJob, 2486)
  near(result.incomeTax, 2000)
  // Class 4 looks at the profit on its own, and £10,000 is under £12,570.
  assert.equal(result.class4, 0)
  near(result.totalBill, 2000)
  near(result.takeHomeAnnual, 8000)
})

test('self-employed [own working] a job that pushes the profit into higher bands', () => {
  // £45,000 job + £10,000 profit: £5,270 of the profit is basic rate, £4,730 higher rate.
  const acrossHigherRate = soleTrader(10000, { employmentIncome: 45000 })
  near(acrossHigherRate.incomeTax, 5270 * 0.2 + 4730 * 0.4)
  assert.equal(acrossHigherRate.basicRateBandLeft, 5270)
  // £95,000 job + £10,000 profit: 40% on the profit, plus £2,500 of allowance lost at 40%.
  const acrossTaper = soleTrader(10000, { employmentIncome: 95000 })
  near(acrossTaper.incomeTax, 5000)
  assert.equal(acrossTaper.basicRateBandLeft, 0)
  // A small job leaves some allowance: £5,000 job + £10,000 profit.
  const smallJob = soleTrader(10000, { employmentIncome: 5000 })
  assert.equal(smallJob.allowanceUsedByJob, 5000)
  assert.equal(smallJob.allowanceLeftForProfit, 7570)
  near(smallJob.incomeTax, 486) // 20% of £15,000 - £12,570
  // Tax on the job plus tax on the profit is the tax on everything together.
  for (const [job, profit] of [
    [25000, 10000],
    [48000, 9000],
    [99000, 40000],
    [0, 60000],
  ]) {
    const both = soleTrader(profit, { employmentIncome: job })
    near(both.taxOnJob + both.incomeTax, calculateTakeHome(job + profit).incomeTax)
  }
})

// ---------------------------------------------------------------------------
// Student loans through Self Assessment
// ---------------------------------------------------------------------------

test('self-employed [gov.uk] student loan is worked out on income for the whole year', () => {
  // "You have a Plan 1 loan and you're both employed and self-employed. You have an income of
  // £32,000 a year from your self-employment and £10,000 a year from a job ... combined income
  // is £42,000 ... £42,000 - £26,900 = £15,100. 9% of £15,100 = £1,359."
  assert.equal(calculateStudentLoanForYear({ income: 42000, plan: 'plan1' }).total, 1359)
  const result = soleTrader(32000, { employmentIncome: 10000, plan: 'plan1' })
  // The £10,000 job is under the monthly threshold, so nothing was taken through pay.
  assert.equal(result.studentLoanThroughJob, 0)
  assert.equal(result.studentLoan, 1359)
})

test('self-employed [own working] student loan with and without a job', () => {
  // Plan 2 on £30,000 profit: 9% of £615 is £55.35, rounded down.
  assert.equal(soleTrader(30000, { plan: 'plan2' }).studentLoan, 55)
  // Under the threshold: nothing.
  assert.equal(soleTrader(29385, { plan: 'plan2' }).studentLoan, 0)
  // Postgraduate Loan as well: 6% of £9,000 is £540.
  assert.equal(soleTrader(30000, { plan: 'plan2', hasPostgraduateLoan: true }).studentLoan, 595)
  // "If you've already made repayments from a salary, HMRC will deduct them."
  // £35,000 job on Plan 2 repays £42 a month (£504 a year) through pay. With £10,000
  // of profit the year's total is 9% of £15,615 = £1,405, leaving £901 to pay.
  const withJob = soleTrader(10000, { employmentIncome: 35000, plan: 'plan2' })
  assert.equal(withJob.studentLoanThroughJob, 504)
  assert.equal(withJob.studentLoan, 901)
  near(withJob.totalBill, 2000 + 901)
  // No loan.
  assert.equal(soleTrader(60000).studentLoan, 0)
})

// ---------------------------------------------------------------------------
// Payments on account
// ---------------------------------------------------------------------------

test('self-employed [gov.uk] payments on account: the £1,000 and 80% tests', () => {
  // "You must make these 2 payments, unless either: the amount of tax you owed last year
  // was less than £1,000; last year you paid more than 80% of the tax you owed outside of
  // Self Assessment". "Each payment is half of the tax you owed last year."

  // £15,000 profit: tax £486 + Class 4 £145.80 = £631.80, under £1,000.
  const small = soleTrader(15000)
  near(small.totalBill, 631.8)
  assert.equal(small.paymentsOnAccountApply, false)
  assert.equal(small.dueInJuly, 0)
  near(small.dueInJanuary, 631.8)

  // £30,000 profit: £4,531.80, nothing deducted at source, so two payments of half.
  const full = soleTrader(30000)
  assert.equal(full.paymentsOnAccountApply, true)
  near(full.paymentOnAccount, 2265.9)
  near(full.dueInJanuary, 4531.8 + 2265.9)
  near(full.dueInJuly, 2265.9)

  // £25,000 job + £10,000 profit: £2,486 of £4,486 was deducted through pay (55%).
  const sideIncome = soleTrader(10000, { employmentIncome: 25000 })
  near(sideIncome.shareDeductedAtSource, 2486 / 4486)
  assert.equal(sideIncome.paymentsOnAccountApply, true)
  near(sideIncome.paymentOnAccount, 1000)
  near(sideIncome.dueInJanuary, 3000)

  // £60,000 job + £3,000 profit: £11,432 of £12,632 was deducted through pay (90%).
  const mostlyPaid = soleTrader(3000, { employmentIncome: 60000 })
  near(mostlyPaid.incomeTax, 1200)
  near(mostlyPaid.shareDeductedAtSource, 11432 / 12632)
  assert.equal(mostlyPaid.paymentsOnAccountApply, false)
  near(mostlyPaid.dueInJanuary, 1200)
})

test('self-employed [own working] payments on account at the £1,000 boundary', () => {
  // With a £30,000 job every pound of profit is taxed at 20%, and there is no Class 4
  // under £12,570. £4,995 of profit is a £999 bill. £5,000 is £1,000.
  const under = soleTrader(4995, { employmentIncome: 30000 })
  near(under.totalBill, 999)
  assert.equal(under.paymentsOnAccountApply, false)
  const at = soleTrader(5000, { employmentIncome: 30000 })
  near(at.totalBill, 1000)
  assert.equal(at.paymentsOnAccountApply, true)
  near(at.paymentOnAccount, 500)
})

test('self-employed [gov.uk] payments on account leave out student loan', () => {
  // The balancing payment "will also include anything you owe for ... student loans".
  // Payments on account are towards "your next tax bill (including Class 4 National Insurance)".
  const result = soleTrader(40000, { plan: 'plan2' })
  const taxAndClass4 = result.incomeTax + result.class4
  assert.equal(result.studentLoan, 955) // 9% of £10,615 is £955.35
  near(result.paymentOnAccount, taxAndClass4 / 2)
  near(result.dueInJanuary, taxAndClass4 + 955 + taxAndClass4 / 2)
})

test('self-employed [own working] odd inputs', () => {
  for (const income of [0, -5000, NaN, undefined]) {
    const result = soleTrader(income, { expenses: -100, employmentIncome: NaN })
    assert.equal(result.profit, 0)
    assert.equal(result.totalBill, 0)
    assert.equal(result.takeHomeAnnual, 0)
    assert.equal(result.setAsideShare, 0)
    assert.equal(result.paymentsOnAccountApply, false)
  }
  // Take-home is always less than profit once there is tax, and never negative.
  for (let profit = 0; profit <= 300000; profit += 2500) {
    const result = soleTrader(profit, { plan: 'plan2', hasPostgraduateLoan: true })
    assert.ok(result.takeHomeAnnual >= 0 && result.takeHomeAnnual <= profit, `at ${profit}`)
  }
  assert.equal(soleTrader(5000).belowSmallProfitsThreshold, true)
  assert.equal(soleTrader(7105).belowSmallProfitsThreshold, false)
})
