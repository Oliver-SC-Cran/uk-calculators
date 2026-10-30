// Tests for the savings interest tax calculator (savingsTax.js). Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example on gov.uk, checked on 30 October 2026
//   [own working] worked out by hand from the published rules
//
// https://www.gov.uk/apply-tax-free-interest-on-savings/how-much-is-tax-free
// https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances
// https://www.gov.uk/government/publications/self-assessment-tax-calculation-summary-sa110
//   (Tax calculation summary notes 2026, boxes A133b to A138 and section 3a)

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateSavingsTax, interestFrom, taxSavedInIsa } from './savingsTax.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const now = (otherIncome, interest, scottish = false) =>
  calculateSavingsTax({ otherIncome, interest, scottish, taxYear: '2026/27' })
const next = (otherIncome, interest, scottish = false) =>
  calculateSavingsTax({ otherIncome, interest, scottish, taxYear: '2027/28' })

test('savings tax [gov.uk] £16,000 of wages and £200 of interest', () => {
  // gov.uk: £3,430 of wages over the Personal Allowance leaves £1,570 of the
  // starting rate for savings, so the £200 is not taxed.
  const r = now(16000, 200)
  assert.equal(r.startingRateBand, 1570)
  assert.equal(r.coveredByStartingRate, 200)
  near(r.total, 0)
})

test('savings tax [gov.uk] £1,300 of interest for a basic rate taxpayer', () => {
  // gov.uk: the first £1,000 is not taxed and £300 is taxed at 20%, £60.
  // £30,000 of other income makes them a basic rate taxpayer with no starting rate left.
  const r = now(30000, 1300)
  assert.equal(r.personalSavingsAllowance, 1000)
  assert.equal(r.coveredByPsa, 1000)
  near(r.total, 60)
})

test('savings tax [own working] the gov.uk examples from 6 April 2027', () => {
  near(next(16000, 200).total, 0)
  near(next(30000, 1300).total, 72) // £300 at 24%
})

test('savings tax [own working] the starting rate for savings at each boundary', () => {
  // Other income used up by the Personal Allowance: £5,000 starting rate and
  // £1,000 allowance cover £6,000. £1 more is taxed.
  near(now(12570, 6000).total, 0)
  near(now(12570, 6001).total, 0.2)
  near(next(12570, 6001).total, 0.24)
  // At £17,570 there is no starting rate left. The £1,000 allowance covers £1,000.
  assert.equal(now(17570, 1000).startingRateBand, 0)
  near(now(17570, 1000).total, 0)
  near(now(17570, 1500).total, 100)
  near(next(17570, 1500).total, 120)
  // £1 under it, £1 of starting rate is left.
  assert.equal(now(17569, 1001).coveredByStartingRate, 1)
  near(now(17569, 1001).total, 0)
  // No other income: the Personal Allowance, the starting rate and the
  // allowance cover £18,570. £20,000 leaves £1,430 at 20%.
  near(now(0, 18570).total, 0)
  near(now(0, 20000).total, 286)
  near(next(0, 20000).total, 343.2)
})

test('savings tax [own working] interest that takes someone into the higher rate band', () => {
  // £49,270 of other income and £1,000 of interest is £37,700 taxable: still basic rate.
  const atLimit = now(49270, 1000)
  assert.equal(atLimit.personalSavingsAllowance, 1000)
  near(atLimit.total, 0)
  // £1 more and the allowance halves: £500 at 20% and £1 at 40%.
  const over = now(49270, 1001)
  assert.equal(over.psaBand, 'higher')
  near(over.total, 100.4)
  near(next(49270, 1001).total, 120.44)
  // £50,270 of other income: £500 allowance, £500 at the higher rate.
  near(now(50270, 1000).total, 200)
  near(next(50270, 1000).total, 220)
})

test('savings tax [own working] the Personal Allowance taper', () => {
  // £100,000 and £2,000 of interest: £1,000 of allowance is lost, taxed at 40%
  // on other income (£400), and £1,500 of interest at 40% (£600).
  const r = now(100000, 2000)
  assert.equal(r.personalAllowance, 11570)
  near(r.taxFromLostAllowance, 400)
  near(r.taxOnInterest, 600)
  near(r.total, 1000)
  near(next(100000, 2000).total, 1060)
  // £124,140 and £1,000: the last £500 of allowance goes, and taxable income
  // is exactly £125,140, so the £500 allowance still applies.
  const edge = now(124140, 1000)
  assert.equal(edge.personalAllowance, 0)
  assert.equal(edge.personalSavingsAllowance, 500)
  near(edge.total, 400)
  near(next(124140, 1000).total, 420)
  // £125,140 has no allowance with or without the interest, and no Personal
  // Savings Allowance: all £1,000 is taxed at the additional rate.
  const top = now(125140, 1000)
  assert.equal(top.personalSavingsAllowance, 0)
  near(top.taxFromLostAllowance, 0)
  near(top.total, 450)
  near(next(125140, 1000).total, 490)
})

