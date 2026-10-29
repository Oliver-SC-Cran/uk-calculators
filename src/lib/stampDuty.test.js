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
import {
  calculateSharedOwnershipStampDuty,
  calculateStampDuty,
  largestUntaxedRent,
  rentNetPresentValue,
  staircasingStampDuty,
} from './stampDuty.js'

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

// Shared ownership: a new lease from a housing association, council or other
// approved body. Each test name says where its expected values came from:
//   [gov.uk]      an example on gov.uk's shared ownership guide or in HMRC's Stamp Duty
//                 Land Tax Manual, or a result from HMRC's online SDLT calculator, all
//                 checked on 29 October 2026
//   [own working] worked out by hand, or with the closed-form sums below
//
// https://www.gov.uk/stamp-duty-land-tax/shared-ownership-property
// https://www.tax.service.gov.uk/calculate-stamp-duty-land-tax
// https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm27060 (in stages)
// https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm27030 (election)
// https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm27065 (staircasing)
// https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm29880 (first-time
//   buyers, election), sdltm29885 (in stages) and sdltm29890 (buying more shares)
// https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm13075 (net present value)
// https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/sdltm13080 (worked example)

const shared = (marketValue, sharePercent, settings = {}) =>
  calculateSharedOwnershipStampDuty({
    marketValue,
    sharePercent,
    leaseYears: 990,
    rentRisePercent: 0,
    ...settings,
  })

// The net present value of a rent, from the sum of a growing series and of a
// level one, as an independent check on the year-by-year sum in stampDuty.js.
function npvClosedForm(yearlyRent, years, rise) {
  const d = 1.035
  const known = Math.min(5, years)
  let value = 0
  for (let year = 1; year <= known; year += 1)
    value += (yearlyRent * (1 + rise) ** (year - 1)) / d ** year
  const later = Math.max(0, years - 5)
  const highest = yearlyRent * (1 + rise) ** (known - 1)
  value += (highest * (1 - d ** -later)) / 0.035 / d ** 5
  return value
}

test('shared ownership [gov.uk] a market value election taxes the full market value', () => {
  // gov.uk's example: "You pay £140,000 to buy a 50% share of a property with a market value of
  // £280,000 ... total SDLT = £4,000". The share makes no difference to the election.
  assert.equal(shared(280000, 50, { monthlyRent: 500 }).sharePrice, 140000)
  for (const share of [10, 25, 40, 50, 75]) {
    const result = shared(280000, share, { monthlyRent: 500 })
    assert.equal(result.election.tax, 4000, `${share}% share`)
    assert.equal(result.election.price, 280000)
  }
})

test('shared ownership [gov.uk] first-time buyers, both ways of paying', () => {
  // SDLTM29880: a first-time buyer pays £225,000 for a 50% share of a £450,000 home and makes
  // the election: "0% on the first £300,000 and 5% on the remaining £150,000, paying a total of
  // £7,500 ... No SDLT is payable on the rental payments."
  const elected = shared(450000, 50, { buyerType: 'firstTimeBuyer', monthlyRent: 700 })
  assert.equal(elected.sharePrice, 225000)
  assert.equal(elected.election.tax, 7500)
  // SDLTM29885: £180,000 for a 40% share of a £450,000 home, paying in stages: "No SDLT will be
  // due on the £180,000", and the relief also applies to the rent.
  const result = shared(450000, 40, { buyerType: 'firstTimeBuyer', monthlyRent: 700 })
  assert.equal(result.sharePrice, 180000)
  assert.equal(result.inStages.priceTax, 0)
  assert.equal(result.inStages.rentTax, 0)
  assert.equal(result.inStages.tax, 0)
  assert.equal(result.reliefApplies, true)
  assert.equal(result.rent.taxed, false)
})

