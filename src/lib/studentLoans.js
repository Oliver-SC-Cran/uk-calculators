// Student loan repayments. The thresholds and rates are in
// rates/studentLoans.js, by tax year.

import { atLeastZero } from './numbers.js'
import { STUDENT_LOAN_RATES } from './rates/studentLoans.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, total } from './working.js'

/**
 * One month's repayment on one loan, the way gov.uk works it out for someone
 * paid monthly: the monthly threshold is the annual one divided by 12 and
 * rounded down to the pound (£26,900 becomes £2,241), and the repayment is
 * rounded down to the pound too.
 */
export const monthlyLoanThreshold = ({ threshold }) => Math.floor(threshold / 12)

/**
 * Every step of one month's repayment on one loan, so the guide can show
 * exactly the figures the final answer was worked out from. plan is one entry
 * from STUDENT_LOAN, such as STUDENT_LOAN.plan1.
 */
export function studentLoanWorking(grossAnnual, plan) {
  const monthlyThreshold = monthlyLoanThreshold(plan)
  // Whole pence and a whole-number percentage keep the rounding exact.
  const payPence = Math.round((atLeastZero(grossAnnual) / 12) * 100)
  const overPence = Math.max(0, payPence - monthlyThreshold * 100)
  const beforeRoundingPence = (overPence * Math.round(plan.rate * 100)) / 100
  return {
    monthlyPay: payPence / 100,
    monthlyThreshold,
    over: overPence / 100,
    beforeRounding: Math.round(beforeRoundingPence) / 100,
    repayment: Math.floor(beforeRoundingPence / 100),
  }
}

/** One loan's monthly repayment, step by step, for the working. */
function loanPart(grossAnnual, plan) {
  const steps = studentLoanWorking(grossAnnual, plan)
  // Not rounded to the penny, so that it always rounds down to the repayment.
  const beforeRounding = (Math.round(steps.over * 100) * Math.round(plan.rate * 100)) / 10000
  return part(
    plan.label,
    [
      info('Pay a month', steps.monthlyPay, { unit: 'gbpPence' }),
      info('Threshold a month, rounded down to the pound', steps.monthlyThreshold),
      info('Pay over the threshold', steps.over, { unit: 'gbpPence' }),
      add('Repayment before rounding', beforeRounding, {
        unit: 'gbpPence',
        rate: plan.rate,
        on: steps.over,
      }),
    ],
    total('Repayment a month, rounded down to the pound', steps.repayment, { rounding: 'down' }),
  )
}

const monthlyLoanRepayment = (grossAnnual, plan) => studentLoanWorking(grossAnnual, plan).repayment

/**
 * Student loan repayments for an employee paid the same amount every month. A
 * person can have an undergraduate plan (1, 2, 4 or 5) and a Postgraduate Loan
 * at the same time, and both are repaid together, so this returns each
 * separately plus the combined total.
 */
export function calculateStudentLoanRepayment({ grossAnnual, plan, hasPostgraduateLoan, taxYear }) {
  const loans = forTaxYear(STUDENT_LOAN_RATES, taxYear)
  const gross = atLeastZero(grossAnnual)
  const undergradPlan = plan && plan !== 'none' ? loans[plan] : null

  const undergradMonthly = undergradPlan ? monthlyLoanRepayment(gross, undergradPlan) : 0
  const postgradMonthly = hasPostgraduateLoan ? monthlyLoanRepayment(gross, loans.postgraduate) : 0
  const totalMonthly = undergradMonthly + postgradMonthly

  return {
    undergradMonthly,
    postgradMonthly,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    working: [
      part(
        'Student loan repayment',
        [
          undergradPlan && add(undergradPlan.label, undergradMonthly),
          hasPostgraduateLoan && add(loans.postgraduate.label, postgradMonthly),
        ],
        total('Total a month', totalMonthly),
      ),
      undergradPlan && loanPart(gross, undergradPlan),
      hasPostgraduateLoan && loanPart(gross, loans.postgraduate),
    ].filter(Boolean),
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
