// Tests for the pay rise calculator, for the 2026/27 figures. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a worked example or published rule on gov.uk, checked on 9 October 2026
//   [own working] worked out by hand from the published rates and rules
//
// The tax, National Insurance and student loan steps underneath are tested
// against gov.uk in calculations.test.js. Each salary is worked out by the
// take-home calculator, so National Insurance is worked out on each pay day
// with the monthly thresholds, £1,048 and £4,189 (£12,576 and £50,268 over 12
// months), not the yearly £12,570 and £50,270.
//
// https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief
// https://www.gov.uk/guidance/adjusted-net-income
// https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye
// https://www.gov.uk/scottish-income-tax (checked on 11 October 2026)

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateIncomeTax } from './incomeTax.js'
import { calculatePayPackage, calculatePayRise, newSalaryFrom, riseEnteredAs } from './payRise.js'
import { readTaxCode, taxRatesFor } from './readTaxCode.js'
import { calculateTakeHomePay } from './takeHome.js'

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

test('pay rise [own working] the same salary gives the same take-home as the take-home page', () => {
  const salaries = [0, 12570, 30000, 45000, 50270, 60000, 100000, 110000, 125140, 200000]
  const settings = [
    {},
    { plan: 'plan2', hasPostgraduateLoan: true },
    { pensionPercent: 5, pensionType: 'salarySacrifice', plan: 'plan1' },
    { pensionPercent: 8, pensionType: 'netPay', plan: 'plan5' },
    { pensionPercent: 5, pensionType: 'reliefAtSource', plan: 'plan4' },
    { pensionYearlyAmount: 2400, pensionType: 'salarySacrifice' },
    { payFrequency: 'weekly', plan: 'plan2', pensionPercent: 3 },
    { taxCode: '1257L' },
    { taxCode: 'K475', payFrequency: 'weekly' },
    { taxCode: 'BR' },
    { taxCode: 'S1257L', region: 'scotland', plan: 'plan4' },
    { taxCode: 'C1257L' },
    { region: 'scotland', pensionPercent: 5, pensionType: 'netPay' },
  ]
  for (const { taxCode: text, region = 'restOfUk', ...setting } of settings) {
    const taxCode = text ? readTaxCode(text).value : null
    const where = taxRatesFor(taxCode, region)
    for (const salary of salaries) {
      const ours = calculatePayPackage({ salary, taxCode, ...where, ...setting })
      const page = calculateTakeHomePay({ pay: salary, taxCode, ...where, ...setting })
      const label = `${salary} ${text ?? ''} ${JSON.stringify(setting)}:`
      assert.equal(ours.takeHomeAnnual, page.takeHomeAnnual, `take-home on ${label}`)
      assert.equal(ours.incomeTax, page.incomeTax, `income tax on ${label}`)
      assert.equal(ours.nationalInsurance, page.nationalInsurance, `NI on ${label}`)
      assert.equal(ours.studentLoan, page.studentLoan, `student loan on ${label}`)
    }
  }
})

test('pay rise [own working] £45,000 to £55,000 crosses the higher rate at £50,270', () => {
  const result = rise(45000, 55000)
  // Before: tax £6,486, NI (£45,000 - £12,576) at 8% is £2,593.92.
  // After: tax £9,432, NI £37,692 at 8% + £4,732 at 2% is £3,110.
  near(result.before.takeHomeAnnual, 35920.08)
  near(result.after.takeHomeAnnual, 42458)
  near(result.goesTo.incomeTax, 2946) // £5,270 at 20% + £4,730 at 40%
  near(result.goesTo.nationalInsurance, 516.08) // £5,268 at 8% + £4,732 at 2%
  near(result.kept, 6537.92)
  near(result.keptShare, 0.653792)
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
  near(cut.kept, -6537.92)
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
  near(result.nationalInsurance, 3150) // £3,015.36 + £6,732 at 2%
  assert.equal(result.studentLoan, 2484) // £4,750 - £2,448 = £2,302 a month, 9% is £207.18
  near(result.takeHomeAnnual, 57000 - 10232 - 3150 - 2484)
  assert.equal(result.extraReliefToClaim, 0)
})

