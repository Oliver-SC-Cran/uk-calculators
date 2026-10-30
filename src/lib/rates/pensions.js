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

// Announced, not rates for the current year, so kept apart from the table
// above. Used in the guides only. Checked on 30 October 2026.

// From 6 April 2027 most unused pension funds and pension death benefits count
// towards the value of an estate for inheritance tax. Announced at the Autumn
// Budget 2024.
// Source: https://www.gov.uk/government/publications/inheritance-tax-unused-pension-funds-and-death-benefits
export const PENSIONS_INHERITANCE_TAX = {
  from: '6 April 2027',
  announcedAt: 'the Autumn Budget 2024',
}

// The Pension Tax Allowance, announced at Budget 2026, for people over State
// Pension age whose total income is up to the value of the full new State
// Pension, so they do not pay small amounts of tax. It is worth 20% of the gap
// between the full new State Pension and the Personal Allowance, and is
// withdrawn by £1 for every £3 of income above the full new State Pension.
// For 2027/28, 2028/29 and 2029/30.
// Sources: https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar (paragraph 1.4)
//          https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances
export const PENSION_TAX_ALLOWANCE = {
  from: '6 April 2027',
  until: '5 April 2030',
  taxYear: '2027/28',
  fullUpTo: 13037, // the eligibility threshold in 2027/28
  goneAt: 13319,
  incomeForEachPoundLost: 3,
}
