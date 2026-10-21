// Tests for the Lifetime ISA calculator. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example or published rule on gov.uk, checked on 20 October 2026
//   [own working] worked out by hand from the published rules
//
// https://www.gov.uk/lifetime-isa

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contributionAs, projectLifetimeIsa, withdrawalFor } from './lifetimeIsa.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const lisa = (settings) =>
  projectLifetimeIsa({ age: 30, goal: 'home', purchaseAge: 35, ...settings })

test('Lifetime ISA [gov.uk] the withdrawal charge examples', () => {
  // "Assuming no growth, initial savings of £800 will earn a 25% government bonus
  // of £200 and give you a pot of £1,000. If you wish to withdraw the entire pot,
  // a 25% charge will apply to the full £1,000. You'll have to pay a government
  // withdrawal charge of £250. This will leave you with £750."
  const result = lisa({ contribution: 800, frequency: 'yearly', purchaseAge: 31 })
  assert.equal(result.paidIn, 800)
  assert.equal(result.bonus, 200)
  assert.equal(result.value, 1000)
  assert.equal(result.withdrawal.charge, 250)
  assert.equal(result.withdrawal.afterCharge, 750)
  assert.equal(result.withdrawal.shortfall, 50) // £50 less than the £800 put in
  // "Withdrawing £160 means you pay a 25% withdrawal charge of £40 and receive
  // £120 in cash to meet the bill."
  assert.equal(withdrawalFor(120), 160)
  assert.equal(withdrawalFor(120) - 120, 40)
})

test('Lifetime ISA [gov.uk] up to £4,000 a year, with a bonus of up to £1,000', () => {
  // "You can put in up to £4,000 each year" and "The government will add a 25%
  // bonus to your savings, up to a maximum of £1,000 per year."
  const full = lisa({ contribution: 4000, frequency: 'yearly', purchaseAge: 31 })
  assert.equal(full.paidIn, 4000)
  assert.equal(full.bonus, 1000)
  assert.equal(full.overLimit, false)
  // £5,000 a year is cut to £4,000, and the bonus stays at £1,000.
  const over = lisa({ contribution: 5000, frequency: 'yearly', purchaseAge: 31 })
  assert.equal(over.paidIn, 4000)
  assert.equal(over.bonus, 1000)
  assert.equal(over.overLimit, true)
  // £400 a month reaches £4,000 after 10 months and stops for the rest of the year.
  const monthly = lisa({ contribution: 400, purchaseAge: 32 })
  assert.equal(monthly.paidIn, 8000)
  assert.equal(monthly.overLimit, true)
  // £333.33 a month is just under.
  near(lisa({ contribution: 333.33, purchaseAge: 31 }).paidIn, 3999.96)
  assert.equal(lisa({ contribution: 333.33, purchaseAge: 31 }).overLimit, false)
})

test('Lifetime ISA [gov.uk] who can open one, and payments stopping at 50', () => {
  // "You must be 18 or over but under 40 to open a Lifetime ISA."
  assert.equal(lisa({ age: 17, contribution: 100, purchaseAge: 25 }).tooYoung, true)
  assert.equal(lisa({ age: 17, contribution: 100, purchaseAge: 25 }).paidIn, 0)
  assert.equal(lisa({ age: 18, contribution: 100, purchaseAge: 19 }).paidIn, 1200)
  assert.equal(lisa({ age: 39, contribution: 100, purchaseAge: 40 }).paidIn, 1200)
  const forty = lisa({ age: 40, contribution: 100, purchaseAge: 45 })
  assert.equal(forty.tooOldToOpen, true)
  assert.equal(forty.paidIn, 0)
  // Someone who already has one can keep paying in after 40.
  const existing = lisa({ age: 40, currentBalance: 5000, contribution: 100, purchaseAge: 41 })
  assert.equal(existing.tooOldToOpen, false)
  assert.equal(existing.paidIn, 1200)
  // "You can put in up to £4,000 each year, until you're 50." At 45 that is 5
  // more years, and with no growth the pot at 60 is what went in plus the bonus.
  const fromFortyFive = projectLifetimeIsa({
    age: 45,
    currentBalance: 1000,
    contribution: 4000,
    frequency: 'yearly',
    goal: 'retirement',
  })
  assert.equal(fromFortyFive.years, 15)
  assert.equal(fromFortyFive.payingYears, 5)
  assert.equal(fromFortyFive.lastPayingAge, 50)
  assert.equal(fromFortyFive.paidIn, 20000)
  assert.equal(fromFortyFive.bonus, 5000)
  assert.equal(fromFortyFive.value, 26000)
  // "When you turn 50, you will not be able to pay into your Lifetime ISA or earn
  // the 25% bonus. Your account will stay open and your savings will still earn
  // interest or investment returns."
  const fifty = projectLifetimeIsa({
    age: 50,
    currentBalance: 10000,
    contribution: 100,
    growthPercent: 4,
    goal: 'retirement',
  })
  assert.equal(fifty.pastPayingAge, true)
  assert.equal(fifty.paidIn, 0)
  assert.equal(fifty.bonus, 0)
  near(fifty.value, 10000 * 1.04 ** 10)
})

