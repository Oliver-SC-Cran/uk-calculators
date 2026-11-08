// Tests for the workplace pension calculator. Run with: npm test
//
// [gov.uk] values come from gov.uk pages, checked on 6 November 2026. [tpr]
// values come from The Pensions Regulator's table of automatic enrolment
// earnings thresholds for 2026/27, checked on 6 November 2026. [own working]
// values were worked out by hand from the 2026/27 rates. The pot itself is
// grown by the compound interest calculator, whose own tests check it against
// the closed-form formulas, and a test here checks the two agree.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateCompoundInterest } from './compoundInterest.js'
import {
  ANNUAL_ALLOWANCE,
  AUTO_ENROLMENT,
  LUMP_SUM,
  MINIMUM_PENSION_AGE_RISE,
  RELIEF_LIMIT,
  SALARY_SACRIFICE_CHANGE,
  STATE_PENSION,
} from './rates/pensions.js'
import { calculateTakeHomePay } from './takeHome.js'
import {
  calculateWorkplacePension,
  qualifyingEarnings,
  RELIEF_METHODS,
} from './workplacePension.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

// A working life with no growth, so the sums can be followed by hand.
const base = {
  age: 30,
  retirementAge: 67,
  salary: 30000,
  employeePercent: 5,
  employerPercent: 3,
  ratePercent: 0,
}
const pension = (settings) => calculateWorkplacePension({ ...base, ...settings })

// ---------------------------------------------------------------------------
// The figures
// ---------------------------------------------------------------------------

test('workplace pension [tpr] 2026/27 qualifying earnings and earnings trigger, a year, a month and a week', () => {
  assert.deepEqual(AUTO_ENROLMENT.qualifyingEarnings, { lower: 6240, upper: 50270 })
  assert.equal(AUTO_ENROLMENT.earningsTrigger, 10000)
  assert.deepEqual(AUTO_ENROLMENT.byPayPeriod.monthly, {
    lower: 520,
    upper: 4189,
    earningsTrigger: 833,
  })
  assert.deepEqual(AUTO_ENROLMENT.byPayPeriod.weekly, {
    lower: 120,
    upper: 967,
    earningsTrigger: 192,
  })
  // The charge cap on default funds.
  assert.equal(AUTO_ENROLMENT.defaultFundChargeCap, 0.0075)
})

test('workplace pension [gov.uk] minimum contributions: 8% in all, at least 3% from the employer', () => {
  assert.equal(AUTO_ENROLMENT.totalMinimum, 0.08)
  assert.equal(AUTO_ENROLMENT.employerMinimum, 0.03)
  assert.equal(AUTO_ENROLMENT.employeeMinimum, 0.05)
})

test('workplace pension [gov.uk] 2026/27 annual allowance, taper, MPAA, relief limit and lump sum allowances', () => {
  assert.equal(ANNUAL_ALLOWANCE.standard, 60000)
  assert.equal(ANNUAL_ALLOWANCE.moneyPurchase, 10000)
  assert.deepEqual(ANNUAL_ALLOWANCE.taper, {
    thresholdIncome: 200000,
    adjustedIncome: 260000,
    minimum: 10000,
  })
  assert.equal(ANNUAL_ALLOWANCE.carryForwardYears, 3)
  assert.equal(RELIEF_LIMIT.basicAmount, 3600)
  assert.equal(RELIEF_LIMIT.noEarningsPaidIn, 2880)
  assert.equal(LUMP_SUM.taxFreeShare, 0.25)
  assert.equal(LUMP_SUM.lumpSumAllowance, 268275)
  assert.equal(LUMP_SUM.lumpSumAndDeathBenefitAllowance, 1073100)
})

test('workplace pension [gov.uk] the full new State Pension is £241.30 a week in 2026/27, or £12,547.60 a year', () => {
  assert.equal(STATE_PENSION.fullWeekly, 241.3)
  assert.equal(STATE_PENSION.qualifyingYearsForFull, 35)
  near(STATE_PENSION.fullWeekly * 52, 12547.6)
})

