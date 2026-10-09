// Tests for the pay rise calculator, for the 2026/27 figures. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example or published rule on gov.uk, checked on 9 October 2026
//   [own working] worked out by hand from the published rates and rules
//
// The tax, National Insurance and student loan steps underneath are tested
// against gov.uk in calculations.test.js.
//
// https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief
// https://www.gov.uk/guidance/adjusted-net-income
// https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateIncomeTax, calculateTakeHome } from './calculations.js'
import { calculatePayPackage, calculatePayRise } from './payRise.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const pack = (salary, pensionType, pensionPercent = 5, extra = {}) =>
  calculatePayPackage({ salary, pensionType, pensionPercent, ...extra })

const rise = (currentSalary, newSalary, settings = {}) =>
  calculatePayRise({ currentSalary, newSalary, ...settings })

// ---------------------------------------------------------------------------
// With no pension and no student loan
// ---------------------------------------------------------------------------

test('pay rise [own working] no pension or loan matches the take-home calculator', () => {
  for (const salary of [0, 12570, 30000, 50270, 60000, 100000, 110000, 125140, 200000]) {
    const result = calculatePayPackage({ salary })
    const takeHome = calculateTakeHome(salary)
    near(result.takeHomeAnnual, takeHome.takeHomeAnnual, `take-home on ${salary}:`)
    near(result.incomeTax, takeHome.incomeTax, `income tax on ${salary}:`)
    near(result.nationalInsurance, takeHome.nationalInsurance, `NI on ${salary}:`)
  }
})

test('pay rise [own working] £45,000 to £55,000 crosses the higher rate at £50,270', () => {
  const result = rise(45000, 55000)
  // Before: tax £6,486, NI £2,594.40. After: tax £9,432, NI £3,110.60.
  near(result.before.takeHomeAnnual, 35919.6)
  near(result.after.takeHomeAnnual, 42457.4)
  near(result.goesTo.incomeTax, 2946) // £5,270 at 20% + £4,730 at 40%
  near(result.goesTo.nationalInsurance, 516.2) // £5,270 at 8% + £4,730 at 2%
  near(result.kept, 6537.8)
  near(result.keptShare, 0.65378)
  assert.deepEqual(result.warnings, ['higher-rate'])
})

test('pay rise [own working] £95,000 to £105,000 crosses the £100,000 taper', () => {
  const result = rise(95000, 105000)
  // £10,000 at 40% is £4,000. £2,500 of allowance is lost, taxed at 40%: another £1,000.
  near(result.goesTo.incomeTax, 5000)
  near(result.goesTo.nationalInsurance, 200) // 2% of £10,000
  near(result.kept, 4800)
  near(result.keptShare, 0.48)
  assert.deepEqual(result.warnings, ['taper'])
})

test('pay rise [own working] band boundaries: a rise that stops on a limit does not cross it', () => {
  assert.deepEqual(rise(48000, 50270).warnings, [])
  assert.deepEqual(rise(48000, 50271).warnings, ['higher-rate'])
  assert.deepEqual(rise(50270, 52000).warnings, ['higher-rate']) // first pound over is in the rise
  assert.deepEqual(rise(50271, 52000).warnings, []) // already over
  assert.deepEqual(rise(98000, 100000).warnings, [])
  assert.deepEqual(rise(98000, 100002).warnings, ['taper'])
  assert.deepEqual(rise(59000, 60000).warnings, [])
  assert.deepEqual(rise(59000, 60001).warnings, ['child-benefit'])
})

test('pay rise [own working] inside and beyond the taper', () => {
  // Wholly inside the taper: every £100 loses £60 in tax and £2 in NI.
  const inside = rise(105000, 115000)
  near(inside.goesTo.incomeTax, 6000)
  near(inside.kept, 3800)
  assert.deepEqual(inside.warnings, ['inside-taper'])
  // Above £125,140 the allowance has gone, so the rate drops back to 45% + 2%.
  const above = rise(130000, 140000)
  near(above.goesTo.incomeTax, 4500)
  near(above.kept, 5300)
  assert.deepEqual(above.warnings, [])
})