test("shared ownership [gov.uk] HMRC's online calculator on gov.uk's £400,000 home", () => {
  // HMRC's online SDLT calculator on 29 October 2026, for a new 990-year lease (29 October 2026
  // to 28 October 3016) with a £160,000 premium, rent of £6,600 a year and an individual buyer
  // who is UK resident and will own one property. gov.uk's rent example is this home: a 40%
  // share of £400,000, with £550 a month (2.75% of the £240,000 share the landlord keeps).
  const results = [
    // settings, total, SDLT on premium, SDLT on rent, net present value as HMRC shows it
    [{}, 1335, 700, 635, 188571],
    [{ rentRisePercent: 3 }, 1552, 700, 852, 210276], // HMRC was given the rents to the penny
    [{ buyerType: 'firstTimeBuyer' }, 0, 0, 0, 188571], // shared ownership, paying in stages
    [{ buyerType: 'firstTimeBuyer', rentRisePercent: 3 }, 0, 0, 0, 210276],
  ]
  for (const [settings, totalTax, premiumTax, rentTax, npv] of results) {
    const result = shared(400000, 40, { monthlyRent: 550, ...settings })
    const where = JSON.stringify(settings)
    assert.equal(result.inStages.tax, totalTax, where)
    assert.equal(result.inStages.priceTax, premiumTax, where)
    assert.equal(result.inStages.rentTax, rentTax, where)
    assert.equal(Math.floor(result.rent.netPresentValue), npv, where)
  }
  // A first-time buyer making the election, with £400,000 as the market value: £5,000.
  assert.equal(shared(400000, 40, { buyerType: 'firstTimeBuyer' }).election.tax, 5000)
  // HMRC's calculator asks about shared ownership only for first-time buyers. A home mover's
  // election is a lease with a £400,000 premium and no rent there: £10,000.
  assert.equal(shared(400000, 40, { monthlyRent: 550 }).election.tax, 10000)
  // HMRC rounds the tax on the premium and the tax on the rent down separately. With a £160,045
  // premium the tax on it is £700.90 and on the rent £635.71: HMRC's total is £1,335, where
  // rounding the total would give £1,336.
  const probe = calculateSharedOwnershipStampDuty({
    marketValue: 400000,
    sharePercent: (160045 / 400000) * 100,
    monthlyRent: 550,
    leaseYears: 990,
  })
  assert.equal(probe.sharePrice, 160045)
  assert.equal(probe.inStages.priceTax, 700)
  assert.equal(probe.inStages.rentTax, 635)
  assert.equal(probe.inStages.tax, 1335)
})

test("shared ownership [own working] gov.uk's £400,000 home, 40% share and £550 a month rent", () => {
  // In stages: 2% of £35,000 = £700 on the £160,000 share. The rent is £6,600 a year. With
  // no rise its value over 990 years is £6,600 ÷ 0.035 = £188,571.43, so the tax on the rent is
  // 1% of £63,571.43 = £635.71, rounded down to £635.
  const flat = shared(400000, 40, { monthlyRent: 550 })
  assert.equal(flat.sharePrice, 160000)
  assert.equal(flat.inStages.priceTax, 700)
  assert.ok(Math.abs(flat.rent.netPresentValue - 188571.43) < 0.01)
  assert.equal(flat.inStages.rentTax, 635)
  assert.equal(flat.inStages.tax, 1335)
  // With the election: £2,500 + 5% of £150,000 = £10,000, and no tax on the rent.
  assert.equal(flat.election.tax, 10000)
  // With a 3% rise for the first five years the rent is £6,600, £6,798, £7,001.94, £7,212.00
  // and £7,428.36, then £7,428.36 every year after: £210,276.86, so £852 on the rent.
  const rising = shared(400000, 40, { monthlyRent: 550, rentRisePercent: 3 })
  assert.ok(Math.abs(rising.rent.netPresentValue - 210276.86) < 0.01)
  assert.equal(rising.inStages.rentTax, 852)
  assert.equal(rising.inStages.tax, 1552)
  assert.deepEqual(
    rising.rent.knownYears.map((each) => Math.round(each.rent * 100) / 100),
    [6600, 6798, 7001.94, 7212, 7428.36],
  )
  assert.equal(rising.election.tax, 10000)
  // A first-time buyer pays nothing in stages and £5,000 with the election.
  const firstTime = shared(400000, 40, { monthlyRent: 550, buyerType: 'firstTimeBuyer' })
  assert.equal(firstTime.inStages.tax, 0)
  assert.equal(firstTime.election.tax, 5000)
})

