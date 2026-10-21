import { Link } from 'react-router-dom'
import GuidePage from '../../components/GuidePage'
import { INCOME_TAX, SAVINGS_TAX } from '../../lib/rates/incomeTax'
import { ISA } from '../../lib/rates/isa'
import { MORTGAGE } from '../../lib/rates/mortgage'
import { TAX_YEAR } from '../../lib/rates/taxYear'
import { formatGBP as gbp, percent, yearsAndMonths } from '../../lib/format'
import { calculateMortgageOverpayment } from '../../lib/mortgage'
import {
  interestSavedByOverpaying,
  rateBeforeTaxToMatch,
  savingsInterestAfterTax,
  TAX_BANDS,
} from '../../lib/overpayOrSave'
import Source from '../../components/Source'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-20'

// "4.5" rather than "4.50", for rates worked out here.
const rate = (value) => `${Math.round(value * 100) / 100}%`

export default function OverpayOrSave() {
  const { personalSavingsAllowance, startingRateForSavings, startingRateIncomeLimit } = SAVINGS_TAX
  const { basicRate, higherRate, additionalRate } = INCOME_TAX

  // The examples: £20,000 to overpay or save, on £200,000 with 25 years left.
  const lumpSum = 20000
  const mortgage = { balance: 200000, remainingYears: 25 }
  const mortgageRate = 4.5
  const savingsRate = 4
  const fixedRate = 2

  const savedFirstYear = interestSavedByOverpaying({
    ...mortgage,
    annualRatePercent: mortgageRate,
    lumpSum,
  })
  const wholeTerm = calculateMortgageOverpayment({
    ...mortgage,
    annualRatePercent: mortgageRate,
    lumpSum,
  })
  const savedOnFix = interestSavedByOverpaying({
    ...mortgage,
    annualRatePercent: fixedRate,
    lumpSum,
  })
  const save = (band, extra = {}) =>
    savingsInterestAfterTax({ amount: lumpSum, ratePercent: savingsRate, band, ...extra })
  const basic = save('basic')
  const basicAllowanceUsed = save('basic', { otherInterest: personalSavingsAllowance.basic })
  const higher = save('higher')
  const inIsa = save('higher', { isa: true })
  const limitShare = lumpSum / mortgage.balance

  const afterTax = (band) => savingsRate * (1 - TAX_BANDS[band])

  return (
    <GuidePage
      path="/guides/overpay-mortgage-or-save"
      updated={LAST_UPDATED}
      calculators={[
        '/mortgage-overpayment-calculator',
        '/isa-calculator',
        '/lifetime-isa-calculator',
      ]}
      intro={
        <>
          If you have money to spare, you can pay down your mortgage or keep it in savings. This
          guide compares the two with the {TAX_YEAR} tax rules, works through examples and sets out
          what else to weigh up.
        </>
      }
    >
      <p>
        This is general information, not financial advice. Which suits you depends on your own
        circumstances.
      </p>

      <h2>The basic comparison</h2>
      <p>
        Every pound you overpay stops being charged interest at your mortgage rate. So overpaying
        works like a savings account that pays your mortgage rate. You know the return for as long
        as your rate stays the same, and because it is interest you no longer pay, there is no tax
        on it. Savings earn their own rate, and the interest may be taxed. The comparison is your
        mortgage rate against your savings rate after any tax.
      </p>

      <h2>Tax on savings interest in {TAX_YEAR}</h2>
      <p>
        Most people can earn some interest tax-free. Your Personal Savings Allowance depends on your
        income tax band:
      </p>
      <ul>
        <li>basic rate: {gbp(personalSavingsAllowance.basic)} of interest a year</li>
        <li>higher rate: {gbp(personalSavingsAllowance.higher)}</li>
        <li>additional rate: {gbp(personalSavingsAllowance.additional)}</li>
      </ul>
      <p>
        Interest above the allowance is taxed at your usual rate: {percent(basicRate)},{' '}
        {percent(higherRate)} or {percent(additionalRate)}, the same across the UK. If your other
        income is under {gbp(startingRateIncomeLimit)}, the starting rate for savings can also let
        you earn up to {gbp(startingRateForSavings)} of interest tax-free. Interest on cash in an
        ISA is not taxed, and you can put up to {gbp(ISA.overallAllowance)} into ISAs in {TAX_YEAR}.
        The Budget 2025 document says the tax rates on savings income will go up by{' '}
        {Math.round(SAVINGS_TAX.rateRise * 100)} percentage points in every band from{' '}
        {SAVINGS_TAX.rateRiseFrom}.
      </p>

      <h3>Comparing a savings rate after tax with your mortgage rate</h3>
      <p>
        For interest above your allowance, take your tax rate off the savings rate. A{' '}
        {rate(savingsRate)} account leaves {rate(afterTax('basic'))} for a basic rate taxpayer,{' '}
        {rate(afterTax('higher'))} for higher rate and {rate(afterTax('additional'))} for additional
        rate. Interest inside your allowance, or in a cash ISA, keeps the full {rate(savingsRate)}.
      </p>
      <p>
        Turned round, to match a {rate(mortgageRate)} mortgage with interest above your allowance, a
        savings account would need to pay {rate(rateBeforeTaxToMatch(mortgageRate, 'basic'))} before
        tax for a basic rate taxpayer, {rate(rateBeforeTaxToMatch(mortgageRate, 'higher'))} for
        higher rate and {rate(rateBeforeTaxToMatch(mortgageRate, 'additional'))} for additional
        rate.
      </p>

      <h2>Worked examples</h2>
      <p>
        Each uses {gbp(lumpSum)} and a {gbp(mortgage.balance)} repayment mortgage with{' '}
        {mortgage.remainingYears} years left. The overpayment figures come from our{' '}
        <Link to="/mortgage-overpayment-calculator">mortgage overpayment calculator</Link>, which
        charges interest monthly, so it saves a little more than the headline rate. The savings
        figures are for one year at {rate(savingsRate)}, with no other savings interest.{' '}
        {gbp(lumpSum)} is {percent(limitShare)} of the balance, the most many lenders allow in a
        year without a charge.
      </p>

      <h3>
        A basic rate taxpayer, {rate(mortgageRate)} mortgage, {rate(savingsRate)} savings
      </h3>
      <p>
        Overpaying saves {gbp(savedFirstYear)} of interest in the first year. Saving earns{' '}
        {gbp(basic.interest)}, all inside the {gbp(personalSavingsAllowance.basic)} allowance, so
        there is no tax. If other savings already use up the allowance, the tax is{' '}
        {gbp(basicAllowanceUsed.tax)} and you keep {gbp(basicAllowanceUsed.afterTax)}. Left in the
        mortgage for the rest of the term, the overpayment saves {gbp(wholeTerm.interestSaved)} in
        interest and ends the mortgage {yearsAndMonths(wholeTerm.monthsSaved)} early.
      </p>

      <h3>A higher rate taxpayer, same rates</h3>
      <p>
        Overpaying still saves {gbp(savedFirstYear)} in the first year. Saving earns{' '}
        {gbp(higher.interest)}, but the allowance is {gbp(personalSavingsAllowance.higher)}, so{' '}
        {gbp(higher.taxable)} is taxed at {percent(higherRate)}: {gbp(higher.tax)}. You keep{' '}
        {gbp(higher.afterTax)}. In a cash ISA you would keep all {gbp(inIsa.afterTax)}.
      </p>

      <h3>A fixed rate that ends in a year</h3>
      <p>
        On a {rate(fixedRate)} fixed rate, overpaying {gbp(lumpSum)} saves {gbp(savedOnFix)} of
        interest over that year. Saving it at {rate(savingsRate)} earns {gbp(basic.afterTax)} after
        tax for a basic rate taxpayer, or {gbp(higher.afterTax)} for higher rate. When the fixed
        rate ends, you can still overpay, and on a lender's standard variable rate there is usually
        no limit. What overpaying saves after that depends on the rate you move to, which is not
        known yet.
      </p>

      <h2>What else changes the answer</h2>
      <ul>
        <li>
          An emergency fund. MoneyHelper suggests keeping enough to live on for at least three
          months before paying your mortgage off early.
        </li>
        <li>
          Getting the money back. Overpayments usually cannot be withdrawn unless you have a
          flexible or offset mortgage. Money in an easy-access savings account can.
        </li>
        <li>
          Early repayment charges. Many lenders let you overpay up to{' '}
          {percent(MORTGAGE.typicalOverpaymentLimit)} a year without a fee while you are on a fixed
          rate, and you could be charged for going over. The calculator checks your overpayments
          against your limit.
        </li>
        <li>
          Other debts. Credit cards and loans usually charge more interest than a mortgage, and
          MoneyHelper says to pay them off before reducing your mortgage.
        </li>
        <li>
          The end of your fixed rate. Unless you take a new deal, you move to the lender's standard
          variable rate, which is often higher. A higher rate means each pound overpaid saves more.
        </li>
        <li>
          Pensions. Contributions get tax relief, and workplace pensions get money from your
          employer too, so MoneyHelper says you might get more for your money in a pension than you
          would save in mortgage interest. The{' '}
          <Link to="/pay-rise-calculator">pay rise calculator</Link> shows how pension tax relief
          changes your take-home pay.
        </li>
        <li>
          A home in the future. A <Link to="/lifetime-isa-calculator">Lifetime ISA</Link> adds a{' '}
          {percent(ISA.lisaBonusRate)} bonus for a first home or for later life, but has a charge
          for taking money out for anything else.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Is overpaying the same as saving at my mortgage rate?</h3>
      <p>
        Close to it. Each pound overpaid saves interest at your mortgage rate, with no tax, for as
        long as that rate lasts. Unlike savings, you usually cannot take it back out.
      </p>
      <h3>Do I pay tax on interest in a cash ISA?</h3>
      <p>
        No. Interest on cash in an ISA is not taxed. The{' '}
        <Link to="/isa-calculator">ISA allowance calculator</Link> shows how much of your {TAX_YEAR}{' '}
        allowance is left.
      </p>
      <h3>What if my savings rate after tax is higher than my mortgage rate?</h3>
      <p>
        Then saving earns more than overpaying would save, while the rates stay as they are, and you
        can still get at the money. Rates can change, on savings and on mortgages.
      </p>

      <h2>Where this comes from</h2>
      <p>
        From gov.uk:{' '}
        <Source href="https://www.gov.uk/apply-tax-free-interest-on-savings">
          tax on savings interest
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/individual-savings-accounts/how-isas-work">
          how ISAs work
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief">
          pension tax relief
        </Source>{' '}
        and the{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html">
          Budget 2025 document
        </Source>
        . From MoneyHelper:{' '}
        <Source href="https://www.moneyhelper.org.uk/en/homes/buying-a-home/should-you-pay-off-your-mortgage-early">
          should you pay off your mortgage early?
        </Source>{' '}
        and{' '}
        <Source href="https://www.moneyhelper.org.uk/en/homes/buying-a-home/mortgage-interest-rate-options">
          understanding mortgages and interest rates
        </Source>
        .
      </p>
    </GuidePage>
  )
}
