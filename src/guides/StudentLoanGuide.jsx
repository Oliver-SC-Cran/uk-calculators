import {
  calculateStudentLoanRepayment,
  monthlyLoanThreshold,
  STUDENT_LOAN,
  TAX_YEAR,
} from '../lib/calculations'
import { gbp, gbpPence, percent } from './format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

export default function StudentLoanGuide() {
  const { plan1, plan2, plan4, plan5, postgraduate } = STUDENT_LOAN

  const thresholdText = (plan) =>
    `${gbp(plan.threshold)} a year (${gbp(monthlyLoanThreshold(plan))} a month)`

  // Shows the sum behind one month's repayment, before it is rounded down.
  const working = (salary, plan) => {
    const monthlyPay = salary / 12
    const over = monthlyPay - monthlyLoanThreshold(plan)
    return { monthlyPay, over, beforeRounding: over * plan.rate }
  }

  const ex1 = working(33000, plan1)
  const ex1Result = calculateStudentLoanRepayment({ grossAnnual: 33000, plan: 'plan1' })
  const ex2Plan = working(30000, plan2)
  const ex2Postgrad = working(30000, postgraduate)
  const ex2Result = calculateStudentLoanRepayment({
    grossAnnual: 30000,
    plan: 'plan2',
    hasPostgraduateLoan: true,
  })
  const ex3 = working(40000, plan5)
  const ex3Result = calculateStudentLoanRepayment({ grossAnnual: 40000, plan: 'plan5' })

  return (
    <article className="guide">
      <h2>How student loan repayments work in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        You repay a student loan out of your pay once you earn more than a threshold. What you
        repay depends on your income, not on how much you owe. Bonuses and overtime count as
        income.
      </p>

      <h3>Which plan you are on</h3>
      <p>Your plan depends on where you applied for student finance and when you started.</p>
      <ul>
        <li>
          Plan 1: England or Wales, if your course started before 1 September 2012. Everyone who
          applied to Student Finance Northern Ireland.
        </li>
        <li>
          Plan 2: England, if your course started between 1 September 2012 and 31 July 2023.
          Wales, if it started on or after 1 September 2012.
        </li>
        <li>Plan 4: everyone who applied to the Student Awards Agency Scotland.</li>
        <li>Plan 5: England, if your course started on or after 1 August 2023.</li>
        <li>
          Postgraduate Loan: a master's or doctoral course funded by Student Finance England or
          Wales.
        </li>
      </ul>

      <h3>Thresholds and rates</h3>
      <p>
        You repay {percent(plan1.rate)} of what you earn over your plan's threshold, or{' '}
        {percent(postgraduate.rate)} for a Postgraduate Loan.
      </p>
      <ul>
        <li>Plan 1: {thresholdText(plan1)}</li>
        <li>Plan 2: {thresholdText(plan2)}</li>
        <li>Plan 4: {thresholdText(plan4)}</li>
        <li>Plan 5: {thresholdText(plan5)}</li>
        <li>Postgraduate Loan: {thresholdText(postgraduate)}</li>
      </ul>

      <h3>Why your payslip deduction rounds down</h3>
      <p>
        Your employer works out the repayment each payday, not over the whole year. They take your
        pay for that month, subtract the monthly threshold, take {percent(plan1.rate)} of what is
        left and round it down to the whole pound. So the deduction is never pennies, and twelve
        payslips add up to slightly less than {percent(plan1.rate)} of your yearly income over the
        threshold.
      </p>
      <p>
        It also means a month with a bonus or overtime can trigger a repayment even if your yearly
        income is under the threshold. If that happens, you can ask for a refund at the end of the
        tax year.
      </p>

      <h3>Postgraduate Loans alongside other plans</h3>
      <p>
        A Postgraduate Loan is repaid at the same time as an undergraduate plan, not after it. You
        pay {percent(postgraduate.rate)} over the Postgraduate Loan threshold and{' '}
        {percent(plan1.rate)} over your other plan's threshold, both from the same pay.
      </p>

      <h3>When loans are written off</h3>
      <p>Whatever is left is cancelled after a set time, counted from the April you were first due to repay.</p>
      <ul>
        <li>
          Plan 1: {plan1.writeOffYears} years, or when you turn 65 if your first loan was paid
          before 1 September 2006
        </li>
        <li>Plan 2: {plan2.writeOffYears} years</li>
        <li>
          Plan 4: {plan4.writeOffYears} years. If your first loan was paid before 1 August 2007,
          it is when you turn 65 if that comes sooner
        </li>
        <li>Plan 5: {plan5.writeOffYears} years</li>
        <li>Postgraduate Loan (England and Wales): {postgraduate.writeOffYears} years</li>
      </ul>

      <h2>Worked examples</h2>
      <p>Each example assumes you are an employee paid the same amount every month.</p>

      <h3>{gbp(33000)} a year on Plan 1</h3>
      <p>
        Monthly pay is {gbp(ex1.monthlyPay)}. That is {gbp(ex1.over)} over the{' '}
        {gbp(monthlyLoanThreshold(plan1))} threshold. {percent(plan1.rate)} of {gbp(ex1.over)} is{' '}
        {gbpPence(ex1.beforeRounding)}, so you repay {gbp(ex1Result.totalMonthly)} a month.
      </p>

      <h3>{gbp(30000)} a year on Plan 2 with a Postgraduate Loan</h3>
      <p>
        Monthly pay is {gbp(ex2Plan.monthlyPay)}. For Plan 2, {percent(plan2.rate)} of the{' '}
        {gbp(ex2Plan.over)} over the threshold is {gbpPence(ex2Plan.beforeRounding)}, which rounds
        down to {gbp(ex2Result.undergradMonthly)}. For the Postgraduate Loan,{' '}
        {percent(postgraduate.rate)} of the {gbp(ex2Postgrad.over)} over its threshold is{' '}
        {gbp(ex2Result.postgradMonthly)}. You repay {gbp(ex2Result.totalMonthly)} a month in
        total.
      </p>

      <h3>{gbp(40000)} a year on Plan 5</h3>
      <p>
        Monthly pay is {gbpPence(ex3.monthlyPay)}, which is {gbpPence(ex3.over)} over the{' '}
        {gbp(monthlyLoanThreshold(plan5))} threshold. {percent(plan5.rate)} of that is{' '}
        {gbpPence(ex3.beforeRounding)}, so you repay {gbp(ex3Result.totalMonthly)} a month, or{' '}
        {gbp(ex3Result.totalAnnual)} a year.
      </p>

      <h2>Common questions</h2>

      <h3>Do I repay anything if I earn under the threshold?</h3>
      <p>
        No. Repayments stop whenever your pay drops below the threshold, and start again when it
        goes back over.
      </p>

      <h3>What if I have a Plan 1 and a Plan 2 loan?</h3>
      <p>
        You repay {percent(plan1.rate)} of your income over the lower of the two thresholds. This
        calculator handles one undergraduate plan at a time, so pick the plan with the lower
        threshold.
      </p>

      <h3>How do repayments work if I am self-employed?</h3>
      <p>
        HMRC works out your repayment from your Self Assessment tax return, using your income for
        the whole year and the yearly threshold.
      </p>

      <h3>Does owing more mean I repay more each month?</h3>
      <p>No. The size of the loan changes how long you repay for, not the monthly amount.</p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a
          href="https://www.gov.uk/repaying-your-student-loan/which-repayment-plan-you-are-on"
          target="_blank"
          rel="noreferrer"
        >
          which repayment plan you are on
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/repaying-your-student-loan/what-you-pay"
          target="_blank"
          rel="noreferrer"
        >
          what you pay
        </a>{' '}
        and{' '}
        <a
          href="https://www.gov.uk/repaying-your-student-loan/when-your-student-loan-gets-written-off-or-cancelled"
          target="_blank"
          rel="noreferrer"
        >
          when your loan gets written off
        </a>
        .
      </p>
    </article>
  )
}
