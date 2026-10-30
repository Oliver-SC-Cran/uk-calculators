// Official figures the compound interest calculator offers as quick picks, and
// its guide quotes. The calculation itself uses only the figures someone
// enters. None of these is set each tax year, but they are kept by tax year
// like every other rates file, so that every table has the same years.
// Re-check them each April.
//
// Sources, checked on 30 October 2026:
// - FCA Handbook, COBS 13 Annex 2, rule 2.3R (the most a firm may use for the
//   lower, intermediate and higher rates of return in a standardised
//   projection) and rule 2.5R (price inflation, when a projection takes it
//   into account): https://www.handbook.fca.org.uk/handbook/COBS/13/Annex2.html
// - Bank of England, "Inflation and the 2% target" (the Government sets the
//   Bank a target of 2% CPI inflation):
//   https://www.bankofengland.co.uk/monetary-policy/inflation

import { forTaxYear } from './taxYear.js'

export const GROWTH_RATES = {
  '2026/27': {
    // For "tax-exempt business held in a wrapper" (such as an ISA) and
    // personal and stakeholder pensions. They are the most a firm may use,
    // not a forecast: the intermediate rate must also reflect what the
    // product's investments could really earn.
    fcaProjectionRates: { lower: 0.02, intermediate: 0.05, higher: 0.08 },
    // For all other products.
    fcaProjectionRatesOtherProducts: { lower: 0.015, intermediate: 0.045, higher: 0.075 },
    // Price inflation in a projection that takes inflation into account.
    fcaPriceInflation: { lower: 0, intermediate: 0.02, higher: 0.04 },
    // The Government's target for CPI inflation, which the Bank of England works to.
    inflationTarget: 0.02,
  },
}

// The current tax year's figures, for page copy and guides.
export const GROWTH = forTaxYear(GROWTH_RATES)
