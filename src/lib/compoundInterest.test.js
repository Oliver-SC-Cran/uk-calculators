// Tests for the compound interest calculator. Run with: npm test
//
// gov.uk, the FCA and the Bank of England publish no compound interest
// examples or calculator, so every expected value here is [own working]:
// worked out by hand from the standard compound interest formulas. Every
// result is also checked against an independent calculation from the
// closed-form formulas further down. Each test name says whether interest and
// charges are added monthly or yearly.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateCompoundInterest, yearlyGrowth } from './compoundInterest.js'
import { projectLifetimeIsa } from './lifetimeIsa.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const pot = (settings) => calculateCompoundInterest(settings)

// ---------------------------------------------------------------------------
// The standard formula
// ---------------------------------------------------------------------------

test('compound interest [own working] added yearly: £1,000 at 5% for 10 years is £1,628.89', () => {
  // £1,000 × 1.05 to the power 10.
  const r = pot({ startAmount: 1000, ratePercent: 5, years: 10, compounding: 'yearly' })
  near(r.finalValue, 1628.89)
  near(r.growth, 628.89)
  assert.equal(r.charges, 0)
  assert.equal(r.yearlyRate, 0.05)
})

test('compound interest [own working] added monthly: £1,000 at 5% for 10 years is £1,647.01', () => {
  // £1,000 × (1 + 0.05 / 12) to the power 120.
  const r = pot({ startAmount: 1000, ratePercent: 5, years: 10, compounding: 'monthly' })
  near(r.finalValue, 1647.01)
  near(r.growth, 647.01)
})

test('compound interest [own working] added monthly: 5% a year works out at 5.116% over a year', () => {
  // (1 + 0.05 / 12) to the power 12, less 1, is 0.0511619.
  assert.ok(Math.abs(yearlyGrowth({ ratePercent: 5 }).gross - 0.0511619) < 1e-7)
  const r = pot({ startAmount: 1000, ratePercent: 5, years: 1, compounding: 'monthly' })
  near(r.finalValue, 1051.16)
  assert.equal(r.yearlyRate, yearlyGrowth({ ratePercent: 5, compounding: 'monthly' }).gross)
})

test('compound interest [own working] added yearly: the yearly rate is the rate itself', () => {
  assert.equal(yearlyGrowth({ ratePercent: 5, compounding: 'yearly' }).gross, 0.05)
  assert.equal(yearlyGrowth({ ratePercent: 0, compounding: 'yearly' }).gross, 0)
})

// ---------------------------------------------------------------------------
// Regular payments, at the start of each month or year
// ---------------------------------------------------------------------------

test('compound interest [own working] added monthly: £100 at the start of each month for 10 years', () => {
  // 100 × ((1 + i) ^ 120 − 1) / i × (1 + i), with i = 0.05 / 12: £15,592.93.
  const r = pot({ payment: 100, ratePercent: 5, years: 10, compounding: 'monthly' })
  near(r.finalValue, 15592.93)
  assert.equal(r.paymentsMade, 120)
  near(r.totalPayments, 12000)
  near(r.paidIn, 12000)
})

test('compound interest [own working] added yearly: £1,200 at the start of each year for 10 years', () => {
  // 1,200 × (1.05 ^ 10 − 1) / 0.05 × 1.05: £15,848.14.
  const r = pot({
    payment: 1200,
    paymentFrequency: 'yearly',
    ratePercent: 5,
    years: 10,
    compounding: 'yearly',
  })
  near(r.finalValue, 15848.14)
  assert.equal(r.paymentsMade, 10)
})

test('compound interest [own working] added yearly: a monthly payment earns interest for the months it is in', () => {
  // £100 at the start of each month for one year at 12%: each payment earns
  // 1% for each month left, so 100 × 12 + 100 × 12% × (12 + 11 + ... + 1) / 12 = £1,278.
  const r = pot({ payment: 100, ratePercent: 12, years: 1, compounding: 'yearly' })
  near(r.finalValue, 1278)
  near(r.growth, 78)
})

test('compound interest [own working] added yearly: payments at the start of each year match the Lifetime ISA calculator', () => {
  // The Lifetime ISA calculator pays each yearly payment at the start of the
  // year and adds the 25% bonus with it. £2,000 a year from 25 to 35 at 5%
  // is the same as £2,500 a year here.
  const lisa = projectLifetimeIsa({
    age: 25,
    contribution: 2000,
    frequency: 'yearly',
    growthPercent: 5,
    goal: 'home',
    purchaseAge: 35,
  })
  const r = pot({
    payment: 2500,
    paymentFrequency: 'yearly',
    ratePercent: 5,
    years: 10,
    compounding: 'yearly',
  })
  near(r.finalValue, lisa.value)
})

