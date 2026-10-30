// Tests for the mileage allowance calculator (mileage.js). Run with: npm test
//
// [gov.uk] values come from gov.uk and HMRC's manuals, checked on 30 October
// 2026. HMRC's worked examples in the Employment Income Manual are for
// 2025/26, when the car and van rate for the first 10,000 miles was 45p, so
// those tests pass in the 2025/26 rates from EIM31240's table. The rest are
// [own working].
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateIncomeTax } from './incomeTax.js'
import {
  approvedAmount,
  calculateMileageAllowance,
  compareWithApproved,
  employerPays,
} from './mileage.js'
import { MILEAGE_RATES } from './rates/mileage.js'

// EIM31240, "From 2011-2012 to 2025-2026".
const CAR_2025_26 = { firstMiles: 10000, firstMilesRate: 0.45, laterMilesRate: 0.25 }
const CYCLE_2025_26 = { rate: 0.2 }

const BOTH_YEARS = ['2026/27', '2027/28']
const close = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 0.005, `${message}: ${actual}, expected ${expected}`)

// The page's starting figures.
const DEFAULTS = { vehicle: 'carOrVan', miles: 12000, employerRate: 0.45, pay: 35000 }
const mileage = (settings, taxYear) => calculateMileageAllowance({ ...settings, taxYear })

test('mileage [gov.uk] simplified expenses: 11,000 miles in a car comes to £5,750 in 2026/27', () => {
  // gov.uk, "Simplified expenses if you're self-employed", Vehicles.
  const { bands, total } = approvedAmount(11000, MILEAGE_RATES['2026/27'].carOrVan)
  assert.deepEqual(
    bands.map((band) => band.amount),
    [5500, 250],
  )
  assert.equal(total, 5750)
})

test('mileage [gov.uk] EIM31350: 860 miles and nothing paid gives £387 of relief (2025/26 rates)', () => {
  const result = compareWithApproved(860, 0, CAR_2025_26)
  assert.equal(result.approved, 387)
  assert.equal(result.relief, 387)
  assert.equal(result.taxable, 0)
})

test('mileage [gov.uk] EIM31355: 5,000 miles at 49p is £200 taxable, 12,000 at 35p is £800 relief', () => {
  const one = compareWithApproved(5000, employerPays(5000, 0.49, null, CAR_2025_26), CAR_2025_26)
  assert.deepEqual([one.paid, one.approved, one.taxable, one.relief], [2450, 2250, 200, 0])
  const two = compareWithApproved(12000, employerPays(12000, 0.35, null, CAR_2025_26), CAR_2025_26)
  assert.deepEqual(
    two.bands.map((band) => band.amount),
    [4500, 500],
  )
  assert.deepEqual([two.paid, two.approved, two.relief, two.taxable], [4200, 5000, 800, 0])
})

test('mileage [gov.uk] EIM31360: £70 a month plus 35p for 8,000 miles is £40 taxable (2025/26 rates)', () => {
  const paid = 70 * 12 + employerPays(8000, 0.35, null, CAR_2025_26)
  assert.equal(paid, 3640)
  const result = compareWithApproved(8000, paid, CAR_2025_26)
  assert.deepEqual([result.approved, result.taxable], [3600, 40])
})

test('mileage [gov.uk] EIM31370: a car and a van count together, 11,000 miles at 45p is £200 taxable', () => {
  const paid = employerPays(6000 + 5000, 0.45, null, CAR_2025_26)
  const result = compareWithApproved(11000, paid, CAR_2025_26)
  assert.deepEqual([result.paid, result.approved, result.taxable], [4950, 4750, 200])
})

test('mileage [gov.uk] EIM31375: a car and a cycle are worked out on their own', () => {
  const car = compareWithApproved(9500, employerPays(9500, 0.38, null, CAR_2025_26), CAR_2025_26)
  assert.deepEqual([car.paid, car.approved, car.relief], [3610, 4275, 665])
  const cycle = compareWithApproved(
    700,
    employerPays(700, 0.22, null, CYCLE_2025_26),
    CYCLE_2025_26,
  )
  assert.deepEqual([cycle.paid, cycle.approved, cycle.taxable], [154, 140, 14])
})

test('mileage [gov.uk] EIM31380: each employment has its own 10,000 miles unless they are associated', () => {
  // 8,000 and 4,000 miles with employers that are not associated: the higher
  // rate applies to all of them. With associated employers, 2,000 are above.
  for (const miles of [8000, 4000]) {
    assert.equal(approvedAmount(miles, CAR_2025_26).bands[1].miles, 0)
  }
  assert.equal(approvedAmount(12000, CAR_2025_26).bands[1].miles, 2000)
})

