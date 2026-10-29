// The maternity and paternity pay calculator. Rates and limits are in
// rates/parentalPay.js, by tax year.
//
// Dates are plain 'YYYY-MM-DD' text and all date sums are done in UTC (see
// dates.js), so the result is the same on the build server and in any browser
// time zone.

import { addDays, DAY, parseIsoDate, toIsoDate } from './dates.js'
import { atLeastZero } from './numbers.js'
import { PARENTAL_PAY_RATES } from './rates/parentalPay.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, subtract, total } from './working.js'

/** HMRC rounds statutory pay up to the next penny. */
const roundUpToPenny = (amount) => Math.ceil(amount * 100 - 1e-6) / 100
const toPenny = (amount) => Math.round(amount * 100 + 1e-6) / 100

const twoDigits = (year) => String(year % 100).padStart(2, '0')

/** The tax year a 'YYYY-MM-DD' date falls in, as '2026/27'. Tax years start on 6 April. */
export function taxYearOf(isoDate) {
  const year = Number(isoDate.slice(0, 4))
  const start = isoDate.slice(5) >= '04-06' ? year : year - 1
  return `${start}/${twoDigits(start + 1)}`
}

/**
 * The tax year whose National Insurance decides whether an employer gets
 * Small Employers' Relief: the last complete tax year before the qualifying
 * week begins. For a qualifying week starting on 15 November 2026 it is
 * 2025/26.
 */
export function smallEmployerTaxYear(qualifyingWeekStart) {
  const start = Number(taxYearOf(qualifyingWeekStart).slice(0, 4)) - 1
  return `${start}/${twoDigits(start + 1)}`
}

/**
 * Whether an employer gets Small Employers' Relief: its total Class 1
 * National Insurance (employees' and employer's, before Employment
 * Allowance) in that tax year was £45,000 or less.
 */
export function isSmallEmployer(classOneNationalInsurance, { taxYear } = {}) {
  const { smallEmployerLimit } = forTaxYear(PARENTAL_PAY_RATES, taxYear).reclaim
  const paid = classOneNationalInsurance
  return Number.isFinite(paid) && paid >= 0 && paid <= smallEmployerLimit
}

/**
 * What an employer can reclaim from HMRC of the statutory pay it pays: 92%,
 * or 109% with Small Employers' Relief. gov.uk does not say how the reclaim
 * is rounded, so it is worked out on the total and rounded to the penny.
 * cost is what the employer is left paying, and extra what it gets back on
 * top of what it paid (only with the relief).
 */
export function employerReclaim({ statutoryPay, smallEmployer = false, taxYear }) {
  const { reclaim } = forTaxYear(PARENTAL_PAY_RATES, taxYear)
  const rate = smallEmployer ? reclaim.smallEmployerRate : reclaim.rate
  const paid = atLeastZero(statutoryPay)
  const amount = toPenny(paid * rate)
  return {
    rate,
    smallEmployer: Boolean(smallEmployer),
    paid,
    amount,
    cost: Math.max(0, toPenny(paid - amount)),
    extra: Math.max(0, toPenny(amount - paid)),
  }
}

/** The working for what an employer reclaims, after the part for the pay itself. */
function reclaimParts(reclaim, payName) {
  const pence = { unit: 'gbpPence' }
  const reclaimed = part(
    'Reclaimed from HMRC',
    [
      add(
        reclaim.smallEmployer
          ? "Share you can reclaim, with Small Employers' Relief"
          : 'Share you can reclaim',
        reclaim.amount,
        { ...pence, rate: reclaim.rate, on: reclaim.paid },
      ),
    ],
    total('Reclaimed from HMRC', reclaim.amount, pence),
    'gov.uk does not say how the reclaim is rounded, so it is worked out on the total and rounded to the penny.',
  )
  const after =
    reclaim.extra > 0
      ? part(
          'Reclaimed above what you paid',
          [
            add('Reclaimed from HMRC', reclaim.amount, pence),
            subtract(`${payName} you pay`, reclaim.paid, pence),
          ],
          total('Reclaimed above what you paid', reclaim.extra, pence),
        )
      : part(
          'Your cost after the reclaim',
          [
            add(`${payName} you pay`, reclaim.paid, pence),
            subtract('Reclaimed from HMRC', reclaim.amount, pence),
          ],
          total('Your cost after the reclaim', reclaim.cost, pence),
        )
  return [reclaimed, after]
}

/**
 * Average weekly earnings from a regular amount. gov.uk works a monthly-paid
 * employee out as two months' pay, times 6, divided by 52, which is the same
 * as one month's pay times 12 divided by 52.
 */
export function averageWeeklyEarnings({ amount, period }) {
  const pay = atLeastZero(amount)
  if (period === 'monthly') return (pay * 12) / 52
  if (period === 'annual') return pay / 52
  return pay
}

/**
 * The dates that follow from a due date.
 *
 * Weeks run Sunday to Saturday. The expected week of childbirth is the week
 * the due date falls in. The qualifying week is the 15th week before it.
 */
