import {
  CHILD_BENEFIT_CHARGE,
  INCOME_TAX,
  NATIONAL_INSURANCE,
  SCOTTISH_INCOME_TAX,
} from '../lib/rates/incomeTax'
import { SALARY_SACRIFICE_CHANGE } from '../lib/rates/pensions'
import { STUDENT_LOAN } from '../lib/rates/studentLoans'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP as gbp, percent } from '../lib/format'
import { calculatePayRise } from '../lib/payRise'
import CalculatorGuide from '../components/CalculatorGuide'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-23'

// 0.72 becomes 72p, and 0.305 becomes 30.5p
const pence = (share) => `${Number((share * 100).toFixed(1))}p`

export default function PayRiseGuide() {
  const { personalAllowance, basicRateLimit, taperStart, taperFullyGoneAt } = INCOME_TAX
  const { basicRate, higherRate, additionalRate } = INCOME_TAX
  const { mainRate, upperRate, upperEarningsLimit } = NATIONAL_INSURANCE
  const monthlyNi = NATIONAL_INSURANCE.byPayPeriod.monthly
  const { plan2, postgraduate } = STUDENT_LOAN
  const scotland = SCOTTISH_INCOME_TAX

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

  // Scotland. Relief at source is claimed at the UK basic rate, so the extra
  // relief is the Scottish rate less that.
  const scotTaperRate = scotland.advancedRate * 1.5
  const scotEx1 = calculatePayRise({ currentSalary: 35000, newSalary: 38000, scottish: true })
  const scotEx2 = calculatePayRise({ currentSalary: 45000, newSalary: 49000, scottish: true })
  const scotEx2Elsewhere = calculatePayRise({ currentSalary: 45000, newSalary: 49000 })

  return (
    <CalculatorGuide
      heading={<>How much of a pay rise you keep in {TAX_YEAR}</>}
      updated={LAST_UPDATED}
    >
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

      <h3>What comes off each extra pound in Scotland</h3>
      <p>
        Scottish income tax has six rates. NI is the same across the UK, so it stays at{' '}
        {percent(mainRate)} up to {gbp(upperEarningsLimit)}, although the Scottish higher rate
        starts above {gbp(scotland.intermediateRateLimit)}. Between those two figures you keep half
        of each extra pound.
      </p>
      <ul>
        <li>
          {gbp(personalAllowance)} to {gbp(scotland.starterRateLimit)}:{' '}
          {percent(scotland.starterRate)} tax and {percent(mainRate)} NI. You keep{' '}
          {pence(1 - scotland.starterRate - mainRate)}.
        </li>
        <li>
          {gbp(scotland.starterRateLimit)} to {gbp(scotland.basicRateLimit)}:{' '}
          {percent(scotland.basicRate)} tax and {percent(mainRate)} NI. You keep{' '}
          {pence(1 - scotland.basicRate - mainRate)}.
        </li>
        <li>
          {gbp(scotland.basicRateLimit)} to {gbp(scotland.intermediateRateLimit)}:{' '}
          {percent(scotland.intermediateRate)} tax and {percent(mainRate)} NI. You keep{' '}
          {pence(1 - scotland.intermediateRate - mainRate)}.
        </li>
        <li>
          {gbp(scotland.intermediateRateLimit)} to {gbp(upperEarningsLimit)}:{' '}
          {percent(scotland.higherRate)} tax and {percent(mainRate)} NI. You keep{' '}
          {pence(1 - scotland.higherRate - mainRate)}.
        </li>
        <li>
          {gbp(upperEarningsLimit)} to {gbp(scotland.higherRateLimit)}:{' '}
          {percent(scotland.higherRate)} tax and {percent(upperRate)} NI. You keep{' '}
          {pence(1 - scotland.higherRate - upperRate)}.
        </li>
        <li>
          {gbp(scotland.higherRateLimit)} to {gbp(taperStart)}: {percent(scotland.advancedRate)} tax
          and {percent(upperRate)} NI. You keep {pence(1 - scotland.advancedRate - upperRate)}.
        </li>
        <li>
          {gbp(taperStart)} to {gbp(taperFullyGoneAt)}: you also lose £1 of personal allowance for
          every £2, which makes the tax {percent(scotTaperRate)}. You keep{' '}
          {pence(1 - scotTaperRate - upperRate)}.
        </li>
        <li>
          Above {gbp(scotland.advancedRateLimit)}: {percent(scotland.topRate)} tax and{' '}
          {percent(upperRate)} NI. You keep {pence(1 - scotland.topRate - upperRate)}.
        </li>
      </ul>

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
        In Scotland, salary sacrifice and net pay give relief at your Scottish rate without a claim.
        With relief at source, the provider still claims {percent(basicRate)}. If your top rate is
        the {percent(scotland.starterRate)} starter rate, you do not pay back the difference. If you
        pay more than {percent(basicRate)}, you can claim{' '}
        {percent(scotland.intermediateRate - basicRate)} on income taxed at{' '}
        {percent(scotland.intermediateRate)}, {percent(scotland.higherRate - basicRate)} on income
        taxed at {percent(scotland.higherRate)}, {percent(scotland.advancedRate - basicRate)} at{' '}
        {percent(scotland.advancedRate)} and {percent(scotland.topRate - basicRate)} at{' '}
        {percent(scotland.topRate)}. You claim it on a Self Assessment tax return, or by making a
        claim to HMRC if you do not send one.
      </p>
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
        The first {gbp(ex1BelowLimit)} of the rise is taxed at {percent(basicRate)}. The other{' '}
        {gbp(ex1AboveLimit)} is over the limit, so it is taxed at {percent(higherRate)}. NI is
        worked out on each monthly payslip: {percent(mainRate)} up to{' '}
        {gbp(monthlyNi.upperEarningsLimit)} a month ({gbp(monthlyNi.upperEarningsLimit * 12)} a
        year) and {percent(upperRate)} above it. Tax takes {gbp(ex1.goesTo.incomeTax)} and NI{' '}
        {gbp(ex1.goesTo.nationalInsurance)}. You keep {gbp(ex1.kept)}, which is{' '}
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
        at {gbp(ex4.after.undergradLoanEachPayDay)} a month, or {gbp(ex4.goesTo.studentLoan)} a
        year. Tax takes {gbp(ex4.goesTo.incomeTax)} and NI {gbp(ex4.goesTo.nationalInsurance)}. You
        keep {gbp(ex4.kept)}, which is {percent(ex4.keptShare)} of the rise.
      </p>

      <h3>
        {gbp(35000)} to {gbp(38000)} in Scotland
      </h3>
      <p>
        The whole {gbp(scotEx1.rise)} is taxed at the {percent(scotland.intermediateRate)}{' '}
        intermediate rate, with {percent(mainRate)} NI. Tax takes {gbp(scotEx1.goesTo.incomeTax)}{' '}
        and NI {gbp(scotEx1.goesTo.nationalInsurance)}. You keep {gbp(scotEx1.kept)}, which is{' '}
        {percent(scotEx1.keptShare)} of the rise.
      </p>

      <h3>
        {gbp(45000)} to {gbp(49000)} in Scotland
      </h3>
      <p>
        Both salaries are between {gbp(scotland.intermediateRateLimit)} and{' '}
        {gbp(upperEarningsLimit)}, where the {percent(scotland.higherRate)} higher rate and{' '}
        {percent(mainRate)} NI overlap. Tax takes {gbp(scotEx2.goesTo.incomeTax)} and NI{' '}
        {gbp(scotEx2.goesTo.nationalInsurance)}. You keep {gbp(scotEx2.kept)}, which is{' '}
        {percent(scotEx2.keptShare)} of the rise. In the rest of the UK the same rise is taxed at{' '}
        {percent(basicRate)}, and you would keep {gbp(scotEx2Elsewhere.kept)}.
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
        {percent(higherRate)}. In Scotland both are taxed at {percent(scotland.advancedRate)}.
      </p>

      <h3>Do pension contributions change which thresholds I cross?</h3>
      <p>
        Yes. They reduce your adjusted net income, so a rise that would take your salary over{' '}
        {gbp(taperStart)} or {gbp(CHILD_BENEFIT_CHARGE.threshold)} may not take your adjusted net
        income over it. This is general information, not advice on what you should do.
      </p>

      <h3>Is this different in Scotland?</h3>
      <p>
        Yes. Scotland has its own income tax bands, so you keep a different share of each pound. The
        Scottish list above shows them. NI, student loan rules and the personal allowance taper are
        the same. Choose Scotland in the calculator to use the Scottish rates.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noreferrer">
          income tax rates
        </a>
        ,{' '}
        <a href="https://www.gov.uk/scottish-income-tax" target="_blank" rel="noreferrer">
          Income Tax in Scotland
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
    </CalculatorGuide>
  )
}
