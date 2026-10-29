// National Minimum Wage and National Living Wage rates. They change from
// 1 April each year, a few days before the tax year starts, so each entry says
// the date its rates apply from. Re-check every April on gov.uk, then add the
// new tax year below the last one.
// Source: https://www.gov.uk/national-minimum-wage-rates

import { forTaxYear } from './taxYear.js'

export const MINIMUM_WAGE_RATES = {
  '2026/27': {
    // Rates from 1 April 2026 (£/hour)
    effectiveFrom: '1 April 2026',
    nationalLivingWage: 12.71, // age 21+
    age18to20: 10.85,
    under18: 8.0,
    apprentice: 8.0,
    minAge: 16, // workers must be at least school leaving age, which is usually 16
    // The most an employer can count towards minimum wage pay for accommodation
    // it provides, a day. Used in the guide only.
    // Source: https://www.gov.uk/national-minimum-wage-accommodation
    accommodationOffsetDaily: 11.1,
  },
}

// The current tax year's figures, for page copy and guides.
export const MINIMUM_WAGE = forTaxYear(MINIMUM_WAGE_RATES)

// Not yet in force, so not in the table above: the rates from 1 April 2027,
// announced on 28 October 2026 when the government accepted the Low Pay
// Commission's recommendations in full. Used in the guide only. Move them into
// the 2027/28 entry when that year is added in April 2027.
// Sources: https://www.gov.uk/government/news/lpc-recommendations-take-the-national-living-wage-to-1321
//          https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html (section 4.5)
export const MINIMUM_WAGE_FROM_APRIL_2027 = {
  announced: '28 October 2026',
  effectiveFrom: '1 April 2027',
  nationalLivingWage: 13.21, // age 21+
  age18to20: 11.27,
  under18: 8.31,
  apprentice: 8.31,
  accommodationOffsetDaily: 11.53,
}

// Not a legal figure, so not kept by tax year: the full-time week the
// calculators assume when they turn an hourly rate into a week or a year.
export const FULL_TIME_HOURS = 37.5
