import { calculateMortgageOverpayment, MORTGAGE } from '../lib/calculations'
import { formatGBP as gbp, percent, yearsAndMonths } from '../lib/format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

const example = (balance, annualRatePercent, remainingYears, monthlyOverpayment) => ({
  balance,
  annualRatePercent,
  remainingYears,
  monthlyOverpayment,
  ...calculateMortgageOverpayment({
    balance,
    annualRatePercent,
    remainingYears,
    monthlyOverpayment,
  }),
})

export default function MortgageOverpaymentGuide() {
  const { typicalOverpaymentLimit } = MORTGAGE

  const limitBalance = 200000
  const limitYear = limitBalance * typicalOverpaymentLimit
  const limitMonth = limitYear / 12

  const ex1 = example(200000, 4.5, 25, 200)
  const ex2 = example(150000, 5, 20, 100)
  const ex3 = example(300000, 4, 30, 500)
  const ex3ShareOfBalance = (ex3.monthlyOverpayment * 12) / ex3.balance

  return (
    <article className="guide">
      <h2>How mortgage overpayments work</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        Overpaying means paying more than your required monthly payment. The extra comes straight
        off what you owe, so less interest is charged from then on and the mortgage is paid off
        sooner.
      </p>

      <h3>The {percent(typicalOverpaymentLimit)} limit and early repayment charges</h3>
      <p>
        Many lenders let you overpay up to {percent(typicalOverpaymentLimit)} a year without a
        penalty. Go over your limit, or pay the mortgage off early, and you could be charged. The
        limit usually applies while you are on a fixed or discounted deal. Once you move to the
        lender's standard variable rate there is often no limit.
      </p>
      <p>
        On a {gbp(limitBalance)} mortgage, {percent(typicalOverpaymentLimit)} is {gbp(limitYear)} a
        year, or about {gbp(limitMonth)} a month. Lenders measure the limit in different ways and
        some set a lower one, so check your own mortgage offer before you start.
      </p>

      <h3>Reducing your term or your monthly payment</h3>
      <p>An overpayment can be used in one of two ways:</p>
      <ul>
        <li>
          Your monthly payment stays the same and the mortgage finishes sooner. This is what the
          calculator above shows.
        </li>
        <li>
          Your lender recalculates a lower monthly payment and the mortgage finishes on the original
          date.
        </li>
      </ul>
      <p>
        Lenders differ in which one they do by default, so tell yours what you want. Finishing
        sooner saves more interest. A lower payment saves less interest but frees up money each
        month.
      </p>

      <h3>When overpaying may not make sense</h3>
      <ul>
        <li>
          You have more expensive debts. Credit cards and unsecured loans usually charge more
          interest than a mortgage.
        </li>
        <li>
          You have no savings to fall back on. MoneyHelper suggests keeping enough to cover at least
          three months before paying your mortgage off early.
        </li>
        <li>
          You are not paying into a pension. Tax relief and employer contributions can be worth more
          than the mortgage interest you would save.
        </li>
        <li>A savings account pays a higher rate than your mortgage charges.</li>
        <li>
          You may need the money back. Overpayments usually cannot be withdrawn unless you have a
          flexible or offset mortgage.
        </li>
      </ul>
      <p>This is general information, not advice on what you should do.</p>

      <h2>Worked examples</h2>
      <p>
        Each example assumes the interest rate stays the same for the whole term and the overpayment
        is made every month.
      </p>

      <h3>
        {gbp(ex1.monthlyOverpayment)} a month extra on {gbp(ex1.balance)} at {ex1.annualRatePercent}
        % over {ex1.remainingYears} years
      </h3>
      <p>
        The standard payment is {gbp(ex1.standardPayment)} a month. Paying {gbp(ex1.newPayment)}{' '}
        clears the mortgage in {yearsAndMonths(ex1.newTermMonths)}, which is{' '}
        {yearsAndMonths(ex1.monthsSaved)} sooner, and saves {gbp(ex1.interestSaved)} in interest.
      </p>

      <h3>
        {gbp(ex2.monthlyOverpayment)} a month extra on {gbp(ex2.balance)} at {ex2.annualRatePercent}
        % over {ex2.remainingYears} years
      </h3>
      <p>
        The standard payment is {gbp(ex2.standardPayment)} a month. Paying {gbp(ex2.newPayment)}{' '}
        clears it in {yearsAndMonths(ex2.newTermMonths)}, which is {yearsAndMonths(ex2.monthsSaved)}{' '}
        sooner, and saves {gbp(ex2.interestSaved)} in interest.
      </p>

      <h3>
        {gbp(ex3.monthlyOverpayment)} a month extra on {gbp(ex3.balance)} at {ex3.annualRatePercent}
        % over {ex3.remainingYears} years
      </h3>
      <p>
        The standard payment is {gbp(ex3.standardPayment)} a month. Paying {gbp(ex3.newPayment)}{' '}
        clears it in {yearsAndMonths(ex3.newTermMonths)}, which is {yearsAndMonths(ex3.monthsSaved)}{' '}
        sooner, and saves {gbp(ex3.interestSaved)} in interest. The extra{' '}
        {gbp(ex3.monthlyOverpayment * 12)} a year is {percent(ex3ShareOfBalance)} of the balance,
        well inside a {percent(typicalOverpaymentLimit)} limit.
      </p>

      <h2>Common questions</h2>

      <h3>Is it better to overpay or to save?</h3>
      <p>
        It depends on the rates. If a savings account pays more than your mortgage charges, the
        savings earn more than the overpayment would save, and you can still get at the money.
      </p>

      <h3>Will I be charged for overpaying?</h3>
      <p>
        Only if you go over the limit in your mortgage deal. Your mortgage offer or annual statement
        will say what the limit and the charge are.
      </p>

      <h3>When is the best time to make an overpayment?</h3>
      <p>
        If your lender works out interest daily, the sooner you pay, the sooner you stop being
        charged interest on that money. If interest is worked out once a year, the timing matters
        more, so ask your lender.
      </p>

      <h3>Can I get an overpayment back?</h3>
      <p>
        Usually not. Flexible and offset mortgages are the exception: they let you draw back money
        you have overpaid.
      </p>

      <h2>Where this information comes from</h2>
      <p>
        The figures in the examples come from the calculator on this page. The guidance on limits,
        charges and what to weigh up is from MoneyHelper, the free service run by the
        government-backed Money and Pensions Service. See{' '}
        <a
          href="https://www.moneyhelper.org.uk/en/homes/buying-a-home/should-you-pay-off-your-mortgage-early"
          target="_blank"
          rel="noreferrer"
        >
          should you pay off your mortgage early?
        </a>
      </p>
    </article>
  )
}
