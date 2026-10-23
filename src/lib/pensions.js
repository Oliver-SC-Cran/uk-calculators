// Workplace pension contributions, and how each way of paying in changes the
// pay that income tax, National Insurance and student loans are worked out on.
// Shared by the pay rise and take-home pay calculators.

import { calculateIncomeTax } from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { FULL_TIME_HOURS, MINIMUM_WAGE_RATES } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'

export const PENSION_TYPES = {
  salarySacrifice: 'Salary sacrifice',
  netPay: 'Net pay arrangement',
  reliefAtSource: 'Relief at source',
}

/**
 * What goes into a workplace pension from a year's pay, and the pay each
 * deduction is then worked out on. The three types differ only in which
 * deductions see the reduced pay:
 *
 * - salary sacrifice: pay is reduced first, so tax, NI and student loan all fall
 * - net pay: the contribution comes off before income tax, but not NI or student loan
 * - relief at source: nothing changes on the payslip. 80% of the contribution
 *   is paid from take-home pay and the provider claims the other 20% from HMRC
 *
 * The contribution is pensionPercent of the year's pay, plus pensionYearlyAmount
 * in pounds, and never more than the pay itself. For relief at source it is
 * the total going into the pension, including the 20% from HMRC.
 *
 * A salary sacrifice must not take cash pay below the minimum wage. This uses
 * the rate for people aged 21 and over, for weeklyHours a week.
 */
export function pensionContributions({
  gross: grossAnnual,
  pensionType = 'salarySacrifice',
  pensionPercent = 0,
  pensionYearlyAmount = 0,
  weeklyHours = FULL_TIME_HOURS,
  taxYear,
}) {
  const { nationalLivingWage } = forTaxYear(MINIMUM_WAGE_RATES, taxYear)
  const { basicRate } = forTaxYear(INCOME_TAX_RATES, taxYear).incomeTax
  const gross = atLeastZero(grossAnnual)
  const share = Math.min(atLeastZero(pensionPercent), 100) / 100
  const asked = gross * share + atLeastZero(pensionYearlyAmount)
  const wanted = Math.min(asked, gross)

  const minimumCashPay = nationalLivingWage * atLeastZero(weeklyHours) * 52
  const isSacrifice = pensionType === 'salarySacrifice'
  const isReliefAtSource = pensionType === 'reliefAtSource'
  const pensionIntoPot = isSacrifice
    ? Math.min(wanted, Math.max(0, gross - minimumCashPay))
    : wanted

  const reliefAtSourceGross = isReliefAtSource ? pensionIntoPot : 0
  const hmrcTopUp = reliefAtSourceGross * basicRate

  return {
    pensionType,
    pensionIntoPot,
    pensionFromPay: pensionIntoPot - hmrcTopUp,
    hmrcTopUp,
    reliefAtSourceGross,
    // More was asked for than the pay could cover.
    moreThanPay: asked > gross,
    sacrificeCapped: isSacrifice && pensionIntoPot < wanted,
    minimumCashPay,
    // The pay each deduction is worked out on.
    taxablePay: isReliefAtSource ? gross : gross - pensionIntoPot,
    niablePay: isSacrifice ? gross - pensionIntoPot : gross,
    adjustedNetIncome: gross - pensionIntoPot,
  }
}

/**
 * A pension contribution written another way, for when someone switches
 * between a percentage of pay ('percent') and pounds each pay day ('amount'),
 * or changes how often they are paid. It is worked out from the contribution
 * as the person typed it (typed: { amount, unit, payDays, pay }, where pay is
 * the year's pay), and switching back gives the typed amount itself: 7% of
 * £45,123 is £263.2175 a month, shown as £263.22, and back to a percentage is
 * 7% again.
 *
 * amount, unit, payDays and pay are the contribution entered now, which
 * becomes the typed one when there is none, or when the pay has changed since
 * it was typed. Returns { amount, typed }, for the field's setExact.
 */
export function switchPension({ amount, unit, payDays, pay, toUnit, toPayDays, typed }) {
  const source = typed && typed.pay === pay ? typed : { amount, unit, payDays, pay }
  const same = toUnit === source.unit && (toUnit === 'percent' || toPayDays === source.payDays)
  if (same) return { amount: source.amount, typed: source }
  const yearly =
    source.unit === 'percent' ? (source.pay * source.amount) / 100 : source.amount * source.payDays
  const next = toUnit === 'percent' ? (pay > 0 ? (yearly / pay) * 100 : 0) : yearly / toPayDays
  return { amount: next, typed: source }
}

/**
 * Relief at source only: the extra relief a higher rate taxpayer can claim
 * from HMRC, which is not on the payslip. It is the tax on income worked out
 * the payslip's way, less the tax once the wider bands and the allowance
 * based on adjusted net income are taken into account.
 */
export function extraReliefToClaim({
  income,
  reliefAtSourceGross,
  scottish = false,
  welsh = false,
  taxYear,
}) {
  if (!(reliefAtSourceGross > 0)) return 0
  const where = { scottish, welsh, taxYear }
  const onPayslip = calculateIncomeTax(income, where).tax
  const afterClaim = calculateIncomeTax(income, { ...where, reliefAtSourceGross }).tax
  return Math.max(0, onPayslip - afterClaim)
}