test('mileage [gov.uk] National Insurance: 1,000 van miles are free of it up to £550 in 2026/27', () => {
  // gov.uk, "Expenses and benefits: business travel mileage", rules for
  // National Insurance, and NIM05833: 55p for every business mile.
  const result = mileage({ vehicle: 'carOrVan', miles: 1000, employerRate: 0.55, pay: 30000 })
  assert.equal(result.niFree, 550)
  assert.equal(result.niFreeRate, 0.55)
  assert.equal(result.niLiable, 0)
  const longer = mileage({ vehicle: 'carOrVan', miles: 15000, employerRate: 0, pay: 30000 })
  assert.equal(longer.niFreeRate, 0.55)
  assert.deepEqual(
    longer.bands.map((band) => band.rate),
    [0.55, 0.25],
  )
})

test('mileage [gov.uk] NIM05835: 1,000 miles at 60p leaves £50 liable to National Insurance', () => {
  const result = mileage({ vehicle: 'carOrVan', miles: 1000, employerRate: 0.6, pay: 24000 })
  assert.deepEqual([result.paid, result.niFree, result.niLiable], [600, 550, 50])
  // On pay between the thresholds, that is 8% of £50 [own working].
  close(result.nationalInsurance, 4, 'National Insurance')
})

test('mileage [gov.uk] EIM31415: two passengers for 100 miles at 3p is £6 paid, all tax-free, no relief', () => {
  const settings = { miles: 100, passengerMiles: 100, passengers: 2, pay: 30000 }
  const one = mileage({ ...settings, employerRate: 0.45, passengerRate: 0.03 })
  assert.deepEqual(
    [one.passenger.miles, one.passenger.paid, one.passenger.taxFree, one.passenger.taxable],
    [200, 6, 10, 0],
  )
  // Example two: 43p a mile whether or not passengers are carried, so no
  // passenger payments and no relief for the £10 that could have been tax-free.
  const two = mileage({ ...settings, employerRate: 0.43, passengerRate: 0 })
  assert.deepEqual([two.passenger.paid, two.passenger.taxable], [0, 0])
})

test('mileage [gov.uk] claiming £60 of relief at 20% saves £12', () => {
  // gov.uk, "Claim tax relief for your job expenses": "If you claim £60 and
  // pay tax at a rate of 20% in that year, the amount you are entitled to is
  // £12". 1,000 miles at 49p leaves £60 of the £550 approved amount unpaid.
  const result = mileage({ miles: 1000, employerRate: 0.49, pay: 30000 })
  assert.equal(result.relief, 60)
  close(result.taxSaved, 12, 'tax saved')
})

test('mileage [own working] the starting figures: 12,000 miles at 45p on £35,000', () => {
  const [now, next] = BOTH_YEARS.map((year) => mileage(DEFAULTS, year))
  assert.deepEqual([now.kind, now.relief, now.taxSaved], ['relief', 600, 120])
  assert.deepEqual([next.kind, next.relief, next.taxSaved], ['relief', 800, 160])
  assert.equal(now.approved, 6000)
  assert.equal(next.approved, 6200)
  assert.equal(now.paid, 5400)
})

test('mileage [own working] 12,000 miles at 50.8p: £96 taxable in 2026/27, £104 relief in 2027/28', () => {
  const settings = { ...DEFAULTS, employerRate: 0.508 }
  const [now, next] = BOTH_YEARS.map((year) => mileage(settings, year))
  assert.equal(now.paid, 6096)
  assert.deepEqual([now.kind, now.taxable, now.relief, now.headline], ['taxable', 96, 0, 96])
  close(now.extraTax, 19.2, 'extra tax')
  assert.deepEqual([next.kind, next.relief, next.taxable, next.headline], ['relief', 104, 0, 104])
  close(next.taxSaved, 20.8, 'tax saved')
  // 50.8p is under 55p, so no National Insurance in either year.
  assert.equal(now.niLiable, 0)
  assert.equal(next.niLiable, 0)
})

test('mileage [own working] around 10,000 miles in a car or van, nothing paid', () => {
  const expected = {
    0: [0, 0],
    1: [0.55, 0.55],
    9999: [5499.45, 5499.45],
    10000: [5500, 5500],
    10001: [5500.25, 5500.35],
    10002: [5500.5, 5500.7],
  }
  for (const [miles, [now, next]] of Object.entries(expected)) {
    const settings = { miles: Number(miles), employerRate: 0, pay: 35000 }
    assert.equal(mileage(settings, '2026/27').approved, now, `${miles} miles in 2026/27`)
    assert.equal(mileage(settings, '2027/28').approved, next, `${miles} miles in 2027/28`)
    assert.equal(mileage(settings, '2026/27').relief, now)
  }
})

