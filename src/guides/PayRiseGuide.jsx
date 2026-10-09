import { INCOME_TAX, NATIONAL_INSURANCE, STUDENT_LOAN, TAX_YEAR } from '../lib/calculations'
import { formatGBP as gbp, percent } from '../lib/format'
import { calculatePayRise, CHILD_BENEFIT_CHARGE, SALARY_SACRIFICE_CHANGE } from '../lib/payRise'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '9 October 2026'
const LAST_UPDATED_ISO = '2026-10-09'

const pence = (share) => `${Math.round(share * 100)}p`

export default function PayRiseGuide() {
  const { personalAllowance, basicRateLimit, taperStart, taperFullyGoneAt } = INCOME_TAX
  const { basicRate, higherRate, additionalRate } = INCOME_TAX
  const { mainRate, upperRate } = NATIONAL_INSURANCE
  const { plan2, postgraduate } = STUDENT_LOAN

  // What comes off each extra pound in each band: income tax plus NI.
  const basicBand = basicRate + mainRate
  const higherBand = higherRate + upperRate
  const taperBand = higherRate * 1.5 + upperRate
  const additionalBand = additionalRate + upperRate

  const ex1 = calculatePayRise({ currentSalary: 45000, newSalary: 55000 })
  const ex1BelowLimit = basicRateLimit - 45000
  const ex1AboveLimit = 55000 - basicRateLimit

  const ex2 = calculatePayRise({ currentSalary: 95000, newSalary: 105000 })
  const ex2AllowanceLost = personalAllowance - ex2.after.personalAllowanceUsed

  const ex3 = calculatePayRise({
    currentSalary: 95000,
    newSalary: 105000,
    pensionPercent: 5,
    pensionType: 'salarySacrifice',
  })

  const ex4 = calculatePayRise({ currentSalary: 29000, newSalary: 31000, plan: 'plan2' })

  return (
    <article className="guide">
      <h2>How much of a pay rise you keep in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        A pay rise is taxed at your top rate, not your average rate. The extra money sits on top of
        what you already earn, so it meets the highest tax band you have reached. That is why you
        keep a smaller share of a rise than you keep of your salary as a whole.
      </p>

      <h3>What comes off each extra pound</h3>
      <p>
        These are the rates for England, Wales and Northern Ireland, with income tax and NI
        together.
      </p>
      <ul>
        <li>
          {gbp(personalAllowance)} to {gbp(basicRateLimit)}: {percent(basicRate)} tax and{' '}
          {percent(mainRate)} NI. You keep {pence(1 - basicBand)}.
        </li>
        <li>
          {gbp(basicRateLimit)} to {gbp(taperStart)}: {percent(higherRate)} tax and{' '}
          {percent(upperRate)} NI. You keep {pence(1 - higherBand)}.
        </li>
        <li>
          {gbp(taperStart)} to {gbp(taperFullyGoneAt)}: you also lose £1 of personal allowance for
          every £2, which makes the tax {percent(higherRate * 1.5)}. You keep {pence(1 - taperBand)}
          .
        </li>
        <li>
          Above {gbp(taperFullyGoneAt)}: {percent(additionalRate)} tax and {percent(upperRate)} NI.
          You keep {pence(1 - additionalBand)}.
        </li>
      </ul>
      <p>
        A student loan takes a further {percent(plan2.rate)} above your plan's threshold, and a
        Postgraduate Loan {percent(postgraduate.rate)}.
      </p>

      <h3>How your pension changes the sums</h3>
      <ul>
        <li>
          Salary sacrifice: you give up part of your salary and your employer pays it into your
          pension. Tax, NI and student loan are all worked out on the lower salary.
        </li>
        <li>
          Net pay: your contribution is taken before income tax, so you pay less tax. NI and student
          loan are still worked out on your full salary.
        </li>
        <li>
          Relief at source: your contribution is taken after tax. Your pension provider claims{' '}
          {percent(basicRate)} from HMRC and adds it to your pot. Your payslip does not change, and
          if you pay tax above {percent(basicRate)} you claim the rest yourself.
        </li>
      </ul>
      <p>
        All three reduce your adjusted net income. That is the figure HMRC uses for the{' '}
        {gbp(taperStart)} personal allowance taper and the {gbp(CHILD_BENEFIT_CHARGE.threshold)}{' '}
        Child Benefit charge. With relief at source the allowance comes back when you claim, not in
        your monthly pay.
      </p>
      <p>
        A salary sacrifice cannot take your pay below the minimum wage. The government has also
        announced that from {SALARY_SACRIFICE_CHANGE.startDate}, NI will be charged on pension
        salary sacrifice above {gbp(SALARY_SACRIFICE_CHANGE.niFreeLimit)} a year. Income tax relief
        is not changing, and nothing changes for {TAX_YEAR}.
      </p>

      <h2>Worked examples</h2>
      <p>These assume no student loan and no pension unless they say so.</p>

      <h3>
        {gbp(45000)} to {gbp(55000)}, across {gbp(basicRateLimit)}
      </h3>
      <p>
        The first {gbp(ex1BelowLimit)} of the rise is taxed at {percent(basicRate)} with{' '}
        {percent(mainRate)} NI. The other {gbp(ex1AboveLimit)} is over the limit, so it is taxed at{' '}
        {percent(higherRate)} with {percent(upperRate)} NI. Tax takes {gbp(ex1.goesTo.incomeTax)}{' '}
        and NI {gbp(ex1.goesTo.nationalInsurance)}. You keep {gbp(ex1.kept)}, which is{' '}
        {percent(ex1.keptShare)} of the rise.
      </p>

      <h3>
        {gbp(95000)} to {gbp(105000)}, across {gbp(taperStart)}
      </h3>
      <p>
        The whole {gbp(ex2.rise)} is taxed at {percent(higherRate)}, which is{' '}
        {gbp(ex2.rise * higherRate)}. You also lose {gbp(ex2AllowanceLost)} of personal allowance,
        which costs another {gbp(ex2AllowanceLost * higherRate)}. NI takes{' '}
        {gbp(ex2.goesTo.nationalInsurance)}. You keep {gbp(ex2.kept)}, which is{' '}
        {percent(ex2.keptShare)} of the rise.
      </p>

      <h3>The same rise with 5% salary sacrifice</h3>
      <p>
        Your adjusted net income after the rise is {gbp(ex3.after.adjustedNetIncome)}, under{' '}
        {gbp(taperStart)}, so no allowance is lost. Tax takes {gbp(ex3.goesTo.incomeTax)} and NI{' '}
        {gbp(ex3.goesTo.nationalInsurance)}. Another {gbp(ex3.goesTo.pension)} goes into your
        pension. You keep {gbp(ex3.kept)}, which is {percent(ex3.keptShare)} of the rise.
      </p>

      <h3>
        {gbp(29000)} to {gbp(31000)} on Plan 2
      </h3>
      <p>
        The rise takes you over the Plan 2 threshold of {gbp(plan2.threshold)}, so repayments start
        at {gbp(ex4.after.undergradLoanMonthly)} a month, or {gbp(ex4.goesTo.studentLoan)} a year.
        Tax takes {gbp(ex4.goesTo.incomeTax)} and NI {gbp(ex4.goesTo.nationalInsurance)}. You keep{' '}
        {gbp(ex4.kept)}, which is {percent(ex4.keptShare)} of the rise.
      </p>

      <h2>Common questions</h2>

      <h3>Can a pay rise leave me with less take-home pay?</h3>
      <p>
        Not from income tax, NI and student loan. Each takes only part of the extra money, never all
        of it. The exception to watch is Child Benefit. If you or your partner get it, you pay back
        1% for every £200 of income over {gbp(CHILD_BENEFIT_CHARGE.threshold)}, and all of it over{' '}
        {gbp(CHILD_BENEFIT_CHARGE.fullyRepaidAt)}. This calculator does not include that.
      </p>

      <h3>
        Why do I keep so little between {gbp(taperStart)} and {gbp(taperFullyGoneAt)}?
      </h3>
      <p>
        Because the personal allowance is withdrawn in that range. Each extra £2 is taxed at{' '}
        {percent(higherRate)} and also makes another £1 of your income taxable at{' '}
        {percent(higherRate)}.
      </p>

      <h3>Do pension contributions change which thresholds I cross?</h3>
      <p>
        Yes. They reduce your adjusted net income, so a rise that would take your salary over{' '}
        {gbp(taperStart)} or {gbp(CHILD_BENEFIT_CHARGE.threshold)} may not take your adjusted net
        income over it. This is general information, not advice on what you should do.
      </p>

      <h3>Is this different in Scotland?</h3>
      <p>
        Yes. Scotland has its own income tax bands, so the shares above do not apply. NI and student
        loan rules are the same. This calculator does not cover Scottish rates.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noreferrer">
          income tax rates
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief"
          target="_blank"
          rel="noreferrer"
        >
          tax relief on pension contributions
        </a>
        ,{' '}
        <a href="https://www.gov.uk/guidance/adjusted-net-income" target="_blank" rel="noreferrer">
          adjusted net income
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye"
          target="_blank"
          rel="noreferrer"
        >
          salary sacrifice
        </a>
        , the{' '}
        <a
          href="https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029"
          target="_blank"
          rel="noreferrer"
        >
          salary sacrifice change from April 2029
        </a>{' '}
        and the{' '}
        <a href="https://www.gov.uk/child-benefit-tax-charge" target="_blank" rel="noreferrer">
          High Income Child Benefit Charge
        </a>
        .
      </p>
    </article>
  )
}
