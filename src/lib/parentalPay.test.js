// Tests for the maternity and paternity pay calculator. Run with: npm test
//
// Each test name says where its expected values came from:
//   [gov.uk]      a published rule, or a result from the official "Maternity, adoption
//                 and paternity calculator for employers", checked on 10 October 2026
//   [own working] worked out by hand from the published rates and rules
//
// https://www.gov.uk/maternity-paternity-calculator
// https://www.gov.uk/maternity-pay-leave
// https://www.gov.uk/paternity-pay-leave
// https://www.gov.uk/maternity-allowance

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  averageWeeklyEarnings,
  calculateMaternityPay,
  calculatePaternityPay,
  keyDates,
} from './parentalPay.js'

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `${message ?? ''} got ${actual}, expected ${expected}`,
  )

const maternity = (averageWeekly, extra = {}) =>
  calculateMaternityPay({
    dueDate: '2027-03-01',
    averageWeeklyEarnings: averageWeekly,
    workedContinuously: true,
    ...extra,
  })

const paternity = (averageWeekly, extra = {}) =>
  calculatePaternityPay({
    dueDate: '2027-03-01',
    averageWeeklyEarnings: averageWeekly,
    workedContinuously: true,
    ...extra,
  })

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

test('parental pay [gov.uk] the qualifying week and other dates match the official calculator', () => {
  // For each due date the official calculator gives: the earliest date leave can start,
  // the dates the contract must cover (26 weeks up to the start of the qualifying week),
  // and the Saturday that ends the qualifying week.
  const cases = [
    // due date, earliest leave, employed since, qualifying week start, qualifying week end
    ['2027-03-01', '2026-12-13', '2026-05-30', '2026-11-15', '2026-11-21'], // due on a Monday
    ['2027-01-17', '2026-11-01', '2026-04-18', '2026-10-04', '2026-10-10'], // due on a Sunday
    ['2027-01-16', '2026-10-25', '2026-04-11', '2026-09-27', '2026-10-03'], // due on a Saturday
    ['2026-12-25', '2026-10-04', '2026-03-21', '2026-09-06', '2026-09-12'], // due on a Friday
    ['2027-07-14', '2027-04-25', '2026-10-10', '2027-03-28', '2027-04-03'], // due on a Wednesday
  ]
  for (const [due, earliestLeave, employedSince, weekStart, weekEnd] of cases) {
    const dates = keyDates(due)
    assert.equal(dates.earliestLeaveStart, earliestLeave, `${due}: earliest leave`)
    assert.equal(dates.employedSince, employedSince, `${due}: employed since`)
    assert.equal(dates.qualifyingWeekStart, weekStart, `${due}: qualifying week start`)
    assert.equal(dates.qualifyingWeekEnd, weekEnd, `${due}: qualifying week end`)
    // "Latest date to claim leave" on the official calculator is the end of the qualifying week.
    assert.equal(dates.tellEmployerBy, weekEnd)
  }
})

test('parental pay [own working] the qualifying week is always a Sunday to Saturday', () => {
  // A due date on a Sunday starts a new expected week. Saturday is the last day of one.
  assert.equal(keyDates('2027-01-17').expectedWeekStart, '2027-01-17')
  assert.equal(keyDates('2027-01-16').expectedWeekStart, '2027-01-10')
  // Every due date in a year: 15 weeks before the expected week, Sunday to Saturday.
  for (let day = 0; day < 366; day++) {
    const due = new Date(Date.UTC(2027, 0, 1 + day)).toISOString().slice(0, 10)
    const dates = keyDates(due)
    const start = new Date(`${dates.qualifyingWeekStart}T00:00:00Z`)
    const end = new Date(`${dates.qualifyingWeekEnd}T00:00:00Z`)
    assert.equal(start.getUTCDay(), 0, `${due}: starts on a Sunday`)
    assert.equal(end.getUTCDay(), 6, `${due}: ends on a Saturday`)
    const weeksBefore =
      (new Date(`${dates.expectedWeekStart}T00:00:00Z`) - start) / (7 * 24 * 60 * 60 * 1000)
    assert.equal(weeksBefore, 15, due)
    assert.ok(dates.expectedWeekStart <= due)
  }
  // Across a leap day and a year end.
  assert.equal(keyDates('2028-06-12').qualifyingWeekStart, '2028-02-27')
  assert.equal(keyDates('2027-04-10').qualifyingWeekStart, '2026-12-20')
})

