// Tests for the take-home pay calculator (takeHome.js, payPeriods.js and
// pensions.js). Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a published example, rule or threshold on gov.uk, checked on
//                 21 October 2026
//   [own working] worked out by hand from the published rates and rules
//
// Sources:
//   https://www.gov.uk/income-tax-rates
//   https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
//   https://www.gov.uk/national-insurance/how-much-you-pay
//   https://www.gov.uk/national-insurance
//   https://www.gov.uk/tax-codes/what-your-tax-code-means
//   https://www.gov.uk/tax-codes/k-in-your-tax-code
//   https://www.gov.uk/welsh-income-tax

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculateIncomeTax,
  calculateTakeHome,
  flatRateFor,
  incomeTaxLabel,
  nationalInsuranceForPeriod,
  payrollCodeAllowance,
} from './incomeTax.js'
import { payFor, yearlyPayFrom } from './payPeriods.js'
import { calculatePayPackage } from './payRise.js'
import { pensionContributions } from './pensions.js'
import { INCOME_TAX, INCOME_TAX_RATES, WELSH_INCOME_TAX } from './rates/incomeTax.js'
import { readTaxCode, taxRatesFor } from './readTaxCode.js'
import { calculateTakeHomePay } from './takeHome.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const code = (text) => readTaxCode(text).value

// A tax code's prefix decides the rates, as the page does it.
const withCode = (text, settings) => {
  const taxCode = code(text)
  return calculateTakeHomePay({ ...settings, taxCode, ...taxRatesFor(taxCode, 'restOfUk') })
}

// ---------------------------------------------------------------------------
// Pay and the default case
// ---------------------------------------------------------------------------

test('take-home pay [gov.uk] £35,000 pays basic rate tax on £22,430', () => {
  // gov.uk example: "You paid basic rate tax at 20% on £22,430 (£35,000 minus £12,570)."
  near(calculateTakeHomePay({ pay: 35000 }).incomeTax, 22430 * 0.2)
})

test('take-home pay [own working] £35,000 paid monthly', () => {
  const r = calculateTakeHomePay({ pay: 35000 })
  // NI each month: 8% of (£2,916.67 - £1,048) is £149.49, so £1,793.92 a year.
  near(r.nationalInsurance, 1793.92)
  near(r.takeHomeAnnual, 35000 - 4486 - 1793.92)
  near(r.takeHomeMonthly, 28720.08 / 12)
  near(r.takeHomeWeekly, 28720.08 / 52)
  near(r.takeHomePayDay, r.takeHomeMonthly)
  near(r.effectiveRate, (4486 + 1793.92) / 35000)
  // The columns are the year divided by 12 and by 52.
  near(r.columns.month.incomeTax, 4486 / 12)
  near(r.columns.week.pay, 35000 / 52)
  near(r.columns.year.takeHome, r.takeHomeAnnual)
})

test('take-home pay [own working] £35,000 paid weekly uses the weekly thresholds', () => {
  const r = calculateTakeHomePay({ pay: 35000, payFrequency: 'weekly' })
  // 8% of (£673.08 - £242) is £34.49 a week, £1,793.28 a year.
  near(r.nationalInsurance, 1793.28)
  near(r.incomeTax, 4486)
  near(r.takeHomePayDay, (35000 - 4486 - 1793.28) / 52)
  assert.equal(r.period, 'week')
})

test('take-home pay [own working] £60,000 paid monthly, against the yearly sum', () => {
  // Monthly: 8% of £3,141 is £251.28, and 2% of £811 is £16.22. £267.50 a
  // month is £3,210 a year. Worked out on the year it would be £3,210.60,
  // because the monthly thresholds are rounded to the pound.
  const r = calculateTakeHomePay({ pay: 60000 })
  near(r.nationalInsurance, 3210)
  near(calculateTakeHome(60000).nationalInsurance, 3210.6)
  near(r.takeHomeAnnual, 60000 - 11432 - 3210)
})

