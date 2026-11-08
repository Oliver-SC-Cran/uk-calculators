// The workplace pension calculator: what a pension pot could grow to by the
// time someone retires, what goes into it from them, from tax relief and from
// their employer, and what their contribution costs from their take-home pay
// under each way tax relief is given.
//
// It has no growth or tax sums of its own:
// - The pot grows by calculateCompoundInterest, with the year's contributions
//   paid in a twelfth at a time at the start of each month and rising with pay
//   at the start of each year (paymentRisePercent). So the compound interest
//   calculator gives the same pot for the same figures, and the two pages
//   explain growth, charges and today's money the same way.
// - What a contribution costs is how much it takes off take-home pay in
//   calculateTakeHomePay, less any extra relief someone can claim under relief
//   at source (extraReliefToClaim in pensions.js). Scotland, student loans, the
//   National Insurance thresholds for each pay day and the minimum wage limit
//   on a salary sacrifice all come from there.
//
// Contributions and their cost are worked out on the tax rules for one tax
// year (2026/27 unless another is passed). Over the years, pay, contributions
// and the bands are taken to rise together, so what comes from you, from tax
// relief and from your employer keeps the same shares as in that year.

import { calculateCompoundInterest, todaysMoneyPart, yearlyRatePart } from './compoundInterest.js'
import { percent } from './format.js'
import { atLeastZero } from './numbers.js'
import { PAY_FREQUENCIES } from './payPeriods.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { FULL_TIME_HOURS, MINIMUM_WAGE_RATES } from './rates/minimumWage.js'
import { MINIMUM_PENSION_AGE_RISE, PENSION_RATES } from './rates/pensions.js'
import { CURRENT_TAX_YEAR, forTaxYear } from './rates/taxYear.js'
import { calculateTakeHomePay } from './takeHome.js'
import { add, info, part, subtract, total } from './working.js'

const pence = { unit: 'gbpPence' }

/** The ways tax relief can be given, in the order the page shows them. */
export const RELIEF_METHODS = ['reliefAtSource', 'netPay', 'salarySacrifice']

/** What contributions can be worked out on. */
export const CONTRIBUTION_BASES = {
  qualifyingEarnings: 'Qualifying earnings',
  fullSalary: 'Your full salary',
}

/**
 * Qualifying earnings for a year's salary: the pay on each pay day between
 * the lower and upper limits for that pay period, from The Pensions
 * Regulator's table, as payroll works them out. £30,000 paid monthly is
 * £2,500 a month, so £1,980 a month and £23,760 a year.
 */
export function qualifyingEarnings(salary, { payFrequency = 'monthly', taxYear } = {}) {
  const { byPayPeriod } = forTaxYear(PENSION_RATES, taxYear).autoEnrolment
  const frequency = PAY_FREQUENCIES[payFrequency] ? payFrequency : 'monthly'
  const { perYear: payDays, period } = PAY_FREQUENCIES[frequency]
  const { lower, upper } = byPayPeriod[frequency]
  const payDay = atLeastZero(salary) / payDays
  const eachPayDay = Math.max(0, Math.min(payDay, upper) - lower)
  return { lower, upper, payDays, period, payDay, eachPayDay, yearly: eachPayDay * payDays }
}

/**
 * The workplace pension calculator.
 *
 * - age, retirementAge: whole years. The pot grows for the years between them.
 * - potNow: what is in the pension now.
 * - salary: pay a year before tax, as entered, before any salary sacrifice.
 * - payRisePercent: how much pay, and so contributions, rise each year.
 * - employeePercent, employerPercent: shares of qualifyingEarnings or
 *   fullSalary (basis). Under relief at source the employee's share is what
 *   goes in, with the 20% basic rate relief, as it is on a payslip.
 * - reliefType: 'reliefAtSource', 'netPay' or 'salarySacrifice'.
 * - ratePercent, compounding, chargePercent, inflationPercent: as
 *   calculateCompoundInterest takes them.
 * - scottish, plan, hasPostgraduateLoan, payFrequency: as
 *   calculateTakeHomePay takes them.
 * - weeklyHours: for the minimum wage limit on a salary sacrifice.
 */
