// Tests for the First Time Buyer ISA projection used by the guides. Run with: npm test
//
// Each test name says where its expected values came from:
//   [own working] worked out by hand from the rules in HM Treasury's response to
//                 the consultation (28 October 2026), checked on 30 October 2026.
//                 The response has no worked examples to test against.
//
// https://assets.publishing.service.gov.uk/media/6ae0cc8216428df53760625c/First_Time_Buyer_ISA_Consultation_-_Government_Response.pdf

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { balanceForMostBonus, projectFirstTimeBuyerIsa } from './firstTimeBuyerIsa.js'
import { homeOverCapWithdrawal, projectLifetimeIsa } from './lifetimeIsa.js'
import { LIFETIME_ISA_REFORM } from './rates/isa.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const { yearlyLimit, bonusCap, propertyCap } = LIFETIME_ISA_REFORM.firstTimeBuyerIsa

test('First Time Buyer ISA [own working] a 25% bonus on the balance, with no growth', () => {
  // £200 a month for 5 years is £12,000, and 25% of that is £3,000.
  const result = projectFirstTimeBuyerIsa({ contribution: 200, years: 5 })
  assert.equal(result.paidIn, 12000)
  assert.equal(result.growth, 0)
  assert.equal(result.balance, 12000)
  assert.equal(result.bonus, 3000)
  assert.equal(result.value, 15000)
  assert.equal(result.bonusCapped, false)
})

test('First Time Buyer ISA [own working] the bonus counts growth', () => {
  // £4,000 at the start of each year for 2 years at 5%: 4,000 x 1.05 x 1.05 +
  // 4,000 x 1.05 = £8,610, so the bonus is £2,152.50.
  const result = projectFirstTimeBuyerIsa({
    contribution: 4000,
    frequency: 'yearly',
    growthPercent: 5,
    years: 2,
  })
  assert.equal(result.paidIn, 8000)
  near(result.balance, 8610)
  near(result.growth, 610)
  near(result.bonus, 2152.5)
  near(result.value, 10762.5)
})

test('First Time Buyer ISA [own working] up to £4,000 a tax year', () => {
  assert.equal(yearlyLimit, 4000)
  // £5,000 a year is cut to £4,000.
  assert.equal(
    projectFirstTimeBuyerIsa({ contribution: 5000, frequency: 'yearly', years: 1 }).paidIn,
    4000,
  )
  // £400 a month reaches £4,000 after 10 months and stops for the rest of the year.
  assert.equal(projectFirstTimeBuyerIsa({ contribution: 400, years: 2 }).paidIn, 8000)
  // £333.33 a month is just under.
  near(projectFirstTimeBuyerIsa({ contribution: 333.33, years: 1 }).paidIn, 3999.96)
  // A very large payment is still cut to the limit.
  assert.equal(projectFirstTimeBuyerIsa({ contribution: 1e12, years: 3 }).paidIn, 12000)
})

test('First Time Buyer ISA [own working] the bonus stops at £20,000', () => {
  assert.equal(bonusCap, 20000)
  assert.equal(balanceForMostBonus(), 80000)
  // £4,000 a year with no growth: £80,000 after 20 years gives exactly £20,000.
  const atCap = projectFirstTimeBuyerIsa({ contribution: 4000, frequency: 'yearly', years: 20 })
  assert.equal(atCap.balance, 80000)
  assert.equal(atCap.bonus, 20000)
  assert.equal(atCap.bonusCapped, false)
  // A year more is £84,000, and the bonus is still £20,000, not £21,000.
  const overCap = projectFirstTimeBuyerIsa({ contribution: 4000, frequency: 'yearly', years: 21 })
  assert.equal(overCap.balance, 84000)
  assert.equal(overCap.bonus, 20000)
  assert.equal(overCap.bonusCapped, true)
  assert.equal(overCap.value, 104000)
  // With 4% growth the balance first passes £80,000 after 15 years:
  // 4,000 x 1.04 x (1.04^15 - 1) / 0.04 = £83,298.12, and after 14 years £76,094.35.
  const grown = (years) =>
    projectFirstTimeBuyerIsa({ contribution: 4000, frequency: 'yearly', growthPercent: 4, years })
  near(grown(15).balance, (4000 * 1.04 * (1.04 ** 15 - 1)) / 0.04)
  near(grown(14).balance, (4000 * 1.04 * (1.04 ** 14 - 1)) / 0.04)
  assert.ok(grown(14).balance < 80000)
  assert.equal(grown(15).bonus, 20000)
  // Very high values never take the bonus over the cap.
  assert.equal(
    projectFirstTimeBuyerIsa({ contribution: 4000, growthPercent: 50, years: 40 }).bonus,
    20000,
  )
})