test('take-home pay [own working] pay entered for a month, week, day or hour', () => {
  near(yearlyPayFrom(2500, 'month'), 30000)
  near(yearlyPayFrom(600, 'week'), 31200)
  near(yearlyPayFrom(150, 'day', { daysPerWeek: 5 }), 39000)
  near(yearlyPayFrom(150, 'day', { daysPerWeek: 3.5 }), 27300)
  near(yearlyPayFrom(17.95, 'hour', { hoursPerWeek: 37.5 }), 35002.5)
  near(yearlyPayFrom(35000, 'year'), 35000)
  near(yearlyPayFrom(20, 'hour', { hoursPerWeek: 0 }), 0)
  near(yearlyPayFrom(NaN, 'month'), 0)
  // The calculator does the same.
  near(calculateTakeHomePay({ pay: 2500, payPer: 'month' }).pay, 30000)
  near(calculateTakeHomePay({ pay: 17.95, payPer: 'hour', hoursPerWeek: 37.5 }).pay, 35002.5)
  near(calculateTakeHomePay({ pay: 150, payPer: 'day', daysPerWeek: 4 }).pay, 31200)
})

test('take-home pay [own working] switching how pay is entered keeps the same pay', () => {
  // payPeriods.test.js checks every switch. Here the calculator gives the same
  // take-home for £35,000 a year as for the same pay a month, week or hour.
  const settings = { hoursPerWeek: 37.5, daysPerWeek: 5 }
  const year = calculateTakeHomePay({ pay: 35000 })
  for (const payPer of ['month', 'week', 'day', 'hour']) {
    const pay = payFor(payPer, 35000, settings)
    const other = calculateTakeHomePay({ pay, payPer, ...settings })
    near(other.takeHomeAnnual, year.takeHomeAnnual, `${payPer}:`)
  }
})

test('take-home pay [own working] zero, blank, negative and very high pay', () => {
  for (const pay of [0, -5000, NaN, undefined]) {
    const r = calculateTakeHomePay({ pay })
    assert.equal(r.pay, 0)
    assert.equal(r.incomeTax, 0)
    assert.equal(r.nationalInsurance, 0)
    assert.equal(r.takeHomeAnnual, 0)
    assert.equal(r.effectiveRate, 0)
    assert.equal(r.bonus, null)
  }
  // £1,000,000: £436,203 in tax (as calculateTakeHome) and NI of £251.28 plus
  // 2% of £79,144.33 each month, £22,010 a year.
  const high = calculateTakeHomePay({ pay: 1000000 })
  near(high.incomeTax, 436203)
  near(high.nationalInsurance, 22010)
  near(high.takeHomeAnnual, 1000000 - 436203 - 22010)
})

test('take-home pay [own working] pay just either side of each threshold', () => {
  // £12,570 a year is £1,047.50 a month, under the £1,048 NI threshold.
  const allowance = calculateTakeHomePay({ pay: 12570 })
  assert.equal(allowance.incomeTax, 0)
  assert.equal(allowance.nationalInsurance, 0)
  // £12,576 is exactly £1,048 a month: still no NI, and £6 is taxed at 20%.
  const threshold = calculateTakeHomePay({ pay: 12576 })
  near(threshold.incomeTax, 1.2)
  assert.equal(threshold.nationalInsurance, 0)
  // £1 a month over it is 8p of NI each month.
  near(calculateTakeHomePay({ pay: 12588 }).nationalInsurance, 0.96)
  // £50,268 is exactly £4,189 a month: all of the slice above £1,048 at 8%.
  near(calculateTakeHomePay({ pay: 50268 }).nationalInsurance, 251.28 * 12)
})

// ---------------------------------------------------------------------------
// National Insurance for each pay day
// ---------------------------------------------------------------------------

test('National Insurance [gov.uk] the weekly and monthly thresholds', () => {
  // gov.uk: 8% on £242 to £967 a week (£1,048 to £4,189 a month), 2% above.
  const monthly = (pay) => nationalInsuranceForPeriod(pay, 'monthly').ni
  const weekly = (pay) => nationalInsuranceForPeriod(pay, 'weekly').ni
  assert.equal(monthly(1048), 0)
  near(monthly(1049), 0.08)
  near(monthly(4189), 251.28)
  near(monthly(4190), 251.3)
  assert.equal(weekly(242), 0)
  near(weekly(243), 0.08)
  near(weekly(967), 58)
  near(weekly(968), 58.02)
  assert.equal(monthly(0), 0)
  assert.equal(monthly(-100), 0)
})

test('National Insurance [gov.uk] none is paid after State Pension age', () => {
  // gov.uk: "If you're employed, you stop paying Class 1 National Insurance
  // when you reach State Pension age." Income tax and student loan carry on.
  const r = calculateTakeHomePay({
    pay: 60000,
    bonus: 5000,
    plan: 'plan2',
    paysNationalInsurance: false,
  })
  assert.equal(r.nationalInsurance, 0)
  assert.equal(r.bonus.nationalInsurance, 0)
  near(r.incomeTax, 11432)
  assert.ok(r.studentLoan > 0)
  near(r.takeHomeAnnual, 60000 - 11432 - r.studentLoan)
})