test('pay rise [own working] net pay lowers income tax only', () => {
  // £60,000 with 5%: tax is worked out on £57,000, NI and student loan on £60,000.
  const result = pack(60000, 'netPay', 5, { plan: 'plan2' })
  assert.equal(result.pensionFromPay, 3000)
  assert.equal(result.taxablePay, 57000)
  assert.equal(result.niablePay, 60000)
  near(result.incomeTax, 10232)
  near(result.nationalInsurance, 3210) // £3,015.36 + £9,732 at 2%
  assert.equal(result.studentLoan, 2748) // £5,000 - £2,448 = £2,552 a month, 9% is £229.68
  near(result.takeHomeAnnual, 60000 - 3000 - 10232 - 3210 - 2748)
  assert.equal(result.extraReliefToClaim, 0)
})

test('pay rise [own working] relief at source leaves the payslip alone', () => {
  // £60,000 with 5%: £3,000 goes into the pension, £2,400 from pay and £600 from HMRC.
  const result = pack(60000, 'reliefAtSource')
  assert.equal(result.pensionIntoPot, 3000)
  assert.equal(result.pensionFromPay, 2400)
  assert.equal(result.hmrcTopUp, 600)
  near(result.incomeTax, 11432) // the same as with no pension
  near(result.nationalInsurance, 3210)
  near(result.takeHomeAnnual, 60000 - 11432 - 3210 - 2400)
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

test('pay rise [own working] the worked examples in the £100,000 tax trap guide', () => {
  // A £10,000 rise from £100,000: 40% tax on the rise is £4,000, and losing
  // £5,000 of allowance costs another £2,000. NI at 2% is £200.
  const inTrap = calculatePayRise({ currentSalary: 100000, newSalary: 110000 })
  near(inTrap.goesTo.incomeTax, 6000)
  near(inTrap.goesTo.nationalInsurance, 200)
  near(inTrap.kept, 3800)
  // The same rise below the taper: 40% tax and 2% NI.
  near(calculatePayRise({ currentSalary: 80000, newSalary: 90000 }).kept, 5800)
  // £10,000 of a £110,000 salary into a pension by salary sacrifice gives up
  // the same £3,800 of take-home pay and brings the allowance back.
  const noPension = calculatePayPackage({ salary: 110000 })
  const withPension = calculatePayPackage({
    salary: 110000,
    pensionPercent: (10000 / 110000) * 100,
    pensionType: 'salarySacrifice',
  })
  near(withPension.pensionIntoPot, 10000)
  near(withPension.adjustedNetIncome, 100000)
  assert.equal(withPension.personalAllowanceUsed, 12570)
  near(noPension.takeHomeAnnual - withPension.takeHomeAnnual, 3800)
})

// ---------------------------------------------------------------------------
// Scottish taxpayers
// ---------------------------------------------------------------------------

const scot = { scottish: true }

test('Scottish pay rise [own working] no pension or loan matches the take-home page', () => {
  for (const salary of [0, 12570, 16537, 29526, 43662, 47000, 50270, 75000, 110000, 200000]) {
    const result = calculatePayPackage({ salary, ...scot })
    const takeHome = calculateTakeHomePay({ pay: salary, ...scot })
    assert.equal(result.takeHomeAnnual, takeHome.takeHomeAnnual, `take-home on ${salary}:`)
    assert.equal(result.incomeTax, takeHome.incomeTax, `income tax on ${salary}:`)
    assert.equal(result.nationalInsurance, takeHome.nationalInsurance, `NI on ${salary}:`)
  }
})

test('Scottish pay rise [own working] the worked examples shown in the guide', () => {
  // £35,000 to £38,000 is all at the 21% intermediate rate, with 8% NI.
  const intermediate = rise(35000, 38000, scot)
  near(intermediate.goesTo.incomeTax, 630)
  near(intermediate.goesTo.nationalInsurance, 240)
  near(intermediate.kept, 2130)
  near(intermediate.keptShare, 0.71)
  assert.deepEqual(intermediate.warnings, [])
  // £45,000 to £49,000 is all at the 42% higher rate, and NI is still 8%.
  const overlap = rise(45000, 49000, scot)
  near(overlap.goesTo.incomeTax, 1680)
  near(overlap.goesTo.nationalInsurance, 320)
  near(overlap.kept, 2000)
  near(overlap.keptShare, 0.5)
  assert.deepEqual(overlap.warnings, [])
  // The same rise in the rest of the UK is at 20% and 8%.
  near(rise(45000, 49000).kept, 2880)
})

test('Scottish pay rise [own working] rises across the higher and advanced rates', () => {
  // £40,000 to £46,000: £3,662 at 21% and £2,338 at 42%.
  const acrossHigher = rise(40000, 46000, scot)
  near(acrossHigher.goesTo.incomeTax, 1750.98)
  near(acrossHigher.goesTo.nationalInsurance, 480)
  near(acrossHigher.kept, 3769.02)
  assert.deepEqual(acrossHigher.warnings, ['higher-rate'])
  // £45,000 to £55,000: all at 42%. NI is 8% on £5,268 and 2% on £4,732.
  const acrossNiLimit = rise(45000, 55000, scot)
  near(acrossNiLimit.goesTo.incomeTax, 4200)
  near(acrossNiLimit.goesTo.nationalInsurance, 516.08)
  near(acrossNiLimit.kept, 5283.92)
  assert.deepEqual(acrossNiLimit.warnings, []) // £50,270 is not a tax threshold in Scotland
  // £70,000 to £80,000: £5,000 at 42% and £5,000 at 45%, with 2% NI.
  const acrossAdvanced = rise(70000, 80000, scot)
  near(acrossAdvanced.goesTo.incomeTax, 4350)
  near(acrossAdvanced.kept, 5450)
  assert.deepEqual(acrossAdvanced.warnings, ['advanced-rate'])
})

test('Scottish pay rise [own working] which thresholds give a warning', () => {
  // The higher rate starts above £43,662, not £50,270.
  assert.deepEqual(rise(42000, 43662, scot).warnings, [])
  assert.deepEqual(rise(42000, 43663, scot).warnings, ['higher-rate'])
  assert.deepEqual(rise(43662, 45000, scot).warnings, ['higher-rate']) // first pound over is in the rise
  assert.deepEqual(rise(43663, 45000, scot).warnings, []) // already over
  assert.deepEqual(rise(48000, 52000, scot).warnings, [])
  // The advanced rate starts above £75,000.
  assert.deepEqual(rise(70000, 75000, scot).warnings, [])
  assert.deepEqual(rise(70000, 75001, scot).warnings, ['advanced-rate'])
  assert.deepEqual(rise(75000, 80000, scot).warnings, ['advanced-rate'])
  assert.deepEqual(rise(75001, 80000, scot).warnings, [])
  // No warning for the one point steps at £16,537 and £29,526.
  assert.deepEqual(rise(15000, 18000, scot).warnings, [])
  assert.deepEqual(rise(28000, 31000, scot).warnings, [])
  // The taper, the Child Benefit charge and student loans are the same across the UK.
  assert.deepEqual(rise(59000, 60001, scot).warnings, ['child-benefit'])
  assert.deepEqual(rise(98000, 100002, scot).warnings, ['taper'])
  assert.deepEqual(rise(29000, 31000, { plan: 'plan2', ...scot }).warnings, ['student-loan'])
  assert.deepEqual(rise(40000, 80000, scot).warnings, [
    'higher-rate',
    'advanced-rate',
    'child-benefit',
  ])
  // Outside Scotland nothing has moved, and there is no advanced rate.
  assert.deepEqual(rise(42000, 45000).warnings, [])
  assert.deepEqual(rise(48000, 50271).warnings, ['higher-rate'])
  assert.deepEqual(rise(70000, 80000).warnings, [])
})

test('Scottish pay rise [own working] the taper and the top rate', () => {
  // £95,000 to £105,000: £10,000 at 45% is £4,500. £2,500 of allowance is lost,
  // taxed at 45%: another £1,125.
  const across = rise(95000, 105000, scot)
  near(across.goesTo.incomeTax, 5625)
  near(across.goesTo.nationalInsurance, 200)
  near(across.kept, 4175)
  assert.deepEqual(across.warnings, ['taper'])
  // Wholly inside the taper: every £100 loses £67.50 in tax and £2 in NI.
  const inside = rise(105000, 115000, scot)
  near(inside.goesTo.incomeTax, 6750)
  near(inside.kept, 3050)
  assert.deepEqual(inside.warnings, ['inside-taper'])
  // Above £125,140: 48% tax and 2% NI.
  const above = rise(130000, 140000, scot)
  near(above.goesTo.incomeTax, 4800)
  near(above.kept, 5000)
  assert.deepEqual(above.warnings, [])
})

test('Scottish pay rise [own working] salary sacrifice and net pay give relief at Scottish rates', () => {
  // £60,000 with 5%: tax on £57,000 is £6,320.09 + £13,338 at 42%.
  const sacrifice = pack(60000, 'salarySacrifice', 5, scot)
  near(sacrifice.incomeTax, 11922.05)
  near(sacrifice.nationalInsurance, 3150) // the same as outside Scotland
  near(sacrifice.takeHomeAnnual, 57000 - 11922.05 - 3150)
  assert.equal(sacrifice.extraReliefToClaim, 0)
  const netPay = pack(60000, 'netPay', 5, scot)
  near(netPay.incomeTax, 11922.05)
  near(netPay.nationalInsurance, 3210)
  assert.equal(netPay.extraReliefToClaim, 0)
  // Either way the £3,000 saves 42% tax: £1,260.
  near(pack(60000, 'netPay', 0, scot).incomeTax - netPay.incomeTax, 1260)
})

test('Scottish pay rise [gov.uk] relief at source: 20% from the provider, the rest by claiming', () => {
  // gov.uk, "If you pay Income Tax above 20% (Scotland)": you can claim
  // "1% up to the amount of any income you have paid 21% tax on, 22% up to the
  // amount of any income you have paid 42% tax on, 25% up to the amount of any
  // income you have paid 45% tax on, 28% up to the amount of any income you
  // have paid 48% tax on".
  const claim = (salary, percent = 5) =>
    pack(salary, 'reliefAtSource', percent, scot).extraReliefToClaim
  near(claim(35000), 17.5) // 1% of £1,750
  near(claim(60000), 660) // 22% of £3,000
  near(claim(80000), 1000) // 25% of £4,000
  near(claim(200000), 2800) // 28% of £10,000
  // "Up to the amount": £45,000 has £1,338 taxed at 42%, so £2,250 gets 22% on
  // £1,338 and 1% on the other £912.
  near(claim(45000), 294.36 + 9.12)
  // £76,000 has £1,000 taxed at 45%: 25% on that and 22% on the other £2,800.
  near(claim(76000), 250 + 616)
  // £31,000 has £1,474 taxed at 21%. Of £3,100, the rest was taxed at 20%.
  near(claim(31000, 10), 14.74)
  // Nothing more for someone whose top rate is 20%.
  assert.equal(claim(25000), 0)

  // The payslip is taxed in full, and the provider adds 20% whatever the rate.
  const higher = pack(60000, 'reliefAtSource', 5, scot)
  near(higher.incomeTax, 13182.05) // the same as with no pension
  assert.equal(higher.pensionFromPay, 2400)
  assert.equal(higher.hmrcTopUp, 600)
  assert.equal(higher.adjustedNetIncome, 57000)

  // "If your rate of Income Tax in Scotland is 19% your pension provider will
  // claim tax relief for you at a rate of 20%. You do not need to pay the difference."
  const starter = pack(15000, 'reliefAtSource', 5, scot)
  assert.equal(starter.topTaxRate, 0.19)
  assert.equal(starter.pensionIntoPot, 750)
  assert.equal(starter.hmrcTopUp, 150)
  assert.equal(starter.extraReliefToClaim, 0)
})

test('Scottish pay rise [own working] relief at source and the personal allowance', () => {
  // £105,000 with 5%: the payslip is taxed as £105,000, with £2,500 of allowance
  // lost. Adjusted net income is £99,750, so the full allowance is due. The claim
  // is 25% of £5,250 (£1,312.50) plus £2,500 of allowance at 45% (£1,125).
  const result = pack(105000, 'reliefAtSource', 5, scot)
  near(result.incomeTax, 34107.05)
  near(result.extraReliefToClaim, 2437.5)
  const crossing = rise(95000, 105000, {
    pensionPercent: 5,
    pensionType: 'reliefAtSource',
    ...scot,
  })
  assert.deepEqual(crossing.warnings, ['taper-reclaim'])
  // £130,000 with 5%: £6,500 goes in and adjusted net income is £123,500, which
  // brings back £820 of allowance. 28% on the £4,860 taxed at 48%, 25% on the
  // other £1,640, and £820 at 45%.
  near(pack(130000, 'reliefAtSource', 5, scot).extraReliefToClaim, 1360.8 + 410 + 369)
})

test('Scottish pay rise [own working] the pieces always add up to the rise', () => {
  const settings = [
    {},
    { plan: 'plan4', hasPostgraduateLoan: true },
    { pensionPercent: 8, pensionType: 'salarySacrifice', plan: 'plan4' },
    { pensionPercent: 8, pensionType: 'netPay', plan: 'plan1' },
    { pensionPercent: 8, pensionType: 'reliefAtSource', plan: 'plan2', hasPostgraduateLoan: true },
  ]
  for (const setting of settings) {
    for (const [from, to] of [
      [15000, 19000],
      [28000, 32000],
      [42000, 52000],
      [72000, 78000],
      [97000, 104000],
      [120000, 135000],
    ]) {
      const { rise: total, kept, goesTo } = rise(from, to, { ...setting, ...scot })
      const parts =
        kept + goesTo.incomeTax + goesTo.nationalInsurance + goesTo.studentLoan + goesTo.pension
      near(parts, total, `${JSON.stringify(setting)} ${from} to ${to}:`)
      assert.ok(kept > 0 && kept < total, `${from} to ${to}: kept ${kept}`)
    }
  }
})

// ---------------------------------------------------------------------------
// Entering the rise three ways
// ---------------------------------------------------------------------------

test('pay rise [own working] a rise entered as a new salary, a percentage or pounds', () => {
  near(newSalaryFrom(45000, 'newSalary', 55000), 55000)
  near(newSalaryFrom(45000, 'percent', 10), 49500)
  near(newSalaryFrom(45000, 'pounds', 2000), 47000)
  near(newSalaryFrom(45000, 'percent', 0), 45000)
})

test('pay rise [own working] switching how the rise is entered keeps the same rise', () => {
  // £45,000 to £55,000 is a rise of £10,000, or 22.2222% to four places.
  assert.equal(riseEnteredAs('newSalary', 45000, 55000), 55000)
  assert.equal(riseEnteredAs('pounds', 45000, 55000), 10000)
  assert.equal(riseEnteredAs('percent', 45000, 55000), 22.2222)
  // Switching back from the percentage gives the same whole pounds.
  assert.equal(riseEnteredAs('newSalary', 45000, newSalaryFrom(45000, 'percent', 22.2222)), 55000)
  // With no current salary there is no percentage to show.
  assert.equal(riseEnteredAs('percent', 0, 30000), 0)
  // Amounts are whole pounds.
  assert.equal(riseEnteredAs('pounds', 45000, 49500.4), 4500)
})

test('pay rise [own working] pay a month or an hour keeps the pence when switching', () => {
  // £3,750 a month to £55,000 a year (£4,583.33 a month) is £833.33 a month.
  assert.equal(riseEnteredAs('pounds', 3750, 55000 / 12, 2), 833.33)
  assert.equal(riseEnteredAs('newSalary', 3750, 55000 / 12, 2), 4583.33)
  assert.equal(riseEnteredAs('percent', 3750, 55000 / 12, 2), 22.2222)
})

// ---------------------------------------------------------------------------
// A tax code and a pension in pounds, as on the take-home calculator. Code
// allowances are payroll's (HMRC's tax tables, tested in takeHome.test.js):
// 1257L is £12,579.12 a year for someone paid monthly.
// ---------------------------------------------------------------------------

const code = (text) => readTaxCode(text).value

test('pay rise [own working] no tax code gives the same result as before', () => {
  for (const [from, to] of [
    [45000, 55000],
    [95000, 105000],
    [20000, 30000],
  ]) {
    assert.deepEqual(rise(from, to, { taxCode: null }), rise(from, to))
  }
})

test('pay rise [own working] 1257L uses payroll tax-free pay of £12,579.12', () => {
  const result = rise(45000, 55000, { taxCode: code('1257L') })
  // Before: (£45,000 − £12,579.12) at 20% is £6,484.18.
  near(result.before.incomeTax, 6484.176)
  // After: £37,700 at 20% is £7,540, and (£55,000 − £12,579.12 − £37,700) at
  // 40% is £1,888.35, so £9,428.35.
  near(result.after.incomeTax, 9428.352)
  near(result.goesTo.incomeTax, 2944.176)
  // The higher rate starts £9.12 later than with the Personal Allowance.
  near(result.thresholds.higherRate, 50279.12)
  assert.deepEqual(result.warnings, ['higher-rate'])
  // NI does not depend on the code: £516.08 of the rise, as without one.
  near(result.goesTo.nationalInsurance, 516.08)
})

test('pay rise [own working] a BR code taxes all pay at 20%, with no thresholds', () => {
  const result = rise(45000, 55000, { taxCode: code('BR') })
  near(result.before.incomeTax, 9000)
  near(result.after.incomeTax, 11000)
  assert.deepEqual(result.warnings, [])
})

test('pay rise [own working] payroll does not taper a code above £100,000', () => {
  const result = rise(95000, 105000, { taxCode: code('1257L') })
  // £10,000 at 40%, with no allowance lost.
  near(result.goesTo.incomeTax, 4000)
  assert.deepEqual(result.warnings, ['taper-code'])
})

test('pay rise [own working] a K code takes no more than half the pay', () => {
  // K1500 adds £15,009.12 a year to taxable pay.
  const result = rise(9000, 10000, { taxCode: code('K1500') })
  // £24,009.12 at 20% is £4,801.82, more than half of £9,000.
  near(result.before.incomeTax, 4500)
  near(result.before.taxNotTaken, 301.824)
  // £25,009.12 at 20% is £5,001.82, more than half of £10,000.
  near(result.after.incomeTax, 5000)
  near(result.after.taxNotTaken, 1.824)
  assert.deepEqual(result.warnings, ['tax-limit'])
})

test('Scottish pay rise [own working] S1257L moves the higher rate to £43,671.12', () => {
  const result = rise(40000, 46000, { taxCode: code('S1257L'), scottish: true })
  near(result.thresholds.higherRate, 43671.12)
  // £3,671.12 at 21% is £770.94, and £2,328.88 at 42% is £978.13.
  near(result.goesTo.incomeTax, 1749.0648)
  assert.deepEqual(result.warnings, ['higher-rate'])
})

test('pay rise [own working] a C code names the Welsh rates', () => {
  const result = rise(30000, 33000, { taxCode: code('C1257L'), welsh: true })
  // The Welsh rates are the same as England's in 2026/27: £3,000 at 20%.
  near(result.goesTo.incomeTax, 600)
  assert.equal(result.working[0].lines[1].label, 'Income tax (Welsh rates)')
})

test('pay rise [own working] a pension in pounds', () => {
  const result = pack(45000, 'salarySacrifice', 0, { pensionYearlyAmount: 2400 })
  near(result.pensionIntoPot, 2400)
  // Tax on £42,600: (£42,600 − £12,570) at 20% is £6,006. NI is
  // (£42,600 − £12,576) at 8%, £2,401.92.
  near(result.incomeTax, 6006)
  near(result.nationalInsurance, 2401.92)
  near(result.takeHomeAnnual, 34192.08)
})
