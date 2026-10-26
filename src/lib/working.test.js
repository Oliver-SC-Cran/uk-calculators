// Checks on the working behind every calculator (working.js). Run with: npm test
//
// For a grid of inputs on each calculator, these check that every part adds up
// to its total, that the first part comes to the figure the result panel shows,
// and that every line has the shape a page needs to show it. The expected
// values are [own working]: they are the calculators' own results.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateTakeHome } from './incomeTax.js'
import { calculateISAAllowance } from './isa.js'
import { projectLifetimeIsa } from './lifetimeIsa.js'
import { checkMinimumWage } from './minimumWage.js'
import { calculateMortgageOverpayment, overpaymentToBeMortgageFree } from './mortgage.js'
import { calculateMaternityPay, calculatePaternityPay } from './parentalPay.js'
import { calculatePayPackage, calculatePayRise } from './payRise.js'
import { readTaxCode, taxRatesFor } from './readTaxCode.js'
import { calculateRedundancyPay } from './redundancy.js'
import { calculateSelfEmployedTax } from './selfEmployed.js'
import { calculateStampDuty } from './stampDuty.js'
import { calculateStudentLoanRepayment } from './studentLoans.js'
import { calculateTakeHomePay } from './takeHome.js'
import { sumOfLines } from './working.js'

const product = (...lists) =>
  lists.reduce((acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])), [[]])

const salaries = [
  0,
  12570,
  12571,
  26930,
  35000,
  35000.55,
  50270,
  50271,
  60000,
  100001,
  125140,
  150000,
  -5,
  NaN,
]
const units = ['gbp', 'gbpPence', 'percent', 'weeks', 'months', 'years', 'number', 'yesNo']

// Every line can be shown, and every part with a total adds up to it.
function checkShape(working, where) {
  assert.ok(Array.isArray(working) && working.length > 0, `${where}: no working`)
  for (const part of working) {
    assert.equal(typeof part.title, 'string', `${where}: a part has no title`)
    if ('note' in part) assert.ok(typeof part.note === 'string' && part.note.length > 0)
    for (const line of [...part.lines, ...(part.total ? [part.total] : [])]) {
      assert.equal(typeof line.label, 'string', `${where}: a line has no label`)
      assert.doesNotMatch(line.label, /£|\d%/, `${where}: "${line.label}" has an amount in it`)
      assert.ok(units.includes(line.unit), `${where}: "${line.label}" has unit ${line.unit}`)
      const ok =
        line.unit === 'yesNo' ? typeof line.value === 'boolean' : Number.isFinite(line.value)
      assert.ok(ok, `${where}: "${line.label}" is ${line.value}`)
    }
    for (const line of part.lines) assert.ok(['add', 'subtract', 'info'].includes(line.kind))
    const sum = sumOfLines(part)
    if (sum !== null) {
      assert.ok(
        Math.abs(sum - part.total.value) < 0.005,
        `${where}: "${part.title}" lines come to ${sum}, total is ${part.total.value}`,
      )
    }
  }
}

// The first part's total is the figure the page shows, or there is no total
// when the page shows no figure.
function checkHeadline(working, figure, where) {
  checkShape(working, where)
  const first = working[0].total
  if (figure === null) assert.equal(first, undefined, `${where}: a total where there is no figure`)
  else
    assert.ok(
      Math.abs(first.value - figure) < 0.005,
      `${where}: shows ${figure}, working says ${first?.value}`,
    )
}

test('working [own working] take-home pay adds up to the take-home figure', () => {
  for (const [salary, scottish] of product(salaries, [false, true])) {
    const r = calculateTakeHome(salary, { scottish })
    checkHeadline(r.working, r.takeHomeAnnual, `take-home ${salary} ${scottish}`)
  }
})

