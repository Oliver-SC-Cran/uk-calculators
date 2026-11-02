import { Link } from 'react-router-dom'
import { MORTGAGE } from '../lib/rates/mortgage'
import { formatGBP as gbp, percent, yearsAndMonths } from '../lib/format'
import { calculateMortgageOverpayment, overpaymentToBeMortgageFree } from '../lib/mortgage'
import CalculatorGuide from '../components/CalculatorGuide'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-11-02'

const FCA_EARLY_REPAYMENT_RULES = 'https://handbook.fca.org.uk/handbook/mcob12/mcob12s3'

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

  // The same lump sum with the payment lowered instead: the lender works the
  // payment out again on what is left, over the same 25 years.
  const lowerPayment = example(none.balance - lumpNow.lumpSum, 4.5, 25)
  const lowerPaymentSaves = none.standardTotalInterest - lowerPayment.standardTotalInterest

  // A lump sum against monthly overpayments: what each £1,000 overpaid saves.
  const totalOverpaid = (result) => result.years.reduce((sum, row) => sum + row.overpaid, 0)
  const monthly200Overpaid = totalOverpaid(monthly200)
  const savedPer1000 = (result) => (result.interestSaved / totalOverpaid(result)) * 1000

  // MoneyHelper's own example, worked out here.
  const moneyHelper = example(250000, 5, 25, { lumpSum: 5000 })

  // The extra needed to clear the same mortgage in 20, 15, 10 or 5 years,
  // with the limit checked over a 5-year deal.
  const [in20, in15, in10, in5] = [20, 15, 10, 5].map((targetYears) => ({
    targetYears,
    ...overpaymentToBeMortgageFree({
      balance: none.balance,
      annualRatePercent: none.annualRatePercent,
      remainingYears: none.remainingYears,
      targetMonths: targetYears * 12,
      overpaymentLimitYears: 5,
    }),
  }))
  const in10Limits = in10.result.years.slice(0, 5)
  const in5FirstYear = in5.result.years[0]

  // Offset or overpay: the same mortgage, and savings of £20,000 overpaid
  // straight away or kept in an offset account.
  const savings = 20000
  const overpaid = example(200000, 4.5, 25, { lumpSum: savings })
  const offset = example(200000, 4.5, 25, { offsetSavings: savings })
  const offsetDearer = example(200000, 4.75, 25, { offsetSavings: savings })
  const limitYear1Allowance = overpaid.years[0].allowance

  const ex2 = example(150000, 5, 20, { monthlyOverpayment: 100 })
  const ex3 = example(300000, 4, 30, { monthlyOverpayment: 500 })
  const ex3ShareOfBalance = (ex3.monthlyOverpayment * 12) / ex3.balance

  return (
    <CalculatorGuide heading={<>How mortgage overpayments work</>} updated={LAST_UPDATED}>
      <p>
        Overpaying is one way to pay off your mortgage early. It means paying more than your
        required monthly payment, either a set amount each month or a one-off lump sum. The extra
        comes straight off what you owe, so less interest is charged from then on and the mortgage
        is paid off sooner.
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
      <p>
        For example, take {gbp(none.balance)} at {none.annualRatePercent}% with{' '}
        {none.remainingYears} years left, where the payment is {gbp(none.standardPayment)} a month,
        and a {gbp(lumpNow.lumpSum)} lump sum straight away. Keeping the payment the same clears the
        mortgage {yearsAndMonths(lumpNow.monthsSaved)} sooner and saves {gbp(lumpNow.interestSaved)}{' '}
        in interest. If the lender lowered the payment instead, it would be{' '}
        {gbp(lowerPayment.standardPayment)} a month for the same {none.remainingYears} years, and
        you would save {gbp(lowerPaymentSaves)}.
      </p>

      <h2>How much can you overpay on a mortgage each year?</h2>
      <p>
        It depends on your mortgage deal. MoneyHelper, the free guidance service backed by the
        government, says many lenders let you overpay up to {percent(typicalOverpaymentLimit)} a
        year without penalties, and that this is often the limit on a fixed-rate deal. That is where
        the calculator's starting figure of {percent(typicalOverpaymentLimit)} comes from. It is
        typical, not a rule: some lenders set a lower limit or measure it in a different way, so
        check your own mortgage offer. On a lender's standard variable rate there is usually no
        limit, even on large amounts, and trackers usually have fewer limits or none.
      </p>
      <p>
        The calculator works the limit out on what you owe at the start of each year, and checks it
        for the years left on your deal. A lump sum is an overpayment too, so the calculator counts
        it towards the limit.
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

      <h2>Early repayment charges</h2>
      <p>
        An early repayment charge is what a lender can charge if you overpay by more than your deal
        allows, or pay off the mortgage or leave the deal early. MoneyHelper says you are usually
        tied in for the length of a fixed-rate deal, and that you might pay a fee for leaving a
        discounted deal before the discount ends.
      </p>
      <p>
        The Financial Conduct Authority's rules say the charge must be a cash amount and a
        reasonable pre-estimate of what it costs the lender when you repay early. Before you take
        out a mortgage or switch to a new rate, the lender must tell you the most the charge could
        be, and the mortgage offer must show it too. Lenders work it out in their own ways, and
        neither MoneyHelper nor the FCA gives a typical amount, so the calculator does not work out
        a charge. It warns you when your overpayments would go over the limit you enter, so you know
        to check the charge in your offer.
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

      <h2>A lump sum or monthly overpayments?</h2>
      <p>
        Both bring the end date forward, and both count towards your lender's yearly limit. The
        difference is timing. A pound paid off now stops interest being charged on it for longer
        than a pound paid later, so each pound of an early lump sum saves more. On the same{' '}
        {gbp(none.balance)} mortgage:
      </p>
      <ul>
        <li>
          a {gbp(lumpNow.lumpSum)} lump sum straight away saves {gbp(lumpNow.interestSaved)}, about{' '}
          {gbp(savedPer1000(lumpNow))} for every £1,000 overpaid
        </li>
        <li>
          {gbp(monthly200.monthlyOverpayment)} a month saves {gbp(monthly200.interestSaved)}, but
          you would overpay {gbp(monthly200Overpaid)} in all before the mortgage ends, so it saves
          about {gbp(savedPer1000(monthly200))} for every £1,000
        </li>
      </ul>
      <p>
        A lump sum has to fit inside one year's limit. With a {percent(typicalOverpaymentLimit)}{' '}
        limit, the most you could overpay in the first year here is{' '}
        {gbp(lumpNow.years[0].allowance)}. Spreading money over several years as monthly
        overpayments keeps each year's share smaller. Either way, an overpayment usually cannot be
        taken back unless you have a flexible or offset mortgage. You can enter a lump sum and a
        monthly amount together in the calculator to see what they save between them.
      </p>

      <h2>How much extra do you need to pay to clear your mortgage in a set number of years?</h2>
      <p>
        The monthly payment that clears a mortgage in a set number of payments comes from the same
        sum that sets your normal payment, with the shorter term in place of the one you have left.
        The extra you need is the difference between the two. Choose "I want to be mortgage-free by
        a set date" in the calculator to work it out for your mortgage. It rounds the amount up to
        the next pound, so paying it clears the mortgage by your target.
      </p>
      <p>
        For {gbp(none.balance)} at {none.annualRatePercent}% with {none.remainingYears} years left,
        where the normal payment is {gbp(none.standardPayment)} a month, clearing it in:
      </p>
      <ul>
        {[in20, in15, in10, in5].map((each) => (
          <li key={each.targetYears}>
            {each.targetYears} years takes {gbp(each.monthlyOverpayment)} a month extra and saves{' '}
            {gbp(each.result.interestSaved)} in interest.
          </li>
        ))}
      </ul>
      <p>
        Each 5 years taken off costs more than the last, because there are fewer payments to spread
        what you owe over. Check the yearly limit as well. {gbp(in10.monthlyOverpayment)} a month is{' '}
        {gbp(in10.monthlyOverpayment * 12)} a year, inside a {percent(typicalOverpaymentLimit)}{' '}
        limit in each of the first 5 years, although the limit falls from{' '}
        {gbp(in10Limits[0].allowance)} to {gbp(in10Limits[4].allowance)} as the balance falls.{' '}
        {gbp(in5.monthlyOverpayment)} a month is {gbp(in5FirstYear.overpaid)} a year, over the{' '}
        {gbp(in5FirstYear.allowance)} limit from the first year, so clearing the mortgage in 5 years
        could mean an early repayment charge while the limit applies.
      </p>

      <h2>Offset or overpay?</h2>
      <p>
        An offset mortgage links your mortgage to a savings account. MoneyHelper explains that you
        do not pay interest on the part of your mortgage equal to your savings, and that the savings
        usually earn no interest themselves. In its example, with a £200,000 offset mortgage at 3%
        and £10,000 in the savings account, you would only pay interest on £190,000.
      </p>
      <p>
        So each pound in an offset account stops interest being charged on a pound of your mortgage,
        just as a pound overpaid does. The difference is what happens to the money:
      </p>
      <ul>
        <li>
          An overpayment comes off your balance for good. You usually cannot take it back unless you
          have a flexible mortgage: MoneyHelper says flexible mortgages, offset mortgages included,
          let you draw back what you have overpaid without a charge.
        </li>
        <li>
          Offset savings stay in your account. MoneyHelper says you can still take them out if you
          need to. Once you do, you pay interest on that part of the mortgage again.
        </li>
      </ul>

      <h3>A worked example</h3>
      <p>
        Take {gbp(overpaid.balance)} at {overpaid.annualRatePercent}% with {overpaid.remainingYears}{' '}
        years left and {gbp(savings)} of savings, with the monthly payment kept the same:
      </p>
      <ul>
        <li>
          Overpaying the {gbp(savings)} straight away saves {gbp(overpaid.interestSaved)} in
          interest, and the mortgage ends after {yearsAndMonths(overpaid.newTermMonths)}.
        </li>
        <li>
          Keeping the {gbp(savings)} in an offset account for the whole term saves the same{' '}
          {gbp(offset.interestSaved)}. After {yearsAndMonths(offset.savingsCoverMonth)} what you owe
          is down to {gbp(savings)}, the point at which the overpaid mortgage ends, so you could
          clear it with your savings then. If you leave the savings where they are, your payments
          clear the rest {yearsAndMonths(offset.newTermMonths - offset.savingsCoverMonth)} later,
          with no more interest to pay.
        </li>
      </ul>
      <p>
        The interest saved is the same only while the rate is the same and the savings stay in the
        account. MoneyHelper lists limited access to discounted-rate deals as a drawback of offset
        mortgages, so compare the rates too. If the offset deal in this example charged{' '}
        {offsetDearer.annualRatePercent}% rather than {overpaid.annualRatePercent}%, you would pay{' '}
        {gbp(offsetDearer.newTotalInterest)} in interest in all, against{' '}
        {gbp(overpaid.newTotalInterest)} by overpaying.
      </p>
      <p>
        An overpayment also counts towards your lender's yearly limit. With a{' '}
        {percent(typicalOverpaymentLimit)} limit, the most you could overpay in the first year here
        is {gbp(limitYear1Allowance)}. The calculator does not count offset savings towards the
        limit, because they are not paid off the mortgage. Enter your savings in the calculator, on
        their own or with overpayments, to see what they could save. If you would rather earn
        interest on your savings, the guide{' '}
        <Link to="/guides/overpay-mortgage-or-save">should I overpay my mortgage or save?</Link>{' '}
        compares the two after tax. This is general information, not advice on what you should do.
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

      <h3>How do I work out my mortgage-free date?</h3>
      <p>
        Enter what you owe, your interest rate, the years left and a start date. The calculator
        shows the month of your last payment without overpaying, and with your overpayments or
        offset savings. It assumes the rate stays the same, so check again when your deal ends.
      </p>

      <h3>Will I be charged for overpaying?</h3>
      <p>
        Only if you go over the limit in your mortgage deal, or pay the mortgage off early while a
        charge applies. Your mortgage offer or annual statement will say what the limit and the
        charge are. See early repayment charges, above.
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
        charges, offset mortgages and what to weigh up is from MoneyHelper, the free service run by
        the government-backed Money and Pensions Service. See{' '}
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
        . The rules on early repayment charges are the FCA's, in{' '}
        <a href={FCA_EARLY_REPAYMENT_RULES} target="_blank" rel="noreferrer">
          MCOB 12.3
        </a>{' '}
        of its handbook.
      </p>
    </CalculatorGuide>
  )
}
