// The mortgage overpayment calculator. It works a month at a time, so it can
// handle a regular overpayment, a one-off lump sum, or both, and keep track of
// how much is overpaid in each year. The typical yearly overpayment limit is
// in MORTGAGE in calculations.js.

import { MORTGAGE } from './calculations.js'

// Inputs come straight from form fields, so treat anything that is not a
// positive number (blank, negative, not a number) as zero.
const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

// Less than half a penny left counts as paid off.
const PAID_OFF = 0.005

/** The standard monthly payment on a repayment mortgage. */
export function standardMonthlyPayment(balance, monthlyRate, months) {
  if (monthlyRate === 0) return balance / months
  const growth = Math.pow(1 + monthlyRate, months)
  return (balance * monthlyRate * growth) / (growth - 1)
}

/**
 * Mortgage overpayment comparison. The normal monthly payment comes from the
 * standard repayment formula. Then two schedules run side by side, month by
 * month: one with the normal payment only, and one with the overpayments. The
 * monthly payment stays the same, so overpaying makes the mortgage end sooner.
 *
 * - monthlyOverpayment is added to every monthly payment.
 * - lumpSum is paid once, at the start of lumpSumYear, before that month's
 *   payment. Year 1 means straight away. Only what is still owed is used.
 * - overpaymentLimit is the share of the balance a lender lets you overpay in a
 *   year without a charge (0.1 for 10%), measured on what is owed at the start
 *   of each year. Pass null to leave the check out.
 * - overpaymentLimitYears is how many years the limit applies for, usually the
 *   years left on a fixed or discounted deal. null means every year.
 *
 * Returns null when there is nothing to work out, or the figures overflow.
 */
export function calculateMortgageOverpayment({
  balance,
  annualRatePercent,
  remainingYears,
  monthlyOverpayment = 0,
  lumpSum = 0,
  lumpSumYear = 1,
  overpaymentLimit = MORTGAGE.typicalOverpaymentLimit,
  overpaymentLimitYears = null,
}) {
  const monthlyRate = atLeastZero(annualRatePercent) / 100 / 12
  const totalMonths = Math.round(atLeastZero(remainingYears) * 12)
  const overpayment = atLeastZero(monthlyOverpayment)
  const lump = atLeastZero(lumpSum)
  const lumpMonth = (Math.max(1, Math.floor(atLeastZero(lumpSumYear))) - 1) * 12 + 1
  const limit = overpaymentLimit === null ? null : atLeastZero(overpaymentLimit)
  const limitYears = overpaymentLimitYears === null ? Infinity : atLeastZero(overpaymentLimitYears)

  if (!(balance > 0) || totalMonths <= 0) {
    return null
  }

  const standardPayment = standardMonthlyPayment(balance, monthlyRate, totalMonths)

  // Absurd inputs (a rate in the millions of percent) overflow the formula.
  if (!Number.isFinite(standardPayment)) {
    return null
  }

  const standardTotalInterest = standardPayment * totalMonths - balance
  const newPayment = standardPayment + overpayment

  let standardLeft = balance
  let left = balance
  let paymentsMade = 0
  let interestPaid = 0
  let lumpSumPaid = 0
  const years = []

  for (let month = 1; month <= totalMonths; month += 1) {
    if (month % 12 === 1) {
      years.push({
        year: years.length + 1,
        startBalance: left,
        allowance: limit === null ? null : left * limit,
        overpaid: 0,
      })
    }
    const thisYear = years[years.length - 1]

    if (month === lumpMonth && left > PAID_OFF) {
      lumpSumPaid = Math.min(lump, left)
      left -= lumpSumPaid
      thisYear.overpaid += lumpSumPaid
    }

    if (left > PAID_OFF) {
      const interest = left * monthlyRate
      // The last payment is only what is left.
      const payment = Math.min(newPayment, left + interest)
      left = left + interest - payment
      interestPaid += interest
      paymentsMade = month
      thisYear.overpaid += Math.max(0, payment - standardPayment)
    }

    if (standardLeft > PAID_OFF) {
      const interest = standardLeft * monthlyRate
      standardLeft = standardLeft + interest - Math.min(standardPayment, standardLeft + interest)
    }

    if (month % 12 === 0 || month === totalMonths) {
      thisYear.endMonth = month
      thisYear.balance = left > PAID_OFF ? left : 0
      thisYear.standardBalance = standardLeft > PAID_OFF ? standardLeft : 0
    }
  }

  const yearsOverAllowance =
    limit === null
      ? []
      : years
          .filter((row) => row.year <= limitYears && row.overpaid > row.allowance + PAID_OFF)
          .map((row) => row.year)

  return {
    standardPayment,
    standardTotalInterest,
    newPayment,
    newTotalInterest: interestPaid,
    newTermMonths: paymentsMade,
    originalTermMonths: totalMonths,
    monthsSaved: totalMonths - paymentsMade,
    interestSaved: Math.max(0, standardTotalInterest - interestPaid),
    lumpSumPaid,
    lumpSumMonth: lumpMonth,
    // A lump sum was entered but some or all of it was not needed.
    lumpSumNotAllUsed: lump > 0 && lumpSumPaid < lump - PAID_OFF,
    years,
    firstYearAllowance: years[0].allowance,
    yearsOverAllowance,
  }
}

/**
 * The month a number of monthly payments after a start date ends in, as
 * 'YYYY-MM'. startDate is 'YYYY-MM-DD' text, and only its year and month are
 * used, so this gives the same answer on the server and in any browser.
 */
export function monthAfter(startDate, months) {
  const [year, month] = startDate.split('-').map(Number)
  const index = year * 12 + (month - 1) + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
