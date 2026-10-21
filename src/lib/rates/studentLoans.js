// Student loan repayment thresholds and rates. Re-check every April on gov.uk,
// then add the new tax year below the last one.
// Source: https://www.gov.uk/repaying-your-student-loan/what-you-pay

import { forTaxYear } from './taxYear.js'

export const STUDENT_LOAN_RATES = {
  '2026/27': {
    // Annual thresholds
    plan1: { threshold: 26900, rate: 0.09, label: 'Plan 1', writeOffYears: 25 },
    plan2: { threshold: 29385, rate: 0.09, label: 'Plan 2', writeOffYears: 30 },
    plan4: { threshold: 33795, rate: 0.09, label: 'Plan 4 (Scotland)', writeOffYears: 30 },
    plan5: { threshold: 25000, rate: 0.09, label: 'Plan 5', writeOffYears: 40 },
    postgraduate: { threshold: 21000, rate: 0.06, label: 'Postgraduate Loan', writeOffYears: 30 },
  },
}

// The current tax year's figures, for page copy and guides.
export const STUDENT_LOAN = forTaxYear(STUDENT_LOAN_RATES)
