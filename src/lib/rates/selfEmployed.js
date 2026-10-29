// Self-employment figures and Self Assessment dates. The dates and the Making
// Tax Digital thresholds change every year, so re-check them every April on
// gov.uk, then add the new tax year below the last one.
// Sources: https://www.gov.uk/self-employed-national-insurance-rates
//          https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income
//          https://www.gov.uk/understand-self-assessment-bill/payments-on-account

import { forTaxYear } from './taxYear.js'

export const SELF_EMPLOYED_RATES = {
  '2026/27': {
    class4: {
      lowerProfitsLimit: 12570, // Class 4 NI starts on profits above this
      upperProfitsLimit: 50270, // the rate drops from 6% to 2% above this
      mainRate: 0.06,
      upperRate: 0.02,
    },
    // Class 2 no longer has to be paid. It is treated as paid on profits of
    // smallProfitsThreshold or more, and can be paid voluntarily below that.
    class2: {
      smallProfitsThreshold: 7105,
      voluntaryWeeklyRate: 3.65,
    },
    tradingAllowance: 1000, // can be claimed instead of actual expenses
    paymentsOnAccount: {
      minimumBill: 1000, // no payments on account if the Self Assessment bill is under this
      deductedAtSourceShare: 0.8, // or if more than this share of all tax was deducted at source
    },
    // Self Assessment dates for the 2026/27 tax year.
    registerBy: '5 October 2027',
    paperReturnBy: '31 October 2027',
    payBy: '31 January 2028',
    secondPaymentOnAccountBy: '31 July 2028',
    nextTaxYear: '2027/28',
    // Making Tax Digital for Income Tax: who has to use it, and from when.
    makingTaxDigital: [
      { incomeOver: 50000, inTaxYear: '2024/25', from: '6 April 2026' },
      { incomeOver: 30000, inTaxYear: '2025/26', from: '6 April 2027' },
      { incomeOver: 20000, inTaxYear: '2026/27', from: '6 April 2028' },
    ],
  },
}

// The current tax year's figures, for page copy and guides.
export const SELF_EMPLOYED = forTaxYear(SELF_EMPLOYED_RATES)

// Not yet in force, so not in the table above: Budget 2026 (28 October 2026)
// raised the trading allowance from the 2027/28 tax year. Used in the guide
// only. Move it into the 2027/28 entry when that year is added in April 2027.
// Sources: https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html
//          https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar (paragraph 1.5)
export const TRADING_ALLOWANCE_RISE = {
  taxYear: '2027/28',
  from: '6 April 2027',
  tradingAllowance: 3000,
}
