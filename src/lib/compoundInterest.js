// The compound interest calculator: what a starting amount and regular
// payments grow to at a fixed yearly rate, less any yearly charge, with the
// value in today's money and an optional one-off market fall. It uses no
// official rates: every figure is one that someone enters. The quick picks on
// the page come from rates/growth.js.
//
// The rules (decided 30 October 2026):
// - Payments go in at the start of each month, or at the start of each year,
//   as on the Lifetime ISA calculator.
// - Interest added monthly: each month adds a twelfth of the yearly rate, so a
//   year's growth comes to more than the rate. Interest added yearly: the rate
//   is added once, at the end of each year, and money paid in during the year
//   earns it for the months it was in.
// - A yearly charge is taken when interest is added: a twelfth of it each
//   month, or all of it at the end of the year, as a share of the pot.
// - A market fall takes a share off the whole pot at the start of the year
//   chosen, before that year's payments. Growth then carries on at the same
//   rate, so the pot never makes up the difference with the pot that did not
//   fall, and payments made after the fall are not affected by it.

import { atLeastZero } from './numbers.js'
import { add, info, part, subtract, total } from './working.js'

const MONTHS = 12
// A pound in a pot can be a hair under where it started from rounding alone.
const CLOSE_ENOUGH = 1e-6

/**
 * The growth over a whole year that a yearly rate and charge work out to:
 * gross before the charge, net after it. Both are shares (0.05 for 5%).
 */
export function yearlyGrowth({ ratePercent = 0, compounding = 'monthly', chargePercent = 0 }) {
  const rate = atLeastZero(ratePercent) / 100
  const charge = atLeastZero(chargePercent) / 100
  if (compounding === 'yearly') return { gross: rate, net: (1 + rate) * (1 - charge) - 1 }
  return {
    gross: (1 + rate / MONTHS) ** MONTHS - 1,
    net: ((1 + rate / MONTHS) * (1 - charge / MONTHS)) ** MONTHS - 1,
  }
}

/**
 * Runs the pot month by month. fall is { year, fraction } or null. With
 * stopPaymentsFromFall, no payments go in from the year of the fall onwards,
 * to see what growth alone does.
 */
function simulate(settings, { fall = null, stopPaymentsFromFall = false } = {}) {
  const { start, payment, paymentFrequency, rate, compounding, charge, years } = settings
  let value = start
  let paidIn = start
  let payments = 0
  let paymentsMade = 0
  let growth = 0
  let charges = 0
  let before = null
  let lost = 0
  const rows = []
  const monthEnds = []

  for (let year = 1; year <= years; year += 1) {
    if (fall && year === fall.year) {
      before = value
      lost = value * fall.fraction
      value -= lost
    }
    const startOfYear = value
    let interestDue = 0
    const row = { year, payments: 0, growth: 0, charges: 0 }
    for (let month = 0; month < MONTHS; month += 1) {
      const due = paymentFrequency === 'monthly' || month === 0
      const stopped = stopPaymentsFromFall && fall && year >= fall.year
      if (due && !stopped && payment > 0) {
        value += payment
        paidIn += payment
        payments += payment
        paymentsMade += 1
        row.payments += payment
        // Yearly interest: this payment earns it for the rest of the year.
        if (compounding === 'yearly') interestDue += (payment * rate * (MONTHS - month)) / MONTHS
      }
      if (compounding === 'monthly' || month === MONTHS - 1) {
        const interest =
          compounding === 'monthly' ? (value * rate) / MONTHS : startOfYear * rate + interestDue
        value += interest
        growth += interest
        row.growth += interest
        const taken = compounding === 'monthly' ? (value * charge) / MONTHS : value * charge
        value -= taken
        charges += taken
        row.charges += taken
      }
      monthEnds.push(value)
    }
    rows.push({ ...row, paidIn, value })
  }
  return { value, paidIn, payments, paymentsMade, growth, charges, before, lost, rows, monthEnds }
}