test('shared ownership [own working] the rent is taxed only above £125,000 of net present value', () => {
  // A one-year lease, so the net present value is the year's rent ÷ 1.035.
  // £10,781.25 a month is £129,375 a year, worth exactly £125,000: nothing to pay.
  const atBand = shared(400000, 40, { monthlyRent: 10781.25, leaseYears: 1 })
  assert.ok(Math.abs(atBand.rent.netPresentValue - 125000) < 1e-6)
  assert.equal(atBand.inStages.rentTax, 0)
  assert.equal(atBand.inStages.tax, 700)
  // £10,871.25 a month is £130,455 a year, worth £126,043.48: 1% of £1,043.48 is £10.43.
  const over = shared(400000, 40, { monthlyRent: 10871.25, leaseYears: 1 })
  assert.equal(over.inStages.rentTax, 10)
  // On a 990-year lease with no rise, £4,375 a year (about £364.58 a month) is the most
  // rent with no tax on it: £125,000 × 0.035 ÷ (1 − 1.035^−990).
  assert.ok(Math.abs(largestUntaxedRent({ years: 990 }) - 4375) < 0.01)
  assert.ok(Math.abs(largestUntaxedRent({ years: 99 }) - 4525.15) < 0.01)
  // £364 a month is £4,368 a year, worth £124,800 over 990 years: nothing to pay.
  assert.equal(shared(400000, 40, { monthlyRent: 364 }).inStages.rentTax, 0)
  // £366 a month is £4,392 a year, worth £125,485.71: 1% of £485.71 is £4.86, so £4.
  assert.equal(shared(400000, 40, { monthlyRent: 366 }).inStages.rentTax, 4)
})

test('shared ownership [gov.uk] the net present value worked example in SDLTM13080', () => {
  // A ten-year lease with rent of £4,000, £5,000, £6,000, £7,000 and £8,000 in the first five
  // years. Years 6 to 10 count at £8,000, the highest of the first five. "Total £57192.25".
  const npv = rentNetPresentValue({ firstYearsRents: [4000, 5000, 6000, 7000, 8000], years: 10 })
  assert.ok(Math.abs(npv.value - 57192.25) < 0.005, `got ${npv.value}`)
  assert.deepEqual(
    npv.knownYears.map((each) => Math.round(each.presentValue * 100) / 100),
    [3864.73, 4667.55, 5411.66, 6100.1, 6735.79],
  )
  assert.equal(npv.highestRent, 8000)
  // £6,508.00 + £6,287.93 + £6,075.29 + £5,869.85 + £5,671.35 for years 6 to 10.
  assert.ok(Math.abs(npv.laterValue - 30412.42) < 0.01, `got ${npv.laterValue}`)
})

test('shared ownership [own working] the net present value matches the closed-form sums', () => {
  for (const [yearlyRent, years, rise] of [
    [6600, 990, 0],
    [6600, 990, 0.03],
    [6600, 99, 0],
    [6600, 99, 0.03],
    [6600, 125, 0.05],
    [4950, 3, 0.03], // shorter than the five years whose rent is known
    [4950, 5, 0.03],
    [4950, 6, 0.03],
    [12000, 1, 0.1],
  ]) {
    const { value } = rentNetPresentValue({ yearlyRent, years, yearlyRise: rise })
    const expected = npvClosedForm(yearlyRent, years, rise)
    assert.ok(Math.abs(value - expected) < 1e-6, `${yearlyRent} over ${years} years at ${rise}`)
  }
  // After year 5 the rent stays at the highest of the first five, however long the lease.
  const npv = rentNetPresentValue({ yearlyRent: 1000, years: 20, yearlyRise: 0.1 })
  assert.ok(Math.abs(npv.highestRent - 1464.1) < 1e-9)
  assert.equal(npv.laterYears, 15)
  // Blank, zero or negative rent or years give nothing.
  for (const [yearlyRent, years] of [
    [0, 990],
    [6600, 0],
    [-6600, 990],
    [6600, -5],
    [NaN, 990],
    [6600, NaN],
  ]) {
    assert.equal(rentNetPresentValue({ yearlyRent, years }).value, 0)
  }
})