test('workplace pension [gov.uk] the minimum pension age rises to 57 on 6 April 2028, and the salary sacrifice cap is £2,000', () => {
  assert.deepEqual(MINIMUM_PENSION_AGE_RISE, { now: 55, from: '6 April 2028', to: 57 })
  assert.equal(SALARY_SACRIFICE_CHANGE.niFreeLimit, 2000)
})

// ---------------------------------------------------------------------------
// gov.uk's examples
// ---------------------------------------------------------------------------

test('workplace pension [gov.uk] relief at source: you put in £40, your employer £30 and tax relief £10, so £80 goes in', () => {
  // gov.uk gives the amounts each pay day but not the pay. They are 5% and 3%
  // of £1,000 of qualifying earnings, so pay of £1,520 a month (£520 more).
  const r = pension({ salary: 1520 * 12, reliefType: 'reliefAtSource' })
  near(r.qualifyingEarnings.eachPayDay, 1000)
  near(r.chosen.cost / 12, 40)
  near(r.chosen.relief / 12, 10)
  near(r.employer / 12, 30)
  near(r.yearlyIntoPot / 12, 80)
})

test('workplace pension [gov.uk] relief at source: £12,000 paid in on £60,270 earns extra relief of 20% on £10,000', () => {
  // "You earn £60,270 ... You pay £12,000 into a relief at source pension
  // scheme." The scheme claims 20%, and 20% more is claimed on the £10,000
  // taxed at 40%. Through a net pay arrangement the cost is the same.
  const settings = {
    salary: 60270,
    basis: 'fullSalary',
    employeePercent: (12000 / 60270) * 100,
    employerPercent: 0,
  }
  const r = pension({ ...settings, reliefType: 'reliefAtSource' })
  near(r.chosen.intoPot, 12000)
  near(r.chosen.hmrcTopUp, 2400)
  near(r.chosen.extraClaim, 2000)
  near(r.chosen.cost, 7600)
  near(r.methods.netPay.cost, 7600)
  near(r.methods.netPay.incomeTaxSaved, 4400)
})

// ---------------------------------------------------------------------------
// Qualifying earnings
// ---------------------------------------------------------------------------

test('workplace pension [own working] qualifying earnings at the lower limit, the trigger and the upper limit', () => {
  const yearly = (salary, payFrequency = 'monthly') =>
    qualifyingEarnings(salary, { payFrequency }).yearly
  assert.equal(yearly(0), 0)
  assert.equal(yearly(6240), 0) // £520 a month, the lower limit itself
  near(yearly(6240.12), 0.12)
  near(yearly(10000), 3760)
  near(yearly(30000), 23760)
  // £50,270 is £4,189.17 a month, over the monthly upper limit of £4,189.
  near(yearly(50270), 44028)
  near(yearly(50270, 'weekly'), 44030)
  near(yearly(60000), 44028)
  near(yearly(60000, 'weekly'), 44044) // (£967 less £120) for 52 weeks
  near(yearly(10_000_000), 44028)
  assert.equal(yearly(-500), 0)
  assert.equal(yearly(NaN), 0)
})

test('workplace pension [own working] contributions on qualifying earnings or the full salary', () => {
  const onBand = pension({ salary: 60000 })
  near(onBand.earnings, 44028)
  near(onBand.asked, 2201.4)
  near(onBand.employer, 1320.84)
  const onSalary = pension({ salary: 60000, basis: 'fullSalary' })
  near(onSalary.earnings, 60000)
  near(onSalary.asked, 3000)
  near(onSalary.employer, 1800)
  // Paid weekly, the band is worked out on each week's pay.
  near(pension({ salary: 30000, payFrequency: 'weekly' }).earnings, 23760)
})

test('workplace pension [gov.uk] automatic enrolment from age 22 and £10,000 a year, and the employer pays in above £520 a month', () => {
  // "aged between 22 and State Pension age", "earn at least £10,000 per year",
  // and the employer need not contribute at £520 a month or less.
  assert.equal(AUTO_ENROLMENT.minimumAge, 22)
  assert.equal(pension({ salary: 6240 }).autoEnrolment.employerNeedNotPay, true)
  assert.equal(pension({ salary: 6240.12 }).autoEnrolment.employerNeedNotPay, false)
  assert.equal(pension({ salary: 9999.99 }).autoEnrolment.paidTooLittle, true)
  assert.equal(pension({ salary: 10000 }).autoEnrolment.paidTooLittle, false)
  assert.equal(pension({ age: 21 }).autoEnrolment.tooYoung, true)
  assert.equal(pension({ age: 22 }).autoEnrolment.tooYoung, false)
})

