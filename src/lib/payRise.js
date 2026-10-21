// The pay rise calculator. It adds pensions (pensions.js) on top of the tax,
// National Insurance and student loan functions in incomeTax.js and
// studentLoans.js, and contains no tax logic of its own.

import { calculateIncomeTax, calculateNationalInsurance, incomeTaxLabel } from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { extraReliefToClaim as extraRelief, pensionContributions } from './pensions.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { FULL_TIME_HOURS } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'
import { calculateStudentLoanRepayment } from './studentLoans.js'
import { add, info, part, subtract, total } from './working.js'

/**
 * One salary with a student loan and a workplace pension. pensionContributions
 * in pensions.js says how each pension type changes the pay each deduction is
 * worked out on.
 *
 * pensionPercent is a percentage of full salary. For relief at source it is
 * the total going into the pension, including the 20% from HMRC.
 *
 * scottish uses the Scottish income tax rates. Relief at source is still
 * claimed by the provider at 20%, whatever rate of Scottish tax is paid.
 */
export function calculatePayPackage({
  salary,
  plan = 'none',
  hasPostgraduateLoan = false,
  pensionPercent = 0,
  pensionType = 'salarySacrifice',
  weeklyHours = FULL_TIME_HOURS,
  scottish = false,
  taxYear,
}) {
  const gross = atLeastZero(salary)
  const isReliefAtSource = pensionType === 'reliefAtSource'
  const {
    pensionIntoPot,
    pensionFromPay,
    hmrcTopUp,
    reliefAtSourceGross,
    sacrificeCapped,
    minimumCashPay,
    taxablePay,
    niablePay,
    adjustedNetIncome,
  } = pensionContributions({ gross, pensionType, pensionPercent, weeklyHours, taxYear })

  const {
    tax: incomeTax,
    personalAllowanceUsed,
    topRate: topTaxRate,
  } = calculateIncomeTax(taxablePay, { scottish, taxYear })
  const nationalInsurance = calculateNationalInsurance(niablePay, { taxYear })
  const loan = calculateStudentLoanRepayment({
    grossAnnual: niablePay,
    plan,
    hasPostgraduateLoan,
    taxYear,
  })

  const extraReliefToClaim = extraRelief({ income: gross, reliefAtSourceGross, scottish, taxYear })

  const takeHomeAnnual = gross - incomeTax - nationalInsurance - loan.totalAnnual - pensionFromPay

  return {
    salary: gross,
    pensionType,
    pensionIntoPot,
    pensionFromPay,
    hmrcTopUp,
    sacrificeCapped,
    minimumCashPay,
    taxablePay,
    niablePay,
    adjustedNetIncome,
    personalAllowanceUsed,
    incomeTax,
    topTaxRate,
    nationalInsurance,
    studentLoan: loan.totalAnnual,
    undergradLoanMonthly: loan.undergradMonthly,
    postgradLoanMonthly: loan.postgradMonthly,
    extraReliefToClaim,
    takeHomeAnnual,
    takeHomeMonthly: takeHomeAnnual / 12,
    working: [
      part(
        'Take-home pay',
        [
          add('Salary', gross),
          subtract(incomeTaxLabel(scottish), incomeTax),
          subtract('National Insurance', nationalInsurance),
          subtract('Student loan', loan.totalAnnual),
          subtract('Pension paid from your pay', pensionFromPay),
        ],
        total('Take-home pay a year', takeHomeAnnual),
      ),
      part('Your pension', [
        info('Paid into your pension', pensionIntoPot),
        isReliefAtSource && info('Basic rate relief HMRC adds', hmrcTopUp),
        info('Pay income tax is worked out on', taxablePay),
        info('Pay National Insurance and student loan are worked out on', niablePay),
        isReliefAtSource && info('Extra relief to claim from HMRC', extraReliefToClaim),
      ]),
    ],
  }
}

/**
 * The new salary from a rise entered one of three ways: as the new salary
 * itself ('newSalary'), as a percentage ('percent') or in pounds ('pounds').
 */
export function newSalaryFrom(current, riseType, riseAmount) {
  if (riseType === 'percent') return current * (1 + riseAmount / 100)
  if (riseType === 'pounds') return current + riseAmount
  return riseAmount
}

