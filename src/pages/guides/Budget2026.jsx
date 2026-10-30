import { Link } from 'react-router-dom'
import GuidePage from '../../components/GuidePage'
import Source from '../../components/Source'
import { formatGBP as gbp, formatGBPPence as pence, percent } from '../../lib/format'
import { BUDGET_2026 } from '../../lib/rates/budget'
import {
  CHILD_BENEFIT_CHARGE_OFFSET,
  INCOME_TAX,
  INCOME_TAX_FREEZE,
  NEXT_YEAR_SAVINGS_TAX,
  SAVINGS_TAX,
} from '../../lib/rates/incomeTax'
import { CASH_ISA_CUT_SCRAPPED, ISA, LIFETIME_ISA_REFORM } from '../../lib/rates/isa'
import { MILEAGE_RATES } from '../../lib/rates/mileage'
import { MINIMUM_WAGE, MINIMUM_WAGE_FROM_APRIL_2027 } from '../../lib/rates/minimumWage'
import {
  PENSION_TAX_ALLOWANCE,
  PENSIONS_INHERITANCE_TAX,
  SALARY_SACRIFICE_CHANGE,
} from '../../lib/rates/pensions'
import { SELF_EMPLOYED, TRADING_ALLOWANCE_RISE } from '../../lib/rates/selfEmployed'
import {
  NEXT_TAX_YEAR,
  NEXT_TAX_YEAR_START,
  TAX_YEAR,
  TAX_YEAR_START,
} from '../../lib/rates/taxYear'
import { calculateSavingsTax } from '../../lib/savingsTax'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

const hourly = (value) => `£${value.toFixed(2)}`
const pencePerMile = (rate) => `${Math.round(rate * 100)}p`
const rates = ({ basic, higher, additional }) =>
  `${percent(basic)}, ${percent(higher)} and ${percent(additional)}`