// ---------------------------------------------------------------------------
// Tax codes
// ---------------------------------------------------------------------------

// Payroll's tax-free pay for a code, from HMRC's Specification for PAYE Tax
// Table Routines, version 24.0 (February 2026), paragraph 4.3.1, and its
// Tables A, which HMRC's P9X says are still used unchanged in 2026 to 2027:
//   https://www.gov.uk/government/publications/payroll-technical-specifications-income-tax
//   https://www.gov.uk/government/publications/tables-a-pay-adjustment-tables

test('tax codes [gov.uk] payroll turns a code into tax-free pay as HMRC’s tax tables do', () => {
  // The specification: "suffix code 1 thus represents annual allowances (Free
  // Pay) of £19". Tables A give code 1 as £1.59 in month 1 and £0.37 in week 1.
  assert.equal(payrollCodeAllowance(1, 'monthly').payDay, 1.59)
  assert.equal(payrollCodeAllowance(1, 'weekly').payDay, 0.37)
  // Tables A, month 1: code 257 is £214.92, 383 is £319.92, 100 is £84.09 and
  // 500 is £417.42. Week 1: 257 is £49.60 and 500 is £96.33.
  assert.equal(payrollCodeAllowance(257, 'monthly').payDay, 214.92)
  assert.equal(payrollCodeAllowance(383, 'monthly').payDay, 319.92)
  assert.equal(payrollCodeAllowance(100, 'monthly').payDay, 84.09)
  assert.equal(payrollCodeAllowance(500, 'monthly').payDay, 417.42)
  assert.equal(payrollCodeAllowance(257, 'weekly').payDay, 49.6)
  assert.equal(payrollCodeAllowance(500, 'weekly').payDay, 96.33)
  // Each further 500 is the box marked * in Tables A: £416.67 a month, £96.16 a week.
  near(payrollCodeAllowance(1000, 'monthly').payDay - 417.42, 416.67)
  near(payrollCodeAllowance(1000, 'weekly').payDay - 96.33, 96.16)
  // So 1257L is £214.92 plus 2 lots of £416.67 a month. Tables A, month 12:
  // code 257 is £2,579.04 and the box is £5,000.04, so £12,579.12 for the year.
  assert.deepEqual(payrollCodeAllowance(1257, 'monthly'), { payDay: 1048.26, year: 12579.12 })
  assert.deepEqual(payrollCodeAllowance(1257, 'weekly'), { payDay: 241.92, year: 12579.84 })
  // Tables A's worked example: code 1500 at week 35 is £3,371.55 for one unit
  // of 500 and £6,731.20 for the other two, £10,102.75 of free pay to date.
  near(35 * payrollCodeAllowance(1500, 'weekly').payDay, 10102.75)
  // A K code's "additional pay" is worked out the same way: each 1 is £10,
  // with £9 added. K154, from HMRC's PAYE11095 example of a £1,550 deduction.
  assert.equal(payrollCodeAllowance(154, 'monthly').payDay, 129.09)
  // There is no free pay for code 0, as in 0T.
  assert.deepEqual(payrollCodeAllowance(0, 'monthly'), { payDay: 0, year: 0 })
})

test('tax codes [own working] 1257L gives payroll’s £12,579.12, not £12,570', () => {
  // Paid monthly, £9.12 more is tax-free than with no code, so 20% of it
  // (£1.82) less tax at the basic rate, and 40% of it (£3.65) at the higher.
  near(withCode('1257L', { pay: 35000 }).incomeTax, (35000 - 12579.12) * 0.2)
  near(withCode('1257L', { pay: 50270 }).incomeTax, 7540 - 1.824)
  near(withCode('1257L', { pay: 60000 }).incomeTax, 11432 - 3.648)
  // Paid weekly it is £12,579.84.
  near(
    withCode('1257L', { pay: 35000, payFrequency: 'weekly' }).incomeTax,
    (35000 - 12579.84) * 0.2,
  )
  // No tax below the free pay, with or without a code.
  assert.equal(withCode('1257L', { pay: 12579 }).incomeTax, 0)
  assert.equal(withCode('1257L', { pay: 0 }).incomeTax, 0)
  // The working shows it, with the rule in a note.
  const part = withCode('1257L', { pay: 35000 }).working.find((each) =>
    each.title.endsWith('tax code 1257L'),
  )
  const line = part.lines.find((each) => each.label === 'Tax-free pay from your tax code')
  assert.equal(line.value, 12579.12)
  assert.equal(line.each, 1048.26)
  assert.equal(line.count, 12)
  assert.match(part.note, /times £10, adds £9/)
  // No code: no note, and the Personal Allowance itself.
  const plain = calculateTakeHomePay({ pay: 35000 }).working.find(
    (each) => each.title === 'Income tax',
  )
  assert.equal(plain.note, undefined)
})