test('pay rise [own working] the pieces always add up to the rise', () => {
  const settings = [
    {},
    { plan: 'plan2', hasPostgraduateLoan: true },
    { pensionPercent: 8, pensionType: 'salarySacrifice', plan: 'plan1' },
    { pensionPercent: 8, pensionType: 'netPay', plan: 'plan5' },
    { pensionPercent: 8, pensionType: 'reliefAtSource', plan: 'plan4', hasPostgraduateLoan: true },
  ]
  for (const setting of settings) {
    for (const [from, to] of [
      [20000, 26000],
      [48000, 53000],
      [97000, 104000],
      [120000, 135000],
    ]) {
      const { rise: total, kept, goesTo } = rise(from, to, setting)
      const parts =
        kept + goesTo.incomeTax + goesTo.nationalInsurance + goesTo.studentLoan + goesTo.pension
      near(parts, total, `${JSON.stringify(setting)} ${from} to ${to}:`)
      assert.ok(kept > 0 && kept < total, `${from} to ${to}: kept ${kept}`)
    }
  }
})

test('pay rise [own working] no rise, a pay cut and blank input', () => {
  const none = rise(40000, 40000)
  assert.equal(none.rise, 0)
  assert.equal(none.kept, 0)
  assert.equal(none.keptShare, 0)
  assert.deepEqual(none.warnings, [])
  const cut = rise(55000, 45000)
  near(cut.kept, -6537.8)
  assert.equal(cut.keptShare, 0)
  assert.deepEqual(cut.warnings, [])
  const blank = rise(NaN, -5)
  assert.equal(blank.rise, 0)
  assert.equal(blank.after.takeHomeAnnual, 0)
})

// ---------------------------------------------------------------------------
// Student loans
// ---------------------------------------------------------------------------

test('pay rise [own working] a rise that starts student loan repayments', () => {
  // Plan 2: £29,000 is £2,416.67 a month, under the £2,448 threshold.
  // £31,000 is £2,583.33 a month: 9% of £135.33 is £12.18, so £12 a month.
  const result = rise(29000, 31000, { plan: 'plan2' })
  assert.equal(result.before.studentLoan, 0)
  assert.equal(result.goesTo.studentLoan, 144)
  assert.deepEqual(result.warnings, ['student-loan'])
  // Already repaying: no warning, and 9% of the rise goes on the loan.
  const repaying = rise(35000, 37000, { plan: 'plan2' })
  assert.equal(repaying.goesTo.studentLoan, 180)
  assert.deepEqual(repaying.warnings, [])
  // A Postgraduate Loan starts at £21,000.
  const postgrad = rise(20000, 23000, { hasPostgraduateLoan: true })
  assert.deepEqual(postgrad.warnings, ['postgraduate-loan'])
  assert.equal(postgrad.goesTo.studentLoan, 120) // 6% of £166.67 is £10 a month
})

// ---------------------------------------------------------------------------
// Pension types
// ---------------------------------------------------------------------------

test('pay rise [own working] salary sacrifice lowers tax, NI and student loan', () => {
  // £60,000 with 5%: £3,000 is given up, so everything is worked out on £57,000.
  const result = pack(60000, 'salarySacrifice', 5, { plan: 'plan2' })
  assert.equal(result.pensionIntoPot, 3000)
  assert.equal(result.pensionFromPay, 3000)
  assert.equal(result.niablePay, 57000)
  assert.equal(result.adjustedNetIncome, 57000)
  near(result.incomeTax, 10232) // £7,540 + £6,730 at 40%
  near(result.nationalInsurance, 3150.6) // £3,016 + £6,730 at 2%
  assert.equal(result.studentLoan, 2484) // £4,750 - £2,448 = £2,302 a month, 9% is £207.18
  near(result.takeHomeAnnual, 57000 - 10232 - 3150.6 - 2484)
  assert.equal(result.extraReliefToClaim, 0)
})