test('workplace pension [own working] the minimum of 8% of qualifying earnings, 3% from the employer', () => {
  assert.equal(pension({}).autoEnrolment.belowMinimum, false)
  near(pension({}).autoEnrolment.minimumTotal, 1900.8)
  near(pension({}).autoEnrolment.minimumEmployer, 712.8)
  assert.equal(pension({ employeePercent: 4 }).autoEnrolment.belowMinimum, true)
  assert.equal(pension({ employeePercent: 6, employerPercent: 2 }).autoEnrolment.belowMinimum, true)
  // On the full salary, 4% and 2.5% of £30,000 is £1,950, £750 from the
  // employer, which is more than the minimum in pounds.
  const full = pension({ basis: 'fullSalary', employeePercent: 4, employerPercent: 2.5 })
  assert.equal(full.autoEnrolment.belowMinimum, false)
  // Below the lower limit there is no minimum to meet.
  assert.equal(pension({ salary: 5000, employeePercent: 0 }).autoEnrolment.belowMinimum, false)
})

// ---------------------------------------------------------------------------
// What a contribution costs, each way tax relief is given
// ---------------------------------------------------------------------------

test('workplace pension [own working] £30,000: £1,188 costs £950.40 at source or net pay, and £855.36 by salary sacrifice', () => {
  const r = pension({})
  near(r.asked, 1188)
  for (const type of RELIEF_METHODS) near(r.methods[type].intoPot, 1188, type)
  near(r.methods.reliefAtSource.cost, 950.4)
  near(r.methods.reliefAtSource.hmrcTopUp, 237.6)
  assert.equal(r.methods.reliefAtSource.extraClaim, 0)
  near(r.methods.netPay.cost, 950.4)
  near(r.methods.netPay.incomeTaxSaved, 237.6)
  // Salary sacrifice also saves 8% National Insurance.
  near(r.methods.salarySacrifice.cost, 855.36)
  near(r.methods.salarySacrifice.nationalInsuranceSaved, 95.04)
})

test('workplace pension [own working] relief at source for someone who pays no tax: £9,000 still gets 20%', () => {
  const r = pension({ salary: 9000 })
  near(r.asked, 138) // 5% of £2,760
  near(r.methods.reliefAtSource.cost, 110.4)
  near(r.methods.reliefAtSource.relief, 27.6)
  // Through a net pay arrangement there is no tax to save.
  near(r.methods.netPay.cost, 138)
  near(r.methods.netPay.relief, 0)
})

test('workplace pension [own working] net pay below and at the Personal Allowance gets no relief', () => {
  for (const salary of [9000, 12570]) {
    const r = pension({ salary, reliefType: 'netPay' })
    near(r.chosen.relief, 0, `${salary}`)
    near(r.chosen.cost, r.asked, `${salary}`)
    assert.equal(r.netPayLessRelief, true, `${salary}`)
  }
  // £12,570 gives qualifying earnings of £6,330, so £316.50 from you.
  near(pension({ salary: 12570 }).asked, 316.5)
  // A basic rate taxpayer gets the same relief either way.
  assert.equal(pension({ reliefType: 'netPay' }).netPayLessRelief, false)
})

test('workplace pension [own working] relief at source for a higher rate taxpayer: £60,000 claims £440.28 more', () => {
  // £2,201.40 in, all of it on income taxed at 40%.
  const r = pension({ salary: 60000, reliefType: 'reliefAtSource' })
  near(r.chosen.fromPay, 1761.12)
  near(r.chosen.extraClaim, 440.28)
  near(r.chosen.cost, 1320.84)
  near(r.methods.netPay.cost, 1320.84)
  // Salary sacrifice saves 2% National Insurance too, above the upper earnings limit.
  near(r.methods.salarySacrifice.cost, 1276.812)
})

