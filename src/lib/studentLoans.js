// Student loan repayments. The thresholds and rates are in
// rates/studentLoans.js, by tax year.

import { atLeastZero } from './numbers.js'
import { PAY_FREQUENCIES } from './payPeriods.js'
import { STUDENT_LOAN_RATES } from './rates/studentLoans.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, total } from './working.js'

/**
 * The threshold for one pay period, the way gov.uk works it out: the annual
 * one divided by 12 for monthly pay, or 52 for weekly pay, rounded down to
 * the pound. £26,900 becomes £2,241 a month or £517 a week. frequency is
 * 'monthly' or 'weekly'.
 */
export const loanThresholdFor = ({ threshold }, frequency = 'monthly') =>
  Math.floor(threshold / PAY_FREQUENCIES[frequency].perYear)

/** The monthly threshold for a plan: £26,900 becomes £2,241. */
export const monthlyLoanThreshold = (plan) => loanThresholdFor(plan, 'monthly')

/**
 * Every step of one pay day's repayment on one loan. The repayment is rounded
 * down to the pound, as in gov.uk's examples.
 */
function repaymentSteps(periodPay, plan, frequency) {
  const threshold = loanThresholdFor(plan, frequency)
  // Whole pence and a whole-number percentage keep the rounding exact.
  const payPence = Math.round(atLeastZero(periodPay) * 100)
  const overPence = Math.max(0, payPence - threshold * 100)
  const beforeRoundingPence = (overPence * Math.round(plan.rate * 100)) / 100
  return {
    pay: payPence / 100,
    threshold,
    over: overPence / 100,
    beforeRounding: Math.round(beforeRoundingPence) / 100,
    // Not rounded to the penny, so that it always rounds down to the repayment.
    exact: beforeRoundingPence / 100,
    repayment: Math.floor(beforeRoundingPence / 100),
  }
}

/**
 * Every step of one month's repayment on one loan, so the guide can show
 * exactly the figures the final answer was worked out from. plan is one entry
 * from STUDENT_LOAN, such as STUDENT_LOAN.plan1.
 */
export function studentLoanWorking(grossAnnual, plan) {
  const steps = repaymentSteps(atLeastZero(grossAnnual) / 12, plan, 'monthly')
  return {
    monthlyPay: steps.pay,
    monthlyThreshold: steps.threshold,
    over: steps.over,
    beforeRounding: steps.beforeRounding,
    repayment: steps.repayment,
  }
}

/** One loan's repayment on one pay day, step by step, for the working. */
function loanPart(periodPay, plan, frequency) {
  const steps = repaymentSteps(periodPay, plan, frequency)
  const period = PAY_FREQUENCIES[frequency].period
  return part(
    plan.label,
    [
      info(`Pay a ${period}`, steps.pay, { unit: 'gbpPence' }),
      info(`Threshold a ${period}, rounded down to the pound`, steps.threshold),
      info('Pay over the threshold', steps.over, { unit: 'gbpPence' }),
      add('Repayment before rounding', steps.exact, {
        unit: 'gbpPence',
        rate: plan.rate,
        on: steps.over,
      }),
    ],
    total(`Repayment a ${period}, rounded down to the pound`, steps.repayment, {
      rounding: 'down',
    }),
  )
}

/**
 * Student loan repayments on one pay day. A person can have an undergraduate
 * plan (1, 2, 4 or 5) and a Postgraduate Loan at the same time, and both are
 * repaid together, so this returns each separately plus the combined total.
 * periodPay is the pay for that pay day that National Insurance is worked out
 * on. frequency is 'monthly' or 'weekly'.
 */
export function studentLoanForPeriod({
  periodPay,
  plan,
  hasPostgraduateLoan,
  frequency = 'monthly',
  taxYear,
}) {
  const loans = forTaxYear(STUDENT_LOAN_RATES, taxYear)
  const pay = atLeastZero(periodPay)
  const undergradPlan = plan && plan !== 'none' ? loans[plan] : null
  const repay = (loan) => repaymentSteps(pay, loan, frequency).repayment

  const undergrad = undergradPlan ? repay(undergradPlan) : 0
  const postgrad = hasPostgraduateLoan ? repay(loans.postgraduate) : 0
  const period = PAY_FREQUENCIES[frequency].period

  return {
    undergrad,
    postgrad,
    total: undergrad + postgrad,
    working: [
      part(
        'Student loan repayment',
        [
          undergradPlan && add(undergradPlan.label, undergrad),
          hasPostgraduateLoan && add(loans.postgraduate.label, postgrad),
        ],
        total(`Total a ${period}`, undergrad + postgrad),
      ),
      undergradPlan && loanPart(pay, undergradPlan, frequency),
      hasPostgraduateLoan && loanPart(pay, loans.postgraduate, frequency),
    ].filter(Boolean),
  }
}

/**
 * Student loan repayments for an employee paid the same amount every month,
 * as monthly and yearly totals.
 */
export function calculateStudentLoanRepayment({ grossAnnual, plan, hasPostgraduateLoan, taxYear }) {
  const onPayDay = (frequency) =>
    studentLoanForPeriod({
      periodPay: atLeastZero(grossAnnual) / PAY_FREQUENCIES[frequency].perYear,
      plan,
      hasPostgraduateLoan,
      frequency,
      taxYear,
    })
  const month = onPayDay('monthly')
  // The same pay paid weekly, as a weekly payslip shows it. Each pay day's
  // threshold and repayment are rounded down to the pound, so 52 weekly
  // repayments can come to a few pounds more or less than 12 monthly ones.
  const week = onPayDay('weekly')
  const paidWeekly = ' if you are paid weekly'
  return {
    undergradMonthly: month.undergrad,
    postgradMonthly: month.postgrad,
    totalMonthly: month.total,
    totalAnnual: month.total * 12,
    undergradWeekly: week.undergrad,
    postgradWeekly: week.postgrad,
    totalWeekly: week.total,
    totalAnnualPaidWeekly: week.total * 52,
    working: month.working,
    weeklyWorking: week.working.map((each) => ({ ...each, title: each.title + paidWeekly })),
  }
}

/**
 * Student loan repayments worked out the Self Assessment way: on income for
 * the whole year against the yearly threshold, not month by month. gov.uk
 * example: Plan 1 on £42,000 is 9% of (£42,000 - £26,900) = £1,359.
 */
export function calculateStudentLoanForYear({ income, plan, hasPostgraduateLoan, taxYear }) {
  const loans = forTaxYear(STUDENT_LOAN_RATES, taxYear)
  const total = atLeastZero(income)
  const forPlan = (loan) =>
    Math.floor((Math.max(0, total - loan.threshold) * Math.round(loan.rate * 100)) / 100)
  const undergradPlan = plan && plan !== 'none' ? loans[plan] : null
  const undergrad = undergradPlan ? forPlan(undergradPlan) : 0
  const postgrad = hasPostgraduateLoan ? forPlan(loans.postgraduate) : 0
  return { undergrad, postgrad, total: undergrad + postgrad }
}