test('shared ownership [own working] the full market value limit for first-time buyer relief', () => {
  // £500,000: relief applies both ways. A 40% share is £200,000, so nothing in stages, and
  // the election is 5% of £200,000 = £10,000.
  const atLimit = shared(500000, 40, { buyerType: 'firstTimeBuyer', monthlyRent: 550 })
  assert.equal(atLimit.reliefApplies, true)
  assert.equal(atLimit.firstTimeBuyerOverLimit, false)
  assert.equal(atLimit.inStages.tax, 0)
  assert.equal(atLimit.election.tax, 10000)
  // £500,001: no relief either way. In stages, 2% of £75,000.40 on the £200,000.40 share
  // (£1,500.008, so £1,500) and £635 on the rent. With the election, £15,000.05, so £15,000.
  const over = shared(500001, 40, { buyerType: 'firstTimeBuyer', monthlyRent: 550 })
  assert.equal(over.reliefApplies, false)
  assert.equal(over.firstTimeBuyerOverLimit, true)
  assert.equal(over.sharePrice, 200000.4)
  assert.equal(over.inStages.priceTax, 1500)
  assert.equal(over.inStages.rentTax, 635)
  assert.equal(over.inStages.tax, 2135)
  assert.equal(over.election.tax, 15000)
  // Over the limit a first-time buyer pays the same as a home mover.
  const mover = shared(500001, 40, { monthlyRent: 550 })
  assert.equal(over.inStages.tax, mover.inStages.tax)
  assert.equal(over.election.tax, mover.election.tax)
  // The relief depends on the full market value, not the share: a £150,000 share of a
  // £600,000 home gets none.
  const bigHome = shared(600000, 25, { buyerType: 'firstTimeBuyer', monthlyRent: 0 })
  assert.equal(bigHome.reliefApplies, false)
  assert.equal(bigHome.inStages.priceTax, 500) // 2% of £25,000
})

test('shared ownership [own working] the smallest and largest shares, with the rent estimated', () => {
  // No rent entered: 2.75% a year of the landlord's share. A 10% share of £400,000 leaves
  // £360,000, so £9,900 a year (£825 a month). Over 990 years with no rise that is worth
  // £282,857.14, and 1% of £157,857.14 is £1,578.57.
  const smallest = shared(400000, 10)
  assert.equal(smallest.rentEstimated, true)
  assert.equal(smallest.sharePrice, 40000)
  assert.equal(smallest.monthlyRent, 825)
  assert.equal(smallest.inStages.priceTax, 0)
  assert.equal(smallest.inStages.rentTax, 1578)
  assert.equal(smallest.election.tax, 10000)
  // A 75% share is £300,000: £2,500 + 5% of £50,000 = £5,000. The rent on the other
  // £100,000 is £2,750 a year, or £229.17 a month to the penny, worth £78,572 or so: no tax.
  const largest = shared(400000, 75)
  assert.equal(largest.monthlyRent, 229.17)
  assert.equal(largest.inStages.priceTax, 5000)
  assert.equal(largest.inStages.rentTax, 0)
  assert.equal(largest.inStages.tax, 5000)
  // A rent that is entered is used as it is, even £0.
  const noRent = shared(400000, 10, { monthlyRent: 0 })
  assert.equal(noRent.rentEstimated, false)
  assert.equal(noRent.inStages.rentTax, 0)
})

test('shared ownership [own working] lease lengths of 1, 99 and 990 years', () => {
  // £550 a month with no rise. One year: £6,600 ÷ 1.035 = £6,376.81, so no tax on the rent.
  const oneYear = shared(400000, 40, { monthlyRent: 550, leaseYears: 1 })
  assert.ok(Math.abs(oneYear.rent.netPresentValue - 6376.81) < 0.01)
  assert.equal(oneYear.inStages.rentTax, 0)
  // 99 years: £6,600 × (1 − 1.035^−99) ÷ 0.035, which is about £182,316, so £573 on the rent.
  const ninetyNine = shared(400000, 40, { monthlyRent: 550, leaseYears: 99 })
  const expected = npvClosedForm(6600, 99, 0)
  assert.ok(Math.abs(ninetyNine.rent.netPresentValue - expected) < 1e-6)
  assert.equal(ninetyNine.inStages.rentTax, Math.floor((expected - 125000) * 0.01))
  assert.equal(ninetyNine.inStages.rentTax, 573)
  // 990 years: £635, as in gov.uk's example.
  assert.equal(shared(400000, 40, { monthlyRent: 550 }).inStages.rentTax, 635)
  // A longer lease is never worth less.
  let previous = 0
  for (const leaseYears of [1, 2, 5, 6, 10, 50, 99, 125, 250, 990, 999]) {
    const { netPresentValue } = shared(400000, 40, { monthlyRent: 550, leaseYears }).rent
    assert.ok(netPresentValue >= previous, `${leaseYears} years`)
    previous = netPresentValue
  }
})

