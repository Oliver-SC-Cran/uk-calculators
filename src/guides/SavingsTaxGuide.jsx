import { Link } from 'react-router-dom'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'
import { formatGBP as gbp, formatGBPPence as pence, percent } from '../lib/format'
import {
  INCOME_TAX,
  NEXT_YEAR_SAVINGS_TAX,
  SAVINGS_TAX,
  SAVINGS_TAX_PAYMENT,
} from '../lib/rates/incomeTax'
import { ISA } from '../lib/rates/isa'
import { NEXT_TAX_YEAR, NEXT_TAX_YEAR_START, TAX_YEAR } from '../lib/rates/taxYear'
import { calculateSavingsTax } from '../lib/savingsTax'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

const both = (settings) => [
  calculateSavingsTax({ ...settings, taxYear: TAX_YEAR }),
  calculateSavingsTax({ ...settings, taxYear: NEXT_TAX_YEAR }),
]

export default function SavingsTaxGuide() {
  const { personalAllowance, basicRateLimit, higherRateLimit, taperStart } = INCOME_TAX
  const {
    personalSavingsAllowance: psa,
    startingRateForSavings,
    startingRateIncomeLimit,
  } = SAVINGS_TAX
  const ratesNow = SAVINGS_TAX.rates
  const ratesNext = NEXT_YEAR_SAVINGS_TAX.rates

  // gov.uk's two examples, and the same people from April 2027. The second
  // needs other income for a basic rate taxpayer, so it uses £30,000.
  const [wages] = both({ otherIncome: 16000, interest: 200 })
  const [basicNow, basicNext] = both({ otherIncome: 30000, interest: 1300 })
  // Interest that tips someone over the basic rate band.
  const [underNow] = both({ otherIncome: 49270, interest: 1000 })
  const [overNow, overNext] = both({ otherIncome: 49270, interest: 1001 })
  // Interest over the taper start.
  const [taperNow, taperNext] = both({ otherIncome: taperStart, interest: 2000 })
  // A Scottish taxpayer in the Scottish higher rate band.
  const [scotland] = both({ otherIncome: 45000, interest: 1000, scottish: true })

  return (
    <CalculatorGuide
      heading={
        <>
          How savings interest is taxed in {TAX_YEAR} and {NEXT_TAX_YEAR}
        </>
      }
      updated={LAST_UPDATED}
    >
      <p>
        Most people pay no tax on their savings interest, because three allowances cover it. Any
        interest above them is taxed at your income tax rate. From {NEXT_TAX_YEAR_START}, the rates
        on savings interest go up to {percent(ratesNext.basic)}, {percent(ratesNext.higher)} and{' '}
        {percent(ratesNext.additional)}, from {percent(ratesNow.basic)}, {percent(ratesNow.higher)}{' '}
        and {percent(ratesNow.additional)}. The allowances stay the same.
      </p>

      <h3>The allowances that cover interest</h3>
      <ul>
        <li>
          Your Personal Allowance of {gbp(personalAllowance)}, if your pay, pension or profit does
          not use all of it.
        </li>
        <li>
          The starting rate for savings: up to {gbp(startingRateForSavings)} of interest at 0% if
          your other income is under {gbp(startingRateIncomeLimit)}. Each £1 of other income over
          the Personal Allowance takes £1 off it.
        </li>
        <li>
          The Personal Savings Allowance: {gbp(psa.basic)} for a basic rate taxpayer,{' '}
          {gbp(psa.higher)} for a higher rate taxpayer and {gbp(psa.additional)} for an additional
          rate taxpayer. Your band is worked out with the interest added to your other income.
        </li>
      </ul>
      <p>
        gov.uk gives two examples. With {gbp(wages.otherIncome)} of wages and {gbp(wages.interest)}{' '}
        of interest, the wages over the Personal Allowance leave {gbp(wages.startingRateBand)} of
        the starting rate, so the interest is not taxed. A basic rate taxpayer with{' '}
        {gbp(basicNow.interest)} of interest pays {pence(basicNow.total)}: nothing on the first{' '}
        {gbp(psa.basic)} and {percent(ratesNow.basic)} on the rest. From {NEXT_TAX_YEAR_START} the
        same interest costs {pence(basicNext.total)}.
      </p>

      <h3>When interest takes you into the higher rate band</h3>
      <p>
        The Personal Savings Allowance halves once your taxable income, interest included, goes over
        the basic rate band, which ends at {gbp(basicRateLimit)} of income for most people. So £1
        more interest can cost much more than £1. With {gbp(underNow.otherIncome)} of other income,{' '}
        {gbp(underNow.interest)} of interest is taxed {pence(underNow.total)}.{' '}
        {gbp(overNow.interest)} is taxed {pence(overNow.total)} in {TAX_YEAR}, and{' '}
        {pence(overNext.total)} from {NEXT_TAX_YEAR_START}.
      </p>

      <h3>Income over {gbp(taperStart)}</h3>
      <p>
        Interest counts towards the income that reduces your Personal Allowance, by £1 for every £2
        over {gbp(taperStart)}, until it is gone at {gbp(higherRateLimit)}. The allowance you lose
        is taxed at the rate on your other income. With {gbp(taperNow.otherIncome)} of other income
        and {gbp(taperNow.interest)} of interest, the interest adds {pence(taperNow.total)} of tax
        in {TAX_YEAR} and {pence(taperNext.total)} in {NEXT_TAX_YEAR}, of which{' '}
        {pence(taperNow.taxFromLostAllowance)} is tax on the lost allowance. From{' '}
        {NEXT_TAX_YEAR_START} the law also says the Personal Allowance must be set against pay,
        pensions and profit before savings.
      </p>

      <h3>If you live in Scotland</h3>
      <p>
        Scottish income tax does not apply to savings interest. It is taxed at the UK rates, in the
        UK bands, so your Personal Savings Allowance depends on the UK higher rate threshold of{' '}
        {gbp(basicRateLimit)}. Someone in Scotland with {gbp(scotland.otherIncome)} of pay is in the
        Scottish higher rate band, but still gets the {gbp(scotland.personalSavingsAllowance)}{' '}
        allowance, so {gbp(scotland.interest)} of interest is taxed {pence(scotland.total)}.
        Scottish rates only matter when the interest reduces your Personal Allowance.
      </p>

      <h3>ISAs</h3>
      <p>
        Interest on savings in an ISA is not taxed, and does not use up your allowances. You can pay
        up to {gbp(ISA.overallAllowance)} into ISAs in {TAX_YEAR}. The{' '}
        <Link to="/isa-calculator">ISA allowance calculator</Link> shows how much of it is left.
      </p>

      <h3>How you pay the tax</h3>
      <p>
        Banks and building societies tell HMRC how much interest they paid you after each tax year
        ends. If you are employed or get a pension, HMRC sends a tax calculation, usually between
        June and the following March, and collects the tax through your tax code. It may also add an
        estimate of this year&apos;s interest to your code. If you have no tax code it can change,
        it sends a Simple Assessment letter instead. If you have tax to pay and no letter by{' '}
        {SAVINGS_TAX_PAYMENT.contactHmrcIfNoLetterBy} after the tax year, contact HMRC. If your
        interest is over {gbp(SAVINGS_TAX_PAYMENT.selfAssessmentOver)}, you need to put it on a Self
        Assessment tax return.
      </p>

      <h3>What this calculator assumes</h3>
      <p>
        It works out the extra tax because of your interest: the tax with it less the tax without
        it. It takes the same interest in both years and covers the whole UK. It leaves out
        dividends, pension contributions and Gift Aid, which change the bands, and Marriage
        Allowance and Blind Person&apos;s Allowance. Interest worked out from a balance and a rate
        assumes the balance stays the same all year.
      </p>

      <p>
        Sources, checked on 30 October 2026: gov.uk&apos;s{' '}
        <Source href="https://www.gov.uk/apply-tax-free-interest-on-savings">
          Tax on savings interest
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/income-tax-rates">
          Income Tax rates and Personal Allowances
        </Source>
        , <Source href="https://www.gov.uk/scottish-income-tax">Income Tax in Scotland</Source>, the
        rates and allowances in{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances">
          Budget 2026&apos;s overview of tax legislation and rates
        </Source>
        , HMRC&apos;s{' '}
        <Source href="https://www.gov.uk/government/publications/self-assessment-tax-calculation-summary-sa110">
          tax calculation summary notes
        </Source>{' '}
        for how the Personal Savings Allowance is decided, and HMRC&apos;s note on{' '}
        <Source href="https://www.gov.uk/government/publications/income-tax-changes-to-tax-rates-for-property-savings-and-dividend-income">
          the order allowances are used from April 2027
        </Source>
        .
      </p>
    </CalculatorGuide>
  )
}
