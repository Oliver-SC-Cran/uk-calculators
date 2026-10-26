// Tests for the mortgage overpayment calculator. Run with: npm test
//
// gov.uk has no mortgage calculator, so every expected value here is
// [own working]: worked out by hand from the standard repayment-mortgage
// formulas. Every result is also checked against an independent calculation
// from the closed-form loan formulas further down.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculateMortgageOverpayment,
  compareOffsetAndOverpaying,
  overpaymentToBeMortgageFree,
} from './mortgage.js'
import { monthAfter, paymentsByEndOf } from './dates.js'

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

// ---------------------------------------------------------------------------
// Offset savings
// ---------------------------------------------------------------------------

test('mortgage [own working] interest is charged only on what is owed above the savings', () => {
  // MoneyHelper's example: a £200,000 offset mortgage at 3% with £10,000 in the
  // offset account, so "you'd only pay interest on £190,000". Over a single
  // month that is £190,000 x 3% / 12 = £475.
  const oneMonth = calculateMortgageOverpayment({
    balance: 200000,
    annualRatePercent: 3,
    remainingYears: 1 / 12,
    offsetSavings: 10000,
  })
  near(oneMonth.newTotalInterest, 475)
  near(oneMonth.standardTotalInterest, 500)
  // Savings that cover the whole balance mean no interest at all.
  const covered = calculateMortgageOverpayment({
    balance: 100000,
    annualRatePercent: 5,
    remainingYears: 25,
    offsetSavings: 150000,
  })
  assert.equal(covered.newTotalInterest, 0)
  assert.equal(covered.savingsCoverMonth, 0)
  assert.equal(covered.newTermMonths, Math.ceil(100000 / covered.standardPayment))
})

test('mortgage [own working] offsetting saves the same interest as overpaying the same amount', () => {
  // £20,000 offset on £200,000 at 4.5% over 25 years, with the payment kept at
  // £1,111.66. The part above the savings falls exactly as the balance would
  // after a £20,000 lump sum, so the interest is the same. The lump sum ends
  // the mortgage after 250 payments. With the offset, what is owed is down to
  // the £20,000 of savings at the same point, and the payments clear that in
  // 18 more months with no interest.
  const offset = overpay({ offsetSavings: 20000 })
  const lump = overpay({ lumpSum: 20000 })
  assert.equal(lump.newTermMonths, 250)
  assert.equal(offset.savingsCoverMonth, 250)
  assert.equal(offset.newTermMonths, 268)
  assert.equal(268 - 250, Math.ceil(20000 / offset.standardPayment))
  near(offset.interestSaved, lump.interestSaved)
  assert.equal(Math.round(offset.interestSaved), 35968)
  // Offset savings are not an overpayment, so they never count towards the limit.
  const big = overpay({ offsetSavings: 150000 })
  assert.deepEqual(big.yearsOverAllowance, [])
  assert.ok(big.years.every((row) => row.overpaid === 0))
})

test('mortgage [own working] offset savings with overpayments, and odd amounts', () => {
  // Bigger savings always save more and never make the mortgage end later,
  // until they cover all £200,000 and no interest is left to save.
  let previous = overpay({})
  for (let savings = 5000; savings <= 250000; savings += 5000) {
    const result = overpay({ offsetSavings: savings })
    if (savings <= 200000) assert.ok(result.interestSaved > previous.interestSaved, `at ${savings}`)
    else assert.equal(result.interestSaved, previous.interestSaved, `at ${savings}`)
    assert.ok(result.newTermMonths <= previous.newTermMonths, `at ${savings}`)
    previous = result
  }
  // Together they save more than either on its own, and less than the two added up.
  const { offsetOnly, overpayingOnly, both } = compareOffsetAndOverpaying({
    balance: 200000,
    annualRatePercent: 4.5,
    remainingYears: 25,
    monthlyOverpayment: 200,
    offsetSavings: 20000,
  })
  assert.equal(Math.round(offsetOnly.interestSaved), 35968)
  assert.equal(Math.round(overpayingOnly.interestSaved), 36280)
  assert.equal(Math.round(both.interestSaved), 60203)
  assert.ok(both.interestSaved > offsetOnly.interestSaved)
  assert.ok(both.interestSaved > overpayingOnly.interestSaved)
  assert.ok(both.interestSaved < offsetOnly.interestSaved + overpayingOnly.interestSaved)
  assert.equal(both.newTermMonths, 209)
  assert.equal(both.savingsCoverMonth, 194)
  // With no interest, an offset changes nothing.
  const free = calculateMortgageOverpayment({
    balance: 120000,
    annualRatePercent: 0,
    remainingYears: 10,
    offsetSavings: 50000,
  })
  assert.equal(free.newTermMonths, 120)
  assert.equal(free.interestSaved, 0)
  // Blank, negative or nonsense savings count as none, and give the same as no offset.
  for (const savings of [0, -5000, NaN]) {
    const result = overpay({ offsetSavings: savings, monthlyOverpayment: 200 })
    assert.equal(result.offsetSavings, 0)
    assert.equal(result.savingsCoverMonth, null)
    assert.equal(result.interestSaved, overpay({ monthlyOverpayment: 200 }).interestSaved)
  }
  // A very large mortgage and savings still give finite numbers.
  const large = calculateMortgageOverpayment({
    balance: 10000000,
    annualRatePercent: 5.5,
    remainingYears: 35,
    offsetSavings: 2500000,
  })
  assert.ok(Number.isFinite(large.interestSaved) && large.interestSaved > 0)
})