test('tax codes [own working] a code is used as it is above £100,000', () => {
  // No code: the allowance falls to £7,570 at £110,000, so tax is £7,540 plus
  // 40% of £64,730, which is £33,432. With 1257L payroll keeps the full
  // £12,579.12: £7,540 plus 40% of £59,720.88, which is £31,428.35.
  const noCode = calculateTakeHomePay({ pay: 110000 })
  near(noCode.incomeTax, 33432)
  assert.equal(noCode.codeSkipsTaper, false)
  const coded = withCode('1257L', { pay: 110000 })
  near(coded.incomeTax, 31428.352)
  assert.equal(coded.codeSkipsTaper, true)
  assert.equal(withCode('1257L', { pay: 100000 }).codeSkipsTaper, false)
})

test('tax codes [own working] 1100L, gov.uk’s example of a reduced code', () => {
  // Payroll: £84.09 for 100 plus 2 lots of £416.67 is £917.43 a month,
  // £11,009.16 a year. £35,000 less that, at 20%.
  near(withCode('1100L', { pay: 35000 }).incomeTax, (35000 - 11009.16) * 0.2)
})

test('tax codes [own working] M and N codes', () => {
  // 1383M: £319.92 plus £833.34 a month, £13,839.12 a year.
  // 1131N: £109.92 plus £833.34 a month, £11,319.12 a year.
  near(withCode('1383M', { pay: 35000 }).incomeTax, (35000 - 13839.12) * 0.2)
  near(withCode('1131N', { pay: 35000 }).incomeTax, (35000 - 11319.12) * 0.2)
})

test('tax codes [own working] 0T taxes all pay, with the usual bands', () => {
  near(withCode('0T', { pay: 35000 }).incomeTax, 7000)
  // £37,700 at 20% and £22,300 at 40%.
  near(withCode('0T', { pay: 60000 }).incomeTax, 7540 + 8920)
})

test('tax codes [gov.uk] BR, D0 and D1 tax all pay at one rate', () => {
  // "All your income from this job or pension is taxed at the basic rate"
  // (higher rate for D0, additional rate for D1).
  near(withCode('BR', { pay: 20000 }).incomeTax, 4000)
  near(withCode('D0', { pay: 20000 }).incomeTax, 8000)
  near(withCode('D1', { pay: 20000 }).incomeTax, 9000)
  // NI is not changed by the code.
  near(withCode('BR', { pay: 20000 }).nationalInsurance, 593.92)
})

test('tax codes [gov.uk] the Scottish and Welsh one-rate codes', () => {
  // Scotland: basic 20%, intermediate 21%, higher 42%, advanced 45%, top 48%.
  near(withCode('SBR', { pay: 20000 }).incomeTax, 4000)
  near(withCode('SD0', { pay: 20000 }).incomeTax, 4200)
  near(withCode('SD1', { pay: 20000 }).incomeTax, 8400)
  near(withCode('SD2', { pay: 20000 }).incomeTax, 9000)
  near(withCode('SD3', { pay: 20000 }).incomeTax, 9600)
  // Wales: the same rates as England and Northern Ireland in 2026/27.
  near(withCode('CBR', { pay: 20000 }).incomeTax, 4000)
  near(withCode('CD0', { pay: 20000 }).incomeTax, 8000)
  near(withCode('CD1', { pay: 20000 }).incomeTax, 9000)
})

test('tax codes [gov.uk] NT means no tax, but NI is still paid', () => {
  const r = withCode('NT', { pay: 35000 })
  assert.equal(r.incomeTax, 0)
  near(r.nationalInsurance, 1793.92)
})