test('compound interest [own working] added monthly and yearly: 0% growth gives back what was paid in', () => {
  for (const compounding of ['monthly', 'yearly']) {
    const r = pot({ startAmount: 1000, payment: 100, ratePercent: 0, years: 10, compounding })
    near(r.finalValue, 13000, compounding)
    assert.equal(r.growth, 0)
    near(r.paidIn, 13000)
  }
})

// ---------------------------------------------------------------------------
// Charges
// ---------------------------------------------------------------------------

test('compound interest [own working] charges added yearly: a 5% charge on 3% growth shrinks the pot', () => {
  // £10,000 × (1.03 × 0.95) ^ 10 = £8,046.52.
  const r = pot({
    startAmount: 10000,
    ratePercent: 3,
    chargePercent: 5,
    years: 10,
    compounding: 'yearly',
  })
  near(r.finalValue, 8046.52)
  near(r.charges, 4679.26)
  near(r.growth, 2725.78)
  assert.ok(r.yearlyRateAfterCharges < 0)
})

test('compound interest [own working] charges added yearly: 1% a year on £10,000 at 5% for 25 years', () => {
  const without = pot({ startAmount: 10000, ratePercent: 5, years: 25, compounding: 'yearly' })
  const charged = pot({
    startAmount: 10000,
    ratePercent: 5,
    chargePercent: 1,
    years: 25,
    compounding: 'yearly',
  })
  near(without.finalValue, 33863.55)
  near(charged.finalValue, 26339.79)
  near(charged.charges, 4343.49)
  // The pot is £7,523.76 smaller, more than the charges themselves, because
  // money taken in charges no longer grows.
  near(without.finalValue - charged.finalValue, 7523.76)
})

test('compound interest [own working] charges added monthly: a twelfth of the charge each month', () => {
  // £1,000 at 6% with a 1.2% charge for one year: (1.005 × 0.999) ^ 12.
  const r = pot({ startAmount: 1000, ratePercent: 6, chargePercent: 1.2, years: 1 })
  near(r.finalValue, 1000 * (1.005 * 0.999) ** 12)
  near(r.yearlyRateAfterCharges, (1.005 * 0.999) ** 12 - 1)
})

test('compound interest [own working] charges added monthly and yearly: a charge of 100% empties the pot', () => {
  for (const compounding of ['monthly', 'yearly']) {
    const r = pot({ startAmount: 5000, ratePercent: 5, chargePercent: 100, years: 3, compounding })
    assert.ok(r.finalValue >= 0, compounding)
    assert.ok(r.finalValue < 5000, compounding)
  }
})

// ---------------------------------------------------------------------------
// Inflation
// ---------------------------------------------------------------------------

test("compound interest [own working] added yearly: £1,628.89 is £1,336.26 in today's money at 2% inflation", () => {
  const r = pot({
    startAmount: 1000,
    ratePercent: 5,
    years: 10,
    compounding: 'yearly',
    inflationPercent: 2,
  })
  // 1,628.89 / 1.02 ^ 10.
  near(r.realValue, 1336.26)
  near(r.rows[9].realValue, r.realValue)
  near(r.rows[0].realValue, 1050 / 1.02)
})

test("compound interest [own working] added monthly: no inflation leaves out today's money", () => {
  const r = pot({ startAmount: 1000, ratePercent: 5, years: 10 })
  assert.equal(r.realValue, null)
  assert.equal(r.rows[0].realValue, null)
  assert.equal(r.working.length, 2)
})

// ---------------------------------------------------------------------------
// A market fall
// ---------------------------------------------------------------------------

test('compound interest [own working] added yearly: a 20% fall at the start of year 1 on £10,000 at 5% for 20 years', () => {
  const r = pot({
    startAmount: 10000,
    ratePercent: 5,
    years: 20,
    compounding: 'yearly',
    fall: { percent: 20, year: 1 },
  })
  near(r.fall.valueBefore, 10000)
  near(r.fall.lost, 2000)
  near(r.fall.valueAfter, 8000)
  near(r.finalValue, 21226.38)
  near(r.fall.finalWithoutFall, 26532.98)
  // The gap is the £2,000 lost, grown at 5% for 20 years.
  near(r.fall.gap, 5306.6)
  near(r.fall.gap, 2000 * 1.05 ** 20)
})