// ---------------------------------------------------------------------------
// The independent check with offset savings
//
// While what is owed is above the savings, interest is charged on the part
// above them, so that part follows the loan formula on its own. Once it has
// reached zero no more interest is charged, and each payment comes straight
// off what is owed. Each stretch is worked out from the formulas, with no loop
// over the months.
// ---------------------------------------------------------------------------

// Up to `most` payments of `payment` from `owed`, with `savings` offset.
// Returns how many were made (fewer if it was cleared), what is owed after
// them, and the interest charged.
function stretch(owed, savings, r, payment, most) {
  if (owed <= 0.005 || most <= 0) return { made: 0, owed: owed <= 0.005 ? 0 : owed, interest: 0 }
  const above = owed - savings
  let made = 0
  let interest = 0
  let left = owed
  if (above > 0) {
    // The payment after which the part above the savings is zero or below.
    const exact = r === 0 ? above / payment : -Math.log(1 - (r * above) / payment) / Math.log(1 + r)
    const crossing = Math.ceil(exact)
    if (crossing > most) {
      const rest = leftAfter(above, r, payment, most)
      return { made: most, owed: savings + rest, interest: payment * most + rest - above }
    }
    const before = leftAfter(above, r, payment, crossing - 1)
    // Less than half a penny left one payment early counts as cleared.
    if (savings + before <= 0.005) {
      return { made: crossing - 1, owed: 0, interest: payment * (crossing - 1) + before - above }
    }
    // The interest on each payment is what is owed above the savings times r.
    // Over `crossing` payments that adds up to every payment, less what came
    // off the part above the savings.
    interest = payment * (crossing - 1) + before * (1 + r) - above
    left = Math.max(0, savings + before * (1 + r) - payment)
    made = crossing
  }
  const toClear = left > 0.005 ? Math.ceil((left - 0.005) / payment) : 0
  const more = Math.min(toClear, most - made)
  return { made: made + more, owed: more === toClear ? 0 : left - more * payment, interest }
}

function closedFormWithSavings({
  balance,
  ratePercent,
  years,
  overpayment = 0,
  savings = 0,
  lump = 0,
  lumpYear = 1,
}) {
  const r = ratePercent / 100 / 12
  const n = Math.round(years * 12)
  const standard = r === 0 ? balance / n : (balance * r * (1 + r) ** n) / ((1 + r) ** n - 1)
  const payment = standard + overpayment
  const lumpMonth = (lumpYear - 1) * 12 + 1

  // Up to the lump sum, the lump sum, then the rest.
  const first = stretch(balance, savings, r, payment, lumpMonth - 1)
  const lumpPaid = lump > 0 && lumpMonth <= n && first.owed > 0.005 ? Math.min(lump, first.owed) : 0
  const afterLump = first.owed - lumpPaid
  const rest = stretch(afterLump, savings, r, payment, n)
  const months = first.made + rest.made

  // What is owed after k payments. With lumpIncluded, a lump sum due straight
  // after payment k has been paid.
  const owedAfter = (k, lumpIncluded = false) => {
    const lumpIn = lumpPaid > 0 && (k > lumpMonth - 1 || (k === lumpMonth - 1 && lumpIncluded))
    if (!lumpIn) return stretch(balance, savings, r, payment, k).owed
    return stretch(afterLump, savings, r, payment, k - (lumpMonth - 1)).owed
  }
  let savingsCover = null
  if (savings > 0) {
    savingsCover = 0
    while (owedAfter(savingsCover, true) > savings) savingsCover += 1
  }

  const yearEnds = []
  for (let end = 12; end < n + 12; end += 12) yearEnds.push(Math.min(end, n))
  const interest = first.interest + rest.interest
  return {
    standard,
    months,
    interest,
    interestSaved: standard * n - balance - interest,
    lumpPaid,
    savingsCover,
    balances: yearEnds.map((k) => owedAfter(k)),
  }
}

