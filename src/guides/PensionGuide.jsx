import { Link } from 'react-router-dom'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'
import { formatGBP as gbp, formatGBPPence as pence, percent } from '../lib/format'
import { GROWTH } from '../lib/rates/growth'
import { INCOME_TAX, SCOTTISH_INCOME_TAX } from '../lib/rates/incomeTax'
import {
  ANNUAL_ALLOWANCE,
  AUTO_ENROLMENT,
  LOW_EARNER_PENSION_PAYMENT,
  LUMP_SUM,
  MINIMUM_PENSION_AGE_RISE,
  PENSIONS_INHERITANCE_TAX,
  RELIEF_LIMIT,
  SALARY_SACRIFICE_CHANGE,
  STATE_PENSION,
  STATE_PENSION_FROM_APRIL_2027,
} from '../lib/rates/pensions'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { calculateWorkplacePension } from '../lib/workplacePension'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-11-08'

export default function PensionGuide() {
  const ae = AUTO_ENROLMENT
  const { monthly, weekly } = ae.byPayPeriod
  const { basicRate, higherRate, additionalRate } = INCOME_TAX
  const scot = SCOTTISH_INCOME_TAX
  const scottishExtra = [scot.intermediateRate, scot.higherRate, scot.advancedRate, scot.topRate]
    .map((rate) => percent(rate - scot.basicRate))
    .join(', ')
    .replace(/, ([^,]+)$/, ' and $1')

  // The automatic enrolment minimums on two salaries, paid monthly.
  const example = (salary) =>
    calculateWorkplacePension({
      age: 30,
      retirementAge: 67,
      salary,
      employeePercent: ae.employeeMinimum * 100,
      employerPercent: ae.employerMinimum * 100,
    })
  const middle = example(30000)
  const higher = example(60000)

  // How much prices rise over the example's 37 years at the inflation target.
  const years = middle.years
  const pricesRise = (1 + GROWTH.inflationTarget) ** years - 1

  return (
    <CalculatorGuide heading="How workplace pensions work" updated={LAST_UPDATED}>
      <p>
        This calculator shows what a workplace pension could grow to, and what your own contribution
        costs once tax relief is counted. The pot grows exactly as it would on the{' '}
        <Link to="/compound-interest-calculator">compound interest calculator</Link> with the same
        figures, and the cost comes from the{' '}
        <Link to="/salary-calculator">take-home pay calculator</Link>. It does not forecast what any
        pension will earn.
      </p>

      <h3>How much goes in</h3>
      <p>
        Your employer must enrol you in a workplace pension automatically if you are aged{' '}
        {ae.minimumAge} to State Pension age and earn at least {gbp(ae.earningsTrigger)} a year. If
        you do not qualify you can usually still ask to join. Your employer must then pay in too if
        you earn more than {gbp(monthly.lower)} a month ({gbp(weekly.lower)} a week).
      </p>
      <p>
        Under automatic enrolment at least {percent(ae.totalMinimum)} of your qualifying earnings
        goes in, with at least {percent(ae.employerMinimum)} from your employer and usually{' '}
        {percent(ae.employeeMinimum)} from you. In {TAX_YEAR} qualifying earnings are your earnings
        between {gbp(ae.qualifyingEarnings.lower)} and {gbp(ae.qualifyingEarnings.upper)} a year,
        worked out on each pay day: {gbp(monthly.lower)} to {gbp(monthly.upper)} a month. Some
        schemes use your full salary instead.
      </p>

      <h3>Three ways tax relief is given</h3>
      <p>
        Your employer&apos;s scheme decides how you get tax relief, so the same contribution can
        cost you different amounts.
      </p>
      <ul>
        <li>
          <strong>Relief at source.</strong> {percent(1 - basicRate)} of your contribution comes
          from your take-home pay, and your pension provider claims the other {percent(basicRate)}{' '}
          from HMRC, even if you pay no income tax. Higher and additional rate taxpayers can claim{' '}
          {percent(higherRate - basicRate)} or {percent(additionalRate - basicRate)} more on their
          Self Assessment tax return. In Scotland the extra relief is {scottishExtra}, by band.
        </li>
        <li>
          <strong>Net pay arrangement.</strong> Your contribution comes off your pay before income
          tax. If you earn less than the Personal Allowance there is no tax to save. HMRC is paying
          a Low Earner&apos;s Pension Payment, from {LOW_EARNER_PENSION_PAYMENT.fromTaxYear}, to
          people in net pay schemes who get less relief because of this, and contacts those who
          qualify.
        </li>
        <li>
          <strong>Salary sacrifice.</strong> You give up some salary and your employer pays it into
          your pension, so you pay less income tax and less National Insurance. It must not take
          your cash pay below the National Minimum Wage. Employers often work out pension
          contributions on your pay before the sacrifice, which is what the calculator does.
        </li>
      </ul>
      <p>
        On a {gbp(middle.salary)} salary paid monthly, qualifying earnings are{' '}
        {gbp(middle.earnings)}, so the {percent(ae.employeeMinimum)} minimum from you is{' '}
        {gbp(middle.asked)} a year. Relief at source and net pay both cost you{' '}
        {pence(middle.methods.reliefAtSource.cost)} of it, and salary sacrifice{' '}
        {pence(middle.methods.salarySacrifice.cost)}, because it saves National Insurance too. On{' '}
        {gbp(higher.salary)}, {pence(higher.asked)} costs {pence(higher.methods.netPay.cost)} either
        of the first two ways, once a higher rate taxpayer has claimed the extra relief, and{' '}
        {pence(higher.methods.salarySacrifice.cost)} by salary sacrifice.
      </p>

      <h3>Limits on paying in</h3>
      <p>
        You get tax relief on contributions up to {percent(1)} of your earnings each year, or on{' '}
        {gbp(RELIEF_LIMIT.basicAmount)} if that is more. The annual allowance is{' '}
        {gbp(ANNUAL_ALLOWANCE.standard)} in {TAX_YEAR}, for everything paid in by you, your employer
        and tax relief. You usually pay tax on pension savings above it, but you might be able to
        carry over allowance you did not use in the previous {ANNUAL_ALLOWANCE.carryForwardYears}{' '}
        tax years. If your threshold income is over {gbp(ANNUAL_ALLOWANCE.taper.thresholdIncome)}{' '}
        and your adjusted income is over {gbp(ANNUAL_ALLOWANCE.taper.adjustedIncome)}, your
        allowance goes down by £1 for every £2 over {gbp(ANNUAL_ALLOWANCE.taper.adjustedIncome)}, to
        no less than {gbp(ANNUAL_ALLOWANCE.taper.minimum)}. If you flexibly access a pension, for
        example by taking cash from a pension pot, your annual allowance for money purchase pensions
        can drop to {gbp(ANNUAL_ALLOWANCE.moneyPurchase)}, the Money Purchase Annual Allowance.
      </p>

      <h3>Taking money out</h3>
      <p>
        Most people can take money from a pension from age {MINIMUM_PENSION_AGE_RISE.now}, rising to{' '}
        {MINIMUM_PENSION_AGE_RISE.to} on {MINIMUM_PENSION_AGE_RISE.from}. You can usually take up to{' '}
        {percent(LUMP_SUM.taxFreeShare)} of the amount built up in a pension as a tax-free lump sum.
        The most you can take tax-free across all your pensions is the Lump Sum Allowance of{' '}
        {gbp(LUMP_SUM.lumpSumAllowance)}, unless you hold a protected allowance. You usually pay
        income tax on the rest when you take it, and on your State Pension, depending on your total
        income in the tax year.
      </p>

      <h3>The State Pension</h3>
      <p>
        The full new State Pension is {pence(STATE_PENSION.fullWeekly)} a week in {TAX_YEAR}, or{' '}
        {pence(STATE_PENSION.fullWeekly * 52)} a year. You usually need{' '}
        {STATE_PENSION.qualifyingYearsForFull} qualifying years of National Insurance for the full
        amount, and what you get depends on your own record. It rises by{' '}
        {percent(STATE_PENSION_FROM_APRIL_2027.rise)} to{' '}
        {pence(STATE_PENSION_FROM_APRIL_2027.fullYearly)} a year from April 2027. You can{' '}
        <Source href="https://www.gov.uk/check-state-pension">
          check your State Pension forecast
        </Source>{' '}
        on gov.uk. The calculator shows it beside your pot, but does not add it in.
      </p>

      <h3>Changes on the way</h3>
      <p>
        From {PENSIONS_INHERITANCE_TAX.from}, most unused pension funds and pension death benefits
        will count towards the value of an estate for Inheritance Tax. From{' '}
        {SALARY_SACRIFICE_CHANGE.startDate}, only the first{' '}
        {gbp(SALARY_SACRIFICE_CHANGE.niFreeLimit)} a year of pension contributions made through
        salary sacrifice will be free of National Insurance, for employees and employers. Income tax
        relief does not change.
      </p>

      <h2>Common questions</h2>

      <h3>Why is my pot in today&apos;s money so much smaller?</h3>
      <p>
        Prices rise over time, so a pound buys less. The pot when you retire is divided by how much
        prices will have risen by then. At {percent(GROWTH.inflationTarget)} a year, prices rise by{' '}
        {percent(pricesRise)} over {years} years.
      </p>

      <h3>Can I choose how tax relief is given?</h3>
      <p>
        Usually not. Your employer&apos;s scheme decides. Ask them if you are not sure which it
        uses.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        Every worked figure on this page comes from the calculator above. Sources, checked on 6
        November 2026: gov.uk&apos;s{' '}
        <Source href="https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay">
          Workplace pensions
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/workplace-pensions/joining-a-workplace-pension">
          Joining a workplace pension
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief">
          Tax relief on pension contributions
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/annual-allowance">
          Annual allowance
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/lump-sum-allowance">
          Lump sum allowance
        </Source>
        , <Source href="https://www.gov.uk/tax-on-pension">Tax when you get a pension</Source>,{' '}
        <Source href="https://www.gov.uk/government/publications/rates-and-allowances-pension-schemes/pension-schemes-rates">
          Pension schemes rates
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye">
          Salary sacrifice and the effects on PAYE
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/new-state-pension/what-youll-get">
          The new State Pension
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027/proposed-benefit-and-pension-rates-2026-to-2027">
          Benefit and pension rates 2026 to 2027
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age">
          Increasing normal minimum pension age
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029">
          Changes to salary sacrifice for pensions
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/government/publications/inheritance-tax-unused-pension-funds-and-death-benefits">
          Inheritance Tax on unused pension funds
        </Source>
        , HMRC&apos;s{' '}
        <Source href="https://www.gov.uk/government/publications/pension-schemes-newsletter-184-august-2026/newsletter-184-august-2026">
          pension schemes newsletter 184
        </Source>{' '}
        and Pensions Tax Manual,{' '}
        <Source href="https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm057100">
          PTM057100
        </Source>
        , the Government Actuary&apos;s{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-a-gad-technical-bulletin/budget-2026-a-gad-technical-bulletin">
          Budget 2026 technical bulletin
        </Source>
        , and The Pensions Regulator&apos;s{' '}
        <Source href="https://www.thepensionsregulator.gov.uk/business-advisers/automatic-enrolment-guide-for-business-advisers/automatic-enrolment-earnings-threshold">
          earnings thresholds
        </Source>{' '}
        and{' '}
        <Source href="https://www.thepensionsregulator.gov.uk/en/employers/new-employers/im-an-employer-who-has-to-provide-a-pension/choose-a-pension-scheme/what-to-look-for-in-a-pension-scheme">
          charge cap
        </Source>
        .
      </p>
    </CalculatorGuide>
  )
}
