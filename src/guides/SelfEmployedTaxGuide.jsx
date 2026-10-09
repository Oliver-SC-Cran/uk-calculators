import { INCOME_TAX, SELF_EMPLOYED, STUDENT_LOAN, TAX_YEAR } from '../lib/calculations'
import { formatGBP as gbp, formatGBPPence as gbpPence, percent } from '../lib/format'
import { calculateSelfEmployedTax } from '../lib/selfEmployed'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '9 October 2026'
const LAST_UPDATED_ISO = '2026-10-09'

export default function SelfEmployedTaxGuide() {
  const { personalAllowance, basicRateLimit, higherRateLimit } = INCOME_TAX
  const { basicRate, higherRate, additionalRate } = INCOME_TAX
  const { class4, class2, tradingAllowance, paymentsOnAccount, makingTaxDigital } = SELF_EMPLOYED
  const { registerBy, paperReturnBy, payBy, secondPaymentOnAccountBy } = SELF_EMPLOYED
  const { plan2, postgraduate } = STUDENT_LOAN

  const ex1 = calculateSelfEmployedTax({ income: 30000 })
  const ex2 = calculateSelfEmployedTax({ income: 10000, employmentIncome: 25000 })
  const ex3Settings = { income: 3500, employmentIncome: 30000 }
  const ex3 = calculateSelfEmployedTax({ ...ex3Settings, useTradingAllowance: true })
  const ex3WithExpenses = calculateSelfEmployedTax({ ...ex3Settings, expenses: 200 })

  return (
    <article className="guide">
      <h2>How tax works when you are self-employed in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        As a sole trader you pay tax on your profit, which is your income minus your allowable
        expenses. Nobody takes it off for you. You report it on a Self Assessment tax return and pay
        HMRC yourself.
      </p>

      <h3>What you pay</h3>
      <ul>
        <li>
          Income tax, at the same rates as an employee: nothing on the first{' '}
          {gbp(personalAllowance)}, {percent(basicRate)} up to {gbp(basicRateLimit)},{' '}
          {percent(higherRate)} up to {gbp(higherRateLimit)} and {percent(additionalRate)} above
          that.
        </li>
        <li>
          Class 4 National Insurance: {percent(class4.mainRate)} on profits over{' '}
          {gbp(class4.lowerProfitsLimit)} up to {gbp(class4.upperProfitsLimit)}, and{' '}
          {percent(class4.upperRate)} above that.
        </li>
        <li>
          Class 2 National Insurance: you no longer have to pay it. It is treated as paid, which
          protects your National Insurance record. If your profits are under{' '}
          {gbp(class2.smallProfitsThreshold)} you can choose to pay it, at{' '}
          {gbpPence(class2.voluntaryWeeklyRate)} a week.
        </li>
        <li>
          Student loan: {percent(plan2.rate)} of your income for the whole year over your plan's
          yearly threshold, or {percent(postgraduate.rate)} for a Postgraduate Loan. It is added to
          your Self Assessment bill.
        </li>
      </ul>

      <h3>The trading allowance</h3>
      <p>
        You can take a flat {gbp(tradingAllowance)} off your income, in place of your actual
        expenses. You cannot have both, so it only helps if your expenses are under{' '}
        {gbp(tradingAllowance)}. If your self-employed income for the year is{' '}
        {gbp(tradingAllowance)} or less, you usually do not need to tell HMRC about it at all.
      </p>

      <h3>If you also have a job</h3>
      <p>
        Your salary is taxed first, through PAYE. It uses up your personal allowance and the lower
        tax bands. Your profit sits on top, so it is taxed at whatever rate you have already
        reached. Class 4 is different: it looks at your profit on its own.
      </p>

      <h3>Payments on account</h3>
      <p>
        HMRC asks most self-employed people to pay towards next year's bill in advance. There are
        two payments, each half of this year's income tax and Class 4, due by 31 January and 31
        July. Student loan is not included. You do not make them if your bill was under{' '}
        {gbp(paymentsOnAccount.minimumBill)}, or if more than{' '}
        {percent(paymentsOnAccount.deductedAtSourceShare)} of the tax you owed was already
        collected, for example through your pay.
      </p>
      <p>
        The first time they apply, the January payment is your whole bill plus half as much again.
      </p>

      <h2>Worked examples</h2>

      <h3>A sole trader with {gbp(ex1.profit)} profit</h3>
      <p>
        Income tax is {gbp(ex1.incomeTax)} and Class 4 is {gbp(ex1.class4)}, a bill of{' '}
        {gbp(ex1.totalBill)}. That leaves {gbp(ex1.takeHomeAnnual)}, and means putting by about{' '}
        {gbp(ex1.setAsideMonthly)} a month. Payments on account apply, so {gbp(ex1.dueInJanuary)} is
        due by {payBy} and {gbp(ex1.dueInJuly)} by {secondPaymentOnAccountBy}.
      </p>

      <h3>
        A {gbp(ex2.employmentIncome)} job plus {gbp(ex2.profit)} of side income
      </h3>
      <p>
        The salary has used the whole personal allowance, so all {gbp(ex2.profit)} is taxed at{' '}
        {percent(basicRate)}: {gbp(ex2.incomeTax)}. There is no Class 4, because the profit is under{' '}
        {gbp(class4.lowerProfitsLimit)}. Only {percent(ex2.shareDeductedAtSource)} of the year's tax
        came through pay, so payments on account of {gbp(ex2.paymentOnAccount)} apply and{' '}
        {gbp(ex2.dueInJanuary)} is due by {payBy}.
      </p>

      <h3>Using the trading allowance</h3>
      <p>
        You have a {gbp(ex3.employmentIncome)} job and earn {gbp(ex3.turnover)} from occasional
        work, with {gbp(ex3WithExpenses.deducted)} of expenses. Claiming the expenses gives a profit
        of {gbp(ex3WithExpenses.profit)} and {gbp(ex3WithExpenses.incomeTax)} of tax. Using the
        allowance gives a profit of {gbp(ex3.profit)} and {gbp(ex3.incomeTax)} of tax.
      </p>

      <h2>Common questions</h2>

      <h3>What are the deadlines for {TAX_YEAR}?</h3>
      <p>
        Tell HMRC by {registerBy} if you need to send a return and have not sent one before. A paper
        return is due by {paperReturnBy}. An online return, and the payment, are due by {payBy}.
      </p>

      <h3>What counts as an allowable expense?</h3>
      <p>
        Costs you have only because of the business. That includes office costs such as phone bills,
        travel for work, stock, insurance and bank charges, the running costs of business premises,
        advertising, and training related to your business. Money you take out for yourself does not
        count.
      </p>

      <h3>Do I need to use Making Tax Digital for Income Tax?</h3>
      <p>
        It depends on your qualifying income, which is your self-employment and property income
        before expenses. It applies from {makingTaxDigital[0].from} if that was over{' '}
        {gbp(makingTaxDigital[0].incomeOver)} in {makingTaxDigital[0].inTaxYear}, from{' '}
        {makingTaxDigital[1].from} if it was over {gbp(makingTaxDigital[1].incomeOver)} in{' '}
        {makingTaxDigital[1].inTaxYear}, and from {makingTaxDigital[2].from} if it is over{' '}
        {gbp(makingTaxDigital[2].incomeOver)} in {makingTaxDigital[2].inTaxYear}.
      </p>

      <h3>Is this different in Scotland?</h3>
      <p>
        Yes. Scotland has its own income tax bands. Class 4 and student loan rules are the same.
        This calculator does not cover Scottish rates.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a
          href="https://www.gov.uk/self-employed-national-insurance-rates"
          target="_blank"
          rel="noreferrer"
        >
          self-employed National Insurance rates
        </a>
        , the{' '}
        <a
          href="https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income"
          target="_blank"
          rel="noreferrer"
        >
          trading allowance
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/understand-self-assessment-bill/payments-on-account"
          target="_blank"
          rel="noreferrer"
        >
          payments on account
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/self-assessment-tax-returns/deadlines"
          target="_blank"
          rel="noreferrer"
        >
          Self Assessment deadlines
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/expenses-if-youre-self-employed"
          target="_blank"
          rel="noreferrer"
        >
          allowable expenses
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/repaying-your-student-loan/what-you-pay"
          target="_blank"
          rel="noreferrer"
        >
          student loan repayments
        </a>{' '}
        and{' '}
        <a
          href="https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax"
          target="_blank"
          rel="noreferrer"
        >
          Making Tax Digital for Income Tax
        </a>
        .
      </p>
    </article>
  )
}
