// Tests for the mortgage overpayment calculator. Run with: npm test
//
// gov.uk has no mortgage calculator, so every expected value here is
// [own working]: worked out by hand from the standard repayment-mortgage
// formulas. Every result is also checked against an independent calculation
// from the closed-form loan formulas further down.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateMortgageOverpayment } from './mortgage.js'
import { monthAfter } from './dates.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

// ---------------------------------------------------------------------------
// Monthly overpayments
// ---------------------------------------------------------------------------

const mortgage = (balance, annualRatePercent, remainingYears, monthlyOverpayment = 0) =>
  calculateMortgageOverpayment({ balance, annualRatePercent, remainingYears, monthlyOverpayment })

test('mortgage [own working] standard monthly payments', () => {
  near(Math.round(mortgage(200000, 4.5, 25).standardPayment * 100) / 100, 1111.66)
  near(Math.round(mortgage(100000, 5, 25).standardPayment * 100) / 100, 584.59)
  near(Math.round(mortgage(150000, 6, 30).standardPayment * 100) / 100, 899.33)
})

test('mortgage [own working] no overpayment changes nothing', () => {
  for (const [balance, rate, years] of [
    [200000, 4.5, 25],
    [85000, 7.25, 12],
    [10000000, 3, 40],
  ]) {
    const result = mortgage(balance, rate, years, 0)
    assert.equal(result.newTermMonths, years * 12)
    assert.equal(result.monthsSaved, 0)
    assert.ok(result.interestSaved < 0.01, `interest saved was ${result.interestSaved}`)
  }
})

test('mortgage [own working] £200 a month extra on £200,000 at 4.5% over 25 years', () => {
  const result = mortgage(200000, 4.5, 25, 200)
  near(Math.round(result.newPayment * 100) / 100, 1311.66)
  // From the loan formula: months = -ln(1 - balance x rate / payment) / ln(1 + rate).
  const rate = 4.5 / 100 / 12
  const months = Math.ceil(-Math.log(1 - (200000 * rate) / result.newPayment) / Math.log(1 + rate))
  assert.equal(months, 227)
  assert.equal(result.newTermMonths, 227)
  assert.equal(result.monthsSaved, 73)
  // Everything paid is either the balance or interest. The last payment is
  // smaller than the rest, so the total is between 226 and 227 full payments.
  const totalPaid = 200000 + result.newTotalInterest
  assert.ok(totalPaid > 226 * result.newPayment && totalPaid <= 227 * result.newPayment)
  near(result.interestSaved, result.standardTotalInterest - result.newTotalInterest)
})

test('mortgage [own working] zero interest', () => {
  const plain = mortgage(120000, 0, 10, 0)
  assert.equal(plain.standardPayment, 1000)
  assert.equal(plain.standardTotalInterest, 0)
  const overpaid = mortgage(120000, 0, 10, 200)
  assert.equal(overpaid.newTermMonths, 100)
  assert.equal(overpaid.monthsSaved, 20)
  assert.equal(overpaid.interestSaved, 0)
})

test('mortgage [own working] bigger overpayments always save more', () => {
  let previous = mortgage(200000, 4.5, 25, 0)
  for (let overpayment = 50; overpayment <= 3000; overpayment += 50) {
    const result = mortgage(200000, 4.5, 25, overpayment)
    assert.ok(result.interestSaved > previous.interestSaved, `at ${overpayment}`)
    assert.ok(result.newTermMonths <= previous.newTermMonths, `at ${overpayment}`)
    previous = result
  }
})

test('mortgage [own working] an overpayment bigger than the balance clears it in a month', () => {
  const result = mortgage(5000, 6, 10, 10000)
  assert.equal(result.newTermMonths, 1)
  near(result.newTotalInterest, 25) // one month of interest: £5,000 at 0.5%
})

