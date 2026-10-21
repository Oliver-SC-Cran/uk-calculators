// Checks on the rates tables. Run with: npm test
//
// Every rates file is a table keyed by tax year. These tests make sure that
// adding a new year to one file and forgetting another fails, and that the
// calculators give the same answer for the current year whether or not it is
// passed. The expected values are [own working]: they come from the tables.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateISAAllowance } from '../isa.js'
import { calculateIncomeTax, calculateNationalInsurance, calculateTakeHome } from '../incomeTax.js'
import { projectLifetimeIsa } from '../lifetimeIsa.js'
import { checkMinimumWage } from '../minimumWage.js'
import { calculateMaternityPay, calculatePaternityPay } from '../parentalPay.js'
import { calculatePayRise } from '../payRise.js'
import { calculateRedundancyPay } from '../redundancy.js'
import { calculateSelfEmployedTax } from '../selfEmployed.js'
import { calculateStampDuty } from '../stampDuty.js'
import { calculateStudentLoanRepayment } from '../studentLoans.js'
import { INCOME_TAX_RATES } from './incomeTax.js'
import { ISA_RATES } from './isa.js'
import { MINIMUM_WAGE_RATES } from './minimumWage.js'
import { MORTGAGE_RATES } from './mortgage.js'
import { PARENTAL_PAY_RATES } from './parentalPay.js'
import { PENSION_RATES } from './pensions.js'
import { REDUNDANCY_RATES } from './redundancy.js'
import { SELF_EMPLOYED_RATES } from './selfEmployed.js'
import { STAMP_DUTY_RATES } from './stampDuty.js'
import { STUDENT_LOAN_RATES } from './studentLoans.js'
import { CURRENT_TAX_YEAR, forTaxYear, TAX_YEARS } from './taxYear.js'

const tables = {
  INCOME_TAX_RATES,
  ISA_RATES,
  MINIMUM_WAGE_RATES,
  MORTGAGE_RATES,
  PARENTAL_PAY_RATES,
  PENSION_RATES,
  REDUNDANCY_RATES,
  SELF_EMPLOYED_RATES,
  STAMP_DUTY_RATES,
  STUDENT_LOAN_RATES,
}

test('rates: every table has an entry for every tax year, and no others [own working]', () => {
  const years = Object.keys(TAX_YEARS)
  for (const [name, table] of Object.entries(tables)) {
    assert.deepEqual(Object.keys(table), years, `${name} does not have the same tax years`)
  }
})

test('rates: tax years are written 2026/27 and the current one is listed [own working]', () => {
  for (const year of Object.keys(TAX_YEARS)) {
    assert.match(year, /^\d{4}\/\d{2}$/)
    const [start, end] = year.split('/').map(Number)
    assert.equal((start + 1) % 100, end, `${year} is not one year`)
  }
  assert.ok(CURRENT_TAX_YEAR in TAX_YEARS)
})

test('rates: asking for a tax year with no figures fails, rather than using the wrong ones [own working]', () => {
  assert.throws(
    () => forTaxYear(INCOME_TAX_RATES, '2019/20'),
    /no figures for the 2019\/20 tax year/,
  )
  assert.throws(() => calculateTakeHome(35000, { taxYear: '2019/20' }), /2019\/20/)
})

test('rates: each calculator gives the same answer with the current tax year passed [own working]', () => {
  const taxYear = CURRENT_TAX_YEAR
  const same = (withYear, without) => assert.deepEqual(withYear, without)
  same(
    calculateIncomeTax(60000, { scottish: true, taxYear }),
    calculateIncomeTax(60000, { scottish: true }),
  )
  same(calculateNationalInsurance(60000, { taxYear }), calculateNationalInsurance(60000))
  same(calculateTakeHome(110000, { taxYear }), calculateTakeHome(110000))
  same(
    calculateStudentLoanRepayment({
      grossAnnual: 40000,
      plan: 'plan2',
      hasPostgraduateLoan: true,
      taxYear,
    }),
    calculateStudentLoanRepayment({ grossAnnual: 40000, plan: 'plan2', hasPostgraduateLoan: true }),
  )
  same(
    calculateISAAllowance({ cashISA: 5000, stocksISA: 5000, lisa: 4000, age: 28, taxYear }),
    calculateISAAllowance({ cashISA: 5000, stocksISA: 5000, lisa: 4000, age: 28 }),
  )
  same(
    checkMinimumWage({ age: 22, hourlyRate: 11.5, isApprentice: false, taxYear }),
    checkMinimumWage({ age: 22, hourlyRate: 11.5, isApprentice: false }),
  )
  same(
    calculateRedundancyPay({ age: 45, yearsOfService: 10, weeklyPay: 600, taxYear }),
    calculateRedundancyPay({ age: 45, yearsOfService: 10, weeklyPay: 600 }),
  )
  same(calculateStampDuty({ price: 300000, taxYear }), calculateStampDuty({ price: 300000 }))
  same(
    calculateSelfEmployedTax({ income: 35000, expenses: 5000, employmentIncome: 20000, taxYear }),
    calculateSelfEmployedTax({ income: 35000, expenses: 5000, employmentIncome: 20000 }),
  )
  same(
    calculatePayRise({ currentSalary: 45000, newSalary: 55000, pensionPercent: 5, taxYear }),
    calculatePayRise({ currentSalary: 45000, newSalary: 55000, pensionPercent: 5 }),
  )
  same(
    projectLifetimeIsa({ age: 30, contribution: 200, growthPercent: 4, purchaseAge: 35, taxYear }),
    projectLifetimeIsa({ age: 30, contribution: 200, growthPercent: 4, purchaseAge: 35 }),
  )
  const maternity = { dueDate: '2027-03-01', averageWeeklyEarnings: 600, workedContinuously: true }
  same(calculateMaternityPay({ ...maternity, taxYear }), calculateMaternityPay(maternity))
  same(calculatePaternityPay({ ...maternity, taxYear }), calculatePaternityPay(maternity))
})