export default function Budget2026() {
  const { overallAllowance, lisaWithdrawalChargeRate, lisaOverCapChargeRate } = ISA
  const { lisaPropertyCap, lisaOverCapChargeFrom } = ISA
  const ftb = LIFETIME_ISA_REFORM.firstTimeBuyerIsa
  const { personalSavingsAllowance: psa, startingRateForSavings } = SAVINGS_TAX
  const wageNow = MINIMUM_WAGE
  const wageNext = MINIMUM_WAGE_FROM_APRIL_2027
  const mileageNow = MILEAGE_RATES[TAX_YEAR].carOrVan
  const mileageNext = MILEAGE_RATES[NEXT_TAX_YEAR].carOrVan
  const pta = PENSION_TAX_ALLOWANCE
  const sacrifice = SALARY_SACRIFICE_CHANGE

  // gov.uk's basic rate example: £1,300 of interest, in both years.
  const example = { otherIncome: 30000, interest: 1300 }
  const savingsNow = calculateSavingsTax({ ...example, taxYear: TAX_YEAR })
  const savingsNext = calculateSavingsTax({ ...example, taxYear: NEXT_TAX_YEAR })

  return (
    <GuidePage
      path="/guides/budget-2026"
      updated={LAST_UPDATED}
      calculators={[
        '/savings-interest-tax-calculator',
        '/isa-calculator',
        '/self-employed-tax-calculator',
      ]}
      intro={
        <>
          Budget 2026 was delivered on {BUDGET_2026.date}. This guide lists what it changes for
          savings, work, pensions and Child Benefit, when each change starts, and which changes were
          announced at earlier Budgets.
        </>
      }
    >
      <h2>What changes and when</h2>
      <div className="table-scroll">
        <table className="data-table data-table--plain">
          <thead>
            <tr>
              <th scope="col">Change</th>
              <th scope="col">When</th>
              <th scope="col">New at Budget 2026?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                Lifetime ISA charge for a first home over {gbp(lisaPropertyCap)} falls to{' '}
                {percent(lisaOverCapChargeRate)}
              </th>
              <td>From {lisaOverCapChargeFrom}</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">
                National Living Wage rises to {hourly(wageNext.nationalLivingWage)} an hour
              </th>
              <td>{wageNext.effectiveFrom}</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">Cash ISA limit stays at {gbp(overallAllowance)}</th>
              <td>{CASH_ISA_CUT_SCRAPPED.wouldHaveStarted}</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">
                Tax on savings interest rises to {rates(NEXT_YEAR_SAVINGS_TAX.rates)}
              </th>
              <td>{NEXT_TAX_YEAR_START}</td>
              <td>Half of the rise was announced at Budget 2025</td>
            </tr>
            <tr>
              <th scope="row">
                Trading allowance rises to {gbp(TRADING_ALLOWANCE_RISE.tradingAllowance)}
              </th>
              <td>{TRADING_ALLOWANCE_RISE.from}</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">
                Tax-free mileage: {pencePerMile(mileageNow.firstMilesRate)} for the first{' '}
                {mileageNow.firstMiles.toLocaleString('en-GB')} miles made permanent, and{' '}
                {pencePerMile(mileageNext.laterMilesRate)} above that
              </th>
              <td>
                {pencePerMile(mileageNext.laterMilesRate)} from {NEXT_TAX_YEAR_START}
              </td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">Pension Tax Allowance</th>
              <td>
                {pta.from} to {pta.until}
              </td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">Most unused pensions count for inheritance tax</th>
              <td>{PENSIONS_INHERITANCE_TAX.from}</td>
              <td>No, {PENSIONS_INHERITANCE_TAX.announcedAt}</td>
            </tr>
            <tr>
              <th scope="row">First Time Buyer ISA replaces the Lifetime ISA for new savers</th>
              <td>{ftb.from}</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">
                Pension salary sacrifice free of National Insurance only up to{' '}
                {gbp(sacrifice.niFreeLimit)} a year
              </th>
              <td>{sacrifice.startDate}</td>
              <td>No, Budget 2025</td>
            </tr>
            <tr>
              <th scope="row">
                Personal Allowance and higher rate threshold stay at{' '}
                {gbp(INCOME_TAX.personalAllowance)} and {gbp(INCOME_TAX.basicRateLimit)}
              </th>
              <td>Until {INCOME_TAX_FREEZE.until}</td>
              <td>No, {INCOME_TAX_FREEZE.announcedAt}</td>
            </tr>
            <tr>
              <th scope="row">Child Benefit overpayments set against the Child Benefit charge</th>
              <td>When {CHILD_BENEFIT_CHARGE_OFFSET.law} becomes law</td>
              <td>Yes</td>
            </tr>
            <tr>
              <th scope="row">An incentive for first-time stocks and shares ISA investors</th>
              <td>Not set yet</td>
              <td>Yes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Savings and ISAs</h2>
      <h3>Tax on savings interest</h3>
      <p>
        From {NEXT_TAX_YEAR_START}, interest above your allowances is taxed at{' '}
        {rates(NEXT_YEAR_SAVINGS_TAX.rates)}, depending on your income tax band, instead of{' '}
        {rates(SAVINGS_TAX.rates)}. The allowances do not change: the Personal Savings Allowance is
        still {gbp(psa.basic)} for basic rate taxpayers and {gbp(psa.higher)} for higher rate
        taxpayers, and the starting rate for savings still covers up to{' '}
        {gbp(startingRateForSavings)} for people on low incomes. A basic rate taxpayer with{' '}
        {gbp(example.interest)} of interest pays {pence(savingsNow.total)} in {TAX_YEAR} and{' '}
        {pence(savingsNext.total)} in {NEXT_TAX_YEAR}. The{' '}
        <Link to="/savings-interest-tax-calculator">savings interest tax calculator</Link> shows
        both years for your own figures.
      </p>

      <h3>Cash ISAs</h3>
      <p>
        The cut to {gbp(CASH_ISA_CUT_SCRAPPED.plannedCashLimit)} a year for cash ISAs, planned for{' '}
        {CASH_ISA_CUT_SCRAPPED.wouldHaveStarted}, is scrapped. You can still put the whole{' '}
        {gbp(overallAllowance)} allowance in cash. The government says it will lay regulations in{' '}
        {CASH_ISA_CUT_SCRAPPED.newRegulationsDue} to keep the limit. It will also work with the
        investment industry on a new incentive for people paying into a stocks and shares ISA for
        the first time, but has not said what it will be or when. Our guide to the{' '}
        <Link to="/guides/cash-isa-changes-april-2027">cash ISA limit</Link> has more, and the{' '}
        <Link to="/isa-calculator">ISA allowance calculator</Link> shows what you have left.
      </p>

      <h3>Lifetime ISA and the First Time Buyer ISA</h3>
      <p>
        From {lisaOverCapChargeFrom}, you can use a Lifetime ISA towards a first home that costs
        more than {gbp(lisaPropertyCap)}, with a {percent(lisaOverCapChargeRate)} charge instead of
        the usual {percent(lisaWithdrawalChargeRate)}. The government says this protects the money
        you paid in. From {ftb.from}, the First Time Buyer ISA replaces the Lifetime ISA for new
        savers: up to {gbp(ftb.yearlyLimit)} a year, with a {percent(ftb.bonusRate)} bonus on the
        balance when you use it for a first home costing up to {gbp(ftb.propertyCap)}. The bonus is
        capped at {gbp(ftb.bonusCap)} and there is no upper age limit. If you already have a
        Lifetime ISA, you can keep paying in under the current rules. The{' '}
        <Link to="/lifetime-isa-calculator">Lifetime ISA calculator</Link> covers both charges.
      </p>

      <h2>Work and self-employment</h2>
      <h3>Minimum wage from {wageNext.effectiveFrom}</h3>
      <p>
        The government accepted the Low Pay Commission&apos;s recommendations in full. The National
        Living Wage for people aged 21 and over goes up from {hourly(wageNow.nationalLivingWage)} to{' '}
        {hourly(wageNext.nationalLivingWage)} an hour. The rate for 18 to 20 year olds goes from{' '}
        {hourly(wageNow.age18to20)} to {hourly(wageNext.age18to20)}, and for under 18s and
        apprentices from {hourly(wageNow.under18)} to {hourly(wageNext.under18)}. The most an
        employer can count for accommodation rises to {hourly(wageNext.accommodationOffsetDaily)} a
        day. The <Link to="/minimum-wage-calculator">minimum wage calculator</Link> uses the{' '}
        {TAX_YEAR} rates until then.
      </p>

      <h3>Trading allowance</h3>
      <p>
        From {TRADING_ALLOWANCE_RISE.from}, the first {gbp(TRADING_ALLOWANCE_RISE.tradingAllowance)}{' '}
        of trading and miscellaneous income each year is tax-free, up from{' '}
        {gbp(SELF_EMPLOYED.tradingAllowance)}. The{' '}
        <Link to="/self-employed-tax-calculator">self-employed tax calculator</Link> uses the{' '}
        {TAX_YEAR} allowance.
      </p>

      <h3>Mileage</h3>
      <p>
        If you use your own car or van for work, {pencePerMile(mileageNow.firstMilesRate)} a mile
        for the first {mileageNow.firstMiles.toLocaleString('en-GB')} business miles stays for good.
        It was brought in from {TAX_YEAR_START} as a temporary rise. From {NEXT_TAX_YEAR_START},
        each mile over that goes up from {pencePerMile(mileageNow.laterMilesRate)} to{' '}
        {pencePerMile(mileageNext.laterMilesRate)}. The rates are what an employer can pay you
        without tax, and what self-employed people can claim with the simplified rates.
      </p>

      <h2>Income tax, pensions and Child Benefit</h2>
      <h3>Thresholds stay frozen</h3>
      <p>
        The Personal Allowance stays at {gbp(INCOME_TAX.personalAllowance)} and the higher rate
        threshold at {gbp(INCOME_TAX.basicRateLimit)} until {INCOME_TAX_FREEZE.until}, as announced
        at {INCOME_TAX_FREEZE.announcedAt}. If your pay goes up, more of it is taxed at the basic or
        higher rate. The <Link to="/salary-calculator">take-home pay calculator</Link> and the{' '}
        <Link to="/pay-rise-calculator">pay rise calculator</Link> show what a rise leaves you.
      </p>

      <h3>Pension Tax Allowance</h3>
      <p>
        From {pta.from} to {pta.until}, people over State Pension age whose total income is no more
        than the full new State Pension get a Pension Tax Allowance, so they do not have small
        amounts of tax to pay through Simple Assessment. In {pta.taxYear} the full allowance applies
        up to {gbp(pta.fullUpTo)} of income. It is withdrawn by £1 for every £
        {pta.incomeForEachPoundLost} above that, and is gone at {gbp(pta.goneAt)}.
      </p>

      <h3>Child Benefit charge</h3>
      <p>
        If you were overpaid Child Benefit and also owe the High Income Child Benefit Charge, HMRC
        will set one against the other automatically, so there are fewer separate payments and
        repayments. The change is in {CHILD_BENEFIT_CHARGE_OFFSET.law} and goes back to when the
        charge began in {CHILD_BENEFIT_CHARGE_OFFSET.backTo}.
      </p>

      <h2>Announced before this Budget</h2>
      <p>
        From {PENSIONS_INHERITANCE_TAX.from}, most unused pension funds and pension death benefits
        count towards the value of an estate for inheritance tax. This was announced at{' '}
        {PENSIONS_INHERITANCE_TAX.announcedAt}. The people dealing with the estate report and pay
        any tax due.
      </p>
      <p>
        From {sacrifice.startDate}, only the first {gbp(sacrifice.niFreeLimit)} a year of pension
        contributions made through salary sacrifice is free of National Insurance. You and your
        employer pay it on anything above that. The contributions are still free of income tax,
        within the usual limits. This was announced at Budget 2025.
      </p>

      <h2>Common questions</h2>
      <h3>Does the rise in savings tax affect ISAs?</h3>
      <p>No. Interest in an ISA is still not taxed.</p>
      <h3>Does the Personal Allowance go up in April 2027?</h3>
      <p>
        No. It stays at {gbp(INCOME_TAX.personalAllowance)} until {INCOME_TAX_FREEZE.until}.
      </p>
      <h3>When do the new minimum wage rates start?</h3>
      <p>On {wageNext.effectiveFrom}.</p>

      <h2>Where this comes from</h2>
      <p>
        All from gov.uk, checked on {BUDGET_2026.checkedOn}: the{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-document/budget-2026-html">
          Budget 2026 document
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar">
          overview of tax legislation and rates
        </Source>{' '}
        and its{' '}
        <Source href="https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances">
          rates and allowances
        </Source>
        , HM Treasury&apos;s{' '}
        <Source href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation">
          response on the First Time Buyer ISA
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/government/news/everyday-fixes-to-make-life-easier-for-millions-of-britons">
          announcement on mileage rates
        </Source>{' '}
        and the page on{' '}
        <Source href="https://www.gov.uk/expenses-and-benefits-business-travel-mileage/rules-for-tax">
          mileage rates
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/national-minimum-wage-rates">minimum wage rates</Source>,
        the <Source href="https://www.gov.uk/lifetime-isa">Lifetime ISA</Source> page, and the
        policy papers on{' '}
        <Source href="https://www.gov.uk/government/publications/maintaining-income-tax-and-equivalent-national-insurance-contributions-thresholds-until-5-april-2031">
          frozen thresholds
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/government/publications/inheritance-tax-unused-pension-funds-and-death-benefits">
          pensions and inheritance tax
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029">
          salary sacrifice
        </Source>
        .
      </p>
    </GuidePage>
  )
}