test('First Time Buyer ISA [own working] only for a home up to £450,000', () => {
  assert.equal(propertyCap, 450000)
  const settings = { contribution: 200, years: 5 }
  assert.equal(projectFirstTimeBuyerIsa(settings).bonus, 3000)
  assert.equal(projectFirstTimeBuyerIsa({ ...settings, homePrice: 450000 }).bonus, 3000)
  const over = projectFirstTimeBuyerIsa({ ...settings, homePrice: 450001 })
  assert.equal(over.withinPropertyCap, false)
  assert.equal(over.bonus, 0)
  // No withdrawal charge, so the balance is all there.
  assert.equal(over.value, 12000)
})

test('First Time Buyer ISA [own working] the account must be held for a year', () => {
  const none = projectFirstTimeBuyerIsa({ contribution: 200, years: 0 })
  assert.equal(none.heldLongEnough, false)
  assert.equal(none.paidIn, 0)
  assert.equal(none.bonus, 0)
  const oneYear = projectFirstTimeBuyerIsa({ contribution: 200, years: 1 })
  assert.equal(oneYear.heldLongEnough, true)
  assert.equal(oneYear.bonus, 600)
})

test('First Time Buyer ISA [own working] blank, negative and part years', () => {
  const blank = projectFirstTimeBuyerIsa({})
  assert.equal(blank.paidIn, 0)
  assert.equal(blank.value, 0)
  assert.equal(projectFirstTimeBuyerIsa({ contribution: -100, years: 3 }).paidIn, 0)
  assert.equal(projectFirstTimeBuyerIsa({ contribution: 100, years: -3 }).paidIn, 0)
  // Negative growth is treated as none, as in the Lifetime ISA calculator.
  assert.equal(
    projectFirstTimeBuyerIsa({ contribution: 100, years: 1, growthPercent: -5 }).balance,
    1200,
  )
  // Whole years only: 2.7 years is 2.
  assert.equal(projectFirstTimeBuyerIsa({ contribution: 100, years: 2.7 }).paidIn, 2400)
  assert.equal(projectFirstTimeBuyerIsa({ contribution: Number.NaN, years: 2 }).paidIn, 0)
})

test('First Time Buyer ISA [own working] matches a Lifetime ISA for the same payments, under the cap', () => {
  // 25% added to each payment and then grown is the same as 25% of what the
  // payments grow to, so for a home within the cap the two come to the same
  // until the £20,000 cap is reached. For a home over the cap, the Lifetime
  // ISA's 20% charge leaves what the payments grew to, which is the First Time
  // Buyer ISA's balance with no bonus.
  for (const contribution of [0, 50, 250, 333.33, 400, 1000, 4000]) {
    for (const frequency of ['monthly', 'yearly']) {
      for (const growthPercent of [0, 2.5, 4, 8]) {
        for (const years of [1, 2, 6, 10]) {
          const settings = { contribution, frequency, growthPercent }
          const lisa = projectLifetimeIsa({
            ...settings,
            age: 30,
            goal: 'home',
            purchaseAge: 30 + years,
          })
          const ftb = projectFirstTimeBuyerIsa({ ...settings, years })
          const label = `${contribution} ${frequency} ${growthPercent}% ${years} years`
          assert.equal(ftb.paidIn, lisa.paidIn, label)
          if (!ftb.bonusCapped) near(ftb.value, lisa.value, label)
          const overCap = homeOverCapWithdrawal({ value: lisa.value, putIn: lisa.withdrawal.putIn })
          const ftbOverCap = projectFirstTimeBuyerIsa({ ...settings, years, homePrice: 450001 })
          near(ftbOverCap.value, overCap.afterCharge, label)
        }
      }
    }
  }
})

test('First Time Buyer ISA [own working] the guide example: £250 a month for 6 years at 4%', () => {
  const settings = { contribution: 250, growthPercent: 4 }
  const lisa = projectLifetimeIsa({ ...settings, age: 30, goal: 'home', purchaseAge: 36 })
  const ftb = projectFirstTimeBuyerIsa({ ...settings, years: 6 })
  assert.equal(lisa.paidIn, 18000)
  assert.equal(lisa.bonus, 4500)
  assert.equal(ftb.paidIn, 18000)
  // 25% of the balance is more than the Lifetime ISA's bonus, because it
  // includes 25% of the growth. The Lifetime ISA's own growth includes the
  // growth on its bonus, so the totals match.
  near(ftb.bonus, ftb.balance * 0.25)
  assert.ok(ftb.bonus > lisa.bonus)
  near(ftb.value, lisa.value)
  assert.equal(Math.round(lisa.value), 25409)
  assert.equal(Math.round(ftb.balance), 20327)
})