test('Lifetime ISA [own working] growth matches the savings formulas', () => {
  // £4,000 at the start of each year from 25 to 50, with the £1,000 bonus, at 4%:
  // 5,000 x ((1.04^25 - 1) / 0.04) x 1.04 at 50, then 10 more years of growth.
  const yearly = projectLifetimeIsa({
    age: 25,
    contribution: 4000,
    frequency: 'yearly',
    growthPercent: 4,
    goal: 'retirement',
  })
  const atFifty = 5000 * ((1.04 ** 25 - 1) / 0.04) * 1.04
  near(yearly.value, atFifty * 1.04 ** 10)
  assert.equal(yearly.paidIn, 100000)
  assert.equal(yearly.bonus, 25000)
  near(yearly.growth, yearly.value - 125000)
  // £200 at the start of each month for 5 years at 4% a year. The monthly rate i
  // is 1.04^(1/12) - 1, and each £200 becomes £250 with the bonus:
  // 250 x ((1 + i)^60 - 1) / i x (1 + i).
  const monthly = lisa({ contribution: 200, growthPercent: 4 })
  const i = 1.04 ** (1 / 12) - 1
  near(monthly.value, ((250 * ((1 + i) ** 60 - 1)) / i) * (1 + i))
  assert.equal(monthly.paidIn, 12000)
  assert.equal(monthly.bonus, 3000)
  // Money already in grows on its own: £10,000 for 5 years at 4%.
  near(lisa({ currentBalance: 10000 }).value, 10000)
  near(lisa({ currentBalance: 10000, growthPercent: 4 }).value, 10000 * 1.04 ** 5)
})

test('Lifetime ISA [own working] the withdrawal charge', () => {
  // With no growth and nothing in the account to start with, taking it all out
  // always leaves 6.25% less than was put in: 1.25 x 0.75 = 0.9375.
  for (const contribution of [50, 200, 333]) {
    const result = lisa({ contribution })
    near(result.withdrawal.shortfall / result.withdrawal.putIn, 0.0625)
  }
  // With 4% growth over 5 years, £200 a month is worth £16,598.92, so taking it
  // out leaves £12,449.19: £449.19 more than the £12,000 put in.
  const grown = lisa({ contribution: 200, growthPercent: 4 })
  near(grown.value, 16598.92)
  near(grown.withdrawal.charge, 4149.73)
  near(grown.withdrawal.afterCharge, 12449.19)
  near(grown.withdrawal.shortfall, -449.19)
  // Money already in the account counts as put in.
  assert.equal(lisa({ currentBalance: 2000, contribution: 0 }).withdrawal.putIn, 2000)
})

test('Lifetime ISA [own working] the goal sets when payments and growth stop', () => {
  // A home at 35: 5 years of payments and growth.
  const home = lisa({ contribution: 200 })
  assert.equal(home.goalAge, 35)
  assert.equal(home.years, 5)
  assert.equal(home.payingYears, 5)
  // A home at 55, from 45 with an account already open: payments stop at 50,
  // growth carries on to 55.
  const late = lisa({ age: 45, currentBalance: 1000, contribution: 100, purchaseAge: 55 })
  assert.equal(late.payingYears, 5)
  assert.equal(late.years, 10)
  // Retirement always means 60.
  const retire = projectLifetimeIsa({ age: 30, contribution: 100, goal: 'retirement' })
  assert.equal(retire.goalAge, 60)
  assert.equal(retire.years, 30)
  assert.equal(retire.payingYears, 20)
})

test('Lifetime ISA [own working] odd inputs', () => {
  // A purchase age that is not in the future: nothing happens.
  const now = lisa({ contribution: 200, purchaseAge: 30 })
  assert.equal(now.years, 0)
  assert.equal(now.paidIn, 0)
  assert.equal(lisa({ contribution: 200, purchaseAge: 20 }).years, 0)
  // Blank or negative amounts count as zero.
  const blank = lisa({ contribution: NaN, currentBalance: -500, growthPercent: -3 })
  assert.equal(blank.value, 0)
  assert.equal(blank.paidIn, 0)
  // Age 60 or over has already reached the retirement goal.
  assert.equal(projectLifetimeIsa({ age: 61, goal: 'retirement' }).years, 0)
  // Very high growth still gives finite numbers.
  assert.ok(Number.isFinite(lisa({ contribution: 200, growthPercent: 100 }).value))
})

test('Lifetime ISA [own working] the worked examples in the guide', () => {
  const pounds = (settings) => {
    const result = projectLifetimeIsa(settings)
    return [result.paidIn, result.bonus, result.growth, result.value].map(Math.round)
  }
  // £200 a month from 30, buying at 35, with 4% growth and with none.
  const home = { age: 30, contribution: 200, goal: 'home', purchaseAge: 35 }
  assert.deepEqual(pounds({ ...home, growthPercent: 4 }), [12000, 3000, 1599, 16599])
  assert.deepEqual(pounds({ ...home, growthPercent: 0 }), [12000, 3000, 0, 15000])
  // £4,000 a year from 25, kept until 60, with 4% growth and with none.
  const later = { age: 25, contribution: 4000, frequency: 'yearly', goal: 'retirement' }
  assert.deepEqual(pounds({ ...later, growthPercent: 4 }), [100000, 25000, 195560, 320560])
  assert.deepEqual(pounds({ ...later, growthPercent: 0 }), [100000, 25000, 0, 125000])
})

test('Lifetime ISA [own working] switching between monthly and yearly keeps the same amount', () => {
  assert.equal(contributionAs('yearly', 200), 2400)
  assert.equal(contributionAs('monthly', 2400), 200)
  // £4,000 a year is £333.33 a month, to the penny.
  assert.equal(contributionAs('monthly', 4000), 333.33)
  assert.equal(contributionAs('yearly', 333.34), 4000.08)
})
