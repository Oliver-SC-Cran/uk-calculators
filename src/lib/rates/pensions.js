// Workplace pension figures. Re-check every April on gov.uk, HMRC's Pensions
// Tax Manual and The Pensions Regulator, then add the new tax year below the
// last one.

import { forTaxYear } from './taxYear.js'

export const PENSION_RATES = {
  '2026/27': {
    // Automatic enrolment. The minimums are used by the guides and by the
    // workplace pension calculator's note on them. The earnings figures were
    // kept at their 2025/26 levels for 2026/27 (DWP's review, 18 December 2025).
    // Sources, checked on 6 November 2026:
    // https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay
    // https://www.gov.uk/government/publications/review-of-the-automatic-enrolment-earnings-trigger-and-qualifying-earnings-band-for-202627/review-of-the-automatic-enrolment-earnings-trigger-and-qualifying-earnings-band-for-202627
    // https://www.thepensionsregulator.gov.uk/business-advisers/automatic-enrolment-guide-for-business-advisers/automatic-enrolment-earnings-threshold
    autoEnrolment: {
      totalMinimum: 0.08, // of qualifying earnings, from employer and employee together
      employerMinimum: 0.03,
      employeeMinimum: 0.05,
      // An employer must enrol a worker automatically from this age to State
      // Pension age when they earn at least this a year (gov.uk, "Joining a
      // workplace pension").
      minimumAge: 22,
      earningsTrigger: 10000,
      // Qualifying earnings: pay between these two amounts a year.
      qualifyingEarnings: { lower: 6240, upper: 50270 },
      // The same for each pay period, from TPR's table, which payroll uses.
      // Someone earning more than the lower limit who asks to join must get
      // the employer's minimum too (gov.uk: £520 a month, £120 a week).
      byPayPeriod: {
        weekly: { lower: 120, upper: 967, earningsTrigger: 192 },
        monthly: { lower: 520, upper: 4189, earningsTrigger: 833 },
      },
      // The most a default fund used for automatic enrolment can charge a
      // year, as a share of the pot.
      // Source: https://www.thepensionsregulator.gov.uk/en/employers/new-employers/im-an-employer-who-has-to-provide-a-pension/choose-a-pension-scheme/what-to-look-for-in-a-pension-scheme
      defaultFundChargeCap: 0.0075,
    },

    // Limits on paying in. Sources, checked on 6 November 2026:
    // https://www.gov.uk/government/publications/rates-and-allowances-pension-schemes/pension-schemes-rates (updated 6 April 2026)
    // https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm057100 (the taper)
    // https://www.gov.uk/tax-on-your-private-pension/annual-allowance (carry forward)
    annualAllowance: {
      standard: 60000,
      // Once someone takes money flexibly from a pension pot.
      moneyPurchase: 10000,
      // The tapered annual allowance: £1 less for every £2 of adjusted income
      // over its limit, when threshold income is also over its limit.
      taper: { thresholdIncome: 200000, adjustedIncome: 260000, minimum: 10000 },
      carryForwardYears: 3,
    },
    // Tax relief is limited to 100% of earnings a year, or this if more.
    // Someone with no earnings pays in £2,880 and the provider adds the rest.
    // Sources: the pension schemes rates page above, and
    // https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief
    reliefLimit: { basicAmount: 3600, noEarningsPaidIn: 2880 },

    // Taking money out. Sources, checked on 6 November 2026:
    // https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance
    // https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm063230
    lumpSum: {
      taxFreeShare: 0.25, // usually, of the amount built up in a pension
      lumpSumAllowance: 268275,
      lumpSumAndDeathBenefitAllowance: 1073100,
    },

    // The full new State Pension a week, for people with this many qualifying
    // years of National Insurance. Sources, checked on 6 November 2026:
    // https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027/proposed-benefit-and-pension-rates-2026-to-2027
    // https://www.gov.uk/new-state-pension/what-youll-get
    statePension: { fullWeekly: 241.3, qualifyingYearsForFull: 35 },

    // Announced on 26 November 2025. Not in force for 2026/27. The policy
    // paper says "From April 2029" and gives no day (checked on 13 November
    // 2026), so the copy says the same.
    // Source: https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029
    salarySacrificeChange: {
      startDate: 'April 2029',
      niFreeLimit: 2000, // pension salary sacrifice above this a year will have NI charged on it
    },
  },
}

// The current tax year's figures, for page copy and guides.
const current = forTaxYear(PENSION_RATES)
export const AUTO_ENROLMENT = current.autoEnrolment
export const ANNUAL_ALLOWANCE = current.annualAllowance
export const RELIEF_LIMIT = current.reliefLimit
export const LUMP_SUM = current.lumpSum
export const STATE_PENSION = current.statePension
export const SALARY_SACRIFICE_CHANGE = current.salarySacrificeChange

// Announced, not rates for the current year, so kept apart from the table
// above. Used in the guides only. Checked on 30 October 2026.

// From 6 April 2027 most unused pension funds and pension death benefits count
// towards the value of an estate for inheritance tax. Announced at the Autumn
// Budget 2024. Death in service benefits from a registered pension scheme are
// left out (checked on 6 November 2026).
// Source: https://www.gov.uk/government/publications/inheritance-tax-unused-pension-funds-and-death-benefits
export const PENSIONS_INHERITANCE_TAX = {
  from: '6 April 2027',
  announcedAt: 'the Autumn Budget 2024',
}

// HMRC's Low Earner's Pension Payment, for people in a net pay scheme who get
// less relief than relief at source would give, such as someone earning under
// the Personal Allowance. It applies from this tax year, eligibility is
// assessed each year, and HMRC contacts the people who qualify. How it is
// worked out is not published. Used in the workplace pension calculator's note.
// Checked on 6 November 2026.
// Source: https://www.gov.uk/government/publications/pension-schemes-newsletter-184-august-2026/newsletter-184-august-2026
export const LOW_EARNER_PENSION_PAYMENT = { fromTaxYear: '2024/25' }

// The normal minimum pension age, the earliest most people can take money
// from a pension, rises from 55 to 57 on 6 April 2028. Used by the workplace
// pension calculator and its guide. Checked on 6 November 2026.
// Source: https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age
export const MINIMUM_PENSION_AGE_RISE = { now: 55, from: '6 April 2028', to: 57 }

// The full new State Pension from April 2027, confirmed by the Secretary of
// State for Work and Pensions on 28 October 2026 (Budget day). Used in the
// workplace pension guide only. Checked on 6 November 2026.
// Source: https://www.gov.uk/government/publications/budget-2026-a-gad-technical-bulletin/budget-2026-a-gad-technical-bulletin
export const STATE_PENSION_FROM_APRIL_2027 = { fullYearly: 13036.4, rise: 0.039 }

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