/** Months from the start of the fall's year until the pot is back to its value before it, or null. */
function monthsToGetBack(run, fallYear) {
  if (!(run.before > 0)) return null
  const from = (fallYear - 1) * MONTHS
  for (let index = from; index < run.monthEnds.length; index += 1) {
    if (run.monthEnds[index] >= run.before - CLOSE_ENOUGH) return index - from + 1
  }
  return null
}

/**
 * What a pot grows to.
 *
 * - startAmount: what is in the pot at the start.
 * - payment: paid in each month, or once a year, by paymentFrequency
 *   ('monthly' or 'yearly'), at the start of each period.
 * - ratePercent: the growth or interest rate a year, before charges.
 * - compounding: how often interest is added, 'monthly' or 'yearly'.
 * - chargePercent: a yearly charge, as a share of the pot.
 * - inflationPercent: for the value in today's money. 0 leaves it out.
 * - years: whole years.
 * - fall: { percent, year } for a market fall at the start of that year, or
 *   null. A year outside the term is left out.
 */
export function calculateCompoundInterest({
  startAmount = 0,
  payment = 0,
  paymentFrequency = 'monthly',
  ratePercent = 0,
  compounding = 'monthly',
  chargePercent = 0,
  inflationPercent = 0,
  years = 0,
  fall = null,
}) {
  const settings = {
    start: atLeastZero(startAmount),
    payment: atLeastZero(payment),
    paymentFrequency: paymentFrequency === 'yearly' ? 'yearly' : 'monthly',
    rate: atLeastZero(ratePercent) / 100,
    compounding: compounding === 'yearly' ? 'yearly' : 'monthly',
    charge: Math.min(atLeastZero(chargePercent) / 100, 1),
    years: Math.floor(atLeastZero(years)),
  }
  const inflation = atLeastZero(inflationPercent) / 100
  const fallYear = fall ? Math.floor(atLeastZero(fall.year)) : 0
  const fallFraction = fall ? Math.min(atLeastZero(fall.percent) / 100, 1) : 0
  const hasFall = fall !== null && fallYear >= 1 && fallYear <= settings.years

  const run = simulate(settings, {
    fall: hasFall ? { year: fallYear, fraction: fallFraction } : null,
  })
  const withoutFall = hasFall ? simulate(settings) : run
  const rates = yearlyGrowth({
    ratePercent: settings.rate * 100,
    compounding: settings.compounding,
    chargePercent: settings.charge * 100,
  })

  // Today's money: each year's pot divided by how much prices have risen by then.
  const pricesBy = (year) => (1 + inflation) ** year
  const rows = run.rows.map((row, index) => ({
    ...row,
    realValue: inflation > 0 ? row.value / pricesBy(row.year) : null,
    valueWithoutFall: hasFall ? withoutFall.rows[index].value : null,
  }))
  const realValue = inflation > 0 ? run.value / pricesBy(settings.years) : null

  let fallResult = null
  if (hasFall) {
    const growthOnly = simulate(settings, {
      fall: { year: fallYear, fraction: fallFraction },
      stopPaymentsFromFall: true,
    })
    fallResult = {
      year: fallYear,
      fraction: fallFraction,
      valueBefore: run.before,
      lost: run.lost,
      valueAfter: run.before - run.lost,
      finalWithoutFall: withoutFall.value,
      gap: withoutFall.value - run.value,
      monthsToGetBack: run.lost > 0 ? monthsToGetBack(run, fallYear) : null,
      monthsToGetBackGrowthOnly: run.lost > 0 ? monthsToGetBack(growthOnly, fallYear) : null,
    }
  }

  const result = {
    years: settings.years,
    paymentFrequency: settings.paymentFrequency,
    compounding: settings.compounding,
    startAmount: settings.start,
    payment: settings.payment,
    paymentsMade: run.paymentsMade,
    totalPayments: run.payments,
    paidIn: run.paidIn,
    growth: run.growth,
    charges: run.charges,
    finalValue: run.value,
    yearlyRate: rates.gross,
    yearlyRateAfterCharges: rates.net,
    ratePercent: settings.rate * 100,
    chargePercent: settings.charge * 100,
    inflationPercent: inflation * 100,
    realValue,
    rows,
    fall: fallResult,
  }
  return { ...result, working: workingFor(result) }
}

