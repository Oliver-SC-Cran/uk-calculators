// Tests for the stamp duty calculator. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example or published rule on gov.uk, checked on 9 October 2026
//   [own working] worked out by hand from the published rates
//
// https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
// https://www.gov.uk/guidance/stamp-duty-land-tax-buying-an-additional-residential-property
// https://www.gov.uk/guidance/rates-of-stamp-duty-land-tax-for-non-uk-residents

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateStampDuty } from './calculations.js'

const duty = (price, buyerType = 'homeMover', nonResident = false) =>
  calculateStampDuty({ price, buyerType, nonResident })

test('stamp duty [gov.uk] the published worked examples', () => {
  // "In April 2025 you buy a house for £295,000 ... 0% on the first £125,000 = £0,
  // 2% on the second £125,000 = £2,500, 5% on the final £45,000 = £2,250, total SDLT = £4,750"
  const mover = duty(295000)
  assert.equal(mover.tax, 4750)
  assert.deepEqual(
    mover.breakdown.map((band) => band.tax),
    [0, 2500, 2250],
  )
  // "You are a first-time buyer and purchase a property for £500,000 ... 0% on the first
  // £300,000 = £0, 5% on the remaining £200,000 = £10,000, total SDLT = £10,000"
  const firstTime = duty(500000, 'firstTimeBuyer')
  assert.equal(firstTime.tax, 10000)
  assert.deepEqual(
    firstTime.breakdown.map((band) => band.tax),
    [0, 10000],
  )
  // "you buy an additional residential property for £300,000 ... 5% on the first £125,000 =
  // £6,250, 7% above £125,000 and up to £250,000 = £8,750, 10% on the final £50,000 = £5,000,
  // Total SDLT = £20,000"
  const additional = duty(300000, 'additional')
  assert.equal(additional.tax, 20000)
  assert.deepEqual(
    additional.breakdown.map((band) => band.tax),
    [6250, 8750, 5000],
  )
  // Non-UK resident buying for £700,000: "2% up to £125,000 = £2,500, 4% of £125,001 to
  // £250,000 = £5,000, 7% of £250,001 to £700,000 = £31,500 ... total ... £39,000"
  const nonResident = duty(700000, 'homeMover', true)
  assert.equal(nonResident.tax, 39000)
  assert.deepEqual(
    nonResident.breakdown.map((band) => band.tax),
    [2500, 5000, 31500],
  )
  // In that example the buyer is a first-time buyer over the relief limit, which gives the same.
  assert.equal(duty(700000, 'firstTimeBuyer', true).tax, 39000)
})

test('stamp duty [own working] every standard band boundary', () => {
  const cases = [
    // price, tax
    [0, 0],
    [124999, 0],
    [125000, 0], // top of the 0% band
    [125001, 0], // 2% of £1 is 2p, rounded down
    [125050, 1], // 2% of £50
    [250000, 2500], // top of the 2% band: 2% of £125,000
    [250001, 2500], // 5% of £1 is 5p, rounded down
    [250020, 2501], // 5% of £20
    [925000, 36250], // top of the 5% band: £2,500 + 5% of £675,000
    [925010, 36251], // 10% of £10
    [1500000, 93750], // top of the 10% band: £36,250 + 10% of £575,000
    [1500100, 93762], // 12% of £100
    [2000000, 153750], // £93,750 + 12% of £500,000
    [10000000, 1113750], // £93,750 + 12% of £8,500,000
  ]
  for (const [price, tax] of cases) {
    assert.equal(duty(price).tax, tax, `home mover at ${price}`)
  }
})

test('stamp duty [own working] first-time buyer relief and its cut-off', () => {
  const cases = [
    [125000, 0],
    [300000, 0], // top of the 0% band
    [300020, 1], // 5% of £20
    [400000, 5000], // 5% of £100,000
    [499999, 9999], // 5% of £199,999 is £9,999.95
    [500000, 10000], // the most relief can cover
  ]
  for (const [price, tax] of cases) {
    const result = duty(price, 'firstTimeBuyer')
    assert.equal(result.tax, tax, `first-time buyer at ${price}`)
    assert.equal(result.reliefApplies, true)
    assert.equal(result.firstTimeBuyerOverLimit, false)
  }
  // £1 over £500,000 and the relief is lost completely: standard rates on the whole price.
  // £2,500 + 5% of £250,001 = £15,000.05.
  const over = duty(500001, 'firstTimeBuyer')
  assert.equal(over.tax, 15000)
  assert.equal(over.reliefApplies, false)
  assert.equal(over.firstTimeBuyerOverLimit, true)
  assert.equal(over.tax, duty(500001).tax)
  // The relief is worth £5,000 at £300,000 and above.
  assert.equal(duty(300000).tax - duty(300000, 'firstTimeBuyer').tax, 5000)
  assert.equal(duty(500000).tax - duty(500000, 'firstTimeBuyer').tax, 5000)
})

