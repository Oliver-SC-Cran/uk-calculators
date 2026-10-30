// The First Time Buyer ISA, as HM Treasury's response to the consultation
// (28 October 2026) and the Budget 2026 document describe it. It starts on
// 6 April 2029, so only the guides use this. Its rules are in
// LIFETIME_ISA_REFORM in rates/isa.js.

import { atLeastZero } from './numbers.js'
import { LIFETIME_ISA_REFORM } from './rates/isa.js'

/**
 * What a First Time Buyer ISA could be worth when it is used for a first home.
 *
 * - contribution is paid each month, or once at the start of each year,
 *   depending on frequency, for `years` whole years before buying. No more
 *   than the yearly limit (£4,000) goes in each year: monthly payments stop
 *   for the rest of the year once it is reached.
 * - growthPercent is a yearly rate after fees, applied monthly, as in the
 *   Lifetime ISA calculator, so the two can be compared on the same terms.
 * - The bonus is 25% of the final balance, growth included, up to £20,000 in
 *   all. It is paid only for a first home that costs no more than the property
 *   cap (£450,000), once the account has been held for 12 months. homePrice can
 *   be left out for a home within the cap.
 * - There is no withdrawal charge, so with no bonus the balance is what you
 *   have.
 * - Years are counted from the first payment in, not by tax year.
 */
export function projectFirstTimeBuyerIsa({
  contribution = 0,
  frequency = 'monthly',
  growthPercent = 0,
  years = 0,
  homePrice = 0,
}) {
  const { yearlyLimit, bonusRate, bonusCap, propertyCap, monthsHeld } =
    LIFETIME_ISA_REFORM.firstTimeBuyerIsa

  const amount = atLeastZero(contribution)
  const months = Math.floor(atLeastZero(years)) * 12
  const monthlyGrowth = (1 + atLeastZero(growthPercent) / 100) ** (1 / 12) - 1

  let balance = 0
  let paidIn = 0
  let paidThisYear = 0
  for (let month = 0; month < months; month += 1) {
    if (month % 12 === 0) paidThisYear = 0
    const due = frequency === 'yearly' ? (month % 12 === 0 ? amount : 0) : amount
    const payment = Math.min(due, yearlyLimit - paidThisYear)
    paidThisYear += payment
    paidIn += payment
    balance += payment
    balance *= 1 + monthlyGrowth
  }

  const heldLongEnough = months >= monthsHeld
  const withinPropertyCap = atLeastZero(homePrice) <= propertyCap
  const uncappedBonus = balance * bonusRate
  const bonus = heldLongEnough && withinPropertyCap ? Math.min(uncappedBonus, bonusCap) : 0

  return {
    paidIn,
    growth: balance - paidIn,
    balance,
    bonus,
    bonusCapped: bonus > 0 && uncappedBonus > bonusCap,
    heldLongEnough,
    withinPropertyCap,
    value: balance + bonus,
  }
}

/** The balance at which the bonus reaches its cap: £20,000 is 25% of £80,000. */
export const balanceForMostBonus = () => {
  const { bonusCap, bonusRate } = LIFETIME_ISA_REFORM.firstTimeBuyerIsa
  return bonusCap / bonusRate
}