test('parental pay [own working] dates that are not real give no result', () => {
  for (const due of ['', 'soon', '2027-02-30', '2027-13-01', undefined]) {
    assert.equal(keyDates(due), null)
    assert.equal(maternity(500, { dueDate: due }), null)
    assert.equal(paternity(500, { dueDate: due }), null)
  }
})

// ---------------------------------------------------------------------------
// Average weekly earnings
// ---------------------------------------------------------------------------

test('parental pay [gov.uk] average weekly earnings from monthly pay', () => {
  // The official calculator gives £576.9230769 for £5,000 over 2 months,
  // and £288.4615384 for £2,500 over 2 months.
  near(averageWeeklyEarnings({ amount: 2500, period: 'monthly' }), 576.9230769)
  near(averageWeeklyEarnings({ amount: 1250, period: 'monthly' }), 288.4615384)
  // The same from a yearly salary, and unchanged from a weekly figure.
  near(averageWeeklyEarnings({ amount: 30000, period: 'annual' }), 576.9230769)
  assert.equal(averageWeeklyEarnings({ amount: 400, period: 'weekly' }), 400)
  assert.equal(averageWeeklyEarnings({ amount: -5, period: 'weekly' }), 0)
  assert.equal(averageWeeklyEarnings({ amount: NaN, period: 'monthly' }), 0)
})

// ---------------------------------------------------------------------------
// Statutory Maternity Pay
// ---------------------------------------------------------------------------

test('parental pay [gov.uk] SMP on £30,000 a year matches the official calculator', () => {
  // Official result for a baby due 1 March 2027, leave from 1 March 2027, £5,000 over 2 months:
  // 6 weeks at £519.24, then 33 weeks at £194.32. Total SMP £9,528. Weeks ending
  // 7 March 2027 to 28 November 2027. Leave ends 27 February 2028. Latest date to claim
  // SMP 1 February 2027.
  const result = maternity(averageWeeklyEarnings({ amount: 30000, period: 'annual' }))
  assert.equal(result.qualifies, true)
  assert.equal(result.higherWeekly, 519.24)
  assert.equal(result.standardWeekly, 194.32)
  assert.equal(result.total, 9528)
  assert.equal(result.weeks.length, 39)
  assert.deepEqual(result.weeks[0], {
    number: 1,
    start: '2027-03-01',
    end: '2027-03-07',
    amount: 519.24,
  })
  assert.equal(result.weeks[5].end, '2027-04-11')
  assert.equal(result.weeks[5].amount, 519.24)
  assert.equal(result.weeks[6].end, '2027-04-18')
  assert.equal(result.weeks[6].amount, 194.32)
  assert.equal(result.weeks[38].end, '2027-11-28')
  assert.equal(result.payEnd, '2027-11-28')
  assert.equal(result.leaveEnd, '2028-02-27')
  assert.equal(result.claimPayBy, '2027-02-01')
})

test('parental pay [gov.uk] SMP on £15,000 a year: 90% is rounded up to the penny', () => {
  // Official result for £2,500 over 2 months: £259.62 a week for the first 6 weeks.
  // 90% of £288.4615384 is £259.6153, so the amount is rounded up.
  const result = maternity(averageWeeklyEarnings({ amount: 15000, period: 'annual' }))
  assert.equal(result.higherWeekly, 259.62)
  assert.equal(result.standardWeekly, 194.32)
  assert.equal(result.total, 7970.28) // 6 x £259.62 + 33 x £194.32
})

