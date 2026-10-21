// Income tax and employee National Insurance. The figures are in
// rates/incomeTax.js, by tax year. Each function takes an optional taxYear,
// and uses TAX_YEAR when it is not passed.

import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { forTaxYear } from './rates/taxYear.js'

/**
 * Reduces the personal allowance (£12,570 in 2026/27) by £1 for every £2 of
 * income above the taper start (£100,000), until it reaches £0.
 */
export function taperedPersonalAllowance(grossAnnual, { taxYear } = {}) {
  const { personalAllowance, taperStart, taperAllowanceLostPerPound } = forTaxYear(
    INCOME_TAX_RATES,
    taxYear,
  ).incomeTax
  if (grossAnnual <= taperStart) return personalAllowance
  const reduction = Math.floor((grossAnnual - taperStart) * taperAllowanceLostPerPound)
  return Math.max(0, personalAllowance - reduction)
}

/**
 * The income tax bands, measured on taxable income (income minus the personal
 * allowance). Each rate applies to the slice of taxable income up to `upTo`.
 *
 * The bands are fixed widths. The basic rate band is £37,700 wide in 2026/27,
 * so when the taper shrinks the allowance, the lost allowance is taxed at the
 * top of the bands, not the bottom. The last limit (£125,140) is not reduced
 * by the allowance, because there is none left by then.
 *
 * reliefAtSource is the gross amount paid into a relief at source pension. It
 * raises the basic and higher rate limits in England, Wales and Northern
 * Ireland. In Scotland it raises every limit except the starter rate one,
 * because income taxed at 19% already gets its relief at 20%. That gives
 * gov.uk's figures for the extra relief: 20% and 25%, or in Scotland 1%, 22%,
 * 25% and 28%. gov.uk publishes the percentages, not this method.
 */
function incomeTaxBands({ scottish, reliefAtSource, taxYear }) {
  const rates = forTaxYear(INCOME_TAX_RATES, taxYear)
  const { personalAllowance } = rates.incomeTax
  if (scottish) {
    const s = rates.scottishIncomeTax
    return [
      { upTo: s.starterRateLimit - personalAllowance, rate: s.starterRate },
      { upTo: s.basicRateLimit - personalAllowance + reliefAtSource, rate: s.basicRate },
      {
        upTo: s.intermediateRateLimit - personalAllowance + reliefAtSource,
        rate: s.intermediateRate,
      },
      { upTo: s.higherRateLimit - personalAllowance + reliefAtSource, rate: s.higherRate },
      { upTo: s.advancedRateLimit + reliefAtSource, rate: s.advancedRate },
      { upTo: Infinity, rate: s.topRate },
    ]
  }
  const { basicRateLimit, higherRateLimit, basicRate, higherRate, additionalRate } = rates.incomeTax
  return [
    { upTo: basicRateLimit - personalAllowance + reliefAtSource, rate: basicRate },
    { upTo: higherRateLimit + reliefAtSource, rate: higherRate },
    { upTo: Infinity, rate: additionalRate },
  ]
}

/**
 * Income tax for the year. By default this uses the rates for England, Wales
 * and Northern Ireland (20%, 40% and 45%). With scottish, it uses the six
 * Scottish rates. The personal allowance and its taper are the same for both.
 *
 * reliefAtSourceGross is the gross amount paid into a relief at source
 * pension (what was paid plus the 20% relief the provider claimed). It raises
 * the band limits by that amount, and comes off the income used for the
 * allowance taper. That gives the tax someone owes once they have claimed
 * their extra relief.
 *
 * topRate is the rate on the last pound, or 0 if no tax is due.
 */
export function calculateIncomeTax(
  grossAnnual,
  { reliefAtSourceGross = 0, scottish = false, taxYear } = {},
) {
  const gross = atLeastZero(grossAnnual)
  const reliefAtSource = atLeastZero(reliefAtSourceGross)
  const pa = taperedPersonalAllowance(gross - reliefAtSource, { taxYear })
  const taxable = Math.max(0, gross - pa)

  let tax = 0
  let topRate = 0
  let from = 0
  for (const band of incomeTaxBands({ scottish, reliefAtSource, taxYear })) {
    const inBand = Math.max(0, Math.min(taxable, band.upTo) - from)
    if (inBand > 0) topRate = band.rate
    tax += inBand * band.rate
    from = band.upTo
  }
  return { tax, personalAllowanceUsed: pa, topRate }
}

/** Employee Class 1 National Insurance: 8% then 2%. */
export function calculateNationalInsurance(grossAnnual, { taxYear } = {}) {
  const gross = atLeastZero(grossAnnual)
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = forTaxYear(
    INCOME_TAX_RATES,
    taxYear,
  ).nationalInsurance
  let ni = 0
  if (gross > primaryThreshold) {
    const mainBandTop = Math.min(gross, upperEarningsLimit)
    ni += (mainBandTop - primaryThreshold) * mainRate
  }
  if (gross > upperEarningsLimit) {
    ni += (gross - upperEarningsLimit) * upperRate
  }
  return ni
}

/**
 * Full take-home pay breakdown. scottish switches income tax to the Scottish
 * rates. National Insurance is the same either way.
 */
export function calculateTakeHome(grossAnnual, { scottish = false, taxYear } = {}) {
  const gross = atLeastZero(grossAnnual)
  const { tax, personalAllowanceUsed } = calculateIncomeTax(gross, { scottish, taxYear })
  const ni = calculateNationalInsurance(gross, { taxYear })
  const takeHome = gross - tax - ni
  return {
    grossAnnual: gross,
    personalAllowanceUsed,
    incomeTax: tax,
    nationalInsurance: ni,
    takeHomeAnnual: takeHome,
    takeHomeMonthly: takeHome / 12,
    takeHomeWeekly: takeHome / 52,
    effectiveRate: gross > 0 ? (tax + ni) / gross : 0,
  }
}
