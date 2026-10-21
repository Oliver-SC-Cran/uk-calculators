// The ISA allowance calculator. Its rules are in rates/isa.js, by tax year,
// shared with the Lifetime ISA calculator (lifetimeIsa.js).

import { atLeastZero } from './numbers.js'
import { ISA_RATES } from './rates/isa.js'
import { forTaxYear } from './rates/taxYear.js'

/**
 * ISA & LISA allowance check for one tax year.
 * NOTE: from April 2027, the Cash ISA allowance is due to reduce to £12,000 for
 * under-65s (Stocks & Shares stays at £20,000). This calculator covers the
 * 2026/27 rules, which have not changed. Revisit before April 2027.
 */
export function calculateISAAllowance({ cashISA, stocksISA, lisa, age, taxYear }) {
  const rules = forTaxYear(ISA_RATES, taxYear)
  const { overallAllowance, minAge, lisaLimit, lisaBonusRate } = rules
  const { lisaMinOpenAge, lisaMaxOpenAge, lisaMaxContributionAge } = rules

  const cash = atLeastZero(cashISA)
  const stocks = atLeastZero(stocksISA)
  const lisaEntered = atLeastZero(lisa)

  // Nobody under 18 or aged 50 or over can pay into a Lifetime ISA, so a LISA
  // amount entered at those ages earns no bonus and uses no allowance.
  const lisaAllowedAtAge = age >= lisaMinOpenAge && age < lisaMaxContributionAge
  const lisaCapped = lisaAllowedAtAge ? Math.min(lisaEntered, lisaLimit) : 0
  const lisaOverLimit = lisaAllowedAtAge && lisaEntered > lisaLimit
  const totalContributions = cash + stocks + lisaCapped
  const overallOverLimit = totalContributions > overallAllowance
  const remainingAllowance = Math.max(0, overallAllowance - totalContributions)
  const lisaBonus = lisaCapped * lisaBonusRate
  const lisaEligibleToOpen = age >= lisaMinOpenAge && age < lisaMaxOpenAge

  return {
    totalContributions,
    remainingAllowance,
    overallOverLimit,
    lisaCapped,
    lisaOverLimit,
    lisaBonus,
    lisaEligibleToOpen,
    lisaAllowedAtAge,
    tooYoungForISA: age < minAge,
  }
}