test('working [own working] the take-home pay calculator adds up to the take-home figure', () => {
  const codes = [null, '1257L', 'S1185L M1', 'C0T', 'K2000', 'BR', 'SD3', 'NT']
  for (const [pay, bonus, text, pensionType, frequency, plan] of product(
    [0, 12570, 35000, 60000, 110000, 150000, NaN],
    [0, 5000],
    codes,
    ['salarySacrifice', 'reliefAtSource'],
    ['monthly', 'weekly'],
    ['none', 'plan2'],
  )) {
    const taxCode = text ? readTaxCode(text).value : null
    const r = calculateTakeHomePay({
      pay,
      bonus,
      taxCode,
      ...taxRatesFor(taxCode, 'restOfUk'),
      pensionType,
      pensionPercent: 5,
      payFrequency: frequency,
      plan,
      hasPostgraduateLoan: plan !== 'none',
    })
    checkHeadline(r.working, r.takeHomeAnnual, `take-home ${pay} ${bonus} ${text} ${frequency}`)
    if (r.bonus) {
      const bonusPart = r.working.find((each) => each.title === 'Your bonus')
      assert.ok(Math.abs(bonusPart.total.value - r.bonus.kept) < 0.005)
    }
  }
  // Pay entered by the hour or day, and no National Insurance.
  for (const [payPer, paysNationalInsurance] of product(
    ['month', 'week', 'day', 'hour'],
    [true, false],
  )) {
    const r = calculateTakeHomePay({ pay: 150, payPer, paysNationalInsurance })
    checkHeadline(r.working, r.takeHomeAnnual, `take-home ${payPer} ${paysNationalInsurance}`)
  }
})

test('working [own working] student loans add up to the repayment', () => {
  for (const [grossAnnual, plan, pg] of product(
    salaries,
    ['none', 'plan1', 'plan2', 'plan4', 'plan5'],
    [false, true],
  )) {
    const r = calculateStudentLoanRepayment({ grossAnnual, plan, hasPostgraduateLoan: pg })
    checkHeadline(r.working, r.totalMonthly, `student loan ${grossAnnual} ${plan} ${pg}`)
    checkHeadline(
      r.weeklyWorking,
      r.totalWeekly,
      `student loan weekly ${grossAnnual} ${plan} ${pg}`,
    )
  }
})

test('working [own working] the minimum wage check adds up to the legal minimum', () => {
  for (const [age, hourlyRate, isApprentice] of product(
    [15, 16, 17, 20, 21, 60, NaN],
    [0, 8, 11.5, 12.71, 20],
    [false, true],
  )) {
    const r = checkMinimumWage({ age, hourlyRate, isApprentice })
    checkHeadline(
      r.working,
      r.entitled ? r.applicableRate : null,
      `minimum wage ${age} ${hourlyRate}`,
    )
  }
})

test('working [own working] the ISA allowance adds up to the allowance left', () => {
  for (const [cashISA, stocksISA, lisa, age] of product(
    [0, 5000, 20001],
    [0, 15000],
    [0, 4000, 6000],
    [17, 28, 45, 50],
  )) {
    const r = calculateISAAllowance({ cashISA, stocksISA, lisa, age })
    checkHeadline(r.working, r.remainingAllowance, `ISA ${cashISA} ${stocksISA} ${lisa} ${age}`)
  }
})

test('working [own working] redundancy pay adds up to the pay', () => {
  for (const [age, yearsOfService, weeklyPay, region] of product(
    [20, 30, 45, 61, 70],
    [0, 2, 10, 25],
    [0, 600.55, 751, 2000],
    ['GB', 'NI'],
  )) {
    const r = calculateRedundancyPay({ age, yearsOfService, weeklyPay, region })
    checkHeadline(
      r.working,
      r.qualifies ? r.pay : null,
      `redundancy ${age} ${yearsOfService} ${weeklyPay}`,
    )
  }
})

test('working [own working] stamp duty adds up to the tax', () => {
  for (const [price, buyerType, nonResident] of product(
    [0, 39999, 40000, 125001, 300000, 500001, 925001, 3e6],
    ['homeMover', 'firstTimeBuyer', 'additional'],
    [false, true],
  )) {
    const r = calculateStampDuty({ price, buyerType, nonResident })
    checkHeadline(r.working, r.tax, `stamp duty ${price} ${buyerType} ${nonResident}`)
  }
})

test('working [own working] self-employed tax adds up to the bill', () => {
  for (const [income, expenses, useTradingAllowance, employmentIncome, plan, scottish] of product(
    [0, 999, 1001, 35000, 60000, 150000],
    [0, 5000],
    [false, true],
    [0, 30000, 120000],
    ['none', 'plan2'],
    [false, true],
  )) {
    const r = calculateSelfEmployedTax({
      income,
      expenses,
      useTradingAllowance,
      employmentIncome,
      plan,
      scottish,
    })
    checkHeadline(r.working, r.totalBill, `self-employed ${income} ${expenses} ${employmentIncome}`)
  }
})