test('savings tax [own working] Scottish taxpayers use the UK bands for savings', () => {
  // £45,000 is in the Scottish higher rate band for earnings, but taxable
  // income of £33,430 is under the UK basic rate band, so the allowance is
  // £1,000 (SA110 notes 2026, box A133b uses the UK £37,700).
  const r = now(45000, 1000, true)
  assert.equal(r.personalSavingsAllowance, 1000)
  near(r.total, 0)
  near(now(45000, 2000, true).total, 200)
  near(next(45000, 2000, true).total, 240)
  // Under £100,000 Scottish rates make no difference.
  for (const [other, interest] of [
    [16000, 200],
    [30000, 1300],
    [49270, 1001],
    [80000, 5000],
  ]) {
    near(now(other, interest, true).total, now(other, interest).total)
    near(next(other, interest, true).total, next(other, interest).total)
  }
  // Over £100,000 the lost allowance is taxed at the Scottish advanced rate, 45%.
  const taper = now(100000, 2000, true)
  near(taper.taxFromLostAllowance, 450)
  near(taper.total, 1050)
  // There are no Scottish rates for 2027/28 yet, so that part uses 2026/27's.
  const later = next(100000, 2000, true)
  assert.equal(later.otherIncomeRatesYear, '2026/27')
  near(later.total, 1110)
  assert.equal(next(100000, 2000).otherIncomeRatesYear, '2027/28')
})

test('savings tax [own working] zero, blank, negative and very large figures', () => {
  near(now(0, 0).total, 0)
  near(now(30000, 0).total, 0)
  near(now(NaN, NaN).total, 0)
  near(now(-5000, -100).total, 0)
  // £1,000,000 of interest and nothing else: £5,000 at 0%, £32,700 at 20%,
  // £87,440 at 40% and £874,860 at 45%. No Personal Allowance, no allowance.
  const huge = now(0, 1000000)
  assert.equal(huge.coveredByStartingRate, 5000)
  near(huge.total, 435203)
  near(next(0, 1000000).total, 475003)
})

test('savings tax [own working] interest from a balance and a rate', () => {
  near(interestFrom({ balance: 30000, ratePercent: 4 }), 1200)
  near(interestFrom({ balance: 25025, ratePercent: 4 }), 1001)
  near(interestFrom({ balance: -1, ratePercent: 4 }), 0)
  near(interestFrom({ balance: 30000, ratePercent: NaN }), 0)
})

test('savings tax [own working] what an ISA would save', () => {
  // £50,000 of other income leaves £270 of the basic rate band. £1,600 of
  // interest takes taxable income to £39,030, so the allowance is £500. It
  // covers the lowest £500 of the interest, and the other £1,100 is all above
  // the basic rate band: £440 at 40%.
  const settings = { otherIncome: 50000, interest: 1600, taxYear: '2026/27' }
  near(calculateSavingsTax(settings).total, 440)
  // With £800 of the interest in an ISA, £300 is taxed at 40%: £120. The ISA saves £320.
  near(taxSavedInIsa({ ...settings, moved: 800 }), 320)
  // Moving more than the interest saves all the tax, and moving none saves nothing.
  near(taxSavedInIsa({ ...settings, moved: 5000 }), 440)
  near(taxSavedInIsa({ ...settings, moved: 0 }), 0)
})

test('savings tax [own working] every result matches a whole income tax bill with and without the interest', () => {
  // A separate calculation of the whole bill, written from gov.uk's figures
  // rather than the rates file: the Personal Allowance against other income
  // first, other income in its own bands, then interest through the starting
  // rate, the Personal Savings Allowance and the savings bands. The tax on the
  // interest is the bill with it less the bill without it.
  const years = {
    '2026/27': [0.2, 0.4, 0.45],
    '2027/28': [0.24, 0.44, 0.49],
  }
  const scottishBands = [
    [3967, 0.19],
    [16956, 0.2],
    [31092, 0.21],
    [62430, 0.42],
    [125140, 0.45],
    [Infinity, 0.48],
  ]
  const ukBands = [
    [37700, 0.2],
    [125140, 0.4],
    [Infinity, 0.45],
  ]
  function bill(other, interest, savingsRates, scottish) {
    const income = other + interest
    const pa = income <= 100000 ? 12570 : Math.max(0, 12570 - Math.floor((income - 100000) / 2))
    const taxableOther = Math.max(0, other - pa)
    const savingsTaxable = interest - Math.min(interest, Math.max(0, pa - other))
    let tax = 0
    let from = 0
    for (const [upTo, rate] of scottish ? scottishBands : ukBands) {
      tax += Math.max(0, Math.min(taxableOther, upTo) - from) * rate
      from = upTo
    }
    const taxable = taxableOther + savingsTaxable
    const psa = taxable > 125140 ? 0 : taxable > 37700 ? 500 : 1000
    const zeroRated = Math.min(savingsTaxable, Math.max(0, 5000 - taxableOther)) // starting rate
    const free = Math.min(savingsTaxable, zeroRated + psa)
    let position = taxableOther + free
    let left = savingsTaxable - free
    const limits = [37700, 125140, Infinity]
    for (let band = 0; band < 3; band += 1) {
      const on = Math.max(0, Math.min(left, limits[band] - position))
      tax += on * savingsRates[band]
      position += on
      left -= on
    }
    return tax
  }
  let checked = 0
  for (const [year, savingsRates] of Object.entries(years)) {
    for (const scottish of [false, true]) {
      for (const other of [
        0, 5000, 12570, 16000, 17570, 30000, 45000, 49270, 50270, 99000, 100000, 110000, 124140,
        125140, 200000,
      ]) {
        for (const interest of [0, 1, 200, 500, 999, 1000, 1001, 1600, 5000, 6000, 20000, 150000]) {
          const expected =
            bill(other, interest, savingsRates, scottish) - bill(other, 0, savingsRates, scottish)
          const r = calculateSavingsTax({ otherIncome: other, interest, scottish, taxYear: year })
          near(
            r.total,
            expected,
            `${year} ${scottish ? 'Scotland' : 'rest of UK'} ${other} + ${interest}:`,
          )
          checked += 1
        }
      }
    }
  }
  assert.equal(checked, 720)
})
