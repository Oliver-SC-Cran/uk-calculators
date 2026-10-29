import { PARENTAL_PAY } from '../lib/rates/parentalPay'
import { formatDate, formatGBP as gbp, formatGBPPence as gbpPence, percent } from '../lib/format'
import {
  averageWeeklyEarnings,
  calculateMaternityPay,
  calculatePaternityPay,
  employerReclaim,
} from '../lib/parentalPay'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-29'

const EXAMPLE_DUE_DATE = '2027-03-01'

export default function MaternityPayGuide() {
  const { weeklyRate, earningsShare, lowerEarningsLimit, continuousWeeks, ratesFrom } = PARENTAL_PAY
  const { maternity, paternity, sharedParental, maternityAllowance } = PARENTAL_PAY
  const { qualifyingWeekBeforeDue, earliestLeaveWeeksBeforeDue, noticeDays } = PARENTAL_PAY
  const standardWeeks = maternity.payWeeks - maternity.higherRateWeeks

  const example = (salary, workedContinuously = true) =>
    calculateMaternityPay({
      dueDate: EXAMPLE_DUE_DATE,
      averageWeeklyEarnings: averageWeeklyEarnings({ amount: salary, period: 'annual' }),
      workedContinuously,
    })

  const ex1 = example(30000)
  const ex2 = example(15000)
  const ex3 = example(25000, false)
  const { reclaim } = PARENTAL_PAY
  const reclaimed = employerReclaim({ statutoryPay: ex1.total })
  const reclaimedSmall = employerReclaim({ statutoryPay: ex1.total, smallEmployer: true })
  const dad = calculatePaternityPay({
    dueDate: EXAMPLE_DUE_DATE,
    averageWeeklyEarnings: averageWeeklyEarnings({ amount: 30000, period: 'annual' }),
    workedContinuously: true,
  })

  return (
    <CalculatorGuide
      heading={<>How statutory maternity and paternity pay work</>}
      updated={LAST_UPDATED}
    >
      <p>
        Statutory Maternity Pay (SMP) and Statutory Paternity Pay (SPP) are the legal minimum your
        employer must pay while you are off. These are the rates from {ratesFrom}. Tax and National
        Insurance are taken off both, like normal pay.
      </p>

      <h3>How much maternity pay you get</h3>
      <p>SMP is paid for up to {maternity.payWeeks} weeks:</p>
      <ul>
        <li>
          the first {maternity.higherRateWeeks} weeks at {percent(earningsShare)} of your average
          weekly earnings, with no upper limit
        </li>
        <li>
          the next {standardWeeks} weeks at {gbpPence(weeklyRate)} a week, or{' '}
          {percent(earningsShare)} of your earnings if that is lower
        </li>
      </ul>
      <p>
        Maternity leave itself can last {maternity.leaveWeeks} weeks, so the last{' '}
        {maternity.leaveWeeks - maternity.payWeeks} are unpaid.
      </p>

      <h3>Who qualifies</h3>
      <p>
        You must earn at least {gbp(lowerEarningsLimit)} a week on average, and have worked for your
        employer continuously for at least {continuousWeeks} weeks by the qualifying week. You must
        also give {noticeDays} days' notice and proof that you are pregnant.
      </p>
      <p>
        The qualifying week is the {qualifyingWeekBeforeDue}th week before the week your baby is
        due. Weeks run from Sunday to Saturday. For a baby due on {formatDate(ex1.dueDate)}, it is{' '}
        {formatDate(ex1.qualifyingWeekStart)} to {formatDate(ex1.qualifyingWeekEnd)}. That Saturday
        is also the latest day to tell your employer you are pregnant and when you want leave to
        start.
      </p>

      <h3>How average weekly earnings are worked out</h3>
      <p>
        Your employer averages your pay before tax over about eight weeks, ending with your last
        payday on or before the end of the qualifying week. If you are paid monthly, that is your
        last two months' pay, multiplied by 6 and divided by 52. A bonus or pay cut in that window
        changes the result.
      </p>

      <h3>Paternity pay</h3>
      <p>
        SPP is {gbpPence(weeklyRate)} a week, or {percent(earningsShare)} of your average weekly
        earnings if that is lower, for up to {paternity.payWeeks} weeks. The earnings and{' '}
        {continuousWeeks}-week tests are the same as for SMP. You can take the two weeks together or
        separately. Leave cannot start before the birth and must end within{' '}
        {paternity.leaveMustEndWithinWeeks} weeks of it. On {gbp(30000)} a year that is{' '}
        {gbpPence(dad.weekly)} a week, {gbpPence(dad.total)} in total.
      </p>

      <h3>For employers</h3>
      <p>
        You pay SMP and SPP through payroll and can reclaim most of it from HMRC:{' '}
        {percent(reclaim.rate)} of what you pay, or {percent(reclaim.smallEmployerRate)} with Small
        Employers' Relief. You get the relief if your total Class 1 National Insurance (what you and
        your employees paid together, before any Employment Allowance) was{' '}
        {gbp(reclaim.smallEmployerLimit)} or less in the last complete tax year before the
        qualifying week. For a baby due on {formatDate(ex1.dueDate)} that is the{' '}
        {ex1.smallEmployerTaxYear} tax year.
      </p>
      <p>
        You reclaim through payroll, on an Employer Payment Summary (EPS) to HMRC. If you cannot
        afford to make the payments, you can{' '}
        <Source href="https://www.gov.uk/recover-statutory-payments/if-you-cant-afford-to-make-payments">
          ask HMRC for the money in advance
        </Source>
        . Statutory Adoption Pay, Shared Parental Pay, Parental Bereavement Pay and Neonatal Care
        Pay are reclaimed the same way. Maternity Allowance is paid by the government, so there is
        nothing for an employer to pay or reclaim.
      </p>

      <h2>Worked examples</h2>
      <p>Each is for a baby due on {formatDate(EXAMPLE_DUE_DATE)}, with pay starting that day.</p>

      <h3>Earning {gbp(30000)} a year</h3>
      <p>
        Average weekly earnings are {gbpPence(ex1.averageWeeklyEarnings)}. The first{' '}
        {maternity.higherRateWeeks} weeks pay {gbpPence(ex1.higherWeekly)} a week and the next{' '}
        {standardWeeks} pay {gbpPence(ex1.standardWeekly)}. The total is {gbpPence(ex1.total)}.
      </p>

      <h3>What the employer reclaims on {gbp(30000)} a year</h3>
      <p>
        The employer pays {gbpPence(ex1.total)} of SMP and can reclaim {percent(reclaimed.rate)} of
        it, {gbpPence(reclaimed.amount)}, so it costs them {gbpPence(reclaimed.cost)}. With Small
        Employers' Relief it can reclaim {percent(reclaimedSmall.rate)},{' '}
        {gbpPence(reclaimedSmall.amount)}, which is {gbpPence(reclaimedSmall.extra)} more than it
        paid.
      </p>

      <h3>Earning {gbp(15000)} a year</h3>
      <p>
        Average weekly earnings are {gbpPence(ex2.averageWeeklyEarnings)}. The first{' '}
        {maternity.higherRateWeeks} weeks pay {gbpPence(ex2.higherWeekly)} a week and the next{' '}
        {standardWeeks} pay {gbpPence(ex2.standardWeekly)}. The total is {gbpPence(ex2.total)}.
      </p>

      <h3>Not long enough in the job</h3>
      <p>
        You earn {gbp(25000)} a year but started after {formatDate(ex3.employedSince)}, so you do
        not have {continuousWeeks} weeks by the qualifying week and cannot get SMP. You may get
        Maternity Allowance from the government instead. If you were employed or self-employed for
        at least {maternityAllowance.weeksWorked} of the {maternityAllowance.testPeriodWeeks} weeks
        before the due date, and earned {gbp(maternityAllowance.weeklyEarnings)} a week or more in{' '}
        {maternityAllowance.weeksEarning} of them, it pays {gbpPence(ex3.allowanceWeekly)} a week
        for {maternityAllowance.payWeeks} weeks: {gbpPence(ex3.allowanceTotal)}.
      </p>

      <h2>Common questions</h2>

      <h3>Is maternity pay taxed?</h3>
      <p>
        Yes. SMP and SPP are paid through payroll, with tax and National Insurance taken off. The
        figures here are before those deductions.
      </p>

      <h3>What is Shared Parental Leave?</h3>
      <p>
        You can end maternity leave and pay early and share what is left with your partner: up to{' '}
        {sharedParental.leaveWeeks} weeks of leave and {sharedParental.payWeeks} weeks of pay
        between you, in the first year. Shared parental pay is {gbpPence(weeklyRate)} a week, or{' '}
        {percent(earningsShare)} of earnings if lower.
      </p>

      <h3>What happens if the baby arrives early?</h3>
      <p>
        Leave starts the day after the birth, and you can still get SMP. Tell your employer the date
        of birth as soon as you can. Leave also starts automatically if you are off work with a
        pregnancy-related illness in the 4 weeks before the week the baby is due.
      </p>

      <h3>When can maternity leave start?</h3>
      <p>
        Usually no earlier than {earliestLeaveWeeksBeforeDue} weeks before the week the baby is due.
        For the example above that is {formatDate(ex1.earliestLeaveStart)}.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a href="https://www.gov.uk/maternity-pay-leave" target="_blank" rel="noreferrer">
          maternity pay and leave
        </a>
        ,{' '}
        <a href="https://www.gov.uk/paternity-pay-leave" target="_blank" rel="noreferrer">
          paternity pay and leave
        </a>
        ,{' '}
        <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
          Maternity Allowance
        </a>{' '}
        and{' '}
        <a href="https://www.gov.uk/shared-parental-leave-and-pay" target="_blank" rel="noreferrer">
          Shared Parental Leave and Pay
        </a>
        . The dates and amounts here match the official{' '}
        <a
          href="https://www.gov.uk/maternity-paternity-calculator"
          target="_blank"
          rel="noreferrer"
        >
          maternity and paternity calculator for employers
        </a>
        . For employers, see{' '}
        <Source href="https://www.gov.uk/recover-statutory-payments">
          how to reclaim statutory payments
        </Source>{' '}
        and the{' '}
        <Source href="https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027">
          rates and thresholds for employers 2026 to 2027
        </Source>
        .
      </p>
    </CalculatorGuide>
  )
}
