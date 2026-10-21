// Income tax and employee National Insurance. The figures are in
// rates/incomeTax.js, by tax year. Each function takes an optional taxYear,
// and uses TAX_YEAR when it is not passed.

import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, subtract, total } from './working.js'

/** The name of the income tax line, which says which rates were used. */
export function incomeTaxLabel(scottish, welsh = false) {
  if (scottish) return 'Scottish income tax'
  return welsh ? 'Income tax (Welsh rates)' : 'Income tax'
}

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
function incomeTaxBands({ scottish, welsh, reliefAtSource, taxYear }) {
  const rates = forTaxYear(INCOME_TAX_RATES, taxYear)
  const { personalAllowance } = rates.incomeTax
  if (scottish) {
    const s = rates.scottishIncomeTax
    return [
      { name: 'Starter rate', upTo: s.starterRateLimit - personalAllowance, rate: s.starterRate },
      {
        name: 'Basic rate',
        upTo: s.basicRateLimit - personalAllowance + reliefAtSource,
        rate: s.basicRate,
      },
      {
        name: 'Intermediate rate',
        upTo: s.intermediateRateLimit - personalAllowance + reliefAtSource,
        rate: s.intermediateRate,
      },
      {
        name: 'Higher rate',
        upTo: s.higherRateLimit - personalAllowance + reliefAtSource,
        rate: s.higherRate,
      },
      { name: 'Advanced rate', upTo: s.advancedRateLimit + reliefAtSource, rate: s.advancedRate },
      { name: 'Top rate', upTo: Infinity, rate: s.topRate },
    ]
  }
  // Wales uses the same bands as England and Northern Ireland, with its own rates.
  const { basicRateLimit, higherRateLimit } = rates.incomeTax
  const { basicRate, higherRate, additionalRate } = welsh ? rates.welshIncomeTax : rates.incomeTax
  return [
    {
      name: 'Basic rate',
      upTo: basicRateLimit - personalAllowance + reliefAtSource,
      rate: basicRate,
    },
    { name: 'Higher rate', upTo: higherRateLimit + reliefAtSource, rate: higherRate },
    { name: 'Additional rate', upTo: Infinity, rate: additionalRate },
  ]
}

/**
 * Income tax for the year. By default this uses the rates for England and
 * Northern Ireland (20%, 40% and 45%). With scottish, it uses the six Scottish
 * rates, and with welsh the Welsh rates, which are the same as England's in
 * 2026/27. The personal allowance and its taper are the same for all three.
 *
 * allowance is the tax-free pay from a tax code, such as 12,570 for 1257L or
 * -4,750 for K475. When it is given it is used as it is, without the taper,
 * the way payroll uses a code. When it is left out, the personal allowance is
 * worked out from income, with the taper.
 *
 * reliefAtSourceGross is the gross amount paid into a relief at source
 * pension (what was paid plus the 20% relief the provider claimed). It raises
 * the band limits by that amount, and comes off the income used for the
 * allowance taper. That gives the tax someone owes once they have claimed
 * their extra relief.
 *
 * topRate is the rate on the last pound, or 0 if no tax is due. bands lists
 * the slices of taxable income that were taxed, for the working.
 */
export function calculateIncomeTax(
  grossAnnual,
  { reliefAtSourceGross = 0, scottish = false, welsh = false, allowance, taxYear } = {},
) {
  const gross = atLeastZero(grossAnnual)
  const reliefAtSource = atLeastZero(reliefAtSourceGross)
  const pa = Number.isFinite(allowance)
    ? allowance
    : taperedPersonalAllowance(gross - reliefAtSource, { taxYear })
  const taxable = Math.max(0, gross - pa)

  let tax = 0
  let topRate = 0
  let from = 0
  const bands = []
  for (const band of incomeTaxBands({ scottish, welsh, reliefAtSource, taxYear })) {
    const inBand = Math.max(0, Math.min(taxable, band.upTo) - from)
    if (inBand > 0) {
      topRate = band.rate
      bands.push({ name: band.name, rate: band.rate, on: inBand, tax: inBand * band.rate })
    }
    tax += inBand * band.rate
    from = band.upTo
  }
  return { tax, personalAllowanceUsed: pa, topRate, taxableIncome: taxable, bands }
}

/**
 * The rate for a tax code that taxes all pay from a job at one rate (BR, D0,
 * D1 and the Scottish and Welsh ones). band is the name readTaxCode gives it.
 */
export function flatRateFor(band, { scottish = false, welsh = false, taxYear } = {}) {
  const rates = forTaxYear(INCOME_TAX_RATES, taxYear)
  if (scottish) {
    const s = rates.scottishIncomeTax
    const byBand = {
      basic: s.basicRate,
      intermediate: s.intermediateRate,
      higher: s.higherRate,
      advanced: s.advancedRate,
      top: s.topRate,
    }
    return byBand[band]
  }
  const r = welsh ? rates.welshIncomeTax : rates.incomeTax
  return { basic: r.basicRate, higher: r.higherRate, additional: r.additionalRate }[band]
}

