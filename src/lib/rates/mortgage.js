// The mortgage overpayment calculator uses no official rates. This is the one
// figure it starts from. It is not set each tax year, but it is kept by tax
// year like every other rates file, so that every table has the same years.

import { forTaxYear } from './taxYear.js'

export const MORTGAGE_RATES = {
  '2026/27': {
    // Many lenders allow this much to be overpaid each year without a charge,
    // usually during a fixed or discounted deal (source: MoneyHelper). It is
    // typical, not a rule.
    typicalOverpaymentLimit: 0.1,
  },
}

// The current tax year's figures, for page copy and guides.
export const MORTGAGE = forTaxYear(MORTGAGE_RATES)