test('workplace pension [own working] relief at source when a contribution crosses into the 40% band', () => {
  // 10% of £52,000 is £5,200. Only the £1,730 above £50,270 gets the extra 20%.
  const r = pension({ salary: 52000, basis: 'fullSalary', employeePercent: 10 })
  near(r.chosen.extraClaim, 346)
  near(r.chosen.cost, 3814)
  near(r.methods.netPay.cost, 3814)
})

test('workplace pension [own working] in the Personal Allowance taper, £110,000 costs about 40% of the contribution', () => {
  // £2,201.40 in saves 40% tax on it, and gives back allowance taxed at 40%.
  // The allowance goes down by whole pounds: £3,899 for the £7,798.60 over
  // £100,000 that is left, against £5,000 before, so £1,101 comes back.
  // Tax saved: £880.56 + £440.40 = £1,320.96, so it costs £880.44.
  const r = pension({ salary: 110000 })
  near(r.asked, 2201.4)
  near(r.methods.netPay.incomeTaxSaved, 1320.96)
  near(r.methods.netPay.cost, 880.44)
  near(r.methods.reliefAtSource.cost, 880.44)
  // £1,761.12 from pay, less the £880.68 claimed back.
  near(r.methods.reliefAtSource.extraClaim, 880.68)
})

test('workplace pension [own working] Scotland: £60,000 is in the 42% band, so relief at source claims 22% more', () => {
  const r = pension({ salary: 60000, scottish: true })
  near(r.methods.reliefAtSource.extraClaim, 484.308)
  near(r.methods.reliefAtSource.cost, 1276.812)
  near(r.methods.netPay.cost, 1276.812)
  near(r.methods.salarySacrifice.cost, 1232.784)
})

test('workplace pension [own working] salary sacrifice also cuts a Plan 2 student loan repayment', () => {
  // £40,000 paid monthly: £1,688 a year sacrificed, £140.67 a month. Plan 2
  // takes 9% of pay over its threshold, rounded down to the pound each month.
  const r = pension({ salary: 40000, reliefType: 'salarySacrifice', plan: 'plan2' })
  near(r.asked, 1688)
  const saved = r.chosen.studentLoanSaved
  assert.ok(saved > 0.09 * 1688 - 12 && saved < 0.09 * 1688 + 12, `saved ${saved}`)
  assert.equal(r.reliefLabel, 'Tax, National Insurance and student loan saved')
  near(r.chosen.incomeTaxSaved + r.chosen.nationalInsuranceSaved + saved, r.chosen.relief)
  // Net pay and relief at source do not change the repayment.
  assert.equal(r.methods.netPay.studentLoanSaved, 0)
})

test('workplace pension [own working] each way of paying in costs what it takes off take-home pay', () => {
  // The same contribution entered as a percentage on the take-home pay calculator.
  for (const salary of [9000, 30000, 60000, 110000, 200000]) {
    for (const type of RELIEF_METHODS) {
      const r = pension({ salary, basis: 'fullSalary', employeePercent: 6 })
      const before = calculateTakeHomePay({ pay: salary })
      const after = calculateTakeHomePay({ pay: salary, pensionType: type, pensionPercent: 6 })
      near(
        r.methods[type].cost,
        before.takeHomeAnnual - after.takeHomeAnnual - after.extraReliefToClaim,
        `${salary} ${type}`,
      )
      near(r.methods[type].intoPot, after.pension.pensionIntoPot, `${salary} ${type}`)
    }
  }
})

// ---------------------------------------------------------------------------
// Salary sacrifice and the minimum wage
// ---------------------------------------------------------------------------

