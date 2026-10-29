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
    lisaPropertyCap: 450000, // most a first home can cost without a charge
    // From 29 October 2026, money taken out to buy a first home that costs more
    // than lisaPropertyCap, and meets the other rules, has this lower charge.
    // It takes back the bonus and leaves what was paid in. Checked on gov.uk on
    // 29 October 2026 (https://www.gov.uk/lifetime-isa/withdrawing-money-from-your-lifetime-isa).
    lisaOverCapChargeRate: 0.2,
    lisaOverCapChargeFrom: '29 October 2026',
    lisaMonthsBeforePurchase: 12, // months between first payment in and buying
    lisaTerminalIllnessMonths: 12, // no charge if terminally ill with less than this to live
  },
}

// The current tax year's figures, for page copy and guides.
export const ISA = forTaxYear(ISA_RATES)

// Not a rate, so not kept by tax year: the cut to the cash ISA limit that was
// announced at Budget 2025 and scrapped at Budget 2026, for the guide that
// explains what happened. The limit stays at the overall allowance for
// everyone. The government says it will lay regulations to do this in
// November 2026. Budget 2026 did not say what happens to the other rules that
// were to start with the cut (the charge on cash interest below, no transfers
// into cash ISAs and the money market fund limit): re-check when the
// regulations are published.
// Sources: https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar (paragraph 2.5)
//          https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html
//          https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit
export const CASH_ISA_CUT_SCRAPPED = {
  checkedOn: '29 October 2026',
  announced: 'November 2025', // at the Autumn Budget 2025
  regulationsLaid: '14 September 2026', // the regulations for the cut
  wouldHaveStarted: '6 April 2027',
  plannedCashLimit: 12000, // for people under the age below
  plannedFullAllowanceAge: 65, // from the tax year you turn this age
  plannedCashInterestChargeRate: 0.22, // on cash in a stocks and shares ISA
  scrapped: '28 October 2026', // at Budget 2026
  newRegulationsDue: 'November 2026',
}

// Not a rate, so not kept by tax year: the First Time Buyer ISA, which replaces
// the Lifetime ISA for new savers. Only what HM Treasury's response to the
// consultation (28 October 2026) confirms. Re-check gov.uk each time the ISA
// pages are edited.
// Sources: https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation
//          https://assets.publishing.service.gov.uk/media/6ae0cc8216428df53760625c/First_Time_Buyer_ISA_Consultation_-_Government_Response.pdf
export const LIFETIME_ISA_REFORM = {
  checkedOn: '29 October 2026',
  responsePublished: '28 October 2026',
  consultationOpened: '22 June 2026',
  consultationClosed: '18 August 2026',
  // Paragraphs 2.3 to 2.8 and chapter 3 of the response.
  firstTimeBuyerIsa: {
    from: '6 April 2029',
    yearlyLimit: 4000, // counts towards the overall ISA allowance
    bonusRate: 0.25, // on the final balance, paid when it is used for a first home
    bonusCap: 20000, // the most bonus in all
    propertyCap: 450000,
    minAge: 18, // no upper age limit
    monthsHeld: 12, // before the bonus can be used
  },
}