test('mortgage [own working] odd inputs', () => {
  // Nothing to calculate without a balance and a term.
  assert.equal(mortgage(0, 4.5, 25, 200), null)
  assert.equal(mortgage(-1000, 4.5, 25, 200), null)
  assert.equal(mortgage(NaN, 4.5, 25, 200), null)
  assert.equal(mortgage(200000, 4.5, 0, 200), null)
  // A negative overpayment or rate counts as zero.
  assert.equal(mortgage(200000, 4.5, 25, -500).monthsSaved, 0)
  assert.equal(mortgage(200000, 4.5, 25, -500).newTermMonths, 300)
  assert.equal(mortgage(120000, -3, 10, 0).standardPayment, 1000)
  // A very large mortgage still gives finite numbers.
  const large = mortgage(10000000, 5.5, 35, 5000)
  assert.ok(Number.isFinite(large.interestSaved) && large.interestSaved > 0)
  // A nonsense rate gives no result, not "NaN".
  assert.equal(mortgage(200000, 1e9, 25, 0), null)
})

test('mortgage [own working] the worked examples shown in the guide', () => {
  const summary = (...inputs) => {
    const result = mortgage(...inputs)
    return [
      result.standardPayment,
      result.newTermMonths,
      result.monthsSaved,
      result.interestSaved,
    ].map(Math.round)
  }
  assert.deepEqual(summary(200000, 4.5, 25, 200), [1112, 227, 73, 36280])
  assert.deepEqual(summary(150000, 5, 20, 100), [990, 205, 35, 14256])
  assert.deepEqual(summary(300000, 4, 30, 500), [1432, 220, 140, 92414])
})

// ---------------------------------------------------------------------------
// The independent check
//
// The calculator works month by month. These give the same answers from the
// closed-form loan formulas, with no loop over the months, so a mistake in
// either shows up as a difference.
// ---------------------------------------------------------------------------

// What is left after k payments of `payment` on `start` at monthly rate r:
// start x (1 + r)^k - payment x ((1 + r)^k - 1) / r
const leftAfter = (start, r, payment, k) =>
  r === 0 ? start - payment * k : start * (1 + r) ** k - (payment * ((1 + r) ** k - 1)) / r

// How many payments of `payment` clear `start`, the last one smaller:
// -ln(1 - r x start / payment) / ln(1 + r), rounded up.
function paymentsToClear(start, r, payment) {
  const exact = r === 0 ? start / payment : -Math.log(1 - (r * start) / payment) / Math.log(1 + r)
  const months = Math.ceil(exact)
  // Less than half a penny left after one payment fewer counts as cleared.
  return months > 0 && leftAfter(start, r, payment, months - 1) <= 0.005 ? months - 1 : months
}

function closedForm({ balance, ratePercent, years, overpayment = 0, lump = 0, lumpYear = 1 }) {
  const r = ratePercent / 100 / 12
  const n = Math.round(years * 12)
  const standard = r === 0 ? balance / n : (balance * r * (1 + r) ** n) / ((1 + r) ** n - 1)
  const payment = standard + overpayment
  const lumpMonth = (lumpYear - 1) * 12 + 1

  // Without the lump sum, or if the mortgage is cleared before it is due.
  const clearedWithoutLump = paymentsToClear(balance, r, payment)
  let months = clearedWithoutLump
  let lumpPaid = 0
  // What is owed, and the payment number, from which the last stretch runs.
  let from = { owed: balance, payment: 0 }
  if (lump > 0 && clearedWithoutLump > lumpMonth - 1) {
    const owedAtLump = leftAfter(balance, r, payment, lumpMonth - 1)
    lumpPaid = Math.min(lump, owedAtLump)
    const after = owedAtLump - lumpPaid
    months = after <= 0.005 ? lumpMonth - 1 : lumpMonth - 1 + paymentsToClear(after, r, payment)
    from = { owed: after, payment: lumpMonth - 1 }
  }

  // What was owed just before the last payment, which is that plus a month of interest.
  const lastPayment =
    months === 0 ? 0 : leftAfter(from.owed, r, payment, months - 1 - from.payment) * (1 + r)
  const totalPaid = (months === 0 ? 0 : payment * (months - 1) + lastPayment) + lumpPaid
  const standardInterest = standard * n - balance
  const interest = totalPaid - balance

  // Balance at the end of each year, with and without overpaying.
  // k payments in. The lump sum is paid after payment lumpMonth - 1.
  const owedAfter = (k) => {
    if (lumpPaid === 0 || k <= lumpMonth - 1) {
      return k >= clearedWithoutLump ? 0 : Math.max(0, leftAfter(balance, r, payment, k))
    }
    return k >= months ? 0 : Math.max(0, leftAfter(from.owed, r, payment, k - from.payment))
  }
  const yearEnds = []
  for (let end = 12; end < n + 12; end += 12) yearEnds.push(Math.min(end, n))
  return {
    standard,
    months,
    monthsSaved: n - months,
    interest,
    interestSaved: standardInterest - interest,
    lumpPaid,
    balances: yearEnds.map(owedAfter),
    standardBalances: yearEnds.map((k) => Math.max(0, leftAfter(balance, r, standard, k))),
  }
}

