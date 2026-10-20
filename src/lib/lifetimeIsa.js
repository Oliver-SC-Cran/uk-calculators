// The Lifetime ISA calculator. Its rules (ages, the yearly limit, the bonus and
// the withdrawal charge) are in ISA in calculations.js.

import { ISA } from './calculations.js'

const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

/**
 * A projection of a Lifetime ISA up to a goal: buying a first home at
 * purchaseAge, or reaching the age when money can be taken out without a
 * charge (60).
 *
 * - age is the age now, in whole years. currentBalance is what is in the
 *   account already.
 * - contribution is paid each month, or once at the start of each year,
 *   depending on frequency. No more than £4,000 goes in each year: monthly
 *   payments stop for the rest of the year once it is reached.
 * - The 25% bonus is added when each payment goes in. Payments and bonuses
 *   stop at 50, and stop when the home is bought.
 * - growthPercent is a yearly rate after fees. It is applied monthly, so a
 *   year's growth comes to exactly that rate.
 * - Years are counted from today, not by tax year.
 *
 * Nobody under 18 can open one, and nobody can open one from 40, so with no
 * money in the account already nothing is paid in at those ages.
 */
export function projectLifetimeIsa({
  age,
  currentBalance = 0,
  contribution = 0,
  frequency = 'monthly',
  growthPercent = 0,
  goal = 'home',
  purchaseAge,
}) {
  const { lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA
  const { lisaMaxContributionAge, lisaAccessAge, lisaWithdrawalChargeRate } = ISA

  const startAge = Math.floor(atLeastZero(age))
  const already = atLeastZero(currentBalance)
  const amount = atLeastZero(contribution)
  const monthlyGrowth = (1 + atLeastZero(growthPercent) / 100) ** (1 / 12) - 1
  const goalAge = goal === 'retirement' ? lisaAccessAge : Math.floor(atLeastZero(purchaseAge))
  const years = Math.max(0, goalAge - startAge)

  const tooYoung = startAge < lisaMinOpenAge
  const tooOldToOpen = startAge >= lisaMaxOpenAge && already === 0
  const pastPayingAge = startAge >= lisaMaxContributionAge
  const payingYears =
    tooYoung || tooOldToOpen || pastPayingAge
      ? 0
      : Math.max(0, Math.min(goalAge, lisaMaxContributionAge) - startAge)

  const askedPerYear = frequency === 'yearly' ? amount : amount * 12
  const overLimit = payingYears > 0 && askedPerYear > lisaLimit + 0.005

  let value = already
  let paidIn = 0
  let paidThisYear = 0
  for (let month = 0; month < years * 12; month += 1) {
    if (month % 12 === 0) paidThisYear = 0
    if (month / 12 < payingYears) {
      const due = frequency === 'yearly' ? (month % 12 === 0 ? amount : 0) : amount
      const payment = Math.min(due, lisaLimit - paidThisYear)
      paidThisYear += payment
      paidIn += payment
      value += payment * (1 + lisaBonusRate)
    }
    value *= 1 + monthlyGrowth
  }

  const bonus = paidIn * lisaBonusRate
  const putIn = already + paidIn
  const charge = value * lisaWithdrawalChargeRate
  const afterCharge = value - charge

  return {
    goalAge,
    years,
    payingYears,
    lastPayingAge: payingYears > 0 ? startAge + payingYears : null,
    paidIn,
    bonus,
    growth: value - already - paidIn - bonus,
    value,
    overLimit,
    tooYoung,
    tooOldToOpen,
    pastPayingAge,
    // Taking it all out at the goal date for any other reason.
    withdrawal: {
      charge,
      afterCharge,
      putIn,
      // Positive when you would get back less than you put in.
      shortfall: putIn - afterCharge,
    },
  }
}

/**
 * How much to take out to be left with a sum in cash after the 25% charge.
 * gov.uk: "Withdrawing £160 means you pay a 25% withdrawal charge of £40 and
 * receive £120 in cash".
 */
export const withdrawalFor = (cashNeeded) =>
  atLeastZero(cashNeeded) / (1 - ISA.lisaWithdrawalChargeRate)
