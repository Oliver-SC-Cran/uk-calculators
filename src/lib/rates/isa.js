// ISA and Lifetime ISA rules, from gov.uk's ISA and Lifetime ISA guides.
// Re-check every April, then add the new tax year below the last one.
// Sources: https://www.gov.uk/individual-savings-accounts
//          https://www.gov.uk/lifetime-isa

import { forTaxYear } from './taxYear.js'

export const ISA_RATES = {
  '2026/27': {
    overallAllowance: 20000, // combined limit across Cash, Stocks & Shares and LISA
    minAge: 18, // you must be 18 or over to open an ISA
    lisaLimit: 4000, // counts within the overall allowance, not on top of it
    lisaBonusRate: 0.25,
    lisaMinOpenAge: 18,
    lisaMaxOpenAge: 40, // must open a LISA before your 40th birthday
    lisaMaxContributionAge: 50, // existing LISA holders can keep contributing until 50
    lisaAccessAge: 60, // withdrawals are free of the charge from this age
    lisaWithdrawalChargeRate: 0.25, // on withdrawals that are not for a first home or after 60
    lisaPropertyCap: 450000, // most a first home can cost
    lisaMonthsBeforePurchase: 12, // months between first payment in and buying
    lisaTerminalIllnessMonths: 12, // no charge if terminally ill with less than this to live
    // Announced change: regulations laid before Parliament on 14 September 2026.
    cashLimitChangeDate: '6 April 2027',
    cashLimitUnder65AfterChange: 12000,
    cashLimitFullAllowanceAge: 65,
    // From the same date, the flat-rate charge on interest paid on cash held in a
    // stocks and shares or innovative finance ISA. The ISA manager pays it.
    // Source: HMRC's tax information and impact note of 17 September 2026,
    // https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit
    cashInterestChargeRateAfterChange: 0.22,
  },
}

// The current tax year's figures, for page copy and guides.
export const ISA = forTaxYear(ISA_RATES)

// Not a rate, so not kept by tax year: what gov.uk says about the planned
// First Time Buyer ISA, which will be offered in place of the Lifetime ISA once
// it is available. Only what gov.uk confirms. Re-check when the government
// announces the new account's limits, bonus and price cap.
// Sources: https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation
//          https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html
export const LIFETIME_ISA_REFORM = {
  checkedOn: '26 October 2026',
  consultationOpened: '22 June 2026',
  consultationClosed: '18 August 2026',
  lisaLimitFixedUntil: '5 April 2031', // the £4,000 limit stays the same until then
}
