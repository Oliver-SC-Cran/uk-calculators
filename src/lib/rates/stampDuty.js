// Stamp Duty Land Tax on residential property in England and Northern Ireland.
// These rates are not tied to the tax year, so each entry holds the rates in
// force during that tax year and says the date they apply from. If they change
// part way through a year, the page and the guide need to say which applies.
// Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates

import { forTaxYear } from './taxYear.js'

export const STAMP_DUTY_RATES = {
  '2026/27': {
    ratesFrom: '1 April 2025',
    // Each rate applies to the slice of the price up to that amount.
    bands: [
      { upTo: 125000, rate: 0 },
      { upTo: 250000, rate: 0.02 },
      { upTo: 925000, rate: 0.05 },
      { upTo: 1500000, rate: 0.1 },
      { upTo: Infinity, rate: 0.12 },
    ],
    // First-time buyer relief. Over maxPrice there is no relief at all.
    firstTimeBuyer: {
      maxPrice: 500000,
      bands: [
        { upTo: 300000, rate: 0 },
        { upTo: 500000, rate: 0.05 },
      ],
    },
    additionalPropertySurcharge: 0.05, // added to every band
    nonResidentSurcharge: 0.02, // added to every band
    surchargeMinimumPrice: 40000, // the surcharges apply to purchases of this much or more
    returnDeadlineDays: 14, // to send a return and pay, counted from completion
    replaceMainHomeMonths: 36, // time to sell a previous main home and avoid or reclaim the surcharge
    refundClaimMonths: 12, // time to claim that refund
    nonResidentDays: 183, // days in the UK in the 12 months before buying to count as resident
  },
}

// The current tax year's figures, for page copy and guides.
export const STAMP_DUTY = forTaxYear(STAMP_DUTY_RATES)
