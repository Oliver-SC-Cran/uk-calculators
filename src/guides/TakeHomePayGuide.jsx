import {
  calculateTakeHome,
  INCOME_TAX,
  NATIONAL_INSURANCE,
  taperedPersonalAllowance,
  TAX_YEAR,
  TAX_YEAR_END,
  TAX_YEAR_START,
} from '../lib/calculations'
import { formatGBP as gbp, percent } from '../lib/format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

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
  const standardTaxCode = `${Math.floor(personalAllowance / 10)}L`

  // The taper: each extra £100 is taxed at the higher rate, and removes the
  // allowance from another £50, which is then taxed at the higher rate too.
  const taperExample = taperStart + 10000
  const taperTaxPer100 = 100 * higherRate
  const taperLostAllowancePer100 = 50
  const taperExtraTaxPer100 = taperLostAllowancePer100 * higherRate
  const taperTotalTaxPer100 = taperTaxPer100 + taperExtraTaxPer100
  const taperKeptPer100 = 100 - taperTotalTaxPer100 - 100 * upperRate

  const on25k = calculateTakeHome(25000)
  const on30k = calculateTakeHome(30000)
  const on35k = calculateTakeHome(35000)
  const on60k = calculateTakeHome(60000)
  const over60k = 60000 - basicRateLimit

  return (
    <article className="guide">
      <h2>How income tax and National Insurance work in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        Two things come out of most pay packets: income tax and National Insurance (NI). Both are
        charged in bands, so each rate only applies to the slice of pay inside that band. Moving
        into a higher band never reduces what you keep from the pay below it.
      </p>
      <p>
        The figures here apply in England, Wales and Northern Ireland from {TAX_YEAR_START} to{' '}
        {TAX_YEAR_END}. Scotland sets its own income tax bands.
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
        {gbp(upperEarningsLimit)} a year, and {percent(upperRate)} on anything above that. NI is
        worked out on each payslip, not over the whole year. If your pay changes from month to
        month, the total can differ a little from an annual estimate. You stop paying NI when you
        reach State Pension age.
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
        Each example assumes one job, the standard personal allowance, no pension contributions and
        no student loan. Figures are rounded to the nearest pound.
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
        {percent(upperRate)} on the second, {gbp(on60k.nationalInsurance)} in total. Take-home pay
        is {gbp(on60k.takeHomeAnnual)} a year, or about {gbp(on60k.takeHomeMonthly)} a month.
      </p>

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
        about {gbp(on30k.takeHomeMonthly)} a month.
      </p>

      <h3>Why is my payslip different from this calculator?</h3>
      <p>
        The usual reasons are pension contributions, student loan repayments, a tax code other than{' '}
        {standardTaxCode}, taxable benefits such as a company car, or starting the job part way
        through the tax year.
      </p>

      <h3>Is income tax different in Scotland?</h3>
      <p>
        Yes. Scottish taxpayers pay income tax at rates and bands set by the Scottish Government, so
        their take-home pay is different. NI is the same across the UK. This calculator does not
        cover Scottish rates.
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
        .
      </p>
    </article>
  )
}