export function calculateWorkplacePension({
  age = 0,
  retirementAge = 0,
  potNow = 0,
  salary: salaryEntered = 0,
  payRisePercent = 0,
  employeePercent = 0,
  employerPercent = 0,
  basis = 'qualifyingEarnings',
  reliefType = 'reliefAtSource',
  ratePercent = 0,
  compounding = 'monthly',
  chargePercent = 0,
  inflationPercent = 0,
  scottish = false,
  plan = 'none',
  hasPostgraduateLoan = false,
  payFrequency = 'monthly',
  weeklyHours = FULL_TIME_HOURS,
  taxYear = CURRENT_TAX_YEAR,
}) {
  const rates = forTaxYear(PENSION_RATES, taxYear)
  const { nationalLivingWage } = forTaxYear(MINIMUM_WAGE_RATES, taxYear)
  const frequency = PAY_FREQUENCIES[payFrequency] ? payFrequency : 'monthly'
  const ageNow = Math.floor(atLeastZero(age))
  const years = Math.max(0, Math.floor(atLeastZero(retirementAge)) - ageNow)
  const salary = atLeastZero(salaryEntered)
  const rise = atLeastZero(payRisePercent) / 100
  const onQualifying = basis !== 'fullSalary'
  const relief = RELIEF_METHODS.includes(reliefType) ? reliefType : 'reliefAtSource'

  // What contributions are worked out on, and what each side asks to pay in a year.
  const qualifying = qualifyingEarnings(salary, { payFrequency: frequency, taxYear })
  const earnings = onQualifying ? qualifying.yearly : salary
  const employeeShare = Math.min(atLeastZero(employeePercent), 100) / 100
  const employerShare = Math.min(atLeastZero(employerPercent), 100) / 100
  const asked = earnings * employeeShare
  const employer = earnings * employerShare

  // Take-home pay with no pension, and with the contribution paid each way.
  const takeHome = (pensionType, pensionYearlyAmount) =>
    calculateTakeHomePay({
      pay: salary,
      payFrequency: frequency,
      scottish,
      pensionType,
      pensionYearlyAmount,
      weeklyHours,
      plan,
      hasPostgraduateLoan,
      taxYear,
    })
  const without = takeHome('reliefAtSource', 0)
  const methods = Object.fromEntries(
    RELIEF_METHODS.map((type) => [type, methodFor(type, asked, without, takeHome(type, asked))]),
  )
  const chosen = methods[relief]
  const yourIntoPot = chosen.intoPot
  const yearlyIntoPot = yourIntoPot + employer

  // The pot, grown exactly as the compound interest calculator grows it.
  const projection = calculateCompoundInterest({
    startAmount: potNow,
    payment: yearlyIntoPot / 12,
    paymentFrequency: 'monthly',
    ratePercent,
    compounding,
    chargePercent,
    inflationPercent,
    years,
    paymentRisePercent: rise * 100,
  })

  // Every year's contributions are the first year's, risen with pay.
  let yearsOfPay = 0
  for (let year = 1; year <= years; year += 1) yearsOfPay += (1 + rise) ** (year - 1)
  const totals = {
    fromYou: chosen.cost * yearsOfPay,
    relief: chosen.relief * yearsOfPay,
    employer: employer * yearsOfPay,
    paidIn: projection.totalPayments,
  }
  const rows = projection.rows.map((row) => ({
    ...row,
    age: ageNow + row.year,
    pay: salary * (1 + rise) ** (row.year - 1),
  }))

  // When you retire: usually up to 25% tax-free, up to the Lump Sum Allowance.
  const { taxFreeShare, lumpSumAllowance } = rates.lumpSum
  const quarter = projection.finalValue * taxFreeShare
  const taxFree = Math.min(quarter, lumpSumAllowance)
  const prices = projection.realValue === null ? null : projection.finalValue / projection.realValue
  const lumpSum = {
    share: taxFreeShare,
    allowance: lumpSumAllowance,
    quarter,
    taxFree,
    capped: quarter > lumpSumAllowance,
    rest: projection.finalValue - taxFree,
    taxFreeToday: prices ? taxFree / prices : null,
  }

  const { autoEnrolment, annualAllowance, salarySacrificeChange } = rates
  const minimumTotal = autoEnrolment.totalMinimum * qualifying.yearly
  const minimumEmployer = autoEnrolment.employerMinimum * qualifying.yearly
  const isSacrifice = relief === 'salarySacrifice'

  const result = {
    taxYear,
    age: ageNow,
    retirementAge: ageNow + years,
    years,
    salary,
    payRisePercent: rise * 100,
    payInLastYear: years > 0 ? salary * (1 + rise) ** (years - 1) : salary,
    basis: onQualifying ? 'qualifyingEarnings' : 'fullSalary',
    reliefType: relief,
    payFrequency: frequency,
    qualifyingEarnings: qualifying,
    earnings,
    employeePercent: employeeShare * 100,
    employerPercent: employerShare * 100,
    asked,
    yourIntoPot,
    employer,
    yearlyIntoPot,
    intoPotInLastYear: years > 0 ? yearlyIntoPot * (1 + rise) ** (years - 1) : yearlyIntoPot,
    methods,
    chosen,
    reliefLabel: reliefLabelFor(chosen),
    totals,
    potNow: projection.startAmount,
    finalValue: projection.finalValue,
    realValue: projection.realValue,
    growth: projection.growth,
    charges: projection.charges,
    ratePercent: projection.ratePercent,
    chargePercent: projection.chargePercent,
    inflationPercent: projection.inflationPercent,
    compounding: projection.compounding,
    yearlyRate: projection.yearlyRate,
    yearlyRateAfterCharges: projection.yearlyRateAfterCharges,
    rows,
    lumpSum,
    annualAllowance: {
      allowance: annualAllowance.standard,
      over: yearlyIntoPot > annualAllowance.standard,
      // Threshold income can only be over its limit if pay is.
      mayBeTapered: salary > annualAllowance.taper.thresholdIncome,
    },
    autoEnrolment: {
      // gov.uk: workers aged 22 to State Pension age who earn at least £10,000.
      paidTooLittle: salary < autoEnrolment.earningsTrigger,
      tooYoung: ageNow < autoEnrolment.minimumAge,
      employerNeedNotPay: qualifying.yearly === 0,
      minimumTotal,
      minimumEmployer,
      // On what was entered, so a salary sacrifice the minimum wage limits
      // does not count as choosing too little.
      belowMinimum:
        qualifying.yearly > 0 &&
        (asked + employer < minimumTotal - 0.005 || employer < minimumEmployer - 0.005),
    },
    salarySacrifice: {
      // The minimum wage stopped some or all of it.
      limited: isSacrifice && chosen.sacrificeCapped,
      blocked: isSacrifice && chosen.sacrificeCapped && yourIntoPot === 0,
      hours: atLeastZero(weeklyHours),
      hourlyRate: nationalLivingWage,
      minimumCashPay: chosen.minimumCashPay,
      overNiFreeLimit: isSacrifice
        ? Math.max(0, yourIntoPot - salarySacrificeChange.niFreeLimit)
        : 0,
    },
    // Less relief than relief at source would give, as for someone in a net
    // pay scheme who earns under the Personal Allowance.
    netPayLessRelief:
      relief === 'netPay' &&
      yourIntoPot > 0 &&
      chosen.relief < methods.reliefAtSource.hmrcTopUp - 0.005,
    belowMinimumPensionAge: ageNow + years < MINIMUM_PENSION_AGE_RISE.to,
  }
  return { ...result, working: workingFor(result, projection) }
}

