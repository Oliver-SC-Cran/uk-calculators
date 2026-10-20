import { Link } from 'react-router-dom'
import { MORTGAGE } from '../lib/calculations'
import { formatGBP as gbp, percent, yearsAndMonths } from '../lib/format'
import { calculateMortgageOverpayment } from '../lib/mortgage'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '20 October 2026'
const LAST_UPDATED_ISO = '2026-10-20'

const example = (balance, annualRatePercent, remainingYears, extra = {}) => ({
  balance,
  annualRatePercent,
  remainingYears,
  monthlyOverpayment: 0,
  ...extra,
  ...calculateMortgageOverpayment({ balance, annualRatePercent, remainingYears, ...extra }),
})

export default function MortgageOverpaymentGuide() {
  const { typicalOverpaymentLimit } = MORTGAGE

  // How much you can pay off each year: £1,500 a month on £200,000 at 4.5%.
  const limitExample = example(200000, 4.5, 25, { monthlyOverpayment: 1500 })
  const [limitYear1, limitYear2] = limitExample.years
  const laterLimits = limitExample.years.slice(2, 5)
  const yearlyOverpayment = limitExample.monthlyOverpayment * 12

  // How many years it takes: £200,000 at 4.5% with 25 years left.
  const none = example(200000, 4.5, 25)
  const monthly200 = example(200000, 4.5, 25, { monthlyOverpayment: 200 })
  const monthly500 = example(200000, 4.5, 25, { monthlyOverpayment: 500 })
  const lumpNow = example(200000, 4.5, 25, { lumpSum: 10000 })
  const lumpLater = example(200000, 4.5, 25, { lumpSum: 10000, lumpSumYear: 5 })
  const both = example(200000, 4.5, 25, { lumpSum: 10000, monthlyOverpayment: 200 })

  // MoneyHelper's own example, worked out here.
  const moneyHelper = example(250000, 5, 25, { lumpSum: 5000 })

  const ex2 = example(150000, 5, 20, { monthlyOverpayment: 100 })
  const ex3 = example(300000, 4, 30, { monthlyOverpayment: 500 })
  const ex3ShareOfBalance = (ex3.monthlyOverpayment * 12) / ex3.balance

  return (
    <article className="guide">
      <h2>How mortgage overpayments work</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        Overpaying means paying more than your required monthly payment, either a set amount each
        month or a one-off lump sum. The extra comes straight off what you owe, so less interest is
        charged from then on and the mortgage is paid off sooner.
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

      <h2>How much can you pay off each year?</h2>
      <p>
        It depends on your mortgage deal. MoneyHelper says many lenders let you overpay up to{' '}
        {percent(typicalOverpaymentLimit)} a year without a fee while you are on a fixed-rate deal.
        On a lender's standard variable rate there is usually no limit, even on large amounts. Go
        over a limit while it applies, or pay the mortgage off early, and you could be charged.
      </p>
      <p>
        Lenders measure the limit in different ways, and some set a lower one. The calculator works
        it out on what you owe at the start of each year, and checks it for the years left on your
        deal. A lump sum is an overpayment too, so the calculator counts it towards the limit.
      </p>
      <p>
        For example, on {gbp(limitExample.balance)} at {limitExample.annualRatePercent}%,{' '}
        {percent(typicalOverpaymentLimit)} is {gbp(limitYear1.allowance)} in the first year, or
        about {gbp(limitYear1.allowance / 12)} a month. Overpaying{' '}
        {gbp(limitExample.monthlyOverpayment)} a month, which is {gbp(yearlyOverpayment)} a year,
        fits inside that. By the start of year 2 you would owe {gbp(limitYear2.startBalance)}, so
        the limit falls to {gbp(limitYear2.allowance)} and {gbp(yearlyOverpayment)} is over it. In
        years 3, 4 and 5 the limit would be {gbp(laterLimits[0].allowance)},{' '}
        {gbp(laterLimits[1].allowance)} and {gbp(laterLimits[2].allowance)}. The faster you pay the
        mortgage off, the faster your limit falls, so a set monthly amount that fits now may not fit
        later in your deal.
      </p>

      <h2>How many years will it take to pay off your mortgage?</h2>
      <p>
        Without overpaying, a repayment mortgage ends when its term does: the monthly payment is set
        so that the balance reaches £0 on the last payment. Overpaying brings that date forward.
        Each overpayment is gone from the balance for good, so less interest builds up and more of
        every normal payment goes on what you owe.
      </p>
      <p>
        These are for {gbp(none.balance)} at {none.annualRatePercent}% with {none.remainingYears}{' '}
        years left, where the normal payment is {gbp(none.standardPayment)} a month:
      </p>
      <ul>
        <li>No overpayments: {yearsAndMonths(none.newTermMonths)}.</li>
        <li>
          {gbp(monthly200.monthlyOverpayment)} a month extra:{' '}
          {yearsAndMonths(monthly200.newTermMonths)}, saving {gbp(monthly200.interestSaved)} in
          interest.
        </li>
        <li>
          {gbp(monthly500.monthlyOverpayment)} a month extra:{' '}
          {yearsAndMonths(monthly500.newTermMonths)}, saving {gbp(monthly500.interestSaved)}.
        </li>
        <li>
          A {gbp(lumpNow.lumpSum)} lump sum straight away: {yearsAndMonths(lumpNow.newTermMonths)},
          saving {gbp(lumpNow.interestSaved)}.
        </li>
        <li>
          {gbp(both.lumpSum)} straight away and {gbp(both.monthlyOverpayment)} a month:{' '}
          {yearsAndMonths(both.newTermMonths)}, saving {gbp(both.interestSaved)}.
        </li>
      </ul>
      <p>
        Timing matters. The same {gbp(lumpLater.lumpSum)} paid at the start of year{' '}
        {lumpLater.lumpSumYear} ends the mortgage {yearsAndMonths(lumpLater.monthsSaved)} early and
        saves {gbp(lumpLater.interestSaved)}, because interest has been charged on it for longer.
        Enter a start date in the calculator to see the month your last payment would fall in.
      </p>
      <p>
        MoneyHelper gives a similar example: a {gbp(moneyHelper.lumpSum)} lump sum on a{' '}
        {gbp(moneyHelper.balance)} mortgage at {moneyHelper.annualRatePercent}% with{' '}
        {moneyHelper.remainingYears} years left saves £11,970 in interest and ends the mortgage 11
        months sooner. This calculator gives the same {yearsAndMonths(moneyHelper.monthsSaved)}, and{' '}
        {gbp(moneyHelper.interestSaved)} for the interest: calculators work out interest in slightly
        different ways.
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

      <h2>More worked examples</h2>
      <p>
        Each assumes the interest rate stays the same for the whole term and the overpayment is made
        every month.
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
        savings earn more than the overpayment would save, and you can still get at the money. The
        guide{' '}
        <Link to="/guides/overpay-mortgage-or-save">should I overpay my mortgage or save?</Link>{' '}
        compares the two after tax.
      </p>

      <h3>Will I be charged for overpaying?</h3>
      <p>
        Only if you go over the limit in your mortgage deal, or pay the mortgage off early while a
        charge applies. Your mortgage offer or annual statement will say what the limit and the
        charge are.
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
        </a>{' '}
        and{' '}
        <a
          href="https://www.moneyhelper.org.uk/en/homes/buying-a-home/mortgage-interest-rate-options"
          target="_blank"
          rel="noreferrer"
        >
          understanding mortgages and interest rates
        </a>
        .
      </p>
    </article>
  )
}