test('parental pay [gov.uk] the lower earnings limit of £129 a week', () => {
  // Official results: £1,118 over 2 months is exactly £129.00 a week and qualifies.
  // £1,117 over 2 months is £128.88 a week: "not entitled ... must be at least £129".
  const at = maternity(averageWeeklyEarnings({ amount: 559, period: 'monthly' }))
  near(at.averageWeeklyEarnings, 129)
  assert.equal(at.qualifies, true)
  const under = maternity(averageWeeklyEarnings({ amount: 558.5, period: 'monthly' }))
  near(under.averageWeeklyEarnings, 128.88)
  assert.equal(under.qualifies, false)
  assert.deepEqual(under.reasons, ['earnings'])
  assert.equal(under.total, 0)
  assert.deepEqual(under.weeks, [])
  // The same limit applies to paternity pay.
  assert.equal(paternity(129).qualifies, true)
  assert.equal(paternity(128.99).qualifies, false)
})

test('parental pay [own working] the switch between 90% and the flat rate', () => {
  // 90% of £215.91 is £194.319, which rounds up to exactly the flat rate of £194.32.
  const cases = [
    // average weekly earnings, first 6 weeks, next 33 weeks
    [129, 116.1, 116.1], // 90% in both periods
    [200, 180, 180], // 90% is under the flat rate throughout
    [215.9, 194.31, 194.31], // one penny under
    [215.91, 194.32, 194.32], // exactly on the flat rate
    [216, 194.4, 194.32], // 90% is now over it, so the flat rate takes over after 6 weeks
    [1000, 900, 194.32],
    [5000, 4500, 194.32], // no upper limit on the first 6 weeks
  ]
  for (const [earnings, firstSix, nextThirtyThree] of cases) {
    const result = maternity(earnings)
    assert.equal(result.higherWeekly, firstSix, `first 6 weeks on ${earnings}`)
    assert.equal(result.standardWeekly, nextThirtyThree, `next 33 weeks on ${earnings}`)
    near(result.total, 6 * firstSix + 33 * nextThirtyThree)
    assert.equal(result.weeks.filter((week) => week.amount === firstSix).length >= 6, true)
  }
})

test('parental pay [gov.uk] 26 weeks with the employer is required', () => {
  // "have worked for your employer continuously for at least 26 weeks continuing into
  // the qualifying week"
  const result = maternity(500, { workedContinuously: false })
  assert.equal(result.qualifies, false)
  assert.deepEqual(result.reasons, ['service'])
  // Both reasons can apply at once.
  assert.deepEqual(maternity(100, { workedContinuously: false }).reasons, ['service', 'earnings'])
})

test('parental pay [own working] leave start date and the week-by-week table', () => {
  // Starting leave two weeks before the due date moves every week, the end of pay and the
  // notice date. The amounts stay the same.
  const early = maternity(500, { leaveStart: '2027-02-15' })
  assert.equal(early.weeks[0].start, '2027-02-15')
  assert.equal(early.weeks[0].end, '2027-02-21')
  assert.equal(early.weeks[38].end, '2027-11-14')
  assert.equal(early.claimPayBy, '2027-01-18') // 28 days before
  assert.equal(early.leaveStartTooEarly, false)
  assert.equal(early.total, maternity(500).total)
  // Each week follows the last with no gaps.
  for (let index = 1; index < early.weeks.length; index++) {
    const previousEnd = new Date(`${early.weeks[index - 1].end}T00:00:00Z`)
    const start = new Date(`${early.weeks[index].start}T00:00:00Z`)
    assert.equal((start - previousEnd) / 86400000, 1)
  }
  // The earliest start for this due date is 13 December 2026.
  assert.equal(maternity(500, { leaveStart: '2026-12-13' }).leaveStartTooEarly, false)
  assert.equal(maternity(500, { leaveStart: '2026-12-12' }).leaveStartTooEarly, true)
  // A blank or bad start date falls back to the due date.
  assert.equal(maternity(500, { leaveStart: '' }).leaveStart, '2027-03-01')
  assert.equal(maternity(500, { leaveStart: 'nonsense' }).leaveStart, '2027-03-01')
})

