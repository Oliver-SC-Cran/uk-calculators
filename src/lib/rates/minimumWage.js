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
  },
}

// The current tax year's figures, for page copy and guides.
export const MINIMUM_WAGE = forTaxYear(MINIMUM_WAGE_RATES)

// Not a legal figure, so not kept by tax year: the full-time week the
// calculators assume when they turn an hourly rate into a week or a year.
export const FULL_TIME_HOURS = 37.5