test('pay rise [own working] net pay lowers income tax only', () => {
  // £60,000 with 5%: tax is worked out on £57,000, NI and student loan on £60,000.
  const result = pack(60000, 'netPay', 5, { plan: 'plan2' })
  assert.equal(result.pensionFromPay, 3000)
  assert.equal(result.taxablePay, 57000)
  assert.equal(result.niablePay, 60000)
  near(result.incomeTax, 10232)
  near(result.nationalInsurance, 3210.6) // £3,016 + £9,730 at 2%
  assert.equal(result.studentLoan, 2748) // £5,000 - £2,448 = £2,552 a month, 9% is £229.68
  near(result.takeHomeAnnual, 60000 - 3000 - 10232 - 3210.6 - 2748)
  assert.equal(result.extraReliefToClaim, 0)
})

test('pay rise [own working] relief at source leaves the payslip alone', () => {
  // £60,000 with 5%: £3,000 goes into the pension, £2,400 from pay and £600 from HMRC.
  const result = pack(60000, 'reliefAtSource')
  assert.equal(result.pensionIntoPot, 3000)
  assert.equal(result.pensionFromPay, 2400)
  assert.equal(result.hmrcTopUp, 600)
  near(result.incomeTax, 11432) // the same as with no pension
  near(result.nationalInsurance, 3210.6)
  near(result.takeHomeAnnual, 60000 - 11432 - 3210.6 - 2400)
  // A higher rate taxpayer can claim another 20% of the £3,000.
  near(result.extraReliefToClaim, 600)
  assert.equal(result.adjustedNetIncome, 57000)
})

test('pay rise [gov.uk] extra relief at source relief matches the gov.uk example', () => {
  // "You earn £60,270 ... You pay £12,000 into a relief at source pension scheme ...
  // You can claim an extra 20% tax relief on £10,000 (the same amount you paid 40% tax on)
  // ... You do not get additional relief on the remaining £2,000."
  const payslip = calculateIncomeTax(60270).tax
  const afterClaim = calculateIncomeTax(60270, { reliefAtSourceGross: 12000 }).tax
  near(payslip - afterClaim, 2000) // 20% of £10,000
  // A basic rate taxpayer has nothing more to claim.
  assert.equal(pack(40000, 'reliefAtSource').extraReliefToClaim, 0)
})

test('pay rise [gov.uk] every pension type lowers adjusted net income', () => {
  // gov.uk: adjusted net income is "less ... pension contributions paid gross" and
  // "pension contributions where your pension provider has already given you tax
  // relief at the basic rate - take off the grossed-up amount". It is used for the
  // allowance reduction over £100,000 and the Child Benefit charge over £60,000.
  for (const type of ['salarySacrifice', 'netPay', 'reliefAtSource']) {
    assert.equal(pack(105000, type).adjustedNetIncome, 99750, type)
    // £95,000 to £105,000 with 5% going into a pension stays under £100,000.
    const result = rise(95000, 105000, { pensionPercent: 5, pensionType: type })
    assert.ok(!result.warnings.includes('taper'), type)
    // £58,000 to £63,000 stays under the Child Benefit threshold. £64,000 does not.
    assert.ok(
      !rise(58000, 63000, { pensionPercent: 5, pensionType: type }).warnings.includes(
        'child-benefit',
      ),
    )
    assert.ok(
      rise(58000, 64000, { pensionPercent: 5, pensionType: type }).warnings.includes(
        'child-benefit',
      ),
    )
  }
})

