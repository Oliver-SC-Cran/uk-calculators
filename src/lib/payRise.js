// The pay rise calculator. It adds pensions on top of the tax, National
// Insurance and student loan functions in incomeTax.js and studentLoans.js,
// and contains no tax logic of its own.

import { calculateIncomeTax, calculateNationalInsurance } from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { FULL_TIME_HOURS, MINIMUM_WAGE_RATES } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'
import { calculateStudentLoanRepayment } from './studentLoans.js'

export const PENSION_TYPES = {
  salarySacrifice: 'Salary sacrifice',
  netPay: 'Net pay arrangement',
  reliefAtSource: 'Relief at source',
}

/**
 * One salary with a student loan and a workplace pension. The three pension
 * types differ only in which deductions see the reduced pay:
 *
 * - salary sacrifice: pay is reduced first, so tax, NI and student loan all fall
 * - net pay: the contribution comes off before income tax, but not NI or student loan
 * - relief at source: nothing changes on the payslip. 80% of the contribution
 *   is paid from take-home pay and the provider claims the other 20% from HMRC
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
  const { nationalLivingWage } = forTaxYear(MINIMUM_WAGE_RATES, taxYear)
  const { basicRate } = forTaxYear(INCOME_TAX_RATES, taxYear).incomeTax
  const gross = atLeastZero(salary)
  const share = Math.min(atLeastZero(pensionPercent), 100) / 100
  const wanted = gross * share

  // A salary sacrifice must not take cash pay below the minimum wage. This
  // uses the rate for people aged 21 and over.
  const minimumCashPay = nationalLivingWage * atLeastZero(weeklyHours) * 52
  const isSacrifice = pensionType === 'salarySacrifice'
  const isReliefAtSource = pensionType === 'reliefAtSource'
  const pensionIntoPot = isSacrifice
    ? Math.min(wanted, Math.max(0, gross - minimumCashPay))
    : wanted
  const sacrificeCapped = isSacrifice && pensionIntoPot < wanted

  const reliefAtSourceGross = isReliefAtSource ? pensionIntoPot : 0
  const hmrcTopUp = reliefAtSourceGross * basicRate
  const pensionFromPay = pensionIntoPot - hmrcTopUp

  // The pay each deduction is worked out on.
  const niablePay = isSacrifice ? gross - pensionIntoPot : gross
  const taxablePay = isReliefAtSource ? gross : gross - pensionIntoPot
  const adjustedNetIncome = gross - pensionIntoPot

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

  // Relief at source only: the tax owed once the wider bands and the
  // allowance based on adjusted net income are taken into account. The
  // difference from the payslip is what can be claimed back from HMRC.
  const taxAfterClaim = calculateIncomeTax(gross, { reliefAtSourceGross, scottish, taxYear }).tax
  const extraReliefToClaim = isReliefAtSource ? Math.max(0, incomeTax - taxAfterClaim) : 0

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
  }
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
  }
}
