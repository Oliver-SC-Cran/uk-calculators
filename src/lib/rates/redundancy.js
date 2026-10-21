// Statutory redundancy pay limits. They change from 6 April each year. Re-check
// every April on gov.uk (and nidirect for Northern Ireland), then add the new
// tax year below the last one.
// Sources: https://www.gov.uk/redundant-your-rights/redundancy-pay
//          https://www.nidirect.gov.uk/articles/redundancy-pay

import { forTaxYear } from './taxYear.js'

export const REDUNDANCY_RATES = {
  '2026/27': {
    weeklyPayCapGB: 751, // England, Scotland, Wales
    weeklyPayCapNI: 783, // Northern Ireland
    maxYearsCounted: 20,
    minYearsToQualify: 2,
    earliestServiceAge: 15, // the gov.uk calculator rejects service that started before this age
    taxFreeThreshold: 30000,
    claimWithinMonths: 6, // time limit to apply, from the date the job ends
  },
}

// The current tax year's figures, for page copy and guides.
export const REDUNDANCY = forTaxYear(REDUNDANCY_RATES)