/** What one way of giving tax relief does with the same contribution. */
function methodFor(type, asked, without, withPension) {
  const { pension } = withPension
  const fromPay = without.takeHomeAnnual - withPension.takeHomeAnnual
  const extraClaim = withPension.extraReliefToClaim
  const cost = fromPay - extraClaim
  return {
    type,
    asked,
    intoPot: pension.pensionIntoPot,
    // What take-home pay falls by, and what it costs once any extra relief is claimed.
    fromPay,
    extraClaim,
    cost,
    relief: pension.pensionIntoPot - cost,
    hmrcTopUp: pension.hmrcTopUp,
    incomeTaxSaved: without.incomeTax - withPension.incomeTax,
    nationalInsuranceSaved: without.nationalInsurance - withPension.nationalInsurance,
    studentLoanSaved: without.studentLoan - withPension.studentLoan,
    takeHomeWithout: without.takeHomeAnnual,
    takeHomeWith: withPension.takeHomeAnnual,
    sacrificeCapped: pension.sacrificeCapped,
    minimumCashPay: pension.minimumCashPay,
  }
}

/** What the relief on a contribution is called, by how it is given. */
function reliefLabelFor(method) {
  if (method.type !== 'salarySacrifice') return 'Tax relief'
  return method.studentLoanSaved > 0.005
    ? 'Tax, National Insurance and student loan saved'
    : 'Tax and National Insurance saved'
}

