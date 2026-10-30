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
import { calculateSharedOwnershipStampDuty, calculateStampDuty } from '../stampDuty.js'
import { calculateStudentLoanRepayment } from '../studentLoans.js'
import { INCOME_TAX_RATES } from './incomeTax.js'
import { ISA_RATES } from './isa.js'
import { MILEAGE_RATES } from './mileage.js'
import { MINIMUM_WAGE_RATES } from './minimumWage.js'
import { MORTGAGE_RATES } from './mortgage.js'
import { PARENTAL_PAY_RATES } from './parentalPay.js'
import { PENSION_RATES } from './pensions.js'
import { REDUNDANCY_RATES } from './redundancy.js'
import { SELF_EMPLOYED_RATES } from './selfEmployed.js'
import { STAMP_DUTY_RATES } from './stampDuty.js'
import { STUDENT_LOAN_RATES } from './studentLoans.js'
import {
  ANNOUNCED_TAX_YEARS,
  CURRENT_TAX_YEAR,
  forTaxYear,
  NEXT_TAX_YEAR,
  TAX_YEARS,
} from './taxYear.js'

const tables = {
  INCOME_TAX_RATES,
  ISA_RATES,
  MILEAGE_RATES,
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
  // A table may also have an entry for a year whose figures are only partly
  // announced, but only one listed in ANNOUNCED_TAX_YEARS.
  const years = Object.keys(TAX_YEARS)
  for (const [name, table] of Object.entries(tables)) {
    const ownYears = Object.keys(table).filter((year) => !(year in ANNOUNCED_TAX_YEARS))
    assert.deepEqual(ownYears, years, `${name} does not have the same tax years`)
  }
})

test('rates: an announced year comes after the current one and holds only announced figures [own working]', () => {
  for (const year of Object.keys(ANNOUNCED_TAX_YEARS)) {
    assert.ok(!(year in TAX_YEARS), `${year} is in both lists`)
    assert.ok(year > CURRENT_TAX_YEAR, `${year} is not after ${CURRENT_TAX_YEAR}`)
  }
  assert.ok(NEXT_TAX_YEAR in ANNOUNCED_TAX_YEARS)
  // Budget 2026 published the 2027/28 income tax bands and savings figures,
  // and nothing else this site uses. Each part has the same fields as the
  // current year's, apart from the payroll limit, which is not a Budget figure.
  const announced = INCOME_TAX_RATES[NEXT_TAX_YEAR]
  const current = INCOME_TAX_RATES[CURRENT_TAX_YEAR]
  assert.deepEqual(Object.keys(announced), ['incomeTax', 'savingsTax'])
  const currentIncomeTax = Object.keys(current.incomeTax).filter(
    (key) => key !== 'maxShareOfPayTaken',
  )
  assert.deepEqual(Object.keys(announced.incomeTax), currentIncomeTax)
  assert.deepEqual(Object.keys(announced.savingsTax), Object.keys(current.savingsTax))
  // Mileage rates for 2027/28 were announced in full.
  assert.deepEqual(
    Object.keys(MILEAGE_RATES[NEXT_TAX_YEAR].carOrVan),
    Object.keys(MILEAGE_RATES[CURRENT_TAX_YEAR].carOrVan),
  )
  const withNextYear = ['INCOME_TAX_RATES', 'MILEAGE_RATES']
  for (const [name, table] of Object.entries(tables)) {
    if (!withNextYear.includes(name)) {
      assert.ok(!(NEXT_TAX_YEAR in table), `${name} has ${NEXT_TAX_YEAR}`)
    }
  }
})

test('rates: savings rates match the main rates in 2026/27 and are 4 points higher in 2027/28 [gov.uk]', () => {
  // Budget 2026 overview of tax legislation and rates, Annex A, checked on
  // 30 October 2026: savings basic, higher and additional rates of 20%, 40%
  // and 45% in 2026 to 2027, and 24%, 44% and 49% in 2027 to 2028.
  const { incomeTax, savingsTax } = INCOME_TAX_RATES['2026/27']
  assert.deepEqual(savingsTax.rates, {
    basic: incomeTax.basicRate,
    higher: incomeTax.higherRate,
    additional: incomeTax.additionalRate,
  })
  assert.deepEqual(INCOME_TAX_RATES['2027/28'].savingsTax.rates, {
    basic: 0.24,
    higher: 0.44,
    additional: 0.49,
  })
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
  const sharedOwnership = { marketValue: 400000, sharePercent: 40, leaseYears: 990 }
  same(
    calculateSharedOwnershipStampDuty({ ...sharedOwnership, taxYear }),
    calculateSharedOwnershipStampDuty(sharedOwnership),
  )
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