test('mortgage [own working] the independent calculation with savings agrees with the first one', () => {
  // Checks the check: with no savings it gives what the first one gives.
  for (const [lump, lumpYear] of [
    [0, 1],
    [5000, 3],
    [50000, 8],
  ]) {
    for (const overpayment of [0, 150, 1000]) {
      const settings = { balance: 200000, ratePercent: 4.5, years: 25, overpayment, lump, lumpYear }
      const a = closedForm(settings)
      const b = closedFormWithSavings(settings)
      assert.equal(a.months, b.months)
      assert.ok(Math.abs(a.interest - b.interest) < 0.01)
      a.balances.forEach((value, index) => assert.ok(Math.abs(value - b.balances[index]) < 0.01))
    }
  }
})

test('mortgage [own working] every result with offset savings matches the independent calculation', () => {
  let checked = 0
  for (const balance of [200000, 85000, 1000000]) {
    for (const ratePercent of [0, 2.5, 4.5, 7.25]) {
      for (const years of [10, 12.5, 25]) {
        for (const overpayment of [0, 150, 1000]) {
          // Chosen so that what is owed never lands exactly on the savings,
          // where the two calculations could round either way.
          for (const savings of [6500, 61000, 2000000]) {
            for (const [lump, lumpYear] of [
              [0, 1],
              [5000, 1],
              [50000, 8],
            ]) {
              const label = `${balance} at ${ratePercent}% over ${years} years, ${overpayment} a month, ${savings} offset, ${lump} in year ${lumpYear}:`
              const result = calculateMortgageOverpayment({
                balance,
                annualRatePercent: ratePercent,
                remainingYears: years,
                monthlyOverpayment: overpayment,
                lumpSum: lump,
                lumpSumYear: lumpYear,
                offsetSavings: savings,
              })
              const check = closedFormWithSavings({
                balance,
                ratePercent,
                years,
                overpayment,
                savings,
                lump,
                lumpYear,
              })
              assert.equal(result.newTermMonths, check.months, `${label} months`)
              assert.ok(Math.abs(result.lumpSumPaid - check.lumpPaid) < 0.005, `${label} lump`)
              assert.ok(
                Math.abs(result.newTotalInterest - check.interest) < 0.01,
                `${label} interest ${result.newTotalInterest} against ${check.interest}`,
              )
              assert.ok(Math.abs(result.interestSaved - Math.max(0, check.interestSaved)) < 0.01)
              assert.equal(result.savingsCoverMonth, check.savingsCover, `${label} savings cover`)
              assert.equal(result.years.length, check.balances.length, `${label} years`)
              result.years.forEach((row, index) => {
                assert.ok(
                  Math.abs(row.balance - check.balances[index]) < 0.01,
                  `${label} year ${row.year}: ${row.balance} against ${check.balances[index]}`,
                )
              })
              checked += 1
            }
          }
        }
      }
    }
  }
  assert.equal(checked, 972)
})

// ---------------------------------------------------------------------------
// Mortgage-free by a target
// ---------------------------------------------------------------------------

// The monthly payment that clears `balance` in exactly `months` payments, from
// the loan formula.
const paymentToClear = (balance, r, months) =>
  r === 0 ? balance / months : (balance * r * (1 + r) ** months) / ((1 + r) ** months - 1)

const target = (settings) =>
  overpaymentToBeMortgageFree({
    balance: 200000,
    annualRatePercent: 4.5,
    remainingYears: 25,
    ...settings,
  })

test('mortgage [own working] the overpayment needed to be mortgage-free in 10, 15 or 20 years', () => {
  // £200,000 at 4.5% with 25 years left. To clear it in 15 years (180
  // payments) the loan formula gives £1,529.99 a month, which is £418.32 more
  // than the normal £1,111.66. In whole pence £418.33 is the least that
  // leaves nothing owed, and rounded up to the pound it is £419.
  const r = 4.5 / 100 / 12
  assert.equal(Math.round(paymentToClear(200000, r, 180) * 100), 152999)
  assert.equal(Math.round(paymentToClear(200000, r, 300) * 100), 111166)
  assert.equal(
    Math.floor((paymentToClear(200000, r, 180) - paymentToClear(200000, r, 300)) * 100),
    41832,
  )
  const fifteen = target({ targetMonths: 180 })
  assert.equal(fifteen.exactOverpayment, 418.33)
  assert.equal(fifteen.monthlyOverpayment, 419)
  assert.equal(fifteen.result.newTermMonths, 180)
  assert.equal(Math.round(fifteen.result.interestSaved), 58154)
  assert.equal(target({ targetMonths: 120 }).monthlyOverpayment, 962)
  assert.equal(target({ targetMonths: 240 }).monthlyOverpayment, 154)
  // A shorter target always needs more.
  let previous = 0
  for (let months = 299; months >= 1; months -= 1) {
    const each = target({ targetMonths: months }).monthlyOverpayment
    assert.ok(each >= previous, `at ${months} months`)
    previous = each
  }
})

