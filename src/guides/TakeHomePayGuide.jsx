import { taperedPersonalAllowance } from '../lib/incomeTax'
import { INCOME_TAX, NATIONAL_INSURANCE, SCOTTISH_INCOME_TAX } from '../lib/rates/incomeTax'
import { TAX_YEAR, TAX_YEAR_END, TAX_YEAR_START } from '../lib/rates/taxYear'
import { formatGBP as gbp, formatGBPPence as gbpPence, percent } from '../lib/format'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'
import { calculateTakeHomePay } from '../lib/takeHome'
import { taxCodeFor } from '../lib/taxCode'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-21'

// The calculator's own sums, for someone paid monthly with no tax code,
// pension or student loan, so the examples match what the calculator shows.
const takeHome = (pay, scottish = false) => calculateTakeHomePay({ pay, scottish })

export default function TakeHomePayGuide() {
  const {
    personalAllowance,
    basicRateLimit,
    higherRateLimit,
    taperStart,
    taperFullyGoneAt,
    basicRate,
    higherRate,
    additionalRate,
  } = INCOME_TAX
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = NATIONAL_INSURANCE

  const basicBand = basicRateLimit - personalAllowance
  const standardTaxCode = taxCodeFor(personalAllowance)

  // The taper: each extra £100 is taxed at the higher rate, and removes the
  // allowance from another £50, which is then taxed at the higher rate too.
  const taperExample = taperStart + 10000
  const taperTaxPer100 = 100 * higherRate
  const taperLostAllowancePer100 = 100 * INCOME_TAX.taperAllowanceLostPerPound
  const taperExtraTaxPer100 = taperLostAllowancePer100 * higherRate
  const taperTotalTaxPer100 = taperTaxPer100 + taperExtraTaxPer100
  const taperKeptPer100 = 100 - taperTotalTaxPer100 - 100 * upperRate

  const monthly = NATIONAL_INSURANCE.byPayPeriod.monthly
  const weekly = NATIONAL_INSURANCE.byPayPeriod.weekly

  const on25k = takeHome(25000)
  const on30k = takeHome(30000)
  const on35k = takeHome(35000)
  const on60k = takeHome(60000)
  const over60k = 60000 - basicRateLimit

  // gov.uk's own example of a reduced code: medical insurance worth £1,570.
  const benefit = 1570
  const reducedCode = taxCodeFor(personalAllowance - benefit)

  // A bonus on £35,000, paid monthly.
  const bonusExample = calculateTakeHomePay({ pay: 35000, bonus: 5000 }).bonus

  // Scotland: the same allowance and National Insurance, with its own tax bands.
  const scotland = SCOTTISH_INCOME_TAX
  const scotOn30k = takeHome(30000, true)
  const scotOn35k = takeHome(35000, true)
  const scotOn47k = takeHome(47000, true)
  const on47k = takeHome(47000)
  const scotStarterBand = scotland.starterRateLimit - personalAllowance
  const scotBasicBand = scotland.basicRateLimit - scotland.starterRateLimit
  const scot35kAtIntermediate = 35000 - scotland.basicRateLimit
  const scot47kAtHigher = 47000 - scotland.intermediateRateLimit
  // In the taper, each extra £100 and the £50 of allowance it removes are both
  // taxed at the advanced rate.
  const scotTaperTaxPer100 = (100 + taperLostAllowancePer100) * scotland.advancedRate
  const overlapKeptPerPound = 1 - scotland.higherRate - mainRate
  const aboveOverlapKeptPerPound = 1 - scotland.higherRate - upperRate
  const pence = (share) => `${Math.round(share * 100)}p`

  return (
    <CalculatorGuide
      heading={<>How income tax and National Insurance work in {TAX_YEAR}</>}
      updated={LAST_UPDATED}
    >
      <p>
        Two things come out of most pay packets: income tax and National Insurance (NI). Both are
        charged in bands, so each rate only applies to the slice of pay inside that band. Moving
        into a higher band never reduces what you keep from the pay below it.
      </p>
      <p>
        The figures here are for {TAX_YEAR_START} to {TAX_YEAR_END}. The income tax bands in the
        next section apply in England, Wales and Northern Ireland. Scotland has its own, which have
        a section of their own further down. NI and the personal allowance are the same across the
        UK.
      </p>

      <h3>Income tax bands</h3>
      <ul>
        <li>Personal allowance: the first {gbp(personalAllowance)} you earn is tax-free.</li>
        <li>
          Basic rate: {percent(basicRate)} on income from {gbp(personalAllowance + 1)} to{' '}
          {gbp(basicRateLimit)}.
        </li>
        <li>
          Higher rate: {percent(higherRate)} on income from {gbp(basicRateLimit + 1)} to{' '}
          {gbp(higherRateLimit)}.
        </li>
        <li>
          Additional rate: {percent(additionalRate)} on income above {gbp(higherRateLimit)}.
        </li>
      </ul>

      <h3>National Insurance</h3>
      <p>
        Employees pay NI at {percent(mainRate)} on earnings between {gbp(primaryThreshold)} and{' '}
        {gbp(upperEarningsLimit)} a year, and {percent(upperRate)} on anything above that. Payroll
        works NI out on each payday on its own, with thresholds for the pay period:{' '}
        {gbp(monthly.primaryThreshold)} and {gbp(monthly.upperEarningsLimit)} a month, or{' '}
        {gbp(weekly.primaryThreshold)} and {gbp(weekly.upperEarningsLimit)} a week. Those are
        rounded to the pound, so a year of monthly NI can differ by a few pence from a sum on the
        yearly figures. If your pay changes from month to month, the difference can be larger. You
        stop paying NI when you reach State Pension age.
      </p>

      <h3>The personal allowance taper above {gbp(taperStart)}</h3>
      <p>
        Once your income goes over {gbp(taperStart)}, you lose £1 of personal allowance for every £2
        above it. At {gbp(taperExample)} the allowance is down to{' '}
        {gbp(taperedPersonalAllowance(taperExample))}. At {gbp(taperFullyGoneAt)} it has gone
        completely.
      </p>
      <p>
        This makes each extra £100 between {gbp(taperStart)} and {gbp(taperFullyGoneAt)} cost{' '}
        {gbp(taperTotalTaxPer100)} in income tax. That is {gbp(taperTaxPer100)} at the higher rate,
        plus {gbp(taperExtraTaxPer100)} because another {gbp(taperLostAllowancePer100)} of your
        income is no longer tax-free. With {percent(upperRate)} NI on top, you keep{' '}
        {gbp(taperKeptPer100)} of that £100. Pension contributions and Gift Aid donations reduce the
        income figure used for the taper.
      </p>

      <h2>Worked examples</h2>
      <p>
        Each example assumes one job paid monthly, the standard personal allowance, no pension
        contributions and no student loan. NI is worked out month by month, as payroll does it.
        Figures are rounded to the nearest pound.
      </p>

      <h3>{gbp(25000)} a year</h3>
      <p>
        Take off the {gbp(personalAllowance)} allowance and {gbp(25000 - personalAllowance)} is
        taxable. Income tax at {percent(basicRate)} is {gbp(on25k.incomeTax)}. NI at{' '}
        {percent(mainRate)} on the same amount is {gbp(on25k.nationalInsurance)}. Take-home pay is{' '}
        {gbp(on25k.takeHomeAnnual)} a year, or about {gbp(on25k.takeHomeMonthly)} a month.
      </p>

      <h3>{gbp(35000)} a year</h3>
      <p>
        {gbp(35000 - personalAllowance)} is taxable. Income tax at {percent(basicRate)} is{' '}
        {gbp(on35k.incomeTax)} and NI at {percent(mainRate)} is {gbp(on35k.nationalInsurance)}.
        Take-home pay is {gbp(on35k.takeHomeAnnual)} a year, or about {gbp(on35k.takeHomeMonthly)} a
        month.
      </p>

      <h3>{gbp(60000)} a year</h3>
      <p>
        This salary crosses into the higher rate. You pay {percent(basicRate)} on the{' '}
        {gbp(basicBand)} between {gbp(personalAllowance)} and {gbp(basicRateLimit)}, which is{' '}
        {gbp(basicBand * basicRate)}. You pay {percent(higherRate)} on the {gbp(over60k)} above{' '}
        {gbp(basicRateLimit)}, which is {gbp(over60k * higherRate)}. Income tax comes to{' '}
        {gbp(on60k.incomeTax)}. NI is {percent(mainRate)} on the first slice and{' '}
        {percent(upperRate)} on the second. Worked out each month with the monthly thresholds, that
        comes to {gbp(on60k.nationalInsurance)} for the year. Take-home pay is{' '}
        {gbp(on60k.takeHomeAnnual)} a year, or about {gbp(on60k.takeHomeMonthly)} a month.
      </p>

      <h2>If you pay Scottish income tax</h2>
      <p>
        You pay Scottish income tax if you live in Scotland. It goes by where your main home is, not
        where you work or where your employer is based, and it applies to your wages, pension and
        most other taxable income. Your tax code starts with an S.
      </p>

      <h3>Scottish income tax bands</h3>
      <ul>
        <li>
          Personal allowance: the first {gbp(personalAllowance)} is tax-free, as in the rest of the
          UK.
        </li>
        <li>
          Starter rate: {percent(scotland.starterRate)} on income from {gbp(personalAllowance + 1)}{' '}
          to {gbp(scotland.starterRateLimit)}.
        </li>
        <li>
          Basic rate: {percent(scotland.basicRate)} from {gbp(scotland.starterRateLimit + 1)} to{' '}
          {gbp(scotland.basicRateLimit)}.
        </li>
        <li>
          Intermediate rate: {percent(scotland.intermediateRate)} from{' '}
          {gbp(scotland.basicRateLimit + 1)} to {gbp(scotland.intermediateRateLimit)}.
        </li>
        <li>
          Higher rate: {percent(scotland.higherRate)} from {gbp(scotland.intermediateRateLimit + 1)}{' '}
          to {gbp(scotland.higherRateLimit)}.
        </li>
        <li>
          Advanced rate: {percent(scotland.advancedRate)} from {gbp(scotland.higherRateLimit + 1)}{' '}
          to {gbp(scotland.advancedRateLimit)}.
        </li>
        <li>
          Top rate: {percent(scotland.topRate)} above {gbp(scotland.advancedRateLimit)}.
        </li>
      </ul>
      <p>
        The personal allowance is reduced above {gbp(taperStart)} in the same way. In Scotland the
        lost allowance is taxed at {percent(scotland.advancedRate)}, so each extra £100 between{' '}
        {gbp(taperStart)} and {gbp(taperFullyGoneAt)} costs {gbpPence(scotTaperTaxPer100)} in income
        tax.
      </p>

      <h3>Where higher rate tax and full National Insurance overlap</h3>
      <p>
        NI is the same across the UK, so its {percent(mainRate)} rate runs up to{' '}
        {gbp(upperEarningsLimit)}. Scottish higher rate tax starts earlier, above{' '}
        {gbp(scotland.intermediateRateLimit)}. Between the two, each extra pound loses{' '}
        {pence(scotland.higherRate)} in tax and {pence(mainRate)} in NI, which leaves{' '}
        {pence(overlapKeptPerPound)}. Above {gbp(upperEarningsLimit)}, NI falls to{' '}
        {percent(upperRate)} and you keep {pence(aboveOverlapKeptPerPound)}.
      </p>

      <h3>{gbp(35000)} a year in Scotland</h3>
      <p>
        {gbp(35000 - personalAllowance)} is taxable. The first {gbp(scotStarterBand)} is taxed at{' '}
        {percent(scotland.starterRate)}, the next {gbp(scotBasicBand)} at{' '}
        {percent(scotland.basicRate)} and the last {gbp(scot35kAtIntermediate)} at{' '}
        {percent(scotland.intermediateRate)}. Income tax comes to {gbp(scotOn35k.incomeTax)}, which
        is {gbp(scotOn35k.incomeTax - on35k.incomeTax)} more than in the rest of the UK. NI is the
        same, {gbp(scotOn35k.nationalInsurance)}. Take-home pay is {gbp(scotOn35k.takeHomeAnnual)} a
        year, or about {gbp(scotOn35k.takeHomeMonthly)} a month.
      </p>

      <h3>{gbp(47000)} a year in Scotland</h3>
      <p>
        This salary is in the range where the two overlap. The {gbp(scot47kAtHigher)} above{' '}
        {gbp(scotland.intermediateRateLimit)} is taxed at {percent(scotland.higherRate)}, which is{' '}
        {gbp(scot47kAtHigher * scotland.higherRate)}, and still has {percent(mainRate)} NI taken
        from it. Income tax comes to {gbp(scotOn47k.incomeTax)}, which is{' '}
        {gbp(scotOn47k.incomeTax - on47k.incomeTax)} more than in the rest of the UK. NI is{' '}
        {gbp(scotOn47k.nationalInsurance)}. Take-home pay is {gbp(scotOn47k.takeHomeAnnual)} a year,
        or about {gbp(scotOn47k.takeHomeMonthly)} a month.
      </p>

      <h2>Tax codes</h2>
      <p>
        Your tax code tells your employer how much of your pay from that job is tax-free. The number
        is the tax-free amount without its last digit, so {standardTaxCode} means{' '}
        {gbp(personalAllowance)}. HMRC starts from your Personal Allowance and takes off income you
        have not paid tax on, and deductions such as company benefits. In gov.uk's example, medical
        insurance from an employer worth {gbp(benefit)} leaves {gbp(personalAllowance - benefit)}{' '}
        tax-free, which is code {reducedCode}.
      </p>
      <ul>
        <li>
          L means the standard Personal Allowance. M and N mean Marriage Allowance: you get, or
          give, 10% of a partner's allowance. T means HMRC used other calculations to work out your
          allowance.
        </li>
        <li>
          0T means no tax-free pay, because your allowance is used up or your employer does not have
          the details to give you a code.
        </li>
        <li>
          BR, D0 and D1 tax all pay from the job at the basic, higher or additional rate. They are
          usually for a second job or pension. NT means no tax is taken.
        </li>
        <li>
          K means you have income or deductions that are not taxed elsewhere and come to more than
          your allowance, such as a company benefit or tax owed from an earlier year. The amount is
          added to your pay instead. Your employer cannot take more than half your pay before tax in
          tax.
        </li>
        <li>
          S at the start means Scottish rates, and C the Welsh rates of income tax. Scotland has its
          own one-rate codes, SBR and SD0 to SD3. Wales has CBR, CD0 and CD1. In {TAX_YEAR} the
          Welsh rates are the same as in England and Northern Ireland.
        </li>
      </ul>
      <p>
        A code ending in W1, M1 or X is an emergency code. Tax is then worked out on each week's or
        month's pay on its own, not on your pay so far in the tax year. The calculator works it out
        over the whole year, which comes to the same when your pay is the same every time.
      </p>
      <p>
        Payroll uses your code as it is. If your income goes over {gbp(taperStart)} and your code
        does not allow for the smaller allowance, you will owe more tax for the year than payroll
        takes.
      </p>

      <h2>Bonuses</h2>
      <p>
        A bonus is taxed as part of your pay on the day it is paid. Income tax is worked out on your
        pay so far in the tax year, so over the year a bonus is taxed at your top rate, or rates if
        it crosses a band. NI is worked out on each pay period on its own. In the month a bonus is
        paid, more of your pay can be above the upper limit of {gbp(monthly.upperEarningsLimit)},
        where NI is {percent(upperRate)} instead of {percent(mainRate)}. Student loan repayments are
        worked out on each payday too, so the month of a bonus has a larger one.
      </p>
      <p>
        On a salary of {gbp(35000)} paid monthly, a {gbp(5000)} bonus has{' '}
        {gbp(bonusExample.incomeTax)} of income tax and {gbp(bonusExample.nationalInsurance)} of NI
        taken from it, not the {gbp(5000 * mainRate)} that {percent(mainRate)} would be. You keep{' '}
        {gbp(bonusExample.kept)}.
      </p>

      <h2>Pensions</h2>
      <p>The calculator offers the three ways a workplace pension can be taken from pay.</p>
      <ul>
        <li>
          Salary sacrifice: you agree to lower cash pay, and your employer pays the difference into
          your pension. Tax and NI are worked out on the lower pay. It cannot take your pay below
          the National Minimum Wage.
        </li>
        <li>
          Net pay arrangement: your employer takes the contribution from your pay before income tax.
          NI is still worked out on your full pay.
        </li>
        <li>
          Relief at source: the contribution comes from your pay after tax, and your pension
          provider claims {percent(basicRate)} from the government and adds it to your pot. If you
          pay {percent(higherRate)} or {percent(additionalRate)} tax, you can claim more on a Self
          Assessment tax return.
        </li>
      </ul>

      <h2>Common questions</h2>

      <h3>
        Do I pay {percent(higherRate)} tax on everything if I earn over {gbp(basicRateLimit)}?
      </h3>
      <p>
        No. The {percent(higherRate)} rate only applies to the part of your income above{' '}
        {gbp(basicRateLimit)}. Everything below that is still tax-free or taxed at{' '}
        {percent(basicRate)}, so a pay rise into the higher band still leaves you with more
        take-home pay.
      </p>

      <h3>How much tax do I pay on {gbp(30000)}?</h3>
      <p>
        On {gbp(30000)} a year you pay {gbp(on30k.incomeTax)} in income tax and{' '}
        {gbp(on30k.nationalInsurance)} in NI. That leaves {gbp(on30k.takeHomeAnnual)} a year, or
        about {gbp(on30k.takeHomeMonthly)} a month. In Scotland the income tax is{' '}
        {gbp(scotOn30k.incomeTax)}, which leaves {gbp(scotOn30k.takeHomeAnnual)} a year.
      </p>

      <h3>Why is my payslip different from this calculator?</h3>
      <p>
        Check that you entered your tax code, pension and student loan. Other common reasons are pay
        that changes from month to month, starting the job part way through the tax year, or an
        emergency tax code.
      </p>

      <h3>Is income tax different in Scotland?</h3>
      <p>
        Yes. Scottish taxpayers pay income tax at rates and bands set by the Scottish Parliament,
        with six rates in place of three, so their take-home pay is different. NI is the same across
        the UK. Choose Scotland in the calculator to use the Scottish rates, which are set out in
        the section above.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        HMRC publishes the {TAX_YEAR} rates on gov.uk. See{' '}
        <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noreferrer">
          income tax rates and personal allowances
        </a>{' '}
        and{' '}
        <a
          href="https://www.gov.uk/national-insurance/how-much-you-pay"
          target="_blank"
          rel="noreferrer"
        >
          how much National Insurance you pay
        </a>
        . For Scotland, see{' '}
        <a href="https://www.gov.uk/scottish-income-tax" target="_blank" rel="noreferrer">
          Income Tax in Scotland
        </a>{' '}
        on gov.uk and the Scottish Government's{' '}
        <a
          href="https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/2026-to-2027/"
          target="_blank"
          rel="noreferrer"
        >
          rates and bands for {TAX_YEAR}
        </a>
        .
      </p>
      <p>
        On tax codes, see{' '}
        <Source href="https://www.gov.uk/tax-codes/what-your-tax-code-means">
          what your tax code means
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-codes/emergency-tax-codes">emergency tax codes</Source>{' '}
        and <Source href="https://www.gov.uk/tax-codes/k-in-your-tax-code">K tax codes</Source>. The
        Welsh rates are on{' '}
        <Source href="https://www.gov.uk/welsh-income-tax">Welsh Income Tax</Source>. The weekly and
        monthly thresholds are in HMRC's{' '}
        <Source href="https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027">
          rates and thresholds for employers
        </Source>
        , and pensions are covered by{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief">
          pension tax relief
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye">
          salary sacrifice and the effects on PAYE
        </Source>
        .
      </p>
    </CalculatorGuide>
  )
}
