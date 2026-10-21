// The take-home pay calculator: pay from one job after income tax, National
// Insurance, student loan and a workplace pension, worked out the way payroll
// works it out.
//
// - Income tax is cumulative: payroll works it out on pay so far in the tax
//   year, so over the year it comes to the tax on the year's pay. With a tax
//   code it uses the code as it is. Without one it uses the standard Personal
//   Allowance, reduced above £100,000.
// - National Insurance and student loans are worked out on each pay day on
//   its own, with the thresholds for a week or a month.
// - A bonus is paid on one pay day on top of the usual pay. Its income tax is
//   what it adds to the year's tax, and its NI and student loan are what it
//   adds on that pay day. The pension comes from the usual pay only.
//
// It builds on incomeTax.js, studentLoans.js and pensions.js and has no tax
// rules of its own. The figures are in rates/.

import {
  calculateIncomeTax,
  incomeTaxLabel,
  incomeTaxOnCode,
  nationalInsuranceForPeriod,
} from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { PAY_FREQUENCIES, yearlyPayFrom } from './payPeriods.js'
import { extraReliefToClaim, pensionContributions } from './pensions.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { FULL_TIME_HOURS } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'
import { studentLoanForPeriod } from './studentLoans.js'
import { add, info, part, subtract, total } from './working.js'

const pence = { unit: 'gbpPence' }

/**
 * Take-home pay for a year, and per month and week.
 *
 * - pay and payPer: the pay entered, and what it is for ('year', 'month',
 *   'week', 'day' or 'hour'). hoursPerWeek and daysPerWeek turn hourly and
 *   daily pay into a year.
 * - bonus: a one-off payment in the tax year, before tax.
 * - payFrequency: how often payroll runs, 'monthly' or 'weekly'.
 * - taxCode: what readTaxCode gives, or null to use the standard allowance.
 * - scottish, welsh: which income tax rates (see taxRatesFor in readTaxCode.js).
 * - pensionType, pensionPercent, pensionYearlyAmount, weeklyHours: as
 *   pensionContributions in pensions.js takes them.
 * - plan, hasPostgraduateLoan: the student loans being repaid.
 * - paysNationalInsurance: false for someone over State Pension age.
 */
