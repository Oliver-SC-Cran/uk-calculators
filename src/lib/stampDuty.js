// The stamp duty calculator, for England and Northern Ireland. Its rates are in
// rates/stampDuty.js, by tax year.

import { atLeastZero } from './numbers.js'
import { STAMP_DUTY_RATES } from './rates/stampDuty.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, total } from './working.js'

/**
 * Stamp duty for one residential purchase by an individual.
 * buyerType is 'homeMover', 'firstTimeBuyer' or 'additional'.
 *
 * The tax is charged in slices, like income tax. Surcharges are added to the
 * rate of every slice, including the first one. The total is rounded down to
 * the whole pound.
 */
export function calculateStampDuty({
  price,
  buyerType = 'homeMover',
  nonResident = false,
  taxYear,
}) {
  const rates = forTaxYear(STAMP_DUTY_RATES, taxYear)
  const { firstTimeBuyer, additionalPropertySurcharge, nonResidentSurcharge } = rates
  const amount = atLeastZero(price)

  const isFirstTimeBuyer = buyerType === 'firstTimeBuyer'
  const firstTimeBuyerOverLimit = isFirstTimeBuyer && amount > firstTimeBuyer.maxPrice
  const reliefApplies = isFirstTimeBuyer && !firstTimeBuyerOverLimit
  const bands = reliefApplies ? firstTimeBuyer.bands : rates.bands

  const surchargesApply = amount >= rates.surchargeMinimumPrice
  const additionalApplies = buyerType === 'additional' && surchargesApply
  const nonResidentApplies = Boolean(nonResident) && surchargesApply
  const surcharge =
    (additionalApplies ? additionalPropertySurcharge : 0) +
    (nonResidentApplies ? nonResidentSurcharge : 0)

  const breakdown = []
  let from = 0
  for (const band of bands) {
    if (amount <= from) break
    const to = Math.min(amount, band.upTo)
    // Whole-number percentages keep the sums exact.
    const ratePercent = Math.round((band.rate + surcharge) * 100)
    breakdown.push({
      from,
      to,
      rate: ratePercent / 100,
      amountInBand: to - from,
      tax: ((to - from) * ratePercent) / 100,
    })
    from = band.upTo
  }

  const tax = Math.floor(breakdown.reduce((total, band) => total + band.tax, 0))

  return {
    price: amount,
    tax,
    effectiveRate: amount > 0 ? tax / amount : 0,
    breakdown,
    reliefApplies,
    firstTimeBuyerOverLimit,
    additionalApplies,
    nonResidentApplies,
    // Buying an additional property or as a non-resident, but under the minimum price.
    surchargeWaived:
      amount > 0 && (buyerType === 'additional' || Boolean(nonResident)) && !surchargesApply,
    working: [
      part(
        'Stamp duty',
        breakdown.map((slice) =>
          add('Tax on this part of the price', slice.tax, {
            rate: slice.rate,
            on: slice.amountInBand,
            from: slice.from,
            to: slice.to,
          }),
        ),
        total('Stamp duty, rounded down to the pound', tax, { rounding: 'down' }),
      ),
      part('Rates used', [
        info('The price', amount),
        reliefApplies && info('First-time buyer rates apply up to', firstTimeBuyer.maxPrice),
        surcharge > 0 && info('Added to the rate on every part', surcharge, { unit: 'percent' }),
      ]),
    ],
  }
}