export function keyDates(dueDate, { taxYear } = {}) {
  const due = parseIsoDate(dueDate)
  if (due === null) return null

  const rates = forTaxYear(PARENTAL_PAY_RATES, taxYear)
  const { qualifyingWeekBeforeDue, earliestLeaveWeeksBeforeDue, continuousWeeks } = rates
  const expectedWeekStart = toIsoDate(due - new Date(due).getUTCDay() * DAY)
  const qualifyingWeekStart = addDays(expectedWeekStart, -7 * qualifyingWeekBeforeDue)
  const qualifyingWeekEnd = addDays(qualifyingWeekStart, 6)

  return {
    dueDate,
    expectedWeekStart,
    qualifyingWeekStart,
    qualifyingWeekEnd,
    // To have 26 weeks by the qualifying week, the job must have started by this date.
    employedSince: addDays(qualifyingWeekEnd, -7 * (continuousWeeks - 1)),
    // The employer must be told by the end of the qualifying week.
    tellEmployerBy: qualifyingWeekEnd,
    earliestLeaveStart: addDays(expectedWeekStart, -7 * earliestLeaveWeeksBeforeDue),
    // Small Employers' Relief depends on National Insurance in this tax year.
    smallEmployerTaxYear: smallEmployerTaxYear(qualifyingWeekStart),
    // The earnings limit on file is for qualifying weeks in one tax year.
    limitMayDiffer:
      qualifyingWeekEnd < rates.lowerEarningsLimitFrom ||
      qualifyingWeekEnd > rates.lowerEarningsLimitTo,
  }
}

/** Why someone does not qualify, as a list of codes. Empty if they do. */
function reasonsNotQualifying({ earnings, workedContinuously, rates }) {
  const reasons = []
  if (!workedContinuously) reasons.push('service')
  if (earnings < rates.lowerEarningsLimit) reasons.push('earnings')
  return reasons
}

const pence = { unit: 'gbpPence' }

/** Why someone does not qualify, for the working. */
const whyNotPart = ({ earnings, workedContinuously, rates }) =>
  part('Why you do not qualify', [
    info('Average weekly earnings', earnings, pence),
    info('The least they can be', rates.lowerEarningsLimit, pence),
    info('Worked for your employer for long enough', Boolean(workedContinuously), {
      unit: 'yesNo',
    }),
  ])

/** How the weekly amounts were worked out, for the working. */
const weeklyAmountsPart = ({ earnings, higherWeekly, standardWeekly, rates }) =>
  part('Weekly amounts', [
    info('Average weekly earnings', earnings, pence),
    info('Share of them, rounded up to the penny', higherWeekly, {
      ...pence,
      rate: rates.earningsShare,
      on: earnings,
    }),
    info('The flat weekly rate', rates.weeklyRate, pence),
    info('Weekly pay, the lower of those two', standardWeekly, pence),
  ])

/** Some weeks of pay at one weekly amount, in whole pence. */
const weeksAt = (label, count, each) =>
  add(label, (Math.round(each * 100) * count) / 100, { ...pence, count, each })

/** The flat rate, or 90% of earnings if that is lower. */
const cappedWeeklyPay = (earnings, rates) =>
  Math.min(rates.weeklyRate, roundUpToPenny(earnings * rates.earningsShare))

/**
 * Statutory Maternity Pay: 90% of average weekly earnings for 6 weeks, then
 * the flat rate (or 90% if lower) for 33 weeks. leaveStart is when pay
 * starts. It defaults to the due date.
 *
 * reclaim is what the employer can reclaim from HMRC (employerReclaim), with
 * Small Employers' Relief if smallEmployer is true. The working shows it when
 * forEmployer is true.
 */