export function calculateTakeHomePay({
  pay,
  payPer = 'year',
  hoursPerWeek = FULL_TIME_HOURS,
  daysPerWeek = 5,
  bonus = 0,
  payFrequency = 'monthly',
  taxCode = null,
  scottish = false,
  welsh = false,
  pensionType = 'salarySacrifice',
  pensionPercent = 0,
  pensionYearlyAmount = 0,
  weeklyHours = FULL_TIME_HOURS,
  plan = 'none',
  hasPostgraduateLoan = false,
  paysNationalInsurance = true,
  taxYear,
}) {
  const rates = forTaxYear(INCOME_TAX_RATES, taxYear)
  const { perYear: payDays, period } = PAY_FREQUENCIES[payFrequency]
  const entered = atLeastZero(pay)
  const gross = yearlyPayFrom(entered, payPer, { hoursPerWeek, daysPerWeek })
  const extra = atLeastZero(bonus)
  const where = { scottish, welsh, taxYear }
  const taxName = incomeTaxLabel(scottish, welsh)

  const pension = pensionContributions({
    gross,
    pensionType,
    pensionPercent,
    pensionYearlyAmount,
    weeklyHours,
    taxYear,
  })
  const { taxablePay, niablePay } = pension

  // Income tax due for the year, with and without the bonus.
  const taxDue = (income) =>
    taxCode ? incomeTaxOnCode(income, taxCode, where) : calculateIncomeTax(income, where)
  const regular = taxDue(taxablePay)
  const withBonus = extra > 0 ? taxDue(taxablePay + extra) : regular

  // No more than half of each pay day's pay can be taken in tax. Tax that
  // could not be taken is carried forward, and the bonus is taken as paid on
  // the last pay day of the tax year, so some of it can be taken then.
  const limit = rates.incomeTax.maxShareOfPayTaken
  const taxablePayDay = taxablePay / payDays
  const taxEachPayDay = Math.min(regular.tax / payDays, limit * taxablePayDay)
  const incomeTax = taxEachPayDay * payDays
  const takenBeforeBonus = taxEachPayDay * (payDays - 1)
  const incomeTaxWithBonus =
    extra > 0
      ? takenBeforeBonus +
        Math.min(withBonus.tax - takenBeforeBonus, limit * (taxablePayDay + extra))
      : incomeTax
  const taxNotTaken = Math.max(0, withBonus.tax - incomeTaxWithBonus)

  // National Insurance and student loan on a usual pay day, and on the one the
  // bonus is paid on.
  const niablePayDay = niablePay / payDays
  const niOn = (amount) =>
    paysNationalInsurance
      ? nationalInsuranceForPeriod(amount, payFrequency, { taxYear })
      : { ni: 0, bands: [] }
  const niUsual = niOn(niablePayDay)
  const niBonusDay = niOn(niablePayDay + extra)
  const nationalInsurance = niUsual.ni * payDays

  const loanOn = (amount) =>
    studentLoanForPeriod({
      periodPay: amount,
      plan,
      hasPostgraduateLoan,
      frequency: payFrequency,
      taxYear,
    })
  const loanUsual = loanOn(niablePayDay)
  const loanBonusDay = loanOn(niablePayDay + extra)
  const studentLoan = loanUsual.total * payDays
  const hasLoan = (plan && plan !== 'none') || hasPostgraduateLoan

  const takeHomeAnnual =
    gross - incomeTax - nationalInsurance - studentLoan - pension.pensionFromPay

  const bonusResult =
    extra > 0
      ? {
          amount: extra,
          incomeTax: incomeTaxWithBonus - incomeTax,
          nationalInsurance: niBonusDay.ni - niUsual.ni,
          studentLoan: loanBonusDay.total - loanUsual.total,
        }
      : null
  if (bonusResult) {
    bonusResult.kept =
      extra - bonusResult.incomeTax - bonusResult.nationalInsurance - bonusResult.studentLoan
  }

  const adjustedNetIncome = pension.adjustedNetIncome + extra
  const extraRelief = extraReliefToClaim({
    income: gross + extra,
    reliefAtSourceGross: pension.reliefAtSourceGross,
    scottish,
    welsh,
    taxYear,
  })

  const year = {
    pay: gross,
    incomeTax,
    nationalInsurance,
    studentLoan,
    pension: pension.pensionFromPay,
    takeHome: takeHomeAnnual,
  }
  const divided = (by) => Object.fromEntries(Object.entries(year).map(([k, v]) => [k, v / by]))

  return {
    pay: gross,
    payFrequency,
    payDays,
    period,
    taxCode,
    scottish,
    welsh,
    incomeTaxName: taxName,
    pension,
    extraReliefToClaim: extraRelief,
    incomeTax,
    incomeTaxDue: regular.tax,
    taxNotTaken,
    personalAllowanceUsed: regular.personalAllowanceUsed,
    topTaxRate: regular.topRate,
    nationalInsurance,
    studentLoan,
    takeHomeAnnual,
    takeHomeMonthly: takeHomeAnnual / 12,
    takeHomeWeekly: takeHomeAnnual / 52,
    takeHomePayDay: takeHomeAnnual / payDays,
    takeHomeWithBonus: takeHomeAnnual + (bonusResult?.kept ?? 0),
    columns: { year, month: divided(12), week: divided(52) },
    effectiveRate: gross > 0 ? (incomeTax + nationalInsurance) / gross : 0,
    bonus: bonusResult,
    adjustedNetIncome,
    // A code is used as it is, so payroll does not reduce the allowance above
    // £100,000. HMRC usually changes the code, or collects the tax later.
    codeSkipsTaper: taxCode?.kind === 'allowance' && adjustedNetIncome > rates.incomeTax.taperStart,
    childBenefitCharge: adjustedNetIncome > rates.childBenefitCharge.threshold,
    working: [
      part(
        'Take-home pay a year',
        [
          add('Pay before tax', gross, pence),
          subtract(taxName, incomeTax, pence),
          subtract('National Insurance', nationalInsurance, {
            ...pence,
            count: payDays,
            each: niUsual.ni,
          }),
          hasLoan &&
            subtract('Student loan', studentLoan, {
              ...pence,
              count: payDays,
              each: loanUsual.total,
            }),
          pension.pensionFromPay > 0 &&
            subtract('Pension paid from your pay', pension.pensionFromPay, pence),
        ],
        total('Take-home pay a year', takeHomeAnnual, pence),
      ),
      payPart({ entered, payPer, hoursPerWeek, daysPerWeek, gross }),
      pension.pensionIntoPot > 0 && pensionPart(pension, extraRelief),
      incomeTaxPart({ taxName, taxCode, taxablePay, regular, incomeTax }),
      nationalInsurancePart({ niablePayDay, niUsual, period, paysNationalInsurance }),
      ...(hasLoan ? loanUsual.working : []),
      bonusResult &&
        part(
          'Your bonus',
          [
            add('Bonus', extra, pence),
            subtract(taxName, bonusResult.incomeTax, pence),
            subtract('National Insurance', bonusResult.nationalInsurance, pence),
            hasLoan && subtract('Student loan', bonusResult.studentLoan, pence),
          ],
          total('What you keep from your bonus', bonusResult.kept, pence),
        ),
      bonusResult &&
        paysNationalInsurance &&
        part(
          'National Insurance on the pay day your bonus is paid',
          [
            info(`Pay that ${period}, with the bonus`, niablePayDay + extra, pence),
            ...niBonusDay.bands.map((band) =>
              add(band.name, band.amount, { ...pence, rate: band.rate, on: band.on }),
            ),
            subtract(`National Insurance on a usual ${period}`, niUsual.ni, pence),
          ],
          total('National Insurance on your bonus', bonusResult.nationalInsurance, pence),
        ),
    ].filter(Boolean),
  }
}

