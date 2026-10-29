// The sums behind the "Should I overpay my mortgage or save?" guide. Overpaying
// uses the mortgage calculator's own functions, and savings use the rules for
// tax on savings interest in rates/incomeTax.js, by tax year.
//
// afterRise: true uses the savings tax rates after the announced rise in every
// band (savingsTax.rateRise, from savingsTax.rateRiseFrom), for the guide's
// "from April 2027" figures. It is off unless it is passed.

import { calculateMortgageOverpayment } from './mortgage.js'
import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { forTaxYear } from './rates/taxYear.js'

/**
 * The tax rate for each band that savings interest above the allowances pays:
 * the income tax rates, or with afterRise those rates plus the announced rise.
 */
const taxBandsFor = (taxYear, afterRise = false) => {
  const { incomeTax, savingsTax } = forTaxYear(INCOME_TAX_RATES, taxYear)
  const rise = afterRise ? savingsTax.rateRise : 0
  // Rounded to a tenth of a percentage point, so 0.4 + 0.04 is exactly 0.44.
  const withRise = (rate) => Math.round((rate + rise) * 1000) / 1000
  return {
    basic: withRise(incomeTax.basicRate),
    higher: withRise(incomeTax.higherRate),
    additional: withRise(incomeTax.additionalRate),
  }
}

// The current tax year's bands, and the bands after the rise, for the guide.
export const TAX_BANDS = taxBandsFor()
export const TAX_BANDS_AFTER_RISE = taxBandsFor(undefined, true)

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
  taxYear,
  afterRise = false,
}) {
  const { savingsTax } = forTaxYear(INCOME_TAX_RATES, taxYear)
  const interest = (atLeastZero(amount) * atLeastZero(ratePercent)) / 100
  const allowanceLeft = isa
    ? 0
    : Math.max(0, savingsTax.personalSavingsAllowance[band] - atLeastZero(otherInterest))
  const taxable = isa ? 0 : Math.max(0, interest - allowanceLeft)
  const tax = taxable * taxBandsFor(taxYear, afterRise)[band]
  return { interest, allowanceUsed: interest - taxable, taxable, tax, afterTax: interest - tax }
}

/**
 * The savings rate before tax that leaves the same as a given rate after tax,
 * for interest above the allowance. A basic rate taxpayer needs 5% to be left
 * with 4%, because 20% of it goes in tax.
 */
export const rateBeforeTaxToMatch = (ratePercent, band, { taxYear, afterRise = false } = {}) =>
  ratePercent / (1 - taxBandsFor(taxYear, afterRise)[band])
