// The maternity and paternity pay calculator. Rates and limits are in
// PARENTAL_PAY in calculations.js.
//
// Dates are plain 'YYYY-MM-DD' text and all date sums are done in UTC, so the
// result is the same on the build server and in any browser time zone.

import { PARENTAL_PAY } from './calculations.js'

const DAY = 24 * 60 * 60 * 1000

const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

/** '2027-03-01' to a UTC timestamp, or null if it is not a real date. */
function parseDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text ?? '')
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const time = Date.UTC(year, month - 1, day)
  const date = new Date(time)
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  return isReal ? time : null
}

const toText = (time) => new Date(time).toISOString().slice(0, 10)
const addDays = (text, days) => toText(parseDate(text) + days * DAY)

/** HMRC rounds statutory pay up to the next penny. */
const roundUpToPenny = (amount) => Math.ceil(amount * 100 - 1e-6) / 100

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
export function keyDates(dueDate) {
  const due = parseDate(dueDate)
  if (due === null) return null

  const { qualifyingWeekBeforeDue, earliestLeaveWeeksBeforeDue, continuousWeeks } = PARENTAL_PAY
  const expectedWeekStart = toText(due - new Date(due).getUTCDay() * DAY)
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
    // The earnings limit on file is for qualifying weeks in one tax year.
    limitMayDiffer:
      qualifyingWeekEnd < PARENTAL_PAY.lowerEarningsLimitFrom ||
      qualifyingWeekEnd > PARENTAL_PAY.lowerEarningsLimitTo,
  }
}

/** Why someone does not qualify, as a list of codes. Empty if they do. */
function reasonsNotQualifying({ earnings, workedContinuously }) {
  const reasons = []
  if (!workedContinuously) reasons.push('service')
  if (earnings < PARENTAL_PAY.lowerEarningsLimit) reasons.push('earnings')
  return reasons
}

/** The flat rate, or 90% of earnings if that is lower. */
const cappedWeeklyPay = (earnings) =>
  Math.min(PARENTAL_PAY.weeklyRate, roundUpToPenny(earnings * PARENTAL_PAY.earningsShare))

/**
 * Statutory Maternity Pay: 90% of average weekly earnings for 6 weeks, then
 * the flat rate (or 90% if lower) for 33 weeks. leaveStart is when pay
 * starts. It defaults to the due date.
 */
export function calculateMaternityPay({
  dueDate,
  leaveStart,
  averageWeeklyEarnings: weeklyEarnings,
  workedContinuously,
}) {
  const dates = keyDates(dueDate)
  if (!dates) return null

  const { maternity, maternityAllowance, earningsShare, noticeDays } = PARENTAL_PAY
  const earnings = atLeastZero(weeklyEarnings)
  const start = parseDate(leaveStart) === null ? dueDate : leaveStart
  const reasons = reasonsNotQualifying({ earnings, workedContinuously })
  const qualifies = reasons.length === 0

  const higherWeekly = roundUpToPenny(earnings * earningsShare)
  const standardWeekly = cappedWeeklyPay(earnings)
  const standardWeeks = maternity.payWeeks - maternity.higherRateWeeks

  const weeks = []
  if (qualifies) {
    for (let week = 0; week < maternity.payWeeks; week++) {
      weeks.push({
        number: week + 1,
        start: addDays(start, week * 7),
        end: addDays(start, week * 7 + 6),
        amount: week < maternity.higherRateWeeks ? higherWeekly : standardWeekly,
      })
    }
  }
  // Whole pence, so the total is exact.
  const totalPence =
    Math.round(higherWeekly * 100) * maternity.higherRateWeeks +
    Math.round(standardWeekly * 100) * standardWeeks

  // Maternity Allowance is for people who cannot get SMP. It needs earnings
  // of at least £30 a week, and the same flat rate or 90% applies.
  const allowanceMayApply = !qualifies && earnings >= maternityAllowance.weeklyEarnings
  const allowanceWeekly = allowanceMayApply ? cappedWeeklyPay(earnings) : 0

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
  }
}

/** Statutory Paternity Pay: the flat rate, or 90% if lower, for 2 weeks. */
export function calculatePaternityPay({
  dueDate,
  averageWeeklyEarnings: weeklyEarnings,
  workedContinuously,
}) {
  const dates = keyDates(dueDate)
  if (!dates) return null

  const { paternity } = PARENTAL_PAY
  const earnings = atLeastZero(weeklyEarnings)
  const reasons = reasonsNotQualifying({ earnings, workedContinuously })
  const qualifies = reasons.length === 0
  const weekly = qualifies ? cappedWeeklyPay(earnings) : 0

  return {
    ...dates,
    qualifies,
    reasons,
    averageWeeklyEarnings: earnings,
    weekly,
    total: Math.round(weekly * 100 * paternity.payWeeks) / 100,
    // Leave cannot start before the birth and must end within 52 weeks of it.
    leaveMustEndBy: addDays(dueDate, paternity.leaveMustEndWithinWeeks * 7),
  }
}