/** How pay entered for a month, week, day or hour comes to a year. */
function payPart({ entered, payPer, hoursPerWeek, daysPerWeek, gross }) {
  if (payPer === 'year') return null
  const lines = {
    month: [add('Pay for 12 months', gross, { ...pence, count: 12, each: entered })],
    week: [add('Pay for 52 weeks', gross, { ...pence, count: 52, each: entered })],
    day: [
      info('Days a week', daysPerWeek, { unit: 'number' }),
      add('Pay for the days you work in 52 weeks', gross, {
        ...pence,
        count: daysPerWeek * 52,
        each: entered,
      }),
    ],
    hour: [
      info('Hours a week', hoursPerWeek, { unit: 'number' }),
      add('Pay for the hours you work in 52 weeks', gross, {
        ...pence,
        count: hoursPerWeek * 52,
        each: entered,
      }),
    ],
  }[payPer]
  return part('Your pay for the year', lines, total('Pay before tax a year', gross, pence))
}

/** What goes into the pension, and the pay each deduction is worked out on. */
function pensionPart(pension, extraRelief) {
  const isReliefAtSource = pension.pensionType === 'reliefAtSource'
  return part('Your pension', [
    info('Paid into your pension', pension.pensionIntoPot, pence),
    isReliefAtSource && info('Basic rate relief HMRC adds', pension.hmrcTopUp, pence),
    isReliefAtSource && info('Paid from your take-home pay', pension.pensionFromPay, pence),
    info('Pay income tax is worked out on', pension.taxablePay, pence),
    info('Pay National Insurance and student loan are worked out on', pension.niablePay, pence),
    isReliefAtSource && info('Extra relief you can claim from HMRC', extraRelief, pence),
  ])
}

/** How the year's income tax was worked out, with or without a tax code. */
function incomeTaxPart({ taxName, taxCode, taxablePay, regular, incomeTax }) {
  const allowanceLine = () => {
    if (!taxCode) {
      return info('Personal Allowance (tax-free)', regular.personalAllowanceUsed, pence)
    }
    if (taxCode.kind === 'allowance') {
      return info('Tax-free pay from your tax code', taxCode.allowance, pence)
    }
    if (taxCode.kind === 'k') {
      return info('Added to your pay by your tax code', -taxCode.allowance, pence)
    }
    return null
  }
  const notTaken = regular.tax - incomeTax
  return part(
    taxCode ? `${taxName}, tax code ${taxCode.text}` : taxName,
    [
      info('Pay income tax is worked out on', taxablePay, pence),
      allowanceLine(),
      taxCode?.kind !== 'noTax' && info('Taxable pay', regular.taxableIncome, pence),
      ...regular.bands.map((band) =>
        add(band.name, band.tax, { ...pence, rate: band.rate, on: band.on }),
      ),
      notTaken > 0.005 && subtract('Not taken, over the limit of half your pay', notTaken, pence),
    ],
    total(`${taxName} a year`, incomeTax, pence),
  )
}

/** National Insurance on a usual pay day. */
function nationalInsurancePart({ niablePayDay, niUsual, period, paysNationalInsurance }) {
  const title = `National Insurance a ${period}`
  if (!paysNationalInsurance) {
    return part(
      'National Insurance',
      [info('Over State Pension age, so none is paid', true, { unit: 'yesNo' })],
      total(title, 0, pence),
    )
  }
  return part(
    'National Insurance',
    [
      info(`Pay a ${period}`, niablePayDay, pence),
      info(`Primary threshold a ${period}`, niUsual.primaryThreshold),
      info(`Upper earnings limit a ${period}`, niUsual.upperEarningsLimit),
      ...niUsual.bands.map((band) =>
        add(band.name, band.amount, { ...pence, rate: band.rate, on: band.on }),
      ),
    ],
    total(title, niUsual.ni, pence),
  )
}