const yearsText = (years) => `${years} ${years === 1 ? 'year' : 'years'}`

function workingFor(result, projection) {
  const { chosen, qualifyingEarnings: qualifying, taxYear } = result
  const rises = result.payRisePercent > 0
  const atRetirement = `Your pot at ${result.retirementAge}`

  const pot = part(
    atRetirement,
    [
      add('Your pot now', result.potNow, pence),
      add(`Paid in over ${yearsText(result.years)}`, result.totals.paidIn, pence),
      add('Growth', result.growth, pence),
      result.charges > 0 && subtract('Charges', result.charges, pence),
    ],
    total('Your pot when you retire', result.finalValue, pence),
  )

  const paidIn = part(
    `What goes in over ${yearsText(result.years)}`,
    [
      info('Going in during the first year', result.yearlyIntoPot, pence),
      rises &&
        info('Your pay rises at the start of each year by', result.payRisePercent / 100, {
          unit: 'percent',
        }),
      rises && info('Going in during the last year', result.intoPotInLastYear, pence),
      add('From your take-home pay', result.totals.fromYou, pence),
      add(result.reliefLabel, result.totals.relief, pence),
      add('From your employer', result.totals.employer, pence),
    ],
    total('Paid in', result.totals.paidIn, pence),
    rises
      ? `Your contributions rise with your pay at the start of each year, and are paid in at the start of each month. What comes from you, from tax relief and from your employer keeps the same shares as in ${taxYear}.`
      : `Your contributions stay the same every year, and are paid in at the start of each month. What comes from you, from tax relief and from your employer keeps the same shares as in ${taxYear}.`,
  )

  const onQualifying = result.basis === 'qualifyingEarnings'
  const fromYouLabel =
    result.reliefType === 'reliefAtSource' ? 'From you, with basic rate relief' : 'From you'
  const contributions = part(
    `Your contributions in ${taxYear}`,
    [
      info('Your salary', result.salary, pence),
      onQualifying &&
        info(`Lower limit of qualifying earnings a ${qualifying.period}`, qualifying.lower),
      onQualifying &&
        info(`Upper limit of qualifying earnings a ${qualifying.period}`, qualifying.upper),
      onQualifying &&
        info('Qualifying earnings a year', qualifying.yearly, {
          ...pence,
          count: qualifying.payDays,
          each: qualifying.eachPayDay,
        }),
      add(
        fromYouLabel,
        result.yourIntoPot,
        chosen.sacrificeCapped
          ? pence
          : { ...pence, rate: result.employeePercent / 100, on: result.earnings },
      ),
      chosen.sacrificeCapped && info('Limited by the minimum wage', true, { unit: 'yesNo' }),
      add('From your employer', result.employer, {
        ...pence,
        rate: result.employerPercent / 100,
        on: result.earnings,
      }),
    ],
    total('Going into your pension a year', result.yearlyIntoPot, pence),
    onQualifying
      ? 'Qualifying earnings are your pay between the lower and upper limits on each pay day, worked out on your salary as entered, before any salary sacrifice.'
      : 'Contributions are worked out on your salary as entered, before any salary sacrifice.',
  )

  const cost = part(
    `What your contribution costs you in ${taxYear}`,
    [
      info('Your take-home pay a year with no pension', chosen.takeHomeWithout, pence),
      info('Your take-home pay a year with it', chosen.takeHomeWith, pence),
      add('Going into your pension from you', chosen.intoPot, pence),
      ...reliefLines(chosen),
    ],
    total('What it costs you a year', chosen.cost, pence),
    costNote(chosen.type, taxYear),
  )

  const { lumpSum } = result
  const taxFree = part(
    'The tax-free lump sum',
    [
      info('Your pot when you retire', result.finalValue, pence),
      info('Your tax-free share of it', lumpSum.quarter, {
        ...pence,
        rate: lumpSum.share,
        on: result.finalValue,
      }),
      info('Lump Sum Allowance', lumpSum.allowance, pence),
    ],
    total('Tax-free, the lower of the two', lumpSum.taxFree, pence),
    `You can usually take up to ${percent(lumpSum.share)} of a pension tax-free, up to the Lump Sum Allowance across all your pensions. You usually pay income tax on the rest when you take it, depending on your total income that tax year.`,
  )

  const allowance = part(`The annual allowance in ${taxYear}`, [
    info('Going into your pension a year', result.yearlyIntoPot, pence),
    info('Annual allowance', result.annualAllowance.allowance),
    info('Over the annual allowance', result.annualAllowance.over, { unit: 'yesNo' }),
  ])

  return [
    pot,
    paidIn,
    contributions,
    cost,
    yearlyRatePart(projection),
    todaysMoneyPart(projection, 'Your pot when you retire'),
    taxFree,
    allowance,
  ].filter(Boolean)
}

