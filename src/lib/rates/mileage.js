// The tax-free rates for business miles in your own vehicle (approved mileage
// allowance payments): what an employer can pay without tax, and what
// Mileage Allowance Relief is worked out from when they pay less. Self-employed
// people can use the car, van and motorcycle rates as simplified expenses.
// Used by the mileage allowance calculator (src/lib/mileage.js) and the guides.
// Re-check every April on gov.uk, then add the new tax year below the last one.
//
// - carOrVan: one rate for the first 10,000 business miles in the tax year,
//   another above that. Cars and vans count together.
// - motorcycle and bicycle: one rate for every business mile. An electrically
//   assisted pedal bike counts as a bicycle, and any other electric bike as a
//   motorcycle.
// - passenger: paid for each fellow employee carried on a business journey,
//   per mile, in a car or van. Tax-free up to this rate, with no relief when
//   an employer pays less.
//
// National Insurance has no rate of its own: it uses the highest rate for the
// kind of vehicle for every business mile (HMRC's National Insurance Manual,
// NIM05833), so 55p for a car or van.
//
// 2027/28 is an announced year (ANNOUNCED_TAX_YEARS in taxYear.js). Budget 2026
// made the 55p rate permanent and raised the rate above 10,000 miles to 35p
// from 6 April 2027, for employees and as a simplified expense, to be set by
// regulations before then. The motorcycle, bicycle and passenger rates are set
// in law from 2026/27 onwards (EIM31240, EIM31405), and Budget 2026 did not
// change them. Checked on 30 October 2026.
// Sources: https://www.gov.uk/expenses-and-benefits-business-travel-mileage/rules-for-tax
//          https://www.gov.uk/hmrc-internal-manuals/employment-income-manual/eim31240
//          https://www.gov.uk/hmrc-internal-manuals/employment-income-manual/eim31405
//          https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim05833
//          https://www.gov.uk/simpler-income-tax-simplified-expenses/vehicles
//          https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar (paragraph 2.7)
//          https://www.gov.uk/government/news/everyday-fixes-to-make-life-easier-for-millions-of-britons

import { forTaxYear } from './taxYear.js'

export const MILEAGE_RATES = {
  '2026/27': {
    // 55p from 6 April 2026, up from 45p.
    carOrVan: { firstMiles: 10000, firstMilesRate: 0.55, laterMilesRate: 0.25 },
    motorcycle: { rate: 0.24 },
    bicycle: { rate: 0.2 },
    passenger: { rate: 0.05 },
  },
  '2027/28': {
    carOrVan: { firstMiles: 10000, firstMilesRate: 0.55, laterMilesRate: 0.35 },
    motorcycle: { rate: 0.24 },
    bicycle: { rate: 0.2 },
    passenger: { rate: 0.05 },
  },
}

// The current tax year's figures, for page copy and guides.
export const MILEAGE = forTaxYear(MILEAGE_RATES)

// The car and van rate for the first 10,000 miles from 2011/12 to 2025/26
// (EIM31240). Not a current rate: the calculator offers it as a quick pick
// and starts on it, as some employers may still pay it.
export const CAR_OR_VAN_RATE_BEFORE_APRIL_2026 = 0.45

// How Mileage Allowance Relief is claimed. Not a rate, so not kept by tax year.
// A claim by post on form P87 can be for up to this much in job expenses in a
// tax year, all employments together. Over it, gov.uk says to fill in a Self
// Assessment tax return. A claim can be made up to 4 years after the end of
// the tax year it is for. Checked on 30 October 2026.
// Sources: https://www.gov.uk/guidance/send-an-income-tax-relief-claim-for-job-expenses-by-post-or-phone
//          https://www.gov.uk/tax-relief-for-employees/vehicles-you-use-for-work
export const MILEAGE_CLAIMS = {
  postalClaimLimit: 2500,
  yearsAfterTaxYear: 4,
}