export function calculateMaternityPay({
  dueDate,
  leaveStart,
  averageWeeklyEarnings: weeklyEarnings,
  workedContinuously,
  forEmployer = false,
  smallEmployer = false,
  taxYear,
}) {
  const dates = keyDates(dueDate, { taxYear })
  if (!dates) return null

  const rates = forTaxYear(PARENTAL_PAY_RATES, taxYear)
  const { maternity, maternityAllowance, earningsShare, noticeDays } = rates
  const earnings = atLeastZero(weeklyEarnings)
  const start = parseIsoDate(leaveStart) === null ? dueDate : leaveStart
  const reasons = reasonsNotQualifying({ earnings, workedContinuously, rates })
  const qualifies = reasons.length === 0

  const higherWeekly = roundUpToPenny(earnings * earningsShare)
  const standardWeekly = cappedWeeklyPay(earnings, rates)
  const standardWeeks = maternity.payWeeks - maternity.higherRateWeeks

  // Whole pence, so the total is exact.
  const totalPence =
    Math.round(higherWeekly * 100) * maternity.higherRateWeeks +
    Math.round(standardWeekly * 100) * standardWeeks
  const reclaim = employerReclaim({
    statutoryPay: qualifies ? totalPence / 100 : 0,
    smallEmployer,
    taxYear,
  })

  const weeks = []
  if (qualifies) {
    for (let week = 0; week < maternity.payWeeks; week++) {
      const amount = week < maternity.higherRateWeeks ? higherWeekly : standardWeekly
      weeks.push({
        number: week + 1,
        start: addDays(start, week * 7),
        end: addDays(start, week * 7 + 6),
        amount,
        reclaim: toPenny(amount * reclaim.rate),
      })
    }
  }

  // Maternity Allowance is for people who cannot get SMP. It needs earnings
  // of at least £30 a week, and the same flat rate or 90% applies.
  const allowanceMayApply = !qualifies && earnings >= maternityAllowance.weeklyEarnings
  const allowanceWeekly = allowanceMayApply ? cappedWeeklyPay(earnings, rates) : 0

  return {
    ...dates,
    qualifies,
    reasons,
    averageWeeklyEarnings: earnings,
    leaveStart: start,
    leaveStartTooEarly: start < dates.earliestLeaveStart,
    leaveEnd: addDays(start, maternity.leaveWeeks * 7 - 1),
    claimPayBy: addDays(start, -noticeDays),
    higherWeekly: qualifies ? higherWeekly : 0,
    standardWeekly: qualifies ? standardWeekly : 0,
    standardWeeks,
    total: qualifies ? totalPence / 100 : 0,
    weeks,
    payEnd: qualifies ? weeks.at(-1).end : null,
    allowanceMayApply,
    allowanceWeekly,
    allowanceTotal: Math.round(allowanceWeekly * 100 * maternityAllowance.payWeeks) / 100,
    reclaim: {
      ...reclaim,
      higherWeekly: qualifies ? toPenny(higherWeekly * reclaim.rate) : 0,
      standardWeekly: qualifies ? toPenny(standardWeekly * reclaim.rate) : 0,
    },
    working: qualifies
      ? [
          part(
            'Statutory Maternity Pay',
            [
              weeksAt('The first weeks', maternity.higherRateWeeks, higherWeekly),
              weeksAt('The weeks after that', standardWeeks, standardWeekly),
            ],
            total('Total, before tax', totalPence / 100, pence),
          ),
          ...(forEmployer ? reclaimParts(reclaim, 'Statutory Maternity Pay') : []),
          weeklyAmountsPart({ earnings, higherWeekly, standardWeekly, rates }),
        ]
      : [
          whyNotPart({ earnings, workedContinuously, rates }),
          allowanceMayApply &&
            part(
              'Maternity Allowance you might get instead',
              [
                weeksAt(
                  'Weeks of Maternity Allowance',
                  maternityAllowance.payWeeks,
                  allowanceWeekly,
                ),
              ],
              total(
                'Total',
                Math.round(allowanceWeekly * 100 * maternityAllowance.payWeeks) / 100,
                pence,
              ),
            ),
        ].filter(Boolean),
  }
}

/**
 * Statutory Paternity Pay: the flat rate, or 90% if lower, for 2 weeks.
 * reclaim, forEmployer and smallEmployer work as for maternity pay.
 */
export function calculatePaternityPay({
  dueDate,
  averageWeeklyEarnings: weeklyEarnings,
  workedContinuously,
  forEmployer = false,
  smallEmployer = false,
  taxYear,
}) {
  const dates = keyDates(dueDate, { taxYear })
  if (!dates) return null

  const rates = forTaxYear(PARENTAL_PAY_RATES, taxYear)
  const { paternity } = rates
  const earnings = atLeastZero(weeklyEarnings)
  const reasons = reasonsNotQualifying({ earnings, workedContinuously, rates })
  const qualifies = reasons.length === 0
  const weekly = qualifies ? cappedWeeklyPay(earnings, rates) : 0
  const payTotal = Math.round(weekly * 100 * paternity.payWeeks) / 100
  const reclaim = employerReclaim({ statutoryPay: payTotal, smallEmployer, taxYear })

  return {
    ...dates,
    qualifies,
    reasons,
    averageWeeklyEarnings: earnings,
    weekly,
    total: payTotal,
    reclaim: { ...reclaim, weekly: toPenny(weekly * reclaim.rate) },
    // Leave cannot start before the birth and must end within 52 weeks of it.
    leaveMustEndBy: addDays(dueDate, paternity.leaveMustEndWithinWeeks * 7),
    working: qualifies
      ? [
          part(
            'Statutory Paternity Pay',
            [weeksAt('Weeks of paternity pay', paternity.payWeeks, weekly)],
            total('Total, before tax', payTotal, pence),
          ),
          ...(forEmployer ? reclaimParts(reclaim, 'Statutory Paternity Pay') : []),
          weeklyAmountsPart({
            earnings,
            higherWeekly: roundUpToPenny(earnings * rates.earningsShare),
            standardWeekly: weekly,
            rates,
          }),
        ]
      : [whyNotPart({ earnings, workedContinuously, rates })],
  }
}
