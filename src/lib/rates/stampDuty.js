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
    // A new shared ownership lease from an approved body, such as a housing
    // association or council. A resale of an existing share is taxed like any
    // other purchase.
    // https://www.gov.uk/stamp-duty-land-tax/shared-ownership-property
    // https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm27060
    sharedOwnership: {
      // Paying in stages: tax on the rent is this rate on the net present
      // value of the rent above the nil band.
      // https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm13075
      rentNilBand: 125000,
      rentRate: 0.01,
      // Each year's rent is discounted at this rate a year, compounded.
      rentDiscountRate: 0.035,
      // After this many years, every year counts at the highest rent in them.
      // An estimated rent is looked at again at the end of the fifth year.
      // https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm13155
      rentYearsKnown: 5,
      // Buying more shares is not taxed until your share goes over this.
      // https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm27065
      staircasingTaxedOver: 0.8,
      // The share of the price you can buy at first, on a new lease.
      minimumShare: 0.1,
      maximumShare: 0.75,
      // The yearly rent most landlords charge, as a share of the value of the
      // part they own. Used when no rent is entered.
      // https://www.gov.uk/shared-ownership-scheme/paying-rent
      typicalRentRate: 0.0275,
      // Not an HMRC figure: an estimate of the yearly rent rise for the page to
      // start with. Shared ownership rents go up by RPI plus 0.5% or CPI plus
      // 1%, and this is CPI plus 1%, taking CPI as 2%.
      typicalRentRise: 0.03,
      // The shortest lease on the current shared ownership model.
      // https://www.gov.uk/government/publications/shared-ownership-guidance-for-lenders-landlords-and-conveyancers/shared-ownership-guidance-for-lenders-landlords-and-conveyancers
      newModelLeaseYears: 990,
      // You can make a market value election in the return, or by amending it
      // within this many months of the filing date. It cannot be undone.
      // https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm27030
      electionAmendMonths: 12,
    },
  },
}

// The current tax year's figures, for page copy and guides.
export const STAMP_DUTY = forTaxYear(STAMP_DUTY_RATES)