test('mortgage [own working] every result matches the independent calculation', () => {
  let checked = 0
  for (const balance of [200000, 85000, 1000000]) {
    for (const ratePercent of [0, 2.5, 4.5, 7.25]) {
      for (const years of [10, 12.5, 25]) {
        for (const overpayment of [0, 150, 1000]) {
          for (const [lump, lumpYear] of [
            [0, 1],
            [5000, 1],
            [5000, 3],
            [50000, 8],
            [5000000, 2],
          ]) {
            const label = `${balance} at ${ratePercent}% over ${years} years, ${overpayment} a month, ${lump} in year ${lumpYear}:`
            const result = calculateMortgageOverpayment({
              balance,
              annualRatePercent: ratePercent,
              remainingYears: years,
              monthlyOverpayment: overpayment,
              lumpSum: lump,
              lumpSumYear: lumpYear,
            })
            const check = closedForm({ balance, ratePercent, years, overpayment, lump, lumpYear })
            assert.equal(result.newTermMonths, check.months, `${label} months`)
            assert.equal(result.monthsSaved, check.monthsSaved, `${label} months saved`)
            assert.ok(Math.abs(result.standardPayment - check.standard) < 0.005, label)
            assert.ok(Math.abs(result.lumpSumPaid - check.lumpPaid) < 0.005, `${label} lump sum`)
            assert.ok(
              Math.abs(result.newTotalInterest - check.interest) < 0.01,
              `${label} interest ${result.newTotalInterest} against ${check.interest}`,
            )
            assert.ok(Math.abs(result.interestSaved - Math.max(0, check.interestSaved)) < 0.01)
            assert.equal(result.years.length, check.balances.length, `${label} years`)
            result.years.forEach((row, index) => {
              assert.ok(
                Math.abs(row.balance - check.balances[index]) < 0.01,
                `${label} year ${row.year}: ${row.balance} against ${check.balances[index]}`,
              )
              assert.ok(Math.abs(row.standardBalance - check.standardBalances[index]) < 0.01)
            })
            checked += 1
          }
        }
      }
    }
  }
  assert.equal(checked, 540)
})

// ---------------------------------------------------------------------------
// Lump sums
// ---------------------------------------------------------------------------

const overpay = (settings) =>
  calculateMortgageOverpayment({
    balance: 200000,
    annualRatePercent: 4.5,
    remainingYears: 25,
    ...settings,
  })