test('tax codes [own working] a K code adds its amount to taxable pay', () => {
  // K475 on £30,000: payroll adds £396.59 a month, £4,759.08 a year, at 20%.
  near(withCode('K475', { pay: 30000 }).incomeTax, (30000 + 4759.08) * 0.2)
  // A K code that takes taxable pay into the higher rate: K1000 on £45,000
  // adds £834.09 a month, £10,009.08 a year. £55,009.08 is taxable, so
  // £37,700 at 20% and £17,309.08 at 40%.
  near(withCode('K1000', { pay: 45000 }).incomeTax, 7540 + 6923.632)
})

test('tax codes [gov.uk] a K code cannot take more than half of each pay day', () => {
  // gov.uk: "Employers and pension providers cannot take more than half of
  // your pre-tax wages or pension when using a K tax code."
  // K2000 on £1,000 a month adds £1,667.43 a month, £20,009.16 a year, so
  // £32,009.16 is taxable and £6,401.83 is due. Half of each month's £1,000
  // is £500, so £6,000 is taken.
  const r = withCode('K2000', { pay: 12000 })
  near(r.incomeTaxDue, 6401.832)
  near(r.incomeTax, 6000)
  near(r.columns.month.incomeTax, 500)
  near(r.taxNotTaken, 401.832)
  // Weekly pay is held to half of each week's pay in the same way.
  near(withCode('K2000', { pay: 12000, payFrequency: 'weekly' }).incomeTax, 6000)
  // When the limit is not reached, the full tax is taken.
  assert.equal(withCode('K475', { pay: 30000 }).taxNotTaken, 0)
})

test('tax codes [own working] tax held back by the K code limit comes out of a bonus', () => {
  // K2000 on £12,000 with a £3,000 bonus on the last pay day: £7,001.83 is
  // due. Eleven months take £500 each. The last month can take up to half of
  // £4,000, so it takes the £1,501.83 still due.
  const r = withCode('K2000', { pay: 12000, bonus: 3000 })
  near(r.bonus.incomeTax, 1001.832)
  near(r.taxNotTaken, 0)
  // K3000 adds £2,500.77 a month, £30,009.24 a year. On £12,000 with a
  // £1,000 bonus, £9,663.70 is due with the bonus. £5,500 is taken before it
  // and £1,000 on the last pay day, so £3,163.70 is not taken.
  const short = withCode('K3000', { pay: 12000, bonus: 1000 })
  near(short.incomeTaxDue, 9263.696)
  near(short.bonus.incomeTax, 500)
  near(short.taxNotTaken, 3163.696)
})

test('tax codes [gov.uk] emergency codes are worked out over the whole year here', () => {
  // gov.uk: on an emergency code tax "is worked out based on what you're paid
  // in that week or month only". With the same pay every month that is the
  // same over the year, which is how this calculator works it out.
  for (const text of ['1257L W1', '1257L M1', '1257L X']) {
    near(withCode(text, { pay: 35000 }).incomeTax, (35000 - 12579.12) * 0.2, text)
  }
})

test('tax codes [own working] S codes use Scottish rates, C codes the Welsh rates', () => {
  // Scottish rates on £35,000 with S1257L: £22,420.88 is taxable. £753.73 at
  // 19%, £2,597.80 at 20% and 21% of £5,464.88 is £4,499.15.
  const scottish = withCode('S1257L', { pay: 35000 })
  near(scottish.incomeTax, 4499.1548)
  assert.equal(scottish.incomeTaxName, 'Scottish income tax')
  // Living in Scotland with no code gives the guide's £4,501.07.
  near(calculateTakeHomePay({ pay: 35000, scottish: true }).incomeTax, 4501.07)
  const welsh = withCode('C1257L', { pay: 35000 })
  near(welsh.incomeTax, (35000 - 12579.12) * 0.2)
  assert.equal(welsh.incomeTaxName, 'Income tax (Welsh rates)')
  assert.equal(incomeTaxLabel(false, false), 'Income tax')
})

test('Welsh rates [gov.uk] are the same as England and Northern Ireland in 2026/27', () => {
  // gov.uk's Welsh income tax table: 20% basic, 40% higher, 45% additional,
  // with the same bands and Personal Allowance.
  assert.deepEqual(WELSH_INCOME_TAX, { basicRate: 0.2, higherRate: 0.4, additionalRate: 0.45 })
  for (const pay of [12570, 30000, 50270, 60000, 110000, 125140, 200000]) {
    near(calculateIncomeTax(pay, { welsh: true }).tax, calculateIncomeTax(pay).tax, `${pay}`)
  }
})

