// The pay rise calculator. Each salary's take-home pay is worked out by the
// take-home pay calculator (takeHome.js), so the same salary gives the same
// take-home on both pages. This file compares two salaries and contains no
// tax logic of its own.

import { incomeTaxLabel, payrollCodeAllowance } from './incomeTax.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { FULL_TIME_HOURS } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'
import { calculateTakeHomePay } from './takeHome.js'
import { add, part, subtract, total } from './working.js'

/**
 * One salary with a student loan and a workplace pension, worked out exactly
 * as the take-home pay calculator does it (calculateTakeHomePay): income tax
 * on the year's pay, and National Insurance and student loan on each pay day
 * with gov.uk's weekly or monthly thresholds.
 *
 * pensionPercent is a percentage of full salary, and pensionYearlyAmount an
 * amount in pounds on top of it. For relief at source they are the total
 * going into the pension, including the 20% from HMRC.
 *
 * scottish and welsh pick the income tax rates. Relief at source is still
 * claimed by the provider at 20%, whatever rate of Scottish tax is paid.
 *
 * taxCode is what readTaxCode gives, or null. With a code, income tax is what
 * payroll takes on it over the year, with the code used as it is and no more
 * than half the pay taken. Without one, it uses the standard Personal
 * Allowance with the taper. payFrequency is 'monthly' or 'weekly'.
 */
export function calculatePayPackage({
  salary,
  plan = 'none',
  hasPostgraduateLoan = false,
  pensionPercent = 0,
  pensionYearlyAmount = 0,
  pensionType = 'salarySacrifice',
  weeklyHours = FULL_TIME_HOURS,
  scottish = false,
  welsh = false,
  taxCode = null,
  payFrequency = 'monthly',
  taxYear,
}) {
  const pay = calculateTakeHomePay({
    pay: salary,
    payPer: 'year',
    payFrequency,
    taxCode,
    scottish,
    welsh,
    pensionType,
    pensionPercent,
    pensionYearlyAmount,
    weeklyHours,
    plan,
    hasPostgraduateLoan,
    taxYear,
  })
  const { pension } = pay

  return {
    salary: pay.pay,
    pensionType,
    pensionIntoPot: pension.pensionIntoPot,
    pensionFromPay: pension.pensionFromPay,
    hmrcTopUp: pension.hmrcTopUp,
    // More was asked to go into the pension than the pay could cover.
    moreThanPay: pension.moreThanPay,
    sacrificeCapped: pension.sacrificeCapped,
    minimumCashPay: pension.minimumCashPay,
    taxablePay: pension.taxablePay,
    niablePay: pension.niablePay,
    adjustedNetIncome: pay.adjustedNetIncome,
    personalAllowanceUsed: pay.personalAllowanceUsed,
    incomeTax: pay.incomeTax,
    // Tax a K code asks for that payroll cannot take, because it would be
    // more than half the pay. HMRC collects it another way.
    taxNotTaken: pay.taxNotTaken,
    topTaxRate: pay.topTaxRate,
    nationalInsurance: pay.nationalInsurance,
    studentLoan: pay.studentLoan,
    // Each loan's repayment on one pay day, to see when a rise starts them.
    undergradLoanEachPayDay: pay.studentLoanEachPayDay.undergrad,
    postgradLoanEachPayDay: pay.studentLoanEachPayDay.postgrad,
    extraReliefToClaim: pay.extraReliefToClaim,
    takeHomeAnnual: pay.takeHomeAnnual,
    takeHomeMonthly: pay.takeHomeMonthly,
    working: pay.working,
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
 * it. Amounts to `places` decimal places (whole pounds for a salary, pence
 * for pay a month or an hour), and enough decimal places on a percentage that
 * switching back gives the same number of pounds.
 */
export function riseEnteredAs(riseType, current, next, places = 0) {
  if (riseType === 'percent') {
    return current > 0 ? Number((((next - current) / current) * 100).toFixed(4)) : 0
  }
  const round = (amount) => Math.round(amount * 10 ** places) / 10 ** places
  if (riseType === 'pounds') return round(next - current)
  return round(next)
}

/**
 * The tax-free pay a code gives for a year, the way payroll works it out, in
 * place of the Personal Allowance (negative for a K code). null for a code
 * that taxes all pay at one rate, or none of it.
 */
function codeAllowance(code, payFrequency = 'monthly') {
  if (code.kind !== 'allowance' && code.kind !== 'k') return null
  const { year } = payrollCodeAllowance(code.number, payFrequency)
  return code.kind === 'k' ? -year : year
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
  const { taperStart, taperFullyGoneAt, personalAllowance } = rates.incomeTax
  const warnings = []

  // A tax code moves the rates up or down by the difference between its
  // tax-free pay and the Personal Allowance. A code that taxes everything at
  // one rate, or nothing, has no thresholds to cross.
  const code = settings.taxCode ?? null
  const allowance = code ? codeAllowance(code, settings.payFrequency) : personalAllowance
  const shift = allowance === null ? 0 : allowance - personalAllowance

  // The higher rate starts at a lower income in Scotland, which also has an
  // advanced rate before the taper.
  const thresholds = {
    higherRate:
      (settings.scottish
        ? rates.scottishIncomeTax.intermediateRateLimit
        : rates.incomeTax.basicRateLimit) + shift,
    advancedRate: rates.scottishIncomeTax.higherRateLimit + shift,
  }
  if (allowance !== null && crosses(before.taxablePay, after.taxablePay, thresholds.higherRate)) {
    warnings.push('higher-rate')
  }
  if (
    allowance !== null &&
    settings.scottish &&
    crosses(before.taxablePay, after.taxablePay, thresholds.advancedRate)
  ) {
    warnings.push('advanced-rate')
  }

  // The taper and the Child Benefit charge both use adjusted net income, which
  // every pension type reduces, including relief at source. Payroll uses a
  // code as it is, without the taper, so with a code there is one note.
  if (code) {
    if (code.kind === 'allowance' && after.adjustedNetIncome > taperStart) {
      warnings.push('taper-code')
    }
  } else if (crosses(before.adjustedNetIncome, after.adjustedNetIncome, taperStart)) {
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

  if (before.undergradLoanEachPayDay === 0 && after.undergradLoanEachPayDay > 0) {
    warnings.push('student-loan')
  }
  if (before.postgradLoanEachPayDay === 0 && after.postgradLoanEachPayDay > 0) {
    warnings.push('postgraduate-loan')
  }
  if (after.sacrificeCapped) warnings.push('minimum-wage')
  if (after.taxNotTaken > 0.5) warnings.push('tax-limit')

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
    thresholds,
    working: [
      part(
        'What you keep of the rise',
        [
          add('Your rise', rise),
          subtract(incomeTaxLabel(settings.scottish, settings.welsh), change('incomeTax')),
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
