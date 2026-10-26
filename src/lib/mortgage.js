// The mortgage overpayment calculator. It works a month at a time, so it can
// handle a regular overpayment, a one-off lump sum, savings in an offset
// account, or any of them together, and keep track of how much is overpaid in
// each year. The typical yearly overpayment limit is in rates/mortgage.js.
//
// It also works the other way round: the monthly overpayment needed to be
// mortgage-free by a target (overpaymentToBeMortgageFree).

import { atLeastZero } from './numbers.js'
import { MORTGAGE } from './rates/mortgage.js'
import { add, info, part, subtract, total } from './working.js'

// Less than half a penny left counts as paid off.
const PAID_OFF = 0.005

/** The standard monthly payment on a repayment mortgage. */
function standardMonthlyPayment(balance, monthlyRate, months) {
  if (monthlyRate === 0) return balance / months
  const growth = Math.pow(1 + monthlyRate, months)
  return (balance * monthlyRate * growth) / (growth - 1)
}

// What the first table of the working calls the schedule with the changes in it.
function withLabel(overpaying, offsetting) {
  if (!offsetting) return 'Interest with your overpayments'
  return overpaying
    ? 'Interest with your offset and overpayments'
    : 'Interest with your offset savings'
}

/**
 * Mortgage overpayment comparison. The normal monthly payment comes from the
 * standard repayment formula. Then two schedules run side by side, month by
 * month: one with the normal payment only, and one with the overpayments and
 * any offset savings. The monthly payment stays the same, so overpaying or
 * offsetting makes the mortgage end sooner.
 *
 * - monthlyOverpayment is added to every monthly payment.
 * - lumpSum is paid once, at the start of lumpSumYear, before that month's
 *   payment. Year 1 means straight away. Only what is still owed is used.
 * - offsetSavings is held in an offset account for the whole term. Each month
 *   interest is charged only on what is owed above it, as MoneyHelper
 *   describes. The savings stay in the account and are not used to pay the
 *   mortgage off, so the mortgage ends when the payments clear it.
 * - overpaymentLimit is the share of the balance a lender lets you overpay in a
 *   year without a charge (0.1 for 10%), measured on what is owed at the start
 *   of each year. Pass null to leave the check out. Offset savings are not an
 *   overpayment, so they do not count towards it.
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
  offsetSavings = 0,
  overpaymentLimit = MORTGAGE.typicalOverpaymentLimit,
  overpaymentLimitYears = null,
}) {
  const monthlyRate = atLeastZero(annualRatePercent) / 100 / 12
  const totalMonths = Math.round(atLeastZero(remainingYears) * 12)
  const overpayment = atLeastZero(monthlyOverpayment)
  const lump = atLeastZero(lumpSum)
  const lumpMonth = (Math.max(1, Math.floor(atLeastZero(lumpSumYear))) - 1) * 12 + 1
  const savings = atLeastZero(offsetSavings)
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
  // The payments made by the time the savings cover what is owed.
  let savingsCoverMonth = savings > 0 && balance <= savings ? 0 : null
  const years = []

  for (let month = 1; month <= totalMonths; month += 1) {
    if (month % 12 === 1) {
      years.push({
        year: years.length + 1,
        startBalance: left,
        allowance: limit === null ? null : left * limit,
        overpaid: 0,
        interest: 0,
        standardInterest: 0,
      })
    }
    const thisYear = years[years.length - 1]

    if (month === lumpMonth && left > PAID_OFF) {
      lumpSumPaid = Math.min(lump, left)
      left -= lumpSumPaid
      thisYear.overpaid += lumpSumPaid
      if (savingsCoverMonth === null && savings > 0 && left <= savings) {
        savingsCoverMonth = month - 1
      }
    }

    if (left > PAID_OFF) {
      // Interest is charged only on what is owed above the offset savings.
      const interest = Math.max(0, left - savings) * monthlyRate
      // The last payment is only what is left.
      const payment = Math.min(newPayment, left + interest)
      left = left + interest - payment
      interestPaid += interest
      thisYear.interest += interest
      paymentsMade = month
      thisYear.overpaid += Math.max(0, payment - standardPayment)
      if (savingsCoverMonth === null && savings > 0 && left <= savings) {
        savingsCoverMonth = month
      }
    }

    if (standardLeft > PAID_OFF) {
      const interest = standardLeft * monthlyRate
      thisYear.standardInterest += interest
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

  const overpaying = overpayment > 0 || lump > 0
  const interestSaved = Math.max(0, standardTotalInterest - interestPaid)

  return {
    standardPayment,
    standardTotalInterest,
    newPayment,
    newTotalInterest: interestPaid,
    newTermMonths: paymentsMade,
    originalTermMonths: totalMonths,
    monthsSaved: totalMonths - paymentsMade,
    interestSaved,
    lumpSumPaid,
    lumpSumMonth: lumpMonth,
    // A lump sum was entered but some or all of it was not needed.
    lumpSumNotAllUsed: lump > 0 && lumpSumPaid < lump - PAID_OFF,
    offsetSavings: savings,
    // How many payments in what is owed is no more than the offset savings,
    // so the savings could clear it. null with no savings.
    savingsCoverMonth,
    years,
    firstYearAllowance: years[0].allowance,
    yearsOverAllowance,
    working: [
      part(
        'Interest you could save',
        [
          add('Interest without overpaying', standardTotalInterest),
          subtract(withLabel(overpaying, savings > 0), interestPaid),
        ],
        total('Interest saved', interestSaved, { rounding: 'notBelowZero' }),
      ),
      part('Your normal monthly payment', [
        info('What you owe', balance),
        info('Interest rate a month', monthlyRate, { unit: 'percent' }),
        info('Monthly payments left', totalMonths, { unit: 'number' }),
        info('Normal monthly payment', standardPayment, { unit: 'gbpPence' }),
      ]),
      savings > 0 &&
        part(
          'Your offset savings',
          [
            info('Savings in your offset account', savings),
            info('What you owe above your savings at the start', Math.max(0, balance - savings)),
            info('Months until your savings cover what you owe', savingsCoverMonth, {
              unit: 'months',
            }),
          ],
          null,
          'Each month interest is charged only on what you owe above your savings, so more of each payment goes on what you owe. The savings stay in the account.',
        ),
      part('Your overpayments', [
        info('Extra each month', overpayment),
        info('Lump sum used', lumpSumPaid),
        info('Months sooner it is paid off', totalMonths - paymentsMade, { unit: 'months' }),
      ]),
    ].filter(Boolean),
  }
}

/**
 * What offset savings and overpayments each save on their own, and together.
 * Takes the same settings as calculateMortgageOverpayment. Returns null when
 * there is nothing to work out.
 */