test('pay rise [own working] relief at source gets the personal allowance back by claiming', () => {
  // £105,000 with 5%: the payslip is taxed as £105,000, with £2,500 of allowance lost.
  // Adjusted net income is £99,750, so the full allowance is due. The claim is
  // 20% of £5,250 (£1,050) plus £2,500 of allowance at 40% (£1,000).
  const result = pack(105000, 'reliefAtSource')
  near(result.incomeTax, 30432)
  near(result.extraReliefToClaim, 2050)
  // The rise from £95,000 crosses £100,000 on the payslip only.
  const crossing = rise(95000, 105000, { pensionPercent: 5, pensionType: 'reliefAtSource' })
  assert.deepEqual(crossing.warnings, ['taper-reclaim'])
  near(crossing.goesTo.incomeTax, 5000)
  near(crossing.extraReliefChange, 1100) // £2,050 less the £950 claimable on £95,000
  near(crossing.kept, 4400)
})

test('pay rise [own working] £95,000 to £105,000 with each pension type at 5%', () => {
  const sacrifice = rise(95000, 105000, { pensionPercent: 5, pensionType: 'salarySacrifice' })
  near(sacrifice.goesTo.incomeTax, 3800) // 40% of £9,500
  near(sacrifice.goesTo.nationalInsurance, 190) // 2% of £9,500
  near(sacrifice.goesTo.pension, 500)
  near(sacrifice.kept, 5510)
  assert.deepEqual(sacrifice.warnings, [])

  const netPay = rise(95000, 105000, { pensionPercent: 5, pensionType: 'netPay' })
  near(netPay.goesTo.incomeTax, 3800)
  near(netPay.goesTo.nationalInsurance, 200) // 2% of the full £10,000
  near(netPay.kept, 5500)
  assert.deepEqual(netPay.warnings, [])

  const reliefAtSource = rise(95000, 105000, { pensionPercent: 5, pensionType: 'reliefAtSource' })
  near(reliefAtSource.goesTo.pension, 400) // 80% of £500
  near(reliefAtSource.pensionIntoPotChange, 500)
})

test('pay rise [gov.uk] salary sacrifice cannot take pay below the minimum wage', () => {
  // gov.uk: "A salary sacrifice arrangement must not reduce an employee's cash
  // earnings below the National Minimum Wage rates."
  // Full time at £12.71 an hour is £24,784.50 a year (37.5 hours, 52 weeks).
  const capped = pack(26000, 'salarySacrifice', 10)
  assert.equal(capped.sacrificeCapped, true)
  near(capped.pensionIntoPot, 1215.5) // not the £2,600 asked for
  near(capped.niablePay, 24784.5)
  // Already at or under the minimum: nothing can be sacrificed.
  const none = pack(24000, 'salarySacrifice', 5)
  assert.equal(none.pensionIntoPot, 0)
  assert.equal(none.sacrificeCapped, true)
  // Comfortably above it: no cap.
  assert.equal(pack(40000, 'salarySacrifice', 10).sacrificeCapped, false)
  // Fewer hours lower the floor: 20 hours a week is £13,218.40 a year.
  const partTime = pack(15000, 'salarySacrifice', 5, { weeklyHours: 20 })
  assert.equal(partTime.sacrificeCapped, false)
  assert.equal(partTime.pensionIntoPot, 750)
  // The cap only applies to salary sacrifice.
  assert.equal(pack(24000, 'netPay', 5).sacrificeCapped, false)
  assert.equal(pack(24000, 'reliefAtSource', 5).pensionIntoPot, 1200)
  // And it is flagged on the rise.
  assert.ok(rise(24000, 26000, { pensionPercent: 10 }).warnings.includes('minimum-wage'))
})

test('pay rise [own working] odd pension inputs', () => {
  assert.equal(pack(50000, 'netPay', 0).pensionIntoPot, 0)
  assert.equal(pack(50000, 'netPay', -5).pensionIntoPot, 0)
  assert.equal(pack(50000, 'netPay', NaN).pensionIntoPot, 0)
  // Over 100% is treated as 100%.
  const everything = pack(50000, 'netPay', 150)
  assert.equal(everything.pensionIntoPot, 50000)
  assert.equal(everything.incomeTax, 0)
  // A very high salary still adds up.
  const high = pack(1000000, 'salarySacrifice', 10)
  near(high.takeHomeAnnual, 900000 - high.incomeTax - high.nationalInsurance)
})