/**
 * The same rise written another way, for when someone switches how they enter
 * it. Whole pounds for amounts, and enough decimal places on a percentage that
 * switching back gives the same number of pounds.
 */
export function riseEnteredAs(riseType, current, next) {
  if (riseType === 'percent') {
    return current > 0 ? Number((((next - current) / current) * 100).toFixed(4)) : 0
  }
  if (riseType === 'pounds') return Math.round(next - current)
  return Math.round(next)
}

const crosses = (before, after, threshold) => before <= threshold && after > threshold

/**
 * Compares two salaries with the same student loan and pension settings:
 * how much of the rise is kept, where the rest goes, and which thresholds
 * the rise crosses.
 */
export function calculatePayRise({ currentSalary, newSalary, ...settings }) {
  const before = calculatePayPackage({ salary: currentSalary, ...settings })
  const after = calculatePayPackage({ salary: newSalary, ...settings })

  const change = (key) => after[key] - before[key]
  const rise = change('salary')
  const kept = change('takeHomeAnnual')

  const rates = forTaxYear(INCOME_TAX_RATES, settings.taxYear)
  const { taperStart, taperFullyGoneAt } = rates.incomeTax
  const warnings = []

  // The higher rate starts at a lower income in Scotland, which also has an
  // advanced rate before the taper.
  const higherRateStartsAbove = settings.scottish
    ? rates.scottishIncomeTax.intermediateRateLimit
    : rates.incomeTax.basicRateLimit
  if (crosses(before.taxablePay, after.taxablePay, higherRateStartsAbove)) {
    warnings.push('higher-rate')
  }
  if (
    settings.scottish &&
    crosses(before.taxablePay, after.taxablePay, rates.scottishIncomeTax.higherRateLimit)
  ) {
    warnings.push('advanced-rate')
  }

  // The taper and the Child Benefit charge both use adjusted net income, which
  // every pension type reduces, including relief at source.
  if (crosses(before.adjustedNetIncome, after.adjustedNetIncome, taperStart)) {
    warnings.push('taper')
  } else if (crosses(before.taxablePay, after.taxablePay, taperStart)) {
    // Relief at source: pay goes over the limit on the payslip, but the pension
    // keeps adjusted net income under it, so the lost allowance can be claimed back.
    warnings.push('taper-reclaim')
  } else if (
    rise > 0 &&
    before.adjustedNetIncome > taperStart &&
    before.adjustedNetIncome < taperFullyGoneAt
  ) {
    warnings.push('inside-taper')
  }
  if (
    crosses(before.adjustedNetIncome, after.adjustedNetIncome, rates.childBenefitCharge.threshold)
  ) {
    warnings.push('child-benefit')
  }

  if (before.undergradLoanMonthly === 0 && after.undergradLoanMonthly > 0) {
    warnings.push('student-loan')
  }
  if (before.postgradLoanMonthly === 0 && after.postgradLoanMonthly > 0) {
    warnings.push('postgraduate-loan')
  }
  if (after.sacrificeCapped) warnings.push('minimum-wage')

  return {
    before,
    after,
    rise,
    kept,
    keptShare: rise > 0 ? kept / rise : 0,
    goesTo: {
      incomeTax: change('incomeTax'),
      nationalInsurance: change('nationalInsurance'),
      studentLoan: change('studentLoan'),
      pension: change('pensionFromPay'),
    },
    pensionIntoPotChange: change('pensionIntoPot'),
    extraReliefChange: change('extraReliefToClaim'),
    warnings,
    working: [
      part(
        'What you keep of the rise',
        [
          add('Your rise', rise),
          subtract(incomeTaxLabel(settings.scottish), change('incomeTax')),
          subtract('National Insurance', change('nationalInsurance')),
          subtract('Student loan', change('studentLoan')),
          subtract('Pension paid from your pay', change('pensionFromPay')),
        ],
        total('You keep, a year', kept),
      ),
      { ...before.working[0], title: 'Take-home pay now' },
      { ...after.working[0], title: 'Take-home pay after the rise' },
    ],
  }
}
