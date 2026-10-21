// Workplace pension figures. Re-check every April on gov.uk, then add the new
// tax year below the last one.

import { forTaxYear } from './taxYear.js'

export const PENSION_RATES = {
  '2026/27': {
    // Used in the guides only.
    // Source: https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay
    autoEnrolment: {
      totalMinimum: 0.08, // of a band of earnings, from employer and employee together
      employerMinimum: 0.03,
      employeeMinimum: 0.05,
    },

    // Announced on 26 November 2025. Not in force for 2026/27.
    // Source: https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029
    salarySacrificeChange: {
      startDate: '6 April 2029',
      niFreeLimit: 2000, // pension salary sacrifice above this a year will have NI charged on it
    },
  },
}

// The current tax year's figures, for page copy and guides.
const current = forTaxYear(PENSION_RATES)
export const AUTO_ENROLMENT = current.autoEnrolment
export const SALARY_SACRIFICE_CHANGE = current.salarySacrificeChange