test('shared ownership [own working] blank, zero, negative and very large figures', () => {
  for (const marketValue of [0, -400000, NaN, undefined]) {
    const result = shared(marketValue, 40)
    assert.equal(result.inStages.tax, 0)
    assert.equal(result.election.tax, 0)
    assert.equal(result.monthlyRent, 0)
  }
  for (const sharePercent of [0, -40, NaN]) {
    const result = shared(400000, sharePercent, { monthlyRent: 0 })
    assert.equal(result.sharePrice, 0)
    assert.equal(result.inStages.tax, 0)
    assert.equal(result.election.tax, 10000)
  }
  // A negative rent or rise counts as none.
  assert.equal(shared(400000, 40, { monthlyRent: -550 }).inStages.rentTax, 0)
  assert.equal(shared(400000, 40, { monthlyRent: 550, rentRisePercent: -3 }).inStages.rentTax, 635)
  // A £10 million home, 75% share, no rise. The share is £7,500,000: £93,750 + 12% of
  // £6,000,000 = £813,750. The rent is 2.75% of £2,500,000 = £68,750 a year, worth
  // £1,964,285.71, so 1% of £1,839,285.71 = £18,392.86 on the rent.
  const huge = shared(10000000, 75)
  assert.equal(huge.inStages.priceTax, 813750)
  assert.equal(huge.inStages.rentTax, 18392)
  assert.equal(huge.inStages.tax, 832142)
  assert.equal(huge.election.tax, 1113750)
  // The election always taxes the full value at the usual rates, so it matches the
  // outright calculator.
  for (const price of [0, 125000, 250000, 300000, 925000, 1500000, 3000000]) {
    assert.equal(shared(price, 25).election.tax, duty(price).tax, `${price}`)
    assert.equal(
      shared(price, 25, { buyerType: 'firstTimeBuyer' }).election.tax,
      duty(price, 'firstTimeBuyer').tax,
      `first-time buyer ${price}`,
    )
  }
})

test("staircasing [gov.uk] gov.uk's example of a share that takes you over 80%", () => {
  // "if you've paid £260,000 in total so far, the total SDLT due is £3,000 ... if you're paying
  // £65,000 for this share, divide £65,000 by £260,000 = 0.25 ... SDLT of £3000 multiplied by
  // 0.25 = £750."
  const quarter = staircasingStampDuty({
    paidBefore: 195000,
    sharePrice: 65000,
    shareAfterPercent: 85,
  })
  assert.equal(quarter.totalPaid, 260000)
  assert.equal(quarter.taxOnTotal, 3000)
  assert.equal(quarter.fraction, 0.25)
  assert.equal(quarter.tax, 750)
  // "you do not have to pay any more SDLT or send a return to HMRC until you own more than an
  // 80% share."
  assert.equal(
    staircasingStampDuty({ paidBefore: 195000, sharePrice: 65000, shareAfterPercent: 80 }).tax,
    0,
  )
})

test('staircasing [own working] buying more shares after paying in stages', () => {
  // gov.uk's method: nothing until your share goes over 80%. Then the tax on everything paid
  // so far, times this share's price over the total paid.
  // A £400,000 home bought with a 40% share (£160,000). Buying the other 60% (£240,000) in one
  // go: tax on £400,000 is £10,000, and 240,000 ÷ 400,000 of it is £6,000.
  assert.deepEqual(
    staircasingStampDuty({ paidBefore: 160000, sharePrice: 240000, shareAfterPercent: 100 }),
    { tax: 6000, taxed: true, totalPaid: 400000, taxOnTotal: 10000, fraction: 0.6 },
  )
  // Going to 80% first costs nothing, then the last 20% (£80,000) is £10,000 × 0.2 = £2,000.
  const toEighty = staircasingStampDuty({
    paidBefore: 160000,
    sharePrice: 160000,
    shareAfterPercent: 80,
  })
  assert.equal(toEighty.tax, 0)
  assert.equal(toEighty.taxed, false)
  assert.equal(
    staircasingStampDuty({ paidBefore: 320000, sharePrice: 80000, shareAfterPercent: 100 }).tax,
    2000,
  )
  // Just over 80% is taxed.
  assert.equal(
    staircasingStampDuty({ paidBefore: 195000, sharePrice: 65000, shareAfterPercent: 80.5 }).taxed,
    true,
  )
  // With a market value election nothing more is due.
  const elected = staircasingStampDuty({
    paidBefore: 160000,
    sharePrice: 240000,
    shareAfterPercent: 100,
    electionMade: true,
  })
  assert.equal(elected.tax, 0)
  // Nothing bought, or nothing typed.
  for (const sharePrice of [0, -5, NaN]) {
    assert.equal(
      staircasingStampDuty({ paidBefore: 160000, sharePrice, shareAfterPercent: 100 }).tax,
      0,
    )
  }
})