test('mileage [own working] no miles: nothing approved, paid, claimed or taxed', () => {
  for (const year of BOTH_YEARS) {
    const result = mileage({ miles: 0, employerRate: 0.45, pay: 35000 }, year)
    assert.deepEqual(
      [result.approved, result.paid, result.relief, result.taxableInAll, result.headline],
      [0, 0, 0, 0, 0],
    )
    assert.equal(result.kind, 'even')
    assert.equal(result.taxSaved, 0)
  }
})

test('mileage [own working] an employer paying exactly the approved rates', () => {
  // 55p for up to 10,000 miles: nothing either way in both years.
  for (const year of BOTH_YEARS) {
    const result = mileage({ miles: 10000, employerRate: 0.55, pay: 35000 }, year)
    assert.deepEqual([result.kind, result.relief, result.taxable], ['even', 0, 0])
  }
  // 55p then 25p above 10,000: exact in 2026/27, short by 10p a mile in 2027/28.
  const settings = { miles: 12000, employerRate: 0.55, employerRateAbove: 0.25, pay: 35000 }
  assert.equal(mileage(settings, '2026/27').kind, 'even')
  assert.equal(mileage(settings, '2027/28').relief, 200)
})

test('mileage [own working] 55p for every mile is taxable above 10,000 miles but free of NI', () => {
  const settings = { miles: 12000, employerRate: 0.55, pay: 35000 }
  const [now, next] = BOTH_YEARS.map((year) => mileage(settings, year))
  assert.deepEqual([now.paid, now.taxable, next.taxable], [6600, 600, 400])
  close(now.extraTax, 120, 'extra tax in 2026/27')
  close(next.extraTax, 80, 'extra tax in 2027/28')
  assert.equal(now.niLiable, 0)
  assert.equal(next.niLiable, 0)
})

test('mileage [own working] more than 55p: taxable, with National Insurance above 55p', () => {
  const settings = { miles: 8000, employerRate: 0.6, pay: 35000 }
  for (const year of BOTH_YEARS) {
    const result = mileage(settings, year)
    assert.deepEqual([result.paid, result.taxable, result.niLiable], [4800, 400, 400])
    close(result.extraTax, 80, `extra tax in ${year}`)
    close(result.nationalInsurance, 32, `National Insurance in ${year}`)
  }
  // Above the upper earnings limit, 2%.
  close(mileage({ ...settings, pay: 60000 }, '2026/27').nationalInsurance, 8, 'upper rate')
  // A different rate above 10,000 miles: 55p, then 60p for 2,000 miles.
  const above = mileage({ miles: 12000, employerRate: 0.55, employerRateAbove: 0.6, pay: 35000 })
  assert.deepEqual([above.paid, above.taxable, above.niLiable], [6700, 700, 100])
})

test('mileage [own working] less than the approved rates: relief, never tax', () => {
  // 5,000 miles are £2,750 at 55p.
  for (const [employerRate, relief] of [
    [0, 2750],
    [0.2, 1750],
    [0.25, 1500],
    [0.45, 500],
    [0.5, 250],
    [0.549, 5],
  ]) {
    const result = mileage({ miles: 5000, employerRate, pay: 35000 })
    assert.equal(result.relief, relief, `${employerRate}`)
    assert.equal(result.taxable, 0)
    assert.equal(result.niLiable, 0)
  }
})

test('mileage [own working] motorcycles and bicycles have one rate for every mile', () => {
  for (const year of BOTH_YEARS) {
    const motorcycle = mileage(
      { vehicle: 'motorcycle', miles: 15000, employerRate: 0, pay: 35000 },
      year,
    )
    assert.equal(motorcycle.approved, 3600)
    assert.equal(motorcycle.bands.length, 1)
    const bicycle = mileage({ vehicle: 'bicycle', miles: 1000, employerRate: 0, pay: 35000 }, year)
    assert.equal(bicycle.relief, 200)
  }
  // Paid 30p a mile on a motorcycle: 6p over, taxable and liable to NI.
  const over = mileage({ vehicle: 'motorcycle', miles: 15000, employerRate: 0.3, pay: 35000 })
  assert.deepEqual([over.taxable, over.niFreeRate, over.niLiable], [900, 0.24, 900])
  // A rate above 10,000 miles and passengers are for cars and vans only.
  const ignored = mileage({
    vehicle: 'bicycle',
    miles: 12000,
    employerRate: 0.1,
    employerRateAbove: 5,
    passengerMiles: 100,
    passengers: 3,
    passengerRate: 1,
    pay: 35000,
  })
  assert.deepEqual([ignored.paid, ignored.passenger.miles, ignored.passenger.paid], [1200, 0, 0])
})