test('Welsh rates [own working] C codes read the Welsh rates, not England’s', () => {
  // A made-up year in which the Welsh basic rate is 21%, to show the Welsh
  // figures are the ones used. It is removed again afterwards.
  const testYear = '2099/00'
  INCOME_TAX_RATES[testYear] = {
    ...INCOME_TAX_RATES['2026/27'],
    welshIncomeTax: { basicRate: 0.21, higherRate: 0.41, additionalRate: 0.46 },
  }
  try {
    near(calculateIncomeTax(35000, { welsh: true, taxYear: testYear }).tax, 22430 * 0.21)
    near(calculateIncomeTax(35000, { taxYear: testYear }).tax, 22430 * 0.2)
    assert.equal(flatRateFor('higher', { welsh: true, taxYear: testYear }), 0.41)
    assert.equal(flatRateFor('higher', { taxYear: testYear }), 0.4)
  } finally {
    delete INCOME_TAX_RATES[testYear]
  }
})

// ---------------------------------------------------------------------------
// Bonuses
// ---------------------------------------------------------------------------

test('bonus [own working] £5,000 on £35,000 paid monthly', () => {
  // Income tax: 20% of £5,000. NI that month on £7,916.67: 8% of £1,272.33
  // up to £4,189 and 2% of £3,727.67 above it, £176.34 more than usual.
  const r = calculateTakeHomePay({ pay: 35000, bonus: 5000 })
  near(r.bonus.incomeTax, 1000)
  near(r.bonus.nationalInsurance, 176.34)
  near(r.bonus.kept, 3823.66)
  // The usual pay is not changed by the bonus.
  near(r.takeHomeAnnual, 28720.08)
  near(r.takeHomeWithBonus, 28720.08 + 3823.66)
})

test('bonus [own working] the same bonus paid weekly', () => {
  // NI that week on £5,673.08: 8% of £293.92 and 2% of £4,706.08.
  const r = calculateTakeHomePay({ pay: 35000, bonus: 5000, payFrequency: 'weekly' })
  near(r.bonus.nationalInsurance, 117.64)
  near(r.bonus.kept, 5000 - 1000 - 117.64)
})

test('bonus [own working] a bonus that crosses into the higher rate', () => {
  // £48,000: taxable pay goes from £35,430 to £40,430. £2,270 at 20% and
  // £2,730 at 40%.
  near(calculateTakeHomePay({ pay: 48000, bonus: 5000 }).bonus.incomeTax, 454 + 1092)
})

test('bonus [own working] a bonus that takes income into the allowance taper', () => {
  // £98,000 and a £10,000 bonus: £4,000 of allowance is lost, so the bonus
  // costs 40% of £10,000 plus 40% of £4,000.
  const r = calculateTakeHomePay({ pay: 98000, bonus: 10000 })
  near(r.bonus.incomeTax, 5600)
  near(r.personalAllowanceUsed, 12570) // the usual pay alone keeps it all
})

test('bonus [own working] student loan on a bonus', () => {
  // Plan 2 on £30,000: £2,500 a month repays 9% of £52, rounded down to £4.
  // With a £2,000 bonus that month is £4,500: 9% of £2,052 is £184.68, so £184.
  // NI that month: £251.28 up to £4,189 and 2% of £311, £141.34 more than usual.
  const r = calculateTakeHomePay({ pay: 30000, bonus: 2000, plan: 'plan2' })
  near(r.studentLoan, 48)
  near(r.bonus.studentLoan, 180)
  near(r.bonus.nationalInsurance, 141.34)
  near(r.bonus.incomeTax, 400)
  near(r.bonus.kept, 2000 - 400 - 141.34 - 180)
})

test('bonus [own working] no bonus, a blank one or a negative one', () => {
  for (const bonus of [0, NaN, undefined, -500]) {
    assert.equal(calculateTakeHomePay({ pay: 35000, bonus }).bonus, null)
  }
})

// ---------------------------------------------------------------------------
// Pensions
// ---------------------------------------------------------------------------

