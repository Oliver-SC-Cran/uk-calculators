// The sums behind the "Should I overpay my mortgage or save?" guide. Overpaying
// uses the mortgage calculator's own functions, and savings use the 2026/27
// rules for tax on savings interest in SAVINGS_TAX.

import { INCOME_TAX, SAVINGS_TAX } from './calculations.js'
import { calculateMortgageOverpayment } from './mortgage.js'

const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

export const TAX_BANDS = {
  basic: INCOME_TAX.basicRate,
  higher: INCOME_TAX.higherRate,
  additional: INCOME_TAX.additionalRate,
}

/**
 * The mortgage interest a lump sum overpayment saves over the first `years`
 * years, from the mortgage calculator's own year-by-year interest: the interest
 * charged without the overpayment, less the interest charged with it.
 */
export function interestSavedByOverpaying({
  balance,
  annualRatePercent,
  remainingYears,
  lumpSum,
  years = 1,
}) {
  const result = calculateMortgageOverpayment({
    balance,
    annualRatePercent,
    remainingYears,
    lumpSum,
    overpaymentLimit: null,
  })
  if (!result) return 0
  return result.years
    .slice(0, years)
    .reduce((total, row) => total + row.standardInterest - row.interest, 0)
}

/**
 * A year's interest on savings, and the tax on it, for someone in one income
 * tax band. otherInterest is interest from other savings, which uses up the
 * Personal Savings Allowance first. Interest in a cash ISA is not taxed.
 *
 * This leaves out the starting rate for savings, which only helps people whose
 * other income is under £17,570.
 */
export function savingsInterestAfterTax({
  amount,
  ratePercent,
  band = 'basic',
  otherInterest = 0,
  isa = false,
}) {
  const interest = (atLeastZero(amount) * atLeastZero(ratePercent)) / 100
  const allowanceLeft = isa
    ? 0
    : Math.max(0, SAVINGS_TAX.personalSavingsAllowance[band] - atLeastZero(otherInterest))
  const taxable = isa ? 0 : Math.max(0, interest - allowanceLeft)
  const tax = taxable * TAX_BANDS[band]
  return { interest, allowanceUsed: interest - taxable, taxable, tax, afterTax: interest - tax }
}

/**
 * The savings rate before tax that leaves the same as a given rate after tax,
 * for interest above the allowance. A basic rate taxpayer needs 5% to be left
 * with 4%, because 20% of it goes in tax.
 */
export const rateBeforeTaxToMatch = (ratePercent, band) => ratePercent / (1 - TAX_BANDS[band])