// ---------------------------------------------------------------------------
// Maternity Allowance
// ---------------------------------------------------------------------------

test('parental pay [gov.uk] Maternity Allowance when SMP is not available', () => {
  // "You'll get £194.32 a week or 90% of your average weekly earnings (whichever is less)
  // for up to 39 weeks". Needs earnings of "£30 a week or more in at least 13 weeks".
  // Not long enough with the employer, earning £480.77 a week (£25,000 a year).
  const newJob = maternity(25000 / 52, { workedContinuously: false })
  assert.equal(newJob.qualifies, false)
  assert.equal(newJob.allowanceMayApply, true)
  assert.equal(newJob.allowanceWeekly, 194.32)
  assert.equal(newJob.allowanceTotal, 7578.48) // 39 x £194.32
  // Under the lower earnings limit but over £30 a week: 90% of earnings.
  const lowPaid = maternity(100)
  assert.equal(lowPaid.allowanceMayApply, true)
  assert.equal(lowPaid.allowanceWeekly, 90)
  assert.equal(lowPaid.allowanceTotal, 3510)
  // The £30 boundary.
  assert.equal(maternity(30).allowanceMayApply, true)
  assert.equal(maternity(29.99).allowanceMayApply, false)
  assert.equal(maternity(29.99).allowanceTotal, 0)
  // Not offered to someone who gets SMP.
  assert.equal(maternity(500).allowanceMayApply, false)
})

// ---------------------------------------------------------------------------
// Statutory Paternity Pay
// ---------------------------------------------------------------------------

test('parental pay [gov.uk] paternity pay is the flat rate or 90%, for 2 weeks', () => {
  // "The statutory weekly rate of Paternity Pay is £194.32, or 90% of your average weekly
  // earnings (whichever is lower)." "You can take up to 2 weeks' leave."
  const higherPaid = paternity(576.92)
  assert.equal(higherPaid.qualifies, true)
  assert.equal(higherPaid.weekly, 194.32)
  assert.equal(higherPaid.total, 388.64)
  const lowerPaid = paternity(150)
  assert.equal(lowerPaid.weekly, 135)
  assert.equal(lowerPaid.total, 270)
  // Leave "must end within 52 weeks of the baby's birth".
  assert.equal(higherPaid.leaveMustEndBy, '2028-02-28')
  // Same qualifying week as maternity pay.
  assert.equal(higherPaid.qualifyingWeekStart, '2026-11-15')
  // Not qualifying.
  const noService = paternity(500, { workedContinuously: false })
  assert.equal(noService.qualifies, false)
  assert.equal(noService.total, 0)
})

test('parental pay [own working] odd inputs and qualifying weeks outside 2026/27', () => {
  for (const earnings of [0, -200, NaN, undefined]) {
    const result = maternity(earnings)
    assert.equal(result.qualifies, false)
    assert.equal(result.total, 0)
    assert.equal(result.allowanceMayApply, false)
    assert.equal(paternity(earnings).total, 0)
  }
  // The £129 limit is for qualifying weeks ending 6 April 2026 to 5 April 2027.
  assert.equal(keyDates('2027-03-01').limitMayDiffer, false)
  assert.equal(keyDates('2027-07-14').limitMayDiffer, false) // qualifying week ends 3 April 2027
  assert.equal(keyDates('2027-07-21').limitMayDiffer, true) // ends 10 April 2027
  assert.equal(keyDates('2026-07-01').limitMayDiffer, true) // ends 21 March 2026
})
