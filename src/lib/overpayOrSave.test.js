// Tests for the sums in the "Should I overpay my mortgage or save?" guide.
// Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example or published rule on gov.uk, checked on 20 October 2026,
//                 and the rates from April 2027 checked on 29 October 2026
//   [own working] worked out by hand from the published rules
//
// https://www.gov.uk/apply-tax-free-interest-on-savings
// https://www.gov.uk/individual-savings-accounts/how-isas-work
// https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  interestSavedByOverpaying,
  rateBeforeTaxToMatch,
  savingsInterestAfterTax,
  TAX_BANDS,
  TAX_BANDS_AFTER_RISE,
} from './overpayOrSave.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const save = (settings) => savingsInterestAfterTax({ ratePercent: 4, ...settings })

test('overpay or save [gov.uk] the Personal Savings Allowance example', () => {
  // "HMRC estimates you earned £1,300 in savings interest ... Your Personal Savings
  // Allowance is £1,000 because you're a basic rate taxpayer ... first £1,000 is not
  // taxed, remaining £300 is taxed at 20% (basic rate), tax due on your savings
  // interest is £60". £32,500 at 4% is £1,300 of interest.
  const result = save({ amount: 32500, band: 'basic' })
  near(result.interest, 1300)
  near(result.allowanceUsed, 1000)
  near(result.taxable, 300)
  near(result.tax, 60)
})

test('overpay or save [gov.uk] the allowance for each band, and cash ISAs', () => {
  // "Basic rate £1,000, Higher rate £500, Additional rate £0." £25,000 at 4% is £1,000.
  near(save({ amount: 25000, band: 'basic' }).tax, 0)
  near(save({ amount: 25000, band: 'higher' }).tax, 200) // £500 at 40%
  near(save({ amount: 25000, band: 'additional' }).tax, 450) // £1,000 at 45%
  // "You do not pay tax on: interest on cash in an ISA"
  const isa = save({ amount: 25000, band: 'additional', isa: true })
  near(isa.tax, 0)
  near(isa.afterTax, 1000)
})

test('overpay or save [own working] interest saved matches the loan formula', () => {
  // A lump sum L off a mortgage at a monthly rate r leaves the balance lower by
  // L x (1 + r)^months, so the interest saved is L x ((1 + r)^months - 1).
  for (const ratePercent of [2, 4.5, 6.25]) {
    const r = ratePercent / 100 / 12
    for (const years of [1, 3, 5]) {
      for (const lumpSum of [1000, 20000]) {
        near(
          interestSavedByOverpaying({
            balance: 200000,
            annualRatePercent: ratePercent,
            remainingYears: 25,
            lumpSum,
            years,
          }),
          lumpSum * ((1 + r) ** (12 * years) - 1),
          `${lumpSum} at ${ratePercent}% for ${years} years:`,
        )
      }
    }
  }
})

test('overpay or save [own working] other interest uses the allowance first', () => {
  // £20,000 at 4% is £800. With £1,000 of interest elsewhere, a basic rate
  // taxpayer pays 20% on all £800.
  const result = save({ amount: 20000, band: 'basic', otherInterest: 1000 })
  near(result.tax, 160)
  near(result.afterTax, 640)
  // £700 elsewhere leaves £300 of allowance: £500 taxed, £100 of tax.
  near(save({ amount: 20000, band: 'basic', otherInterest: 700 }).tax, 100)
})

test('overpay or save [own working] the rate needed to match a mortgage', () => {
  near(rateBeforeTaxToMatch(4, 'basic'), 5) // 5% less 20% is 4%
  near(rateBeforeTaxToMatch(4.5, 'basic'), 5.625)
  near(rateBeforeTaxToMatch(4.5, 'higher'), 7.5)
  near(rateBeforeTaxToMatch(4.5, 'additional'), 4.5 / 0.55)
})

test('overpay or save [own working] the worked examples in the guide', () => {
  const mortgage = { balance: 200000, remainingYears: 25, lumpSum: 20000 }
  // £20,000 off a 4.5% mortgage saves £918.80 in the first year, and £403.69 at 2%.
  near(interestSavedByOverpaying({ ...mortgage, annualRatePercent: 4.5 }), 918.8)
  near(interestSavedByOverpaying({ ...mortgage, annualRatePercent: 2 }), 403.69)
  // £20,000 at 4%: £800, no tax for a basic rate taxpayer, £120 for higher rate.
  near(save({ amount: 20000, band: 'basic' }).afterTax, 800)
  near(save({ amount: 20000, band: 'higher' }).tax, 120)
  near(save({ amount: 20000, band: 'higher' }).afterTax, 680)
  near(save({ amount: 20000, band: 'higher', isa: true }).afterTax, 800)
})

