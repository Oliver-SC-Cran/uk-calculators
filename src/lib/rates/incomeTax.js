// Income tax, National Insurance, tax on savings, and the limits that depend
// on adjusted net income. Re-check every April on gov.uk (and gov.scot for the
// Scottish rates), then add the new tax year below the last one.

import { forTaxYear, NEXT_TAX_YEAR } from './taxYear.js'

export const INCOME_TAX_RATES = {
  '2026/27': {
    // England, Wales and Northern Ireland.
    // Sources: https://www.gov.uk/income-tax-rates
    //          https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
    incomeTax: {
      personalAllowance: 12570,
      basicRateLimit: 50270, // income up to this is taxed at 20% (above the personal allowance)
      higherRateLimit: 125140, // income up to this is taxed at 40%; above it, 45%
      taperStart: 100000, // personal allowance starts reducing above this income
      taperFullyGoneAt: 125140,
      taperAllowanceLostPerPound: 0.5, // £1 of allowance goes for every £2 of income above taperStart
      basicRate: 0.2,
      higherRate: 0.4,
      additionalRate: 0.45,
      // Payroll can take no more than half of someone's pay in tax on any pay
      // day. gov.uk states it for K codes, and HMRC's employer guide says it
      // applies to every tax code. Only a K code can reach it.
      // Sources: https://www.gov.uk/tax-codes/k-in-your-tax-code
      //          https://www.gov.uk/government/publications/cwg2-further-guide-to-paye-and-national-insurance-contributions/2026-to-2027-employer-further-guide-to-paye-and-national-insurance-contributions
      maxShareOfPayTaken: 0.5,
    },

    // The Welsh rates of income tax, paid by people whose main home is in
    // Wales. Their tax code starts with C. The bands and the Personal
    // Allowance are the same as in England and Northern Ireland, and in
    // 2026/27 the rates are too.
    // Source: https://www.gov.uk/welsh-income-tax
    welshIncomeTax: {
      basicRate: 0.2,
      higherRate: 0.4,
      additionalRate: 0.45,
    },

    // Scottish income tax, paid by people whose main home is in Scotland on
    // earnings, pensions and profits. The Scottish Parliament agreed these rates
    // on 19 February 2026. The personal allowance and its taper are the same
    // across the UK, and so is National Insurance.
    // Sources: https://www.gov.uk/scottish-income-tax
    //          https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/2026-to-2027/
    scottishIncomeTax: {
      // Each limit is the income up to which that rate applies, for someone with
      // the full personal allowance.
      starterRateLimit: 16537, // 19% above the personal allowance, up to this
      basicRateLimit: 29526, // then 20%
      intermediateRateLimit: 43662, // then 21%. The higher rate starts above this
      higherRateLimit: 75000, // then 42%
      advancedRateLimit: 125140, // then 45%. Above it, 48%
      starterRate: 0.19,
      basicRate: 0.2,
      intermediateRate: 0.21,
      higherRate: 0.42,
      advancedRate: 0.45,
      topRate: 0.48,
    },

    // Employee Class 1 National Insurance.
    nationalInsurance: {
      primaryThreshold: 12570, // NI starts here
      upperEarningsLimit: 50270, // NI rate drops from 8% to 2% above here
      mainRate: 0.08,
      upperRate: 0.02,
      // Payroll works NI out on each pay day on its own, with these thresholds
      // for the pay period, not the yearly ones.
      // Source: https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
      byPayPeriod: {
        weekly: { primaryThreshold: 242, upperEarningsLimit: 967 },
        monthly: { primaryThreshold: 1048, upperEarningsLimit: 4189 },
      },
    },

    // Tax on savings interest, the same across the UK: Scottish and Welsh
    // taxpayers pay UK rates on it, in the UK bands. In 2026/27 the savings
    // rates are the same as the main rates above. Interest on cash in an ISA is
    // not taxed.
    // Sources: https://www.gov.uk/apply-tax-free-interest-on-savings
    //          https://www.gov.uk/individual-savings-accounts/how-isas-work
    //          https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances
    //          https://www.gov.uk/hmrc-internal-manuals/paye-manual/paye13100
    savingsTax: {
      // The Personal Savings Allowance, by income tax band. The band is decided
      // by taxable income including the interest, against the UK basic rate band
      // (£37,700) and £125,140, for Scottish taxpayers too (HMRC's 2026 tax
      // calculation summary notes, SA110, boxes A133b to A138).
      personalSavingsAllowance: { basic: 1000, higher: 500, additional: 0 },
      startingRateForSavings: 5000, // for people whose other income is low
      startingRateIncomeLimit: 17570, // other income below which the starting rate applies
      // The savings basic, higher and additional rates.
      rates: { basic: 0.2, higher: 0.4, additional: 0.45 },
    },

    // The High Income Child Benefit Charge, on adjusted net income.
    // Source: https://www.gov.uk/child-benefit-tax-charge
    childBenefitCharge: {
      threshold: 60000, // adjusted net income above this can trigger the charge
      fullyRepaidAt: 80000, // above this, all of the Child Benefit is paid back
    },

    // Used in the guides only. No calculator depends on these.
    // Sources: https://www.gov.uk/tax-free-childcare
    //          https://www.gov.uk/free-childcare-if-working/check-youre-eligible
    childcare: {
      // Tax-Free Childcare and free childcare for working parents both stop if
      // either parent expects an adjusted net income over this in the tax year.
      adjustedNetIncomeLimit: 100000,
      taxFreeChildcareMaxPerChild: 2000, // the most the government adds in a year
    },

    // Used in the guides only.
    // Sources: https://www.gov.uk/tax-codes/how-to-update-your-tax-code
    //          https://www.gov.uk/tax-codes/emergency-tax-codes
    taxCodeTimes: {
      newCodeWorkingDays: 15, // HMRC tells you and your employer a new code within this
      newJobDays: 35, // how long HMRC can take to update a code after you start a job
    },
  },

  // Announced for 2027/28 (ANNOUNCED_TAX_YEARS in taxYear.js), so this holds
  // only what Budget 2026 published: the UK main rates and bands, and tax on
  // savings. The Scottish and Welsh rates, National Insurance and the rest are
  // added when the year is, in April 2027. Only the savings interest tax
  // calculator and the guides read it. Checked on 30 October 2026.
  // Sources: https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances
  //          https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar (paragraph 1.1)
  //          https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031
  '2027/28': {
    // The Personal Allowance and the basic rate limit stay frozen until
    // 5 April 2031 (Budget 2025), so the bands are the same as in 2026/27.
    incomeTax: {
      personalAllowance: 12570,
      basicRateLimit: 50270,
      higherRateLimit: 125140,
      taperStart: 100000,
      taperFullyGoneAt: 125140,
      taperAllowanceLostPerPound: 0.5,
      basicRate: 0.2,
      higherRate: 0.4,
      additionalRate: 0.45,
    },
    // The savings rates rise by 4 percentage points in every band: 2 announced
    // at Budget 2025 (to 22%, 42% and 47%) and 2 more at Budget 2026. The
    // allowances do not change. From 2027/28 the law also sets the Personal
    // Allowance against other income before savings.
    // Source for that: https://www.gov.uk/government/publications/income-tax-changes-to-tax-rates-for-property-savings-and-dividend-income
    savingsTax: {
      personalSavingsAllowance: { basic: 1000, higher: 500, additional: 0 },
      startingRateForSavings: 5000,
      startingRateIncomeLimit: 17570,
      rates: { basic: 0.24, higher: 0.44, additional: 0.49 },
    },
  },
}