function workingFor(result) {
  const { compounding, fall } = result
  const rate = result.ratePercent / 100
  const charge = result.chargePercent / 100
  const inflation = result.inflationPercent / 100
  const monthly = compounding === 'monthly'
  const yearsText = `${result.years} ${result.years === 1 ? 'year' : 'years'}`

  const pot = part(
    `Your pot after ${yearsText}`,
    [
      add('Starting amount', result.startAmount, { unit: 'gbpPence' }),
      result.paymentsMade > 0 &&
        add('Your regular payments', result.totalPayments, {
          unit: 'gbpPence',
          count: result.paymentsMade,
          each: result.payment,
        }),
      add('Growth', result.growth, { unit: 'gbpPence' }),
      result.charges > 0 && subtract('Charges', result.charges, { unit: 'gbpPence' }),
      fall && fall.lost > 0 && subtract('The market fall', fall.lost, { unit: 'gbpPence' }),
    ],
    total('Your pot at the end', result.finalValue, { unit: 'gbpPence' }),
  )

  const yearly = part(
    'The yearly rate it works out to',
    [
      info('Growth or interest rate a year', rate, { unit: 'percent' }),
      monthly &&
        info('Added each month, a twelfth of the rate', rate / MONTHS, { unit: 'percent' }),
      info('Growth over a whole year', result.yearlyRate, { unit: 'percent' }),
      charge > 0 && info('Yearly charge', charge, { unit: 'percent' }),
      charge > 0 &&
        monthly &&
        info('Taken each month, a twelfth of the charge', charge / MONTHS, { unit: 'percent' }),
      charge > 0 &&
        info('Growth over a whole year after charges', result.yearlyRateAfterCharges, {
          unit: 'percent',
        }),
    ],
    null,
    monthly
      ? "Interest is added each month, so each month's interest earns interest too. That is why a whole year's growth comes to more than the yearly rate."
      : 'Interest is added once a year, at the end of the year. Money paid in during the year earns it for the months it was in.',
  )

  const parts = [pot, yearly]

  if (result.realValue !== null) {
    parts.push(
      part(
        "In today's money",
        [
          info('Inflation a year', inflation, { unit: 'percent' }),
          add('Your pot at the end', result.finalValue, { unit: 'gbpPence' }),
          subtract('What rising prices take off', result.finalValue - result.realValue, {
            unit: 'gbpPence',
          }),
        ],
        total("Your pot in today's money", result.realValue, { unit: 'gbpPence' }),
        'The pot at the end is divided by how much prices will have risen by then, with inflation compounded once a year.',
      ),
    )
  }

  if (fall && fall.lost > 0) {
    parts.push(
      part(
        `The market fall at the start of year ${fall.year}`,
        [
          add('Your pot just before the fall', fall.valueBefore, { unit: 'gbpPence' }),
          subtract('The fall', fall.lost, {
            unit: 'gbpPence',
            rate: fall.fraction,
            on: fall.valueBefore,
          }),
        ],
        total('Your pot just after the fall', fall.valueAfter, { unit: 'gbpPence' }),
      ),
      part(
        'What the fall does by the end',
        [
          add('Your pot at the end without the fall', fall.finalWithoutFall, { unit: 'gbpPence' }),
          subtract('Your pot at the end with the fall', result.finalValue, { unit: 'gbpPence' }),
          fall.monthsToGetBack !== null &&
            info('Months to get back to where it was, with your payments', fall.monthsToGetBack, {
              unit: 'months',
            }),
          fall.monthsToGetBackGrowthOnly !== null &&
            info('Months to get back from growth alone', fall.monthsToGetBackGrowthOnly, {
              unit: 'months',
            }),
        ],
        total('The difference at the end', fall.gap, { unit: 'gbpPence' }),
        'Growth carries on at the same rate after the fall, so the difference at the end is the amount lost, grown at that rate. Payments made after the fall are not affected by it.',
      ),
    )
  }

  return parts
}