test('mortgage [own working] paying the suggested amount clears the mortgage by the target', () => {
  let checked = 0
  for (const balance of [200000, 85000, 1000000]) {
    for (const ratePercent of [0, 2.5, 4.5, 7.25]) {
      for (const years of [10, 25]) {
        for (const targetMonths of [1, 12, 61, 100, 119]) {
          for (const savings of [0, 30000]) {
            for (const [lump, lumpYear] of [
              [0, 1],
              [20000, 3],
            ]) {
              const label = `${balance} at ${ratePercent}% over ${years} years, in ${targetMonths} months, ${savings} offset, ${lump} lump sum:`
              const found = overpaymentToBeMortgageFree({
                balance,
                annualRatePercent: ratePercent,
                remainingYears: years,
                targetMonths,
                offsetSavings: savings,
                lumpSum: lump,
                lumpSumYear: lumpYear,
              })
              const months = (overpayment) =>
                closedFormWithSavings({
                  balance,
                  ratePercent,
                  years,
                  overpayment,
                  savings,
                  lump,
                  lumpYear,
                }).months
              // The amount shown clears it in time, by the independent calculation and the first.
              assert.ok(months(found.monthlyOverpayment) <= targetMonths, `${label} shown`)
              assert.ok(found.result.newTermMonths <= targetMonths, `${label} result`)
              assert.equal(found.result.newTermMonths, months(found.monthlyOverpayment), label)
              // A pound less, or a penny less than the exact amount, does not.
              if (found.monthlyOverpayment > 0) {
                assert.ok(months(found.monthlyOverpayment - 1) > targetMonths, `${label} £1 less`)
                assert.ok(months(found.exactOverpayment - 0.01) > targetMonths, `${label} 1p less`)
              } else {
                assert.ok(found.onTrack)
                assert.ok(months(0) <= targetMonths, `${label} on track`)
              }
              // With nothing else, the exact amount is the loan formula's, to the penny.
              if (savings === 0 && lump === 0 && targetMonths < years * 12) {
                const r = ratePercent / 100 / 12
                const formula =
                  paymentToClear(balance, r, targetMonths) - found.result.standardPayment
                assert.ok(Math.abs(found.exactOverpayment - formula) <= 0.01, `${label} formula`)
              }
              checked += 1
            }
          }
        }
      }
    }
  }
  assert.equal(checked, 480)
})

test('mortgage [own working] a target year: the last payment falls in that year or before', () => {
  // From 26 October 2026 the first payment is in November 2026, and the 170th
  // is in December 2040.
  assert.equal(paymentsByEndOf('2026-10-26', 2040), 170)
  assert.equal(monthAfter('2026-10-26', 170), '2040-12')
  assert.equal(monthAfter('2026-10-26', 171), '2041-01')
  assert.equal(paymentsByEndOf('2027-01-01', 2027), 11) // February to December
  assert.equal(paymentsByEndOf('2026-12-15', 2026), 0) // the first payment is in 2027
  assert.equal(paymentsByEndOf('2026-10-26', 2025), -10)
  for (const [start, year] of [
    ['2026-10-26', 2040],
    ['2027-01-01', 2035],
    ['2026-12-31', 2027],
    ['2026-06-15', 2049],
  ]) {
    const found = target({ targetMonths: paymentsByEndOf(start, year) })
    const lastPayment = monthAfter(start, found.result.newTermMonths)
    assert.ok(lastPayment <= `${year}-12`, `${start} to ${year}: last payment ${lastPayment}`)
    // A pound a month less would push the last payment into the next year.
    const less = overpay({ monthlyOverpayment: found.monthlyOverpayment - 1 })
    assert.ok(monthAfter(start, less.newTermMonths) > `${year}-12`, `${start} to ${year}`)
  }
})