// The current tax year's figures, for page copy and guides.
const current = forTaxYear(INCOME_TAX_RATES)
export const INCOME_TAX = current.incomeTax
export const SCOTTISH_INCOME_TAX = current.scottishIncomeTax
export const WELSH_INCOME_TAX = current.welshIncomeTax
export const NATIONAL_INSURANCE = current.nationalInsurance
export const SAVINGS_TAX = current.savingsTax
// Budget 2025 kept the Personal Allowance and the basic rate limit at their
// current levels, so the higher rate threshold stays the same, until this date.
// Source: https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031
export const INCOME_TAX_FREEZE = {
  until: '5 April 2031',
  announcedAt: 'Budget 2025',
}

// Budget 2026: HMRC will set Child Benefit overpayments against the High Income
// Child Benefit Charge automatically, through Finance Bill 2026-27, back to when
// the charge began. Not a rate, so not kept by tax year.
// Source: https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html
export const CHILD_BENEFIT_CHARGE_OFFSET = {
  law: 'Finance Bill 2026-27',
  backTo: 'January 2013',
}

// How tax on savings interest is paid. Not a rate, so not kept by tax year.
// Up to this much interest, HMRC usually collects the tax through a tax code,
// or sends a Simple Assessment letter when it cannot. Over it, the interest
// goes on a Self Assessment tax return. Checked on 30 October 2026.
// Source: https://www.gov.uk/apply-tax-free-interest-on-savings/how-you-pay-tax-on-savings-interest
export const SAVINGS_TAX_PAYMENT = {
  selfAssessmentOver: 10000,
  contactHmrcIfNoLetterBy: '31 March', // of the tax year after the one the interest was earned in
}

// The savings figures announced for the next tax year, for page copy.
export const NEXT_YEAR_SAVINGS_TAX = forTaxYear(INCOME_TAX_RATES, NEXT_TAX_YEAR).savingsTax
export const CHILD_BENEFIT_CHARGE = current.childBenefitCharge
export const CHILDCARE = current.childcare
export const TAX_CODE_TIMES = current.taxCodeTimes

// How payroll turns a tax code's number into tax-free pay ("free pay"), or
// into the pay a K code adds ("additional pay"). Not kept by tax year: HMRC's
// Tables A have been used unchanged since 6 April 1993, and its P9X for
// 2026 to 2027 says to keep using them. Checked on 21 October 2026.
// Sources: Specification for PAYE Tax Table Routines, version 24.0 (February
//          2026), paragraph 4.3.1, at
//          https://www.gov.uk/government/publications/payroll-technical-specifications-income-tax
//          https://www.gov.uk/government/publications/tables-a-pay-adjustment-tables
export const PAYE_TAX_TABLES = {
  poundsPerCodeUnit: 10, // each 1 in the code is £10 a year
  addedToEachCode: 9, // £9 is added, so code 1 is £1 to £19 and 1257L is £12,579
  codeBlock: 500, // a code over 500 is split into blocks of 500 and a remainder
}