test('pension [own working] 5% by salary sacrifice', () => {
  // £1,750 comes off pay first. Tax on £33,250 is 20% of £20,680. NI each
  // month is 8% of (£2,770.83 - £1,048), £1,653.92 a year.
  const r = calculateTakeHomePay({ pay: 35000, pensionPercent: 5 })
  near(r.pension.pensionIntoPot, 1750)
  near(r.incomeTax, 4136)
  near(r.nationalInsurance, 1653.92)
  near(r.takeHomeAnnual, 35000 - 4136 - 1653.92 - 1750)
})

test('pension [own working] a fixed amount through a net pay arrangement', () => {
  // £150 a month is £1,800 a year. It comes off before tax but not before NI.
  const r = calculateTakeHomePay({
    pay: 35000,
    pensionType: 'netPay',
    pensionYearlyAmount: 1800,
  })
  near(r.incomeTax, (35000 - 1800 - 12570) * 0.2)
  near(r.nationalInsurance, 1793.92)
  near(r.takeHomeAnnual, 35000 - 4126 - 1793.92 - 1800)
})

test('pension [own working] relief at source', () => {
  // 5% of £35,000 goes in. HMRC adds 20% of it, so £1,400 comes from pay.
  const r = calculateTakeHomePay({ pay: 35000, pensionType: 'reliefAtSource', pensionPercent: 5 })
  near(r.pension.pensionIntoPot, 1750)
  near(r.pension.hmrcTopUp, 350)
  near(r.pension.pensionFromPay, 1400)
  near(r.incomeTax, 4486)
  near(r.takeHomeAnnual, 35000 - 4486 - 1793.92 - 1400)
  assert.equal(r.extraReliefToClaim, 0)
  // A higher rate taxpayer can claim another 20% back: 10% of £60,000 is
  // £6,000, all of it in the higher rate band.
  const higher = calculateTakeHomePay({
    pay: 60000,
    pensionType: 'reliefAtSource',
    pensionPercent: 10,
  })
  near(higher.extraReliefToClaim, 1200)
})

test('pension [own working] limits on what can go in', () => {
  // More than the pay: limited to the pay.
  const tooMuch = pensionContributions({
    gross: 30000,
    pensionType: 'netPay',
    pensionYearlyAmount: 60000,
  })
  assert.equal(tooMuch.pensionIntoPot, 30000)
  assert.equal(tooMuch.moreThanPay, true)
  // A salary sacrifice cannot take pay under the minimum wage: £12.71 an
  // hour for 37.5 hours a week is £24,784.50 a year.
  const r = calculateTakeHomePay({ pay: 25000, pensionPercent: 50, weeklyHours: 37.5 })
  assert.equal(r.pension.sacrificeCapped, true)
  near(r.pension.pensionIntoPot, 25000 - 24784.5)
  // Blank or negative contributions are none.
  for (const pensionPercent of [0, NaN, -5]) {
    assert.equal(calculateTakeHomePay({ pay: 35000, pensionPercent }).pension.pensionIntoPot, 0)
  }
})

test('pension [own working] the pay rise calculator gets the same pension figures', () => {
  for (const pensionType of ['salarySacrifice', 'netPay', 'reliefAtSource']) {
    for (const salary of [20000, 45000, 120000]) {
      const shared = pensionContributions({ gross: salary, pensionType, pensionPercent: 6 })
      const payRise = calculatePayPackage({ salary, pensionType, pensionPercent: 6 })
      for (const key of ['pensionIntoPot', 'pensionFromPay', 'hmrcTopUp', 'taxablePay']) {
        near(payRise[key], shared[key], `${pensionType} ${salary} ${key}`)
      }
    }
  }
})

// ---------------------------------------------------------------------------
// Notes the page shows
// ---------------------------------------------------------------------------

test('take-home pay [gov.uk] the Child Benefit charge note starts above £60,000', () => {
  assert.equal(calculateTakeHomePay({ pay: 60000 }).childBenefitCharge, false)
  assert.equal(calculateTakeHomePay({ pay: 60001 }).childBenefitCharge, true)
  // A pension brings adjusted net income back under it, and a bonus adds to it.
  assert.equal(calculateTakeHomePay({ pay: 62000, pensionPercent: 5 }).childBenefitCharge, false)
  assert.equal(calculateTakeHomePay({ pay: 58000, bonus: 3000 }).childBenefitCharge, true)
})

test('take-home pay [own working] the personal allowance taper without a code', () => {
  const r = calculateTakeHomePay({ pay: 110000 })
  assert.equal(r.personalAllowanceUsed, 7570)
  assert.ok(r.personalAllowanceUsed < INCOME_TAX.personalAllowance)
})