test('mortgage [own working] a target the mortgage already meets, and odd targets', () => {
  // The mortgage ends after 300 payments anyway.
  for (const months of [300, 301, 600]) {
    const found = target({ targetMonths: months })
    assert.equal(found.monthlyOverpayment, 0)
    assert.ok(found.onTrack)
    assert.equal(found.result.newTermMonths, 300)
  }
  // One payment sooner takes £2.01 a month more by the loan formula, so £3.
  const r = 0.045 / 12
  near(paymentToClear(200000, r, 299) - paymentToClear(200000, r, 300), 2.01389)
  assert.equal(target({ targetMonths: 299 }).exactOverpayment, 2.02)
  assert.equal(target({ targetMonths: 299 }).monthlyOverpayment, 3)
  // £20,000 of offset savings ends it after 268 payments without overpaying.
  assert.ok(target({ targetMonths: 268, offsetSavings: 20000 }).onTrack)
  assert.equal(target({ targetMonths: 180, offsetSavings: 20000 }).monthlyOverpayment, 346)
  // One payment: everything owed plus a month's interest, less the normal payment.
  const oneMonth = target({ targetMonths: 1 })
  assert.equal(oneMonth.result.newTermMonths, 1)
  assert.equal(
    oneMonth.monthlyOverpayment,
    Math.ceil(200000 * (1 + 0.045 / 12) - oneMonth.result.standardPayment),
  )
  // No interest: £120,000 over 10 years is £1,000 a month, and clearing it in
  // 5 years needs exactly £1,000 more.
  const free = overpaymentToBeMortgageFree({
    balance: 120000,
    annualRatePercent: 0,
    remainingYears: 10,
    targetMonths: 60,
  })
  assert.equal(free.exactOverpayment, 1000)
  assert.equal(free.monthlyOverpayment, 1000)
  // A target of no payments, or none at all, cannot be worked out.
  for (const months of [0, -12, 0.5, NaN]) assert.equal(target({ targetMonths: months }), null)
  assert.equal(target({ targetMonths: 120, balance: 0 }), null)
  // A very large mortgage still gives an amount that clears it in time.
  const large = target({ targetMonths: 12, balance: 10000000 })
  assert.ok(large.result.newTermMonths <= 12)
  assert.ok(Number.isFinite(large.result.interestSaved))
})

test('mortgage [own working] the figures in the guide sections on targets and offsetting', () => {
  // How much extra to clear £200,000 at 4.5% (25 years left) in 20, 15, 10 or 5 years.
  const inYears = [20, 15, 10, 5].map((years) => {
    const found = target({ targetMonths: years * 12, overpaymentLimitYears: 5 })
    return [found.monthlyOverpayment, Math.round(found.result.interestSaved)]
  })
  assert.deepEqual(inYears, [
    [154, 29882],
    [419, 58154],
    [962, 84795],
    [2617, 109784],
  ])
  const ten = target({ targetMonths: 120 }).result.years.slice(0, 5)
  assert.deepEqual(
    ten.map((row) => Math.round(row.allowance)),
    [20000, 18378, 16682, 14908, 13053],
  )
  // Each 5 years taken off costs more than the last: 154, 265, 543 and 1,655 more a month.
  const amounts = [0, ...inYears.map(([each]) => each)]
  const steps = amounts.slice(1).map((each, index) => each - amounts[index])
  assert.deepEqual(steps, [154, 265, 543, 1655])
  // £20,000 overpaid straight away, or kept in an offset account.
  const overpaid = overpay({ lumpSum: 20000 })
  const offset = overpay({ offsetSavings: 20000 })
  assert.deepEqual(
    [
      overpaid.newTermMonths,
      Math.round(overpaid.interestSaved),
      Math.round(overpaid.newTotalInterest),
    ],
    [250, 35968, 97531],
  )
  assert.deepEqual([offset.savingsCoverMonth, offset.newTermMonths], [250, 268])
  // The same offset at 4.75%.
  const dearer = overpay({ annualRatePercent: 4.75, offsetSavings: 20000 })
  assert.equal(Math.round(dearer.newTotalInterest), 102997)
})

test('mortgage [own working] the suggested amount and the overpayment limit', () => {
  // £419 a month is £5,028 a year, well inside 10% of £200,000.
  const fifteen = target({ targetMonths: 180, overpaymentLimitYears: 5 })
  assert.deepEqual(fifteen.result.yearsOverAllowance, [])
  // Clearing it in 5 years takes £2,617 a month, £31,404 a year, which is over
  // the limit in every year of a 5-year deal.
  const five = target({ targetMonths: 60, overpaymentLimitYears: 5 })
  assert.equal(five.monthlyOverpayment, 2617)
  assert.deepEqual(five.result.yearsOverAllowance, [1, 2, 3, 4, 5])
})
