// The pay rise calculator. It adds pensions on top of the tax, National
// Insurance and student loan functions in calculations.js, and contains no
// tax logic of its own.

import {
  calculateIncomeTax,
  calculateNationalInsurance,
  calculateStudentLoanRepayment,
  INCOME_TAX,
  MINIMUM_WAGE,
} from './calculations.js'

export const PENSION_TYPES = {
  salarySacrifice: 'Salary sacrifice',
  netPay: 'Net pay arrangement',
  reliefAtSource: 'Relief at source',
}

export const CHILD_BENEFIT_CHARGE = {
  threshold: 60000, // adjusted net income above this can trigger the charge
  fullyRepaidAt: 80000, // above this, all of the Child Benefit is paid back
}

// Announced on 26 November 2025. Not in force for 2026/27.
export const SALARY_SACRIFICE_CHANGE = {
  startDate: '6 April 2029',
  niFreeLimit: 2000, // pension salary sacrifice above this a year will have NI charged on it
}

export const FULL_TIME_HOURS = 37.5

const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

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
 */
export function calculatePayPackage({
  salary,
  plan = 'none',
  hasPostgraduateLoan = false,
  pensionPercent = 0,
  pensionType = 'salarySacrifice',
  weeklyHours = FULL_TIME_HOURS,
}) {
  const gross = atLeastZero(salary)
  const share = Math.min(atLeastZero(pensionPercent), 100) / 100
  const wanted = gross * share

  // A salary sacrifice must not take cash pay below the minimum wage. This
  // uses the rate for people aged 21 and over.
  const minimumCashPay = MINIMUM_WAGE.nationalLivingWage * atLeastZero(weeklyHours) * 52
  const isSacrifice = pensionType === 'salarySacrifice'
  const isReliefAtSource = pensionType === 'reliefAtSource'
  const pensionIntoPot = isSacrifice
    ? Math.min(wanted, Math.max(0, gross - minimumCashPay))
    : wanted
  const sacrificeCapped = isSacrifice && pensionIntoPot < wanted

  const reliefAtSourceGross = isReliefAtSource ? pensionIntoPot : 0
  const hmrcTopUp = reliefAtSourceGross * INCOME_TAX.basicRate
  const pensionFromPay = pensionIntoPot - hmrcTopUp

  // The pay each deduction is worked out on.
  const niablePay = isSacrifice ? gross - pensionIntoPot : gross
  const taxablePay = isReliefAtSource ? gross : gross - pensionIntoPot
  const adjustedNetIncome = gross - pensionIntoPot

  const { tax: incomeTax, personalAllowanceUsed } = calculateIncomeTax(taxablePay)
  const nationalInsurance = calculateNationalInsurance(niablePay)
  const loan = calculateStudentLoanRepayment({ grossAnnual: niablePay, plan, hasPostgraduateLoan })

  // Relief at source only: the tax owed once the wider basic rate band and
  // the allowance based on adjusted net income are taken into account. The
  // difference from the payslip is what can be claimed back from HMRC.
  const taxAfterClaim = calculateIncomeTax(gross, { reliefAtSourceGross }).tax
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

  const { basicRateLimit, taperStart, taperFullyGoneAt } = INCOME_TAX
  const warnings = []

  if (crosses(before.taxablePay, after.taxablePay, basicRateLimit)) warnings.push('higher-rate')

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
  if (crosses(before.adjustedNetIncome, after.adjustedNetIncome, CHILD_BENEFIT_CHARGE.threshold)) {
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
