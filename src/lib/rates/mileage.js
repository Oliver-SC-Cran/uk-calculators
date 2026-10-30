// The tax-free mileage rates for business miles in your own car or van: what
// an employer can pay without tax (approved mileage allowance payments), and
// the simplified rate self-employed people can claim. Used in the guides only.
// Re-check every April on gov.uk, then add the new tax year below the last one.
//
// 2027/28 is an announced year (ANNOUNCED_TAX_YEARS in taxYear.js). Budget 2026
// made the 55p rate permanent and raised the rate above 10,000 miles to 35p
// from 6 April 2027. Checked on 30 October 2026.
// Sources: https://www.gov.uk/expenses-and-benefits-business-travel-mileage/rules-for-tax
//          https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar (paragraph 2.7)
//          https://www.gov.uk/government/news/everyday-fixes-to-make-life-easier-for-millions-of-britons

import { forTaxYear } from './taxYear.js'

export const MILEAGE_RATES = {
  '2026/27': {
    // 55p from 6 April 2026, up from 45p.
    carOrVan: { firstMiles: 10000, firstMilesRate: 0.55, laterMilesRate: 0.25 },
  },
  '2027/28': {
    carOrVan: { firstMiles: 10000, firstMilesRate: 0.55, laterMilesRate: 0.35 },
  },
}

// The current tax year's figures, for page copy and guides.
export const MILEAGE = forTaxYear(MILEAGE_RATES)