test('workplace pension [own working] salary sacrifice cannot take pay below the minimum wage for the hours worked', () => {
  // £12.71 an hour for 37.5 hours a week is £24,784.50 a year.
  const blocked = pension({ salary: 12570, reliefType: 'salarySacrifice' })
  assert.equal(blocked.salarySacrifice.blocked, true)
  near(blocked.salarySacrifice.minimumCashPay, 24784.5)
  assert.equal(blocked.salarySacrifice.hours, 37.5)
  assert.equal(blocked.salarySacrifice.hourlyRate, 12.71)
  assert.equal(blocked.yourIntoPot, 0)
  near(blocked.yearlyIntoPot, blocked.employer)

  // £25,000 leaves £215.50 above it, so 5% (£938) is limited to that.
  const limited = pension({ salary: 25000, reliefType: 'salarySacrifice' })
  assert.equal(limited.salarySacrifice.limited, true)
  assert.equal(limited.salarySacrifice.blocked, false)
  near(limited.asked, 938)
  near(limited.yourIntoPot, 215.5)

  // At 16 hours a week the minimum is £10,574.72, so £316.50 can go in.
  const partTime = pension({ salary: 12570, reliefType: 'salarySacrifice', weeklyHours: 16 })
  assert.equal(partTime.salarySacrifice.limited, false)
  near(partTime.yourIntoPot, 316.5)
})

test('workplace pension [own working] salary sacrifice over £2,000 a year', () => {
  const over = pension({ salary: 60000, basis: 'fullSalary', reliefType: 'salarySacrifice' })
  near(over.salarySacrifice.overNiFreeLimit, 1000)
  assert.equal(pension({ reliefType: 'salarySacrifice' }).salarySacrifice.overNiFreeLimit, 0)
  // Other ways of paying in are not affected.
  assert.equal(pension({ salary: 60000, basis: 'fullSalary' }).salarySacrifice.overNiFreeLimit, 0)
})

// ---------------------------------------------------------------------------
// The pot
// ---------------------------------------------------------------------------

test('workplace pension [own working] with no growth or rise, the pot is what went in', () => {
  // £1,900.80 a year for 10 years, on top of £10,000.
  const r = pension({ potNow: 10000, retirementAge: 40 })
  assert.equal(r.years, 10)
  near(r.yearlyIntoPot, 1900.8)
  near(r.finalValue, 29008)
  near(r.totals.fromYou, 9504)
  near(r.totals.relief, 2376)
  near(r.totals.employer, 7128)
  near(r.totals.paidIn, 19008)
})

test('workplace pension [own working] a 2% pay rise: 3 years of contributions come to £5,817.21', () => {
  // £1,900.80, then £1,938.82, then £1,977.59: £1,900.80 × 3.0604.
  const r = pension({ retirementAge: 33, payRisePercent: 2 })
  near(r.finalValue, 1900.8 * 3.0604)
  near(r.totals.fromYou, 950.4 * 3.0604)
  near(r.totals.relief, 237.6 * 3.0604)
  near(r.totals.employer, 712.8 * 3.0604)
  near(r.totals.fromYou + r.totals.relief + r.totals.employer, r.totals.paidIn)
  near(r.rows[2].pay, 31212)
  assert.equal(r.rows[2].age, 33)
  near(r.rows[2].payments, 1900.8 * 1.0404)
  near(r.payInLastYear, 31212)
  near(r.intoPotInLastYear, 1900.8 * 1.0404)
})

test('workplace pension [own working] the pot is the compound interest calculator’s, with and without a pay rise', () => {
  for (const payRisePercent of [0, 2, 5]) {
    for (const compounding of ['monthly', 'yearly']) {
      for (const [potNow, salary, chargePercent, inflationPercent] of [
        [0, 30000, 0, 0],
        [20000, 30000, 0.5, 2],
        [150000, 85000, 0.75, 2],
        [5000, 0, 1, 3],
      ]) {
        const r = pension({
          potNow,
          salary,
          payRisePercent,
          ratePercent: 5,
          compounding,
          chargePercent,
          inflationPercent,
        })
        const expected = calculateCompoundInterest({
          startAmount: potNow,
          payment: r.yearlyIntoPot / 12,
          ratePercent: 5,
          compounding,
          chargePercent,
          inflationPercent,
          years: 37,
          paymentRisePercent: payRisePercent,
        })
        const where = `${potNow} ${salary} rise ${payRisePercent}% ${compounding}`
        assert.equal(r.finalValue, expected.finalValue, where)
        assert.equal(r.realValue, expected.realValue, where)
        assert.equal(r.growth, expected.growth, where)
        assert.equal(r.charges, expected.charges, where)
        assert.equal(r.yearlyRate, expected.yearlyRate, where)
      }
    }
  }
})