test('compound interest [own working] added yearly: back to where it was after 5 years from growth alone', () => {
  // £8,000 needs 1.05 to the power 4.57 to get back to £10,000. Interest is
  // added at the end of each year, so the pot gets there at the end of year 5.
  const r = pot({
    startAmount: 10000,
    ratePercent: 5,
    years: 20,
    compounding: 'yearly',
    fall: { percent: 20, year: 1 },
  })
  assert.equal(r.fall.monthsToGetBack, 60)
  assert.equal(r.fall.monthsToGetBackGrowthOnly, 60)
})

test('compound interest [own working] added monthly: back to where it was after 54 months from growth alone', () => {
  // ln(1.25) / ln(1 + 0.05 / 12) is 53.7, so the 54th month.
  const r = pot({ startAmount: 10000, ratePercent: 5, years: 20, fall: { percent: 20, year: 1 } })
  assert.equal(r.fall.monthsToGetBackGrowthOnly, 54)
})

test('compound interest [own working] added monthly: payments after a fall get the pot back sooner, and are not hit by it', () => {
  const settings = { startAmount: 10000, payment: 100, ratePercent: 5, years: 20 }
  const r = pot({ ...settings, fall: { percent: 20, year: 3 } })
  const without = pot(settings)
  assert.ok(r.fall.monthsToGetBack < r.fall.monthsToGetBackGrowthOnly)
  // Only the money in the pot at the time is lost, grown at the same rate: a
  // twelfth of 5% a month for the 18 years from the start of year 3.
  near(r.fall.gap, r.fall.lost * (1 + 0.05 / 12) ** (18 * 12))
  near(r.fall.finalWithoutFall, without.finalValue)
  near(r.fall.valueBefore, without.rows[1].value)
})

test('compound interest [own working] added monthly and yearly: a 100% fall', () => {
  for (const compounding of ['monthly', 'yearly']) {
    const alone = pot({
      startAmount: 10000,
      ratePercent: 5,
      years: 20,
      compounding,
      fall: { percent: 100, year: 1 },
    })
    assert.equal(alone.finalValue, 0, compounding)
    assert.equal(alone.fall.monthsToGetBack, null, compounding)
    assert.equal(alone.fall.monthsToGetBackGrowthOnly, null, compounding)

    // With payments carrying on, they rebuild the pot. From growth alone it never comes back.
    const paying = pot({
      startAmount: 10000,
      payment: 200,
      ratePercent: 5,
      years: 20,
      compounding,
      fall: { percent: 100, year: 1 },
    })
    assert.ok(paying.fall.monthsToGetBack > 0, compounding)
    assert.equal(paying.fall.monthsToGetBackGrowthOnly, null, compounding)
  }
})

test('compound interest [own working] added monthly: a fall of 0%, a fall in the last year, and a fall outside the term', () => {
  const settings = { startAmount: 10000, payment: 50, ratePercent: 4, years: 10 }
  const none = pot(settings)
  const zero = pot({ ...settings, fall: { percent: 0, year: 4 } })
  near(zero.finalValue, none.finalValue)
  assert.equal(zero.fall.lost, 0)
  assert.equal(zero.fall.monthsToGetBack, null)

  const last = pot({ ...settings, fall: { percent: 30, year: 10 } })
  assert.ok(last.finalValue < none.finalValue)
  assert.equal(last.fall.monthsToGetBackGrowthOnly, null)

  const outside = pot({ ...settings, fall: { percent: 30, year: 11 } })
  assert.equal(outside.fall, null)
  near(outside.finalValue, none.finalValue)
})

test('compound interest [own working] added monthly and yearly: a fall when the pot is empty loses nothing', () => {
  for (const compounding of ['monthly', 'yearly']) {
    const r = pot({
      payment: 100,
      ratePercent: 5,
      years: 5,
      compounding,
      fall: { percent: 50, year: 1 },
    })
    assert.equal(r.fall.lost, 0)
    assert.equal(r.fall.monthsToGetBack, null)
    near(r.fall.gap, 0)
  }
})

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

test('compound interest [own working] added monthly and yearly: nothing in and nothing paid gives £0', () => {
  for (const compounding of ['monthly', 'yearly']) {
    const r = pot({ ratePercent: 5, years: 10, compounding })
    assert.equal(r.finalValue, 0)
    assert.equal(r.paymentsMade, 0)
  }
})

test('compound interest [own working] added monthly: blank, negative and impossible figures count as 0', () => {
  const r = pot({
    startAmount: -500,
    payment: NaN,
    ratePercent: -5,
    chargePercent: -1,
    inflationPercent: -2,
    years: 3,
  })
  assert.equal(r.finalValue, 0)
  assert.equal(r.realValue, null)
  assert.equal(pot({ startAmount: 1000, ratePercent: 5, years: -3 }).rows.length, 0)
  assert.equal(pot({ startAmount: 1000, ratePercent: 5, years: 2.7 }).years, 2)
})