test('overpay or save [gov.uk] savings tax rates from 6 April 2027', () => {
  // Budget 2026 overview of tax legislation and rates, Annex A, "Savings rates":
  // savings basic rate 20% in 2026 to 2027 and 24% in 2027 to 2028, higher rate
  // 40% and 44%, additional rate 45% and 49%. The Personal Savings Allowance is
  // £1,000 and £500 in both years.
  assert.deepEqual(TAX_BANDS, { basic: 0.2, higher: 0.4, additional: 0.45 })
  assert.deepEqual(TAX_BANDS_AFTER_RISE, { basic: 0.24, higher: 0.44, additional: 0.49 })
  // The allowances do not change, so interest inside them is still not taxed.
  near(save({ amount: 25000, band: 'basic', afterRise: true }).tax, 0) // £1,000 of interest
  near(save({ amount: 12500, band: 'higher', afterRise: true }).tax, 0) // £500
})

test('overpay or save [own working] tax after the rise at each boundary', () => {
  const after = (settings) => save({ ...settings, afterRise: true })
  // gov.uk's £1,300 example with the new rate: £300 over the allowance at 24%.
  near(after({ amount: 32500, band: 'basic' }).tax, 72)
  // £1,000 of interest: none taxed at basic rate, £500 at 44%, all at 49%.
  near(after({ amount: 25000, band: 'basic' }).tax, 0)
  near(after({ amount: 25000, band: 'higher' }).tax, 220)
  near(after({ amount: 25000, band: 'additional' }).tax, 490)
  // £1 of interest over the basic rate allowance: £25,025 at 4% is £1,001.
  near(after({ amount: 25025, band: 'basic' }).tax, 0.24)
  // Nothing to tax, and a cash ISA.
  near(after({ amount: 0, band: 'additional' }).tax, 0)
  near(after({ amount: -500, band: 'higher' }).tax, 0)
  near(after({ amount: 25000, band: 'additional', isa: true }).tax, 0)
  // £1,000,000 at 4% is £40,000, all taxed at 49% for an additional rate taxpayer.
  near(after({ amount: 1000000, band: 'additional' }).tax, 19600)
  // Left off, the rise changes nothing.
  near(save({ amount: 25000, band: 'additional', afterRise: false }).tax, 450)
})

test('overpay or save [own working] the worked examples in the guide after the rise', () => {
  const after = (settings) => save({ amount: 20000, ...settings, afterRise: true })
  // £20,000 at 4% is £800. With the allowance used up elsewhere, a basic rate
  // taxpayer pays 24%: £192, keeping £608.
  near(after({ band: 'basic', otherInterest: 1000 }).tax, 192)
  near(after({ band: 'basic', otherInterest: 1000 }).afterTax, 608)
  near(after({ band: 'basic' }).afterTax, 800)
  // A higher rate taxpayer pays 44% on the £300 over the £500 allowance: £132.
  near(after({ band: 'higher' }).tax, 132)
  near(after({ band: 'higher' }).afterTax, 668)
  // To match a 4.5% mortgage on interest above the allowance.
  near(rateBeforeTaxToMatch(4.5, 'basic', { afterRise: true }), 4.5 / 0.76)
  near(rateBeforeTaxToMatch(4.5, 'higher', { afterRise: true }), 4.5 / 0.56)
  near(rateBeforeTaxToMatch(4.5, 'additional', { afterRise: true }), 4.5 / 0.51)
})

test('overpay or save [own working] odd inputs', () => {
  assert.equal(save({ amount: NaN, band: 'basic' }).interest, 0)
  assert.equal(save({ amount: -500, band: 'higher' }).tax, 0)
  assert.equal(
    interestSavedByOverpaying({ balance: 0, annualRatePercent: 4, remainingYears: 25, lumpSum: 1 }),
    0,
  )
  // A lump sum bigger than the mortgage only saves interest on what was owed.
  const all = interestSavedByOverpaying({
    balance: 10000,
    annualRatePercent: 6,
    remainingYears: 1,
    lumpSum: 50000,
  })
  assert.ok(all > 0 && all < 10000 * 0.07)
})