test('workplace pension [own working] age 30 to 67 at 5% with a 0.5% charge and 2% inflation', () => {
  // £20,000 now, £30,000 salary, 5% and 3% of qualifying earnings, no pay rise.
  const r = pension({ potNow: 20000, ratePercent: 5, chargePercent: 0.5, inflationPercent: 2 })
  near(r.finalValue, 286224.72)
  near(r.realValue, 137562.73)
  near(r.lumpSum.taxFree, 71556.18)
  near(r.lumpSum.taxFreeToday, 71556.18 / 1.02 ** 37)
})

// ---------------------------------------------------------------------------
// When you retire, and the limits
// ---------------------------------------------------------------------------

test('workplace pension [own working] 25% tax-free, up to the Lump Sum Allowance of £268,275', () => {
  const lump = (potNow) => pension({ potNow, salary: 0, age: 60, retirementAge: 61 }).lumpSum
  near(lump(100000).taxFree, 25000)
  near(lump(100000).rest, 75000)
  near(lump(1073100).taxFree, 268275)
  assert.equal(lump(1073100).capped, false)
  near(lump(2000000).taxFree, 268275)
  assert.equal(lump(2000000).capped, true)
  near(lump(2000000).rest, 1731725)
  assert.equal(lump(0).taxFree, 0)
})

test('workplace pension [own working] over the £60,000 annual allowance', () => {
  // Half of £60,000 from each side is exactly the allowance.
  const at = pension({
    salary: 60000,
    basis: 'fullSalary',
    employeePercent: 50,
    employerPercent: 50,
  })
  near(at.yearlyIntoPot, 60000)
  assert.equal(at.annualAllowance.over, false)
  const over = pension({
    salary: 60002,
    basis: 'fullSalary',
    employeePercent: 50,
    employerPercent: 50,
  })
  assert.equal(over.annualAllowance.over, true)
  assert.equal(pension({ salary: 200000 }).annualAllowance.mayBeTapered, false)
  assert.equal(pension({ salary: 200001 }).annualAllowance.mayBeTapered, true)
})

test('workplace pension [own working] retiring before 57', () => {
  assert.equal(pension({ retirementAge: 56 }).belowMinimumPensionAge, true)
  assert.equal(pension({ retirementAge: 57 }).belowMinimumPensionAge, false)
})

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

test('workplace pension [own working] nothing in the pot and no salary gives £0', () => {
  const r = pension({ salary: 0, potNow: 0, ratePercent: 5 })
  assert.equal(r.finalValue, 0)
  assert.equal(r.yearlyIntoPot, 0)
  assert.equal(r.lumpSum.taxFree, 0)
})

test('workplace pension [own working] a pot with no salary grows on its own for 1 year', () => {
  const r = pension({ salary: 0, potNow: 10000, ratePercent: 5, compounding: 'yearly', age: 66 })
  assert.equal(r.years, 1)
  near(r.finalValue, 10500)
  assert.equal(r.totals.paidIn, 0)
})

test('workplace pension [own working] blank, negative and impossible figures count as 0', () => {
  const r = pension({
    salary: -30000,
    potNow: NaN,
    employeePercent: -5,
    employerPercent: 150,
    payRisePercent: -2,
    ratePercent: -5,
    retirementAge: 20,
  })
  assert.equal(r.years, 0)
  assert.equal(r.finalValue, 0)
  assert.equal(r.salary, 0)
  assert.equal(r.payRisePercent, 0)
  assert.equal(r.employerPercent, 100)
})

test('workplace pension [own working] a £10 million salary stays a usable figure', () => {
  const r = pension({
    salary: 10_000_000,
    potNow: 10_000_000,
    basis: 'fullSalary',
    payRisePercent: 20,
    ratePercent: 20,
    inflationPercent: 20,
    age: 16,
    retirementAge: 75,
  })
  near(r.asked, 500000)
  assert.equal(r.annualAllowance.over, true)
  assert.equal(r.annualAllowance.mayBeTapered, true)
  for (const value of [r.finalValue, r.realValue, r.totals.paidIn, r.lumpSum.taxFree]) {
    assert.ok(Number.isFinite(value) && value >= 0, `${value}`)
  }
  near(r.lumpSum.taxFree, 268275)
})