export function compareOffsetAndOverpaying(settings) {
  const both = calculateMortgageOverpayment(settings)
  if (!both) return null
  return {
    offsetOnly: calculateMortgageOverpayment({ ...settings, monthlyOverpayment: 0, lumpSum: 0 }),
    overpayingOnly: calculateMortgageOverpayment({ ...settings, offsetSavings: 0 }),
    both,
  }
}

/**
 * The smallest monthly overpayment, rounded up to the pound, that clears the
 * mortgage within targetMonths payments. The other settings are the same as
 * calculateMortgageOverpayment's (a lump sum and offset savings count), apart
 * from monthlyOverpayment, which is what this works out.
 *
 * It searches to the penny for the smallest overpayment that leaves nothing
 * owed after payment number targetMonths, then rounds it up to the pound. A
 * bigger overpayment never makes a mortgage end later, so the rounded amount
 * meets the target too.
 *
 * Returns null when there is nothing to work out, or the target is not at
 * least one payment away. Otherwise:
 * - monthlyOverpayment: the amount, in whole pounds. 0 when the mortgage ends
 *   by the target anyway (onTrack).
 * - exactOverpayment: the smallest amount to the penny.
 * - result: calculateMortgageOverpayment with monthlyOverpayment.
 * - working: the steps, starting with the amount.
 */
export function overpaymentToBeMortgageFree({ targetMonths, ...settings }) {
  const target = Math.floor(targetMonths)
  if (!(target >= 1)) return null
  const run = (overpayment, limits = false) =>
    calculateMortgageOverpayment({
      ...settings,
      monthlyOverpayment: overpayment,
      // The yearly limit does not change when the mortgage ends, so the search leaves it out.
      ...(limits ? {} : { overpaymentLimit: null }),
    })
  const noExtra = run(0)
  if (!noExtra) return null

  const meets = (pence) => run(pence / 100).newTermMonths <= target
  let exactPence = 0
  if (!meets(0)) {
    // Overpaying the whole balance clears it with the first payment, so it
    // always meets the target. Search between that and nothing.
    let low = 0
    let high = Math.ceil(settings.balance * 100)
    for (let tries = 0; !meets(high); tries += 1) {
      if (tries === 20) return null
      high *= 2
    }
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2)
      if (meets(middle)) high = middle
      else low = middle
    }
    exactPence = high
  }

  const exactOverpayment = exactPence / 100
  const monthlyOverpayment = exactPence === 0 ? 0 : Math.ceil(exactOverpayment - 1e-9)
  const result = run(monthlyOverpayment, true)
  const onTrack = monthlyOverpayment === 0

  const first = onTrack
    ? part(
        'The extra you need to pay each month',
        [
          info('Monthly payments until your target', target, { unit: 'number' }),
          info('Monthly payments until it is paid off now', noExtra.newTermMonths, {
            unit: 'number',
          }),
        ],
        total('Extra each month', 0),
        'Your mortgage is paid off by your target without paying any more each month.',
      )
    : part(
        'The extra you need to pay each month',
        [
          info('Monthly payments until your target', target, { unit: 'number' }),
          add(
            'Smallest monthly payment that clears it in time',
            result.standardPayment + exactOverpayment,
            { unit: 'gbpPence' },
          ),
          subtract('Normal monthly payment', result.standardPayment, { unit: 'gbpPence' }),
        ],
        total('Extra each month, rounded up to the pound', monthlyOverpayment, { rounding: 'up' }),
        'The smallest payment, to the penny, that leaves nothing owed after your last payment before the target. The extra is rounded up to the next pound, which can only make the mortgage end sooner.',
      )

  return {
    monthlyOverpayment,
    exactOverpayment,
    targetMonths: target,
    onTrack,
    result,
    working: [first, ...result.working],
  }
}