/**
 * Income tax for the year on pay from a job with a tax code. code is what
 * readTaxCode gives. Payroll works tax out on pay so far in the tax year, so
 * over a whole year it comes to the tax on the year's pay.
 *
 * Returns the same as calculateIncomeTax. personalAllowanceUsed is the
 * tax-free pay from the code (negative for a K code), and flatRate is set for
 * a code that taxes everything at one rate.
 */
export function incomeTaxOnCode(pay, code, { scottish = false, welsh = false, taxYear } = {}) {
  const gross = atLeastZero(pay)
  if (code.kind === 'noTax') {
    return { tax: 0, personalAllowanceUsed: 0, topRate: 0, taxableIncome: 0, bands: [] }
  }
  if (code.kind === 'flat') {
    const rate = flatRateFor(code.band, { scottish, welsh, taxYear })
    const bands = gross > 0 ? [{ name: 'All your pay', rate, on: gross, tax: gross * rate }] : []
    return {
      tax: gross * rate,
      personalAllowanceUsed: 0,
      topRate: gross > 0 ? rate : 0,
      taxableIncome: gross,
      flatRate: rate,
      bands,
    }
  }
  return calculateIncomeTax(gross, { allowance: code.allowance, scottish, welsh, taxYear })
}

/**
 * Employee National Insurance on one pay day, the way payroll works it out:
 * on that day's pay on its own, with the thresholds for the pay period.
 * frequency is 'monthly' or 'weekly'. bands are the slices it was charged on.
 */
export function nationalInsuranceForPeriod(periodPay, frequency, { taxYear } = {}) {
  const pay = atLeastZero(periodPay)
  const { mainRate, upperRate, byPayPeriod } = forTaxYear(
    INCOME_TAX_RATES,
    taxYear,
  ).nationalInsurance
  const { primaryThreshold, upperEarningsLimit } = byPayPeriod[frequency]
  const bands = []
  if (pay > primaryThreshold) {
    const on = Math.min(pay, upperEarningsLimit) - primaryThreshold
    bands.push({
      name: 'Pay between the primary threshold and the upper earnings limit',
      rate: mainRate,
      on,
      amount: on * mainRate,
    })
  }
  if (pay > upperEarningsLimit) {
    const on = pay - upperEarningsLimit
    bands.push({
      name: 'Pay above the upper earnings limit',
      rate: upperRate,
      on,
      amount: on * upperRate,
    })
  }
  return {
    ni: bands.reduce((sum, band) => sum + band.amount, 0),
    primaryThreshold,
    upperEarningsLimit,
    bands,
  }
}

/**
 * The slices of pay that employee National Insurance is charged on, for the
 * working. calculateNationalInsurance adds them up the same way.
 */
export function nationalInsuranceBands(grossAnnual, { taxYear } = {}) {
  const gross = atLeastZero(grossAnnual)
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = forTaxYear(
    INCOME_TAX_RATES,
    taxYear,
  ).nationalInsurance
  const bands = []
  if (gross > primaryThreshold) {
    const on = Math.min(gross, upperEarningsLimit) - primaryThreshold
    bands.push({
      name: 'Pay between the primary threshold and the upper earnings limit',
      rate: mainRate,
      on,
      amount: on * mainRate,
    })
  }
  if (gross > upperEarningsLimit) {
    const on = gross - upperEarningsLimit
    bands.push({
      name: 'Pay above the upper earnings limit',
      rate: upperRate,
      on,
      amount: on * upperRate,
    })
  }
  return bands
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
  const incomeTax = calculateIncomeTax(gross, { scottish, taxYear })
  const { tax, personalAllowanceUsed } = incomeTax
  const ni = calculateNationalInsurance(gross, { taxYear })
  const takeHome = gross - tax - ni
  const taxName = incomeTaxLabel(scottish)
  return {
    grossAnnual: gross,
    personalAllowanceUsed,
    incomeTax: tax,
    nationalInsurance: ni,
    takeHomeAnnual: takeHome,
    takeHomeMonthly: takeHome / 12,
    takeHomeWeekly: takeHome / 52,
    effectiveRate: gross > 0 ? (tax + ni) / gross : 0,
    working: [
      part(
        'Take-home pay',
        [
          add('Salary before tax', gross),
          subtract(taxName, tax),
          subtract('National Insurance', ni),
        ],
        total('Take-home pay a year', takeHome),
      ),
      incomeTaxPart(taxName, gross, incomeTax),
      nationalInsurancePart(gross, ni, taxYear),
    ],
  }
}

/** How the income tax on a salary was worked out, for the working. */
export function incomeTaxPart(title, gross, { tax, personalAllowanceUsed, taxableIncome, bands }) {
  return part(
    title,
    [
      info('Income', gross),
      info('Personal allowance (tax-free)', personalAllowanceUsed),
      info('Taxable income', taxableIncome),
      ...bands.map((band) => add(band.name, band.tax, { rate: band.rate, on: band.on })),
    ],
    total(title, tax),
  )
}

/** How employee National Insurance on a salary was worked out, for the working. */
export function nationalInsurancePart(gross, ni, taxYear) {
  return part(
    'National Insurance',
    nationalInsuranceBands(gross, { taxYear }).map((band) =>
      add(band.name, band.amount, { rate: band.rate, on: band.on }),
    ),
    total('National Insurance', ni),
  )
}