test('mortgage [own working] a lump sum on its own', () => {
  // £10,000 straight away on £200,000 at 4.5% over 25 years. The payment stays
  // £1,111.66, so the mortgage ends 26 months sooner.
  const now = overpay({ lumpSum: 10000 })
  assert.equal(now.lumpSumPaid, 10000)
  assert.equal(now.newTermMonths, 274)
  assert.equal(now.monthsSaved, 26)
  near(Math.round(now.interestSaved), 19300)
  // The same £10,000 in year 5 saves less, because interest has been charged on
  // it for four more years.
  const later = overpay({ lumpSum: 10000, lumpSumYear: 5 })
  assert.equal(later.lumpSumMonth, 49)
  assert.equal(later.newTermMonths, 278)
  near(Math.round(later.interestSaved), 14676)
  // MoneyHelper's example: "On a £250,000 mortgage at 5% with 25 years remaining,
  // paying off a £5,000 lump sum reduces the interest by £11,970 and means you
  // would repay it 11 months earlier." The months match, and the interest is
  // within half a percent (calculators count interest in slightly different ways).
  const moneyHelper = calculateMortgageOverpayment({
    balance: 250000,
    annualRatePercent: 5,
    remainingYears: 25,
    lumpSum: 5000,
  })
  assert.equal(moneyHelper.monthsSaved, 11)
  assert.ok(Math.abs(moneyHelper.interestSaved - 11970) / 11970 < 0.005)
})

test('mortgage [own working] a lump sum and a monthly overpayment together', () => {
  // £10,000 now and £200 a month: 210 months, 90 sooner.
  const both = overpay({ lumpSum: 10000, monthlyOverpayment: 200 })
  assert.equal(both.newTermMonths, 210)
  assert.equal(both.monthsSaved, 90)
  near(Math.round(both.interestSaved), 48929)
  // Together they save more than either on its own.
  assert.ok(both.interestSaved > overpay({ lumpSum: 10000 }).interestSaved)
  assert.ok(both.interestSaved > overpay({ monthlyOverpayment: 200 }).interestSaved)
  // In year 1 the lump sum and twelve overpayments are both counted.
  near(both.years[0].overpaid, 10000 + 12 * 200)
})

test('mortgage [own working] a lump sum that is too big, or comes too late', () => {
  // More than is owed clears the mortgage on the day, with no payments left.
  const clears = overpay({ lumpSum: 500000 })
  assert.equal(clears.lumpSumPaid, 200000)
  assert.equal(clears.newTermMonths, 0)
  assert.equal(clears.newTotalInterest, 0)
  assert.equal(clears.lumpSumNotAllUsed, true)
  // A lump sum in year 30 of a 25-year mortgage is never paid.
  const tooLate = overpay({ lumpSum: 10000, lumpSumYear: 30 })
  assert.equal(tooLate.lumpSumPaid, 0)
  assert.equal(tooLate.lumpSumNotAllUsed, true)
  assert.equal(tooLate.newTermMonths, 300)
  // £3,000 a month clears it in year 7, before a lump sum due in year 10.
  const alreadyClear = overpay({ monthlyOverpayment: 3000, lumpSum: 10000, lumpSumYear: 10 })
  assert.ok(alreadyClear.newTermMonths < 9 * 12)
  assert.equal(alreadyClear.lumpSumPaid, 0)
  // A lump sum that clears what is left part way through: only that much is paid.
  const finishes = overpay({ lumpSum: 150000, lumpSumYear: 15 })
  near(finishes.lumpSumPaid, finishes.years[14].startBalance)
  assert.equal(finishes.newTermMonths, 14 * 12)
  // Blank, negative or nonsense amounts and years count as none, or as year 1.
  assert.equal(overpay({ lumpSum: -5000 }).lumpSumPaid, 0)
  assert.equal(overpay({ lumpSum: NaN }).lumpSumNotAllUsed, false)
  assert.equal(overpay({ lumpSum: 10000, lumpSumYear: NaN }).lumpSumMonth, 1)
  assert.equal(overpay({ lumpSum: 10000, lumpSumYear: 0 }).lumpSumMonth, 1)
})

// ---------------------------------------------------------------------------
// The overpayment allowance
// ---------------------------------------------------------------------------

