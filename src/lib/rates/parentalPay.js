// Statutory Maternity Pay, Statutory Paternity Pay and Maternity Allowance.
// The rates change each April. Re-check them every April on gov.uk, then add
// the new tax year below the last one.
// Sources: https://www.gov.uk/maternity-pay-leave/pay
//          https://www.gov.uk/paternity-pay-leave/pay
//          https://www.gov.uk/maternity-allowance/what-youll-get
//          https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
//          https://www.gov.uk/recover-statutory-payments

import { forTaxYear } from './taxYear.js'

export const PARENTAL_PAY_RATES = {
  '2026/27': {
    ratesFrom: 'April 2026',
    weeklyRate: 194.32, // the flat rate for SMP, SPP and Maternity Allowance
    earningsShare: 0.9, // or 90% of average weekly earnings, if that is lower
    // To qualify, average weekly earnings must be at least this. It is the limit
    // for qualifying weeks that end between these two dates (the 2026/27 tax year).
    lowerEarningsLimit: 129,
    lowerEarningsLimitFrom: '2026-04-06',
    lowerEarningsLimitTo: '2027-04-05',
    continuousWeeks: 26, // weeks with the employer by the qualifying week
    qualifyingWeekBeforeDue: 15, // the qualifying week is this many weeks before the week the baby is due
    earliestLeaveWeeksBeforeDue: 11,
    noticeDays: 28, // notice to give an employer before pay starts
    maternity: {
      payWeeks: 39,
      higherRateWeeks: 6, // the first weeks, paid at 90% of earnings with no cap
      leaveWeeks: 52,
    },
    paternity: {
      payWeeks: 2,
      leaveMustEndWithinWeeks: 52, // of the birth
    },
    sharedParental: {
      leaveWeeks: 50,
      payWeeks: 37,
    },
    // What an employer can reclaim from HMRC of the statutory pay it pays, for
    // payments made in this tax year. Small Employers' Relief applies when the
    // employer's total Class 1 National Insurance (employees' and employer's,
    // before Employment Allowance) was no more than smallEmployerLimit in the
    // last complete tax year before the qualifying week. The 109% is set by
    // SI 1994/1882 regulation 3, as amended by SI 2026/201, for payments made
    // from 6 April 2026.
    reclaim: {
      rate: 0.92,
      smallEmployerRate: 1.09,
      smallEmployerLimit: 45000,
    },
    maternityAllowance: {
      payWeeks: 39,
      testPeriodWeeks: 66, // the weeks before the baby is due that are looked at
      weeksWorked: 26, // employed or self-employed for this many of them
      weeklyEarnings: 30, // earning at least this much a week
      weeksEarning: 13, // in at least this many weeks
      selfEmployedMinimum: 27, // lowest weekly rate for the self-employed
    },
  },
}

// The current tax year's figures, for page copy and guides.
export const PARENTAL_PAY = forTaxYear(PARENTAL_PAY_RATES)