/** The lines that take the relief off a contribution to leave its cost. */
function reliefLines(method) {
  if (method.type === 'reliefAtSource') {
    return [
      subtract('Basic rate relief added to your pension', method.hmrcTopUp, pence),
      method.extraClaim > 0 &&
        subtract('Extra relief you can claim from HMRC', method.extraClaim, pence),
    ]
  }
  if (method.type === 'netPay') return [subtract('Income tax saved', method.incomeTaxSaved, pence)]
  return [
    subtract('Income tax saved', method.incomeTaxSaved, pence),
    subtract('National Insurance saved', method.nationalInsuranceSaved, pence),
    method.studentLoanSaved > 0.005 &&
      subtract('Student loan saved', method.studentLoanSaved, pence),
  ]
}

function costNote(type, taxYear) {
  if (type === 'reliefAtSource') {
    const { basicRate } = forTaxYear(INCOME_TAX_RATES, taxYear).incomeTax
    return `With relief at source, ${percent(1 - basicRate)} of your contribution comes from your take-home pay and your pension provider claims the other ${percent(basicRate)} from HMRC. A higher or additional rate taxpayer can claim more back from HMRC.`
  }
  if (type === 'netPay') {
    return 'With a net pay arrangement, your contribution comes off your pay before income tax, so you pay less tax. National Insurance is worked out on your pay before it.'
  }
  return 'With a salary sacrifice, you give up some salary and your employer pays it into your pension, so you pay less income tax and National Insurance.'
}