test('mortgage [own working] the yearly overpayment allowance', () => {
  // £1,500 a month on £200,000: £18,000 a year. 10% of £200,000 is £20,000, so
  // year 1 is inside the limit.
  const result = overpay({ monthlyOverpayment: 1500 })
  assert.equal(result.firstYearAllowance, 20000)
  near(result.years[0].overpaid, 18000)
  // By the start of year 2 the balance is down to £177,193, so the limit is
  // £17,719, under the £18,000 being overpaid.
  const r = 4.5 / 100 / 12
  const owedAtYear2 = leftAfter(200000, r, result.newPayment, 12)
  near(result.years[1].startBalance, owedAtYear2)
  near(result.years[1].allowance, owedAtYear2 * 0.1)
  assert.equal(Math.round(result.years[1].allowance), 17719)
  // Every year from 2 is over the limit, until the mortgage is paid off in year 8.
  assert.deepEqual(result.yearsOverAllowance, [2, 3, 4, 5, 6, 7, 8])
  // Limits usually apply only during a deal. With 5 years left on it, only years 2 to 5 count.
  assert.deepEqual(
    overpay({ monthlyOverpayment: 1500, overpaymentLimitYears: 5 }).yearsOverAllowance,
    [2, 3, 4, 5],
  )
  assert.deepEqual(
    overpay({ monthlyOverpayment: 1500, overpaymentLimitYears: 1 }).yearsOverAllowance,
    [],
  )
  // A £25,000 lump sum is over £20,000 straight away. Exactly £20,000 is not.
  assert.deepEqual(overpay({ lumpSum: 25000 }).yearsOverAllowance, [1])
  assert.deepEqual(overpay({ lumpSum: 20000 }).yearsOverAllowance, [])
  // Another lender's limit, or none at all.
  assert.equal(overpay({ overpaymentLimit: 0.2 }).firstYearAllowance, 40000)
  const noLimit = overpay({ monthlyOverpayment: 1500, overpaymentLimit: null })
  assert.equal(noLimit.firstYearAllowance, null)
  assert.deepEqual(noLimit.yearsOverAllowance, [])
  // £200 a month never comes close in the first 5 years.
  assert.deepEqual(
    overpay({ monthlyOverpayment: 200, overpaymentLimitYears: 5 }).yearsOverAllowance,
    [],
  )
})

test('mortgage [own working] the month a mortgage ends, from a start date', () => {
  assert.equal(monthAfter('2026-10-20', 227), '2045-09')
  assert.equal(monthAfter('2026-10-20', 300), '2051-10')
  assert.equal(monthAfter('2026-12-31', 1), '2027-01') // into the next year
  assert.equal(monthAfter('2027-01-31', 1), '2027-02') // only the month matters
  assert.equal(monthAfter('2027-01-15', 0), '2027-01')
  assert.equal(monthAfter('2026-03-01', 600), '2076-03')
})

test('mortgage [own working] the figures in the guide sections', () => {
  const summary = (settings) => {
    const result = overpay(settings)
    return [result.newTermMonths, result.monthsSaved, Math.round(result.interestSaved)]
  }
  // How many years it takes: £200,000 at 4.5% over 25 years.
  assert.deepEqual(summary({}), [300, 0, 0])
  assert.deepEqual(summary({ monthlyOverpayment: 200 }), [227, 73, 36280])
  assert.deepEqual(summary({ monthlyOverpayment: 500 }), [168, 132, 63887])
  assert.deepEqual(summary({ lumpSum: 10000 }), [274, 26, 19300])
  assert.deepEqual(summary({ lumpSum: 10000, monthlyOverpayment: 200 }), [210, 90, 48929])
  // How much you can pay off each year: the limit for each of the first 5 years
  // when overpaying £1,500 a month.
  const limits = overpay({ monthlyOverpayment: 1500 }).years.slice(0, 5)
  assert.deepEqual(
    limits.map((row) => Math.round(row.allowance)),
    [20000, 17719, 15334, 12839, 10229],
  )
})