test('working [own working] a pay rise adds up to what is kept', () => {
  const pairs = [
    [45000, 55000],
    [95000, 105000],
    [120000, 130000],
    [58000, 62000],
    [50000, 45000],
    [0, 0],
  ]
  for (const [[currentSalary, newSalary], pensionPercent, pensionType, plan, scottish] of product(
    pairs,
    [0, 5, 100],
    ['salarySacrifice', 'netPay', 'reliefAtSource'],
    ['none', 'plan2'],
    [false, true],
  )) {
    const settings = { pensionPercent, pensionType, plan, scottish }
    const r = calculatePayRise({ currentSalary, newSalary, ...settings })
    checkHeadline(r.working, r.kept, `pay rise ${currentSalary} ${newSalary} ${pensionType}`)
    const p = calculatePayPackage({ salary: newSalary, ...settings })
    checkHeadline(p.working, p.takeHomeAnnual, `pay package ${newSalary} ${pensionType}`)
  }
})

test('working [own working] a mortgage overpayment adds up to the interest saved', () => {
  for (const [balance, annualRatePercent, remainingYears, monthlyOverpayment, lumpSum] of product(
    [1, 200000, 1e6],
    [0, 4.5, 15],
    [1, 12.5, 25],
    [0, 200, 5000],
    [0, 10000, 300000],
  )) {
    const r = calculateMortgageOverpayment({
      balance,
      annualRatePercent,
      remainingYears,
      monthlyOverpayment,
      lumpSum,
    })
    checkHeadline(
      r.working,
      r.interestSaved,
      `mortgage ${balance} ${annualRatePercent} ${remainingYears}`,
    )
  }
})

test('working [own working] a mortgage with offset savings adds up to the interest saved', () => {
  for (const [
    balance,
    annualRatePercent,
    remainingYears,
    monthlyOverpayment,
    offsetSavings,
  ] of product([1, 200000, 1e6], [0, 4.5, 15], [1, 12.5, 25], [0, 200, 5000], [10000, 300000])) {
    const r = calculateMortgageOverpayment({
      balance,
      annualRatePercent,
      remainingYears,
      monthlyOverpayment,
      offsetSavings,
    })
    const where = `mortgage ${balance} ${annualRatePercent} ${remainingYears} offset ${offsetSavings}`
    checkHeadline(r.working, r.interestSaved, where)
    assert.ok(
      r.working.some((each) => each.title === 'Your offset savings'),
      where,
    )
  }
})

test('working [own working] mortgage-free by a target adds up to the monthly overpayment', () => {
  for (const [
    balance,
    annualRatePercent,
    remainingYears,
    targetMonths,
    offsetSavings,
    lumpSum,
  ] of product(
    [1, 200000, 1e6],
    [0, 4.5, 15],
    [1, 12.5, 25],
    [1, 60, 180, 400],
    [0, 30000],
    [0, 10000],
  )) {
    const r = overpaymentToBeMortgageFree({
      balance,
      annualRatePercent,
      remainingYears,
      targetMonths,
      offsetSavings,
      lumpSum,
    })
    const where = `mortgage-free ${balance} ${annualRatePercent} ${remainingYears} in ${targetMonths}`
    checkHeadline(r.working, r.monthlyOverpayment, where)
    // The second part is the interest saved with that amount.
    assert.ok(Math.abs(r.working[1].total.value - r.result.interestSaved) < 0.005, where)
  }
})

test('working [own working] a Lifetime ISA adds up to its projected value', () => {
  for (const [age, currentBalance, contribution, frequency, growthPercent, goal] of product(
    [17, 25, 39, 45, 55],
    [0, 5000],
    [0, 200, 5000],
    ['monthly', 'yearly'],
    [0, 4],
    ['home', 'retirement'],
  )) {
    const r = projectLifetimeIsa({
      age,
      currentBalance,
      contribution,
      frequency,
      growthPercent,
      goal,
      purchaseAge: 50,
    })
    checkHeadline(r.working, r.value, `Lifetime ISA ${age} ${contribution} ${frequency}`)
  }
})

test('working [own working] maternity and paternity pay add up to the total', () => {
  for (const [dueDate, earnings, workedContinuously] of product(
    ['2027-03-01', '2026-07-31'],
    [0, 29.99, 30, 128.99, 129, 215.91, 216, 600, 2000],
    [true, false],
  )) {
    const settings = { dueDate, averageWeeklyEarnings: earnings, workedContinuously }
    const m = calculateMaternityPay(settings)
    checkHeadline(m.working, m.qualifies ? m.total : null, `maternity ${dueDate} ${earnings}`)
    if (!m.qualifies && m.allowanceMayApply) {
      assert.ok(Math.abs(m.working[1].total.value - m.allowanceTotal) < 0.005)
    }
    const p = calculatePaternityPay(settings)
    checkHeadline(p.working, p.qualifies ? p.total : null, `paternity ${dueDate} ${earnings}`)
  }
})