test('stamp duty [gov.uk] surcharges only apply from £40,000', () => {
  // "You must pay the higher SDLT rates when you buy a residential property ... for £40,000 or more".
  // "You must pay the surcharge when you buy ... for £40,000 or more if one or more buyers is non-UK resident".
  assert.equal(duty(39999, 'additional').tax, 0)
  assert.equal(duty(39999, 'additional').surchargeWaived, true)
  assert.equal(duty(40000, 'additional').tax, 2000) // 5% of £40,000
  assert.equal(duty(40000, 'additional').surchargeWaived, false)
  assert.equal(duty(39999, 'homeMover', true).tax, 0)
  assert.equal(duty(40000, 'homeMover', true).tax, 800) // 2% of £40,000
})

test('stamp duty [own working] additional property at every band boundary', () => {
  const cases = [
    [125000, 6250], // 5%
    [250000, 15000], // + 7% of £125,000
    [925000, 82500], // + 10% of £675,000
    [1500000, 168750], // + 15% of £575,000
    [2000000, 253750], // + 17% of £500,000
  ]
  for (const [price, tax] of cases) {
    const result = duty(price, 'additional')
    assert.equal(result.tax, tax, `additional property at ${price}`)
    // The surcharge is 5% of the whole price on top of the standard tax.
    assert.equal(result.tax, duty(price).tax + price * 0.05)
  }
})

test('stamp duty [own working] non-UK resident surcharge with each buyer type', () => {
  // Home mover at £300,000: 2% + 4% + 7% of each slice = £2,500 + £5,000 + £3,500.
  assert.equal(duty(300000, 'homeMover', true).tax, 11000)
  // First-time buyer at £400,000: 2% of £300,000 + 7% of £100,000.
  const firstTime = duty(400000, 'firstTimeBuyer', true)
  assert.equal(firstTime.tax, 13000)
  assert.deepEqual(
    firstTime.breakdown.map((band) => band.rate),
    [0.02, 0.07],
  )
  // Additional property at £300,000: 7% + 9% + 12% = £8,750 + £11,250 + £6,000.
  const additional = duty(300000, 'additional', true)
  assert.equal(additional.tax, 26000)
  assert.deepEqual(
    additional.breakdown.map((band) => band.rate),
    [0.07, 0.09, 0.12],
  )
  // Top band with both surcharges is 12% + 5% + 2%.
  assert.equal(duty(2000000, 'additional', true).breakdown.at(-1).rate, 0.19)
})

test('stamp duty [own working] breakdown, effective rate and odd inputs', () => {
  const result = duty(295000)
  assert.deepEqual(
    result.breakdown.map(({ from, to, rate, amountInBand }) => [from, to, rate, amountInBand]),
    [
      [0, 125000, 0, 125000],
      [125000, 250000, 0.02, 125000],
      [250000, 295000, 0.05, 45000],
    ],
  )
  assert.ok(Math.abs(result.effectiveRate - 4750 / 295000) < 1e-12)
  // The slices always add up to the price.
  for (const price of [1, 99999, 310000, 925000, 3250000]) {
    const total = duty(price, 'additional', true).breakdown.reduce(
      (sum, band) => sum + band.amountInBand,
      0,
    )
    assert.equal(total, price)
  }
  // Blank, zero or negative price.
  for (const price of [0, -250000, NaN, undefined]) {
    const empty = duty(price, 'additional', true)
    assert.equal(empty.tax, 0)
    assert.equal(empty.effectiveRate, 0)
    assert.deepEqual(empty.breakdown, [])
  }
  // A higher price never means less tax, except at the first-time buyer cut-off,
  // where it jumps up.
  for (const type of ['homeMover', 'firstTimeBuyer', 'additional']) {
    let previous = 0
    for (let price = 0; price <= 2000000; price += 5000) {
      const { tax } = duty(price, type)
      assert.ok(tax >= previous, `${type} at ${price}`)
      previous = tax
    }
  }
})