test('compound interest [own working] added monthly and yearly: 100 years of £10 million at 20% stays a usable figure', () => {
  for (const compounding of ['monthly', 'yearly']) {
    const r = pot({
      startAmount: 10_000_000,
      payment: 10_000_000,
      paymentFrequency: 'yearly',
      ratePercent: 20,
      chargePercent: 10,
      inflationPercent: 20,
      years: 100,
      compounding,
      fall: { percent: 50, year: 50 },
    })
    assert.equal(r.rows.length, 100)
    for (const value of [r.finalValue, r.growth, r.charges, r.realValue, r.fall.gap]) {
      assert.ok(Number.isFinite(value) && value >= 0, `${compounding}: ${value}`)
    }
  }
})

// ---------------------------------------------------------------------------
// Every result against the closed-form formulas
// ---------------------------------------------------------------------------

// The pot from the textbook formulas, with no month-by-month loop. Payments
// come at the start of each period, as in the calculator.
function closedForm({ start, payment, paymentFrequency, rate, charge, years, compounding }) {
  const series = (factor, periods, each, grow) =>
    factor === 1 ? each * periods : (each * grow * (factor ** periods - 1)) / (factor - 1)
  if (compounding === 'monthly') {
    const month = (1 + rate / 12) * (1 - charge / 12)
    if (paymentFrequency === 'monthly') {
      return start * month ** (12 * years) + series(month, 12 * years, payment, month)
    }
    const year = month ** 12
    return start * year ** years + series(year, years, payment, year)
  }
  const year = (1 + rate) * (1 - charge)
  if (paymentFrequency === 'yearly') {
    return start * year ** years + series(year, years, payment, year)
  }
  // Monthly payments with yearly interest: the year's 12 payments earn
  // interest for 12, 11, ... 1 months, 78 months in all, before the charge.
  const yearOfPayments = (12 * payment + (payment * rate * 78) / 12) * (1 - charge)
  return start * year ** years + series(year, years, yearOfPayments, 1)
}

test('compound interest [own working] added monthly and yearly: every result matches the closed-form formulas', () => {
  for (const start of [0, 1000, 250000]) {
    for (const payment of [0, 50, 2000]) {
      for (const ratePercent of [0, 3.5, 8, 20]) {
        for (const chargePercent of [0, 0.75, 5]) {
          for (const years of [1, 7, 40]) {
            for (const paymentFrequency of ['monthly', 'yearly']) {
              for (const compounding of ['monthly', 'yearly']) {
                const r = pot({
                  startAmount: start,
                  payment,
                  paymentFrequency,
                  ratePercent,
                  chargePercent,
                  years,
                  compounding,
                })
                const expected = closedForm({
                  start,
                  payment,
                  paymentFrequency,
                  rate: ratePercent / 100,
                  charge: chargePercent / 100,
                  years,
                  compounding,
                })
                const where = `${start} ${payment} ${paymentFrequency} ${ratePercent}% ${chargePercent}% ${years}y ${compounding}`
                assert.ok(
                  Math.abs(r.finalValue - expected) <= Math.max(0.005, expected * 1e-10),
                  `${where}: got ${r.finalValue}, expected ${expected}`,
                )
                // What went in, plus growth, less charges, is the pot.
                near(r.paidIn + r.growth - r.charges, r.finalValue, where)
              }
            }
          }
        }
      }
    }
  }
})

test('compound interest [own working] added monthly and yearly: with a fall, the gap is the amount lost grown at the same rate', () => {
  for (const compounding of ['monthly', 'yearly']) {
    for (const year of [1, 4, 10]) {
      const r = pot({
        startAmount: 20000,
        payment: 150,
        ratePercent: 6,
        chargePercent: 0.5,
        years: 10,
        compounding,
        fall: { percent: 35, year },
      })
      const yearsLeft = 10 - year + 1
      const factor =
        compounding === 'monthly'
          ? ((1 + 0.06 / 12) * (1 - 0.005 / 12)) ** (12 * yearsLeft)
          : (1.06 * 0.995) ** yearsLeft
      near(r.fall.gap, r.fall.lost * factor, `${compounding} year ${year}`)
      near(
        r.paidIn + r.growth - r.charges - r.fall.lost,
        r.finalValue,
        `${compounding} year ${year}`,
      )
    }
  }
})