test('mileage [own working] passengers: over 5p is taxable, and miles cannot exceed business miles', () => {
  const settings = { miles: 5000, employerRate: 0.55, pay: 35000 }
  const over = mileage({ ...settings, passengerMiles: 1000, passengers: 2, passengerRate: 0.07 })
  assert.deepEqual(
    [over.passenger.miles, over.passenger.paid, over.passenger.taxFree, over.passenger.taxable],
    [2000, 140, 100, 40],
  )
  assert.deepEqual([over.kind, over.headline, over.niLiable], ['taxable', 40, 40])
  // Exactly 5p: all tax-free.
  const exact = mileage({ ...settings, passengerMiles: 1000, passengers: 2, passengerRate: 0.05 })
  assert.deepEqual([exact.passenger.taxable, exact.kind], [0, 'even'])
  // Passenger miles are capped at the business miles.
  const capped = mileage({ ...settings, passengerMiles: 9000, passengers: 1, passengerRate: 0.05 })
  assert.equal(capped.passenger.miles, 5000)
})

test('mileage [own working] relief and taxable passenger payments in the same year', () => {
  // £600 relief, and £40 of taxable passenger payments: tax on £560 less pay.
  const result = mileage({ ...DEFAULTS, passengerMiles: 1000, passengers: 2, passengerRate: 0.07 })
  assert.deepEqual([result.kind, result.headline, result.taxableInAll], ['relief', 600, 40])
  close(result.taxSaved, 112, 'tax saved')
  // Passenger payments worth more than the relief: tax goes up overall.
  const more = mileage({
    miles: 1000,
    employerRate: 0.54,
    passengerMiles: 1000,
    passengers: 4,
    passengerRate: 0.1,
    pay: 35000,
  })
  assert.deepEqual([more.relief, more.passenger.taxable], [10, 200])
  close(more.extraTax, 38, 'extra tax')
  assert.equal(more.taxSaved, 0)
})

test('mileage [own working] the tax relief saves at each band edge', () => {
  // 10,000 miles at 45p leaves £1,000 of relief.
  const relief = { miles: 10000, employerRate: 0.45 }
  const expected = [
    [0, 0], // no tax to save
    [12570, 0],
    [13000, 86], // never more than the tax paid: 20% of £430
    [35000, 200],
    [50270, 200], // the higher rate threshold: all of it at 20%
    [50770, 300], // half at 40%, half at 20%
    [51270, 400],
    [110000, 600], // in the Personal Allowance taper: 60%
    [200000, 450],
  ]
  for (const [pay, saved] of expected) {
    for (const year of BOTH_YEARS) {
      const result = mileage({ ...relief, pay }, year)
      assert.equal(result.relief, 1000)
      close(result.taxSaved, saved, `£${pay} in ${year}`)
    }
  }
})

test('mileage [own working] Scottish rates, with 2026/27 ones for 2027/28', () => {
  // £40,000 is in the Scottish intermediate band, 21%.
  const scottish = { ...DEFAULTS, miles: 10000, pay: 40000, scottish: true }
  const [now, next] = BOTH_YEARS.map((year) => mileage(scottish, year))
  close(now.taxSaved, 210, 'tax saved in 2026/27')
  close(next.taxSaved, 210, 'tax saved in 2027/28')
  assert.equal(now.taxRatesYear, '2026/27')
  assert.equal(next.taxRatesYear, '2026/27')
  assert.equal(mileage({ ...DEFAULTS }, '2027/28').taxRatesYear, '2027/28')
  // There are no 2027/28 National Insurance rates in the tables yet.
  assert.equal(next.niRatesYear, '2026/27')
})

test('mileage [own working] blank, negative and very high figures', () => {
  for (const bad of [-5, NaN, undefined]) {
    const result = mileage({ miles: bad, employerRate: bad, pay: bad })
    assert.deepEqual([result.miles, result.approved, result.paid, result.taxSaved], [0, 0, 0, 0])
  }
  // A million miles and nothing paid: the relief is more than the pay, so it
  // saves all the tax on the pay and no more.
  const [now, next] = BOTH_YEARS.map((year) =>
    mileage({ miles: 1000000, employerRate: 0, pay: 60000 }, year),
  )
  assert.equal(now.approved, 253000)
  assert.equal(next.approved, 352000)
  close(now.taxSaved, calculateIncomeTax(60000).tax, 'all the tax on the pay')
  // A million miles at £1: taxable above the approved amount.
  const paidLots = mileage({ miles: 1000000, employerRate: 1, pay: 60000 })
  assert.deepEqual([paidLots.taxable, paidLots.niLiable], [747000, 450000])
})

test('mileage [own working] an unknown kind of vehicle is refused', () => {
  assert.throws(() => mileage({ vehicle: 'lorry', miles: 10, employerRate: 0, pay: 0 }))
})
