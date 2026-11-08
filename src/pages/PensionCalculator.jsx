import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { Chips, NumberField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputNote, InputSection, MoreOptions } from '../components/InputCard'
import LineChart from '../components/LineChart'
import Notice from '../components/Notice'
import RegionField from '../components/RegionField'
import { REGIONS, REST_OF_UK_NOTE, STUDENT_LOAN_PLANS } from '../components/choices'
import ResultCard from '../components/ResultCard'
import Source from '../components/Source'
import StudentLoanPlanField from '../components/StudentLoanPlanField'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import PensionGuide from '../guides/PensionGuide'
import { formatAmount, formatDeduction, formatGBP, formatGBPPence, percent } from '../lib/format'
import { PAY_FREQUENCIES } from '../lib/payPeriods'
import { PENSION_TYPES } from '../lib/pensions'
import { GROWTH } from '../lib/rates/growth'
import { INCOME_TAX } from '../lib/rates/incomeTax'
import { FULL_TIME_HOURS, MINIMUM_WAGE } from '../lib/rates/minimumWage'
import {
  ANNUAL_ALLOWANCE,
  AUTO_ENROLMENT,
  LOW_EARNER_PENSION_PAYMENT,
  LUMP_SUM,
  MINIMUM_PENSION_AGE_RISE,
  PENSIONS_INHERITANCE_TAX,
  SALARY_SACRIFICE_CHANGE,
  STATE_PENSION,
} from '../lib/rates/pensions'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { MONEY, PERCENTAGE } from '../lib/validation'
import { calculateWorkplacePension, RELIEF_METHODS } from '../lib/workplacePension'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-11-08'

const MAX_AMOUNT = 10_000_000
const OLDEST_TO_RETIRE = 75

// A share as the text typed in a percentage field: 0.05 becomes '5'.
const percentText = (share) => String(Number((share * 100).toFixed(4)))
// A percentage to up to three decimal places, so the 0.75% charge cap shows as it is.
const exactPercent = (share) => formatAmount(share, 'percent')
const pick = (share) => [percentText(share), exactPercent(share)]

// Quick picks. The FCA's projection rates for pensions, the inflation target,
// the automatic enrolment minimums and the charge cap on default funds are
// official figures, not forecasts or recommendations.
const RATE_PICKS = Object.values(GROWTH.fcaProjectionRates).map(pick)
const INFLATION_PICKS = [pick(GROWTH.inflationTarget)]
const EMPLOYEE_PICKS = [pick(AUTO_ENROLMENT.employeeMinimum)]
const EMPLOYER_PICKS = [pick(AUTO_ENROLMENT.employerMinimum)]
const CHARGE_PICKS = [pick(AUTO_ENROLMENT.defaultFundChargeCap)]

const { lower, upper } = AUTO_ENROLMENT.qualifyingEarnings
const BASIS_NAMES = {
  qualifyingEarnings: `Qualifying earnings (${formatGBP(lower)} to ${formatGBP(upper)} a year)`,
  fullSalary: 'Your full salary',
}

const yearsText = (years) => `${years} ${years === 1 ? 'year' : 'years'}`

// What the "More options" row says while it is closed.
function optionsSummary({ inflation, compounding, payFrequency, plan, hasPostgraduateLoan }) {
  const parts = [
    inflation.valid && inflation.value > 0
      ? `${percent(inflation.value / 100)} inflation`
      : 'no inflation',
    compounding === 'yearly' ? 'growth added yearly' : 'growth added monthly',
    payFrequency === 'weekly' ? 'paid weekly' : 'paid monthly',
    plan !== 'none' || hasPostgraduateLoan ? 'a student loan' : 'no student loan',
  ]
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export default function PensionCalculator() {
  const state = useCalculatorState(
    {
      age: numberInput('30', {
        label: 'Your age',
        min: 16,
        max: OLDEST_TO_RETIRE - 1,
        whole: true,
      }),
      retirementAge: numberInput('67', (fields) => ({
        label: 'Age you plan to retire',
        name: 'the age you plan to retire',
        min: Math.max(
          MINIMUM_PENSION_AGE_RISE.now,
          fields.age.valid ? fields.age.value + 1 : MINIMUM_PENSION_AGE_RISE.now,
        ),
        max: OLDEST_TO_RETIRE,
        whole: true,
      })),
      potNow: numberInput('', {
        label: 'Your pension pot now',
        name: 'your pension pot',
        ...MONEY,
        max: MAX_AMOUNT,
        optional: true,
        grouped: true,
      }),
      salary: numberInput('30,000', {
        label: 'Your salary a year',
        name: 'your salary',
        ...MONEY,
        max: MAX_AMOUNT,
        optional: true,
        grouped: true,
      }),
      payRise: numberInput('2', {
        label: 'Pay rise a year',
        name: 'a pay rise',
        min: 0,
        max: 20,
        optional: true,
      }),
      region: choiceInput('restOfUk', Object.keys(REGIONS)),
      employeePercent: numberInput(percentText(AUTO_ENROLMENT.employeeMinimum), {
        label: 'You pay in',
        name: 'what you pay in',
        ...PERCENTAGE,
      }),
      employerPercent: numberInput(percentText(AUTO_ENROLMENT.employerMinimum), {
        label: 'Your employer pays in',
        name: 'what your employer pays in',
        ...PERCENTAGE,
      }),
      basis: choiceInput('qualifyingEarnings', Object.keys(BASIS_NAMES)),
      reliefType: choiceInput('reliefAtSource', RELIEF_METHODS),
      hours: numberInput(String(FULL_TIME_HOURS), {
        label: 'Hours you work a week',
        min: 1,
        max: 168,
      }),
      rate: numberInput(percentText(GROWTH.fcaProjectionRates.intermediate), {
        label: 'Growth a year',
        name: 'a growth rate',
        min: 0,
        max: 20,
      }),
      charge: numberInput('', {
        label: 'Yearly charge',
        name: 'the yearly charge',
        min: 0,
        max: 10,
        optional: true,
      }),
      inflation: numberInput(percentText(GROWTH.inflationTarget), {
        label: 'Inflation a year',
        name: 'the inflation rate',
        min: 0,
        max: 20,
        optional: true,
      }),
      compounding: choiceInput('monthly', ['monthly', 'yearly']),
      payFrequency: choiceInput('monthly', Object.keys(PAY_FREQUENCIES)),
      plan: choiceInput('none', STUDENT_LOAN_PLANS),
      hasPostgraduateLoan: checkboxInput(false),
    },
    { sharedLinks: true },
  )
  const { age, retirementAge, potNow, salary, payRise, employeePercent, employerPercent } = state
  const { hours, rate, charge, inflation } = state
  const region = state.region.value
  const basis = state.basis.value
  const reliefType = state.reliefType.value
  const compounding = state.compounding.value
  const payFrequency = state.payFrequency.value
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value
  const isSacrifice = reliefType === 'salarySacrifice'
  const scottish = region === 'scotland'

  const problem =
    problemWith(
      age,
      retirementAge,
      potNow,
      salary,
      payRise,
      employeePercent,
      employerPercent,
      ...(isSacrifice ? [hours] : []),
      rate,
      charge,
      inflation,
    ) ??
    (potNow.value > 0 || salary.value > 0 ? null : 'Enter your pension pot now or your salary.')

  const weeklyHours = hours.valid ? hours.value : FULL_TIME_HOURS
  const result = useMemo(
    () =>
      calculateWorkplacePension({
        age: age.value,
        retirementAge: retirementAge.value,
        potNow: potNow.value,
        salary: salary.value,
        payRisePercent: payRise.value,
        employeePercent: employeePercent.value,
        employerPercent: employerPercent.value,
        basis,
        reliefType,
        ratePercent: rate.value,
        compounding,
        chargePercent: charge.value,
        inflationPercent: inflation.value,
        scottish,
        plan,
        hasPostgraduateLoan,
        payFrequency,
        weeklyHours,
      }),
    [
      age.value,
      retirementAge.value,
      potNow.value,
      salary.value,
      payRise.value,
      employeePercent.value,
      employerPercent.value,
      basis,
      reliefType,
      rate.value,
      compounding,
      charge.value,
      inflation.value,
      scottish,
      plan,
      hasPostgraduateLoan,
      payFrequency,
      weeklyHours,
    ],
  )

  const { chosen, lumpSum, totals } = result
  const atAge = `at ${result.retirementAge}`
  const hasCharge = result.charges > 0
  const hasInflation = result.realValue !== null
  const rises = result.payRisePercent > 0
  const rateText = percent(result.ratePercent / 100)
  const { period } = PAY_FREQUENCIES[result.payFrequency]

  const potLine = [[0, result.potNow], ...result.rows.map((row) => [row.year, row.value])]
  const series = [
    {
      name: 'Paid in',
      points: [[0, result.potNow], ...result.rows.map((row) => [row.year, row.paidIn])],
      variant: 'compare',
    },
    { name: 'Your pot', points: potLine, variant: 'main' },
  ]
  const finalPaidIn = result.potNow + totals.paidIn

  const contributionNote =
    basis === 'qualifyingEarnings'
      ? 'Qualifying earnings are worked out on your salary as entered, before any salary sacrifice.'
      : 'Contributions are worked out on your salary as entered, before any salary sacrifice.'

  return (
    <CalculatorLayout
      title="Workplace pension calculator"
      lede={`What your workplace pension could grow to by the time you retire, what goes in from you, tax relief and your employer, and what it costs you after tax in ${TAX_YEAR}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="About you">
              <FieldRow>
                <NumberField id="age" field={age} />
                <NumberField
                  id="retirement-age"
                  hint={`When you plan to start taking money from your pension, up to ${OLDEST_TO_RETIRE}.`}
                  field={retirementAge}
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Your pension now">
              <FieldRow>
                <NumberField
                  id="pot-now"
                  hint="Leave it blank if you are starting a new pension."
                  before="£"
                  decimal
                  optional
                  size="full"
                  field={potNow}
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Your pay">
              <FieldRow>
                <NumberField
                  id="salary"
                  hint="Before tax and before any salary sacrifice. Leave it blank if you are not paying in now."
                  before="£"
                  decimal
                  field={salary}
                />
                <NumberField
                  id="pay-rise"
                  hint="Your pay and contributions rise by this at the start of each year. Enter 0 to keep them the same."
                  after="%"
                  decimal
                  optional
                  field={payRise}
                />
                <RegionField value={region} onChange={state.region.set} size="full" />
              </FieldRow>
            </InputSection>

            <InputSection title="Contributions">
              <FieldRow>
                <NumberField
                  id="employee-percent"
                  hint={`A share of the pay below. With relief at source it includes the ${percent(INCOME_TAX.basicRate)} tax relief, as your payslip does.`}
                  after="%"
                  decimal
                  field={employeePercent}
                  below={
                    <Chips
                      label="The automatic enrolment minimum for you"
                      options={EMPLOYEE_PICKS}
                      current={employeePercent.text}
                      onPick={employeePercent.setText}
                    />
                  }
                />
                <NumberField
                  id="employer-percent"
                  hint="A share of the same pay."
                  after="%"
                  decimal
                  field={employerPercent}
                  below={
                    <Chips
                      label="The automatic enrolment minimum for employers"
                      options={EMPLOYER_PICKS}
                      current={employerPercent.text}
                      onPick={employerPercent.setText}
                    />
                  }
                />
                <SelectField
                  id="basis"
                  label="Worked out on"
                  hint="Most automatic enrolment schemes use qualifying earnings."
                  value={basis}
                  onChange={state.basis.set}
                  size="full"
                >
                  {Object.entries(BASIS_NAMES).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </SelectField>
              </FieldRow>
              <FieldRow>
                <SelectField
                  id="relief-type"
                  label="How tax relief is given"
                  hint="Your employer's scheme decides this. Ask them if you are not sure."
                  value={reliefType}
                  onChange={state.reliefType.set}
                  size="full"
                >
                  {RELIEF_METHODS.map((type) => (
                    <option key={type} value={type}>
                      {PENSION_TYPES[type]}
                    </option>
                  ))}
                </SelectField>
                {isSacrifice && (
                  <NumberField
                    id="hours"
                    hint="A salary sacrifice cannot take your pay below the minimum wage for these hours."
                    decimal
                    field={hours}
                  />
                )}
              </FieldRow>
              <InputNote>{contributionNote}</InputNote>
            </InputSection>

            <InputSection title="Growth">
              <FieldRow>
                <NumberField
                  id="rate"
                  hint="Before charges. The quick picks are the most the FCA lets firms use for their lower, middle and higher projections for pensions. They are not a forecast."
                  after="%"
                  decimal
                  field={rate}
                  below={
                    <Chips
                      label="FCA projection rates for pensions"
                      options={RATE_PICKS}
                      current={rate.text}
                      onPick={rate.setText}
                    />
                  }
                />
                <NumberField
                  id="charge"
                  hint={`Your pension's charges, as a share of your pot each year. A default fund used for automatic enrolment can charge at most ${exactPercent(AUTO_ENROLMENT.defaultFundChargeCap)}.`}
                  after="%"
                  decimal
                  optional
                  field={charge}
                  below={
                    <Chips
                      label="The most a default fund can charge"
                      options={CHARGE_PICKS}
                      current={charge.text}
                      onPick={charge.setText}
                    />
                  }
                />
              </FieldRow>
            </InputSection>

            <MoreOptions
              title="Inflation, pay days and student loan"
              summary={optionsSummary({
                inflation,
                compounding,
                payFrequency,
                plan,
                hasPostgraduateLoan,
              })}
            >
              <FieldRow>
                <NumberField
                  id="inflation"
                  hint={`To show your pot in today's money. The Government's inflation target for the Bank of England is ${percent(GROWTH.inflationTarget)}.`}
                  after="%"
                  decimal
                  optional
                  field={inflation}
                  below={
                    <Chips
                      label="The inflation target"
                      options={INFLATION_PICKS}
                      current={inflation.text}
                      onPick={inflation.setText}
                    />
                  }
                />
                <SelectField
                  id="compounding"
                  label="How often growth is added"
                  hint="As on the compound interest calculator."
                  value={compounding}
                  onChange={state.compounding.set}
                >
                  <option value="monthly">Each month</option>
                  <option value="yearly">Once a year</option>
                </SelectField>
                <SelectField
                  id="pay-frequency"
                  label="How often you are paid"
                  hint="Qualifying earnings, National Insurance and student loan are worked out on each pay day."
                  value={payFrequency}
                  onChange={state.payFrequency.set}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </SelectField>
                <StudentLoanPlanField
                  plan={plan}
                  onPlanChange={state.plan.set}
                  hasPostgraduateLoan={hasPostgraduateLoan}
                  onPostgraduateChange={state.hasPostgraduateLoan.set}
                  size="full"
                />
              </FieldRow>
            </MoreOptions>
          </InputCard>

          <Notice>
            Contributions go in at the start of each month and rise with your pay at the start of
            each year. Tax, National Insurance and the qualifying earnings band are taken as they
            are in {TAX_YEAR} and as rising with your pay, so what comes from you, tax relief and
            your employer keeps the same shares. Growth and charges stay the same every year.{' '}
            {scottish
              ? 'This uses Scottish income tax rates for what your contribution costs. National Insurance and student loans are the same across the UK.'
              : REST_OF_UK_NOTE}
          </Notice>
        </>
      }
      result={
        <ResultCard
          label={`Your pot ${atAge}`}
          figures={[
            { value: formatGBP(result.finalValue), per: atAge },
            hasInflation
              ? { value: formatGBP(result.realValue), per: "in today's money" }
              : { value: formatGBP(result.growth), per: 'growth earned' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <table className="result-table result-table--total">
            <caption>Where your pot comes from</caption>
            <tbody>
              {result.potNow > 0 && (
                <tr>
                  <th scope="row">Your pot now</th>
                  <td>{formatGBP(result.potNow)}</td>
                </tr>
              )}
              <tr>
                <th scope="row">From your take-home pay</th>
                <td>{formatGBP(totals.fromYou)}</td>
              </tr>
              <tr>
                <th scope="row">{result.reliefLabel}</th>
                <td>{formatGBP(totals.relief)}</td>
              </tr>
              <tr>
                <th scope="row">From your employer</th>
                <td>{formatGBP(totals.employer)}</td>
              </tr>
              <tr>
                <th scope="row">Growth</th>
                <td>{formatGBP(result.growth)}</td>
              </tr>
              {hasCharge && (
                <tr>
                  <th scope="row">Charges</th>
                  <td>{formatDeduction(result.charges)}</td>
                </tr>
              )}
              <tr>
                <th scope="row">Your pot {atAge}</th>
                <td>{formatGBP(result.finalValue)}</td>
              </tr>
            </tbody>
          </table>

          <p className="result-card__line">
            {result.yearlyIntoPot > 0 ? (
              rises ? (
                <>
                  {formatGBP(result.yearlyIntoPot)} goes in during the first year. With your pay
                  rising {percent(result.payRisePercent / 100)} a year, that is{' '}
                  {formatGBP(result.intoPotInLastYear)} by your last year, and{' '}
                  {formatGBP(totals.paidIn)} over {yearsText(result.years)}.
                </>
              ) : (
                <>
                  {formatGBP(result.yearlyIntoPot)} goes in each year, {formatGBP(totals.paidIn)}{' '}
                  over {yearsText(result.years)}.
                </>
              )
            ) : (
              <>Nothing goes in from your pay, so only your pot now grows.</>
            )}{' '}
            {rateText} a year,{' '}
            {compounding === 'monthly' ? 'added each month' : 'added once a year'}, works out at{' '}
            {formatAmount(result.yearlyRate, 'percent')} over a whole year
            {hasCharge
              ? `, or ${formatAmount(result.yearlyRateAfterCharges, 'percent')} after the ${exactPercent(result.chargePercent / 100)} yearly charge.`
              : '.'}
            {hasInflation && (
              <>
                {' '}
                At {percent(result.inflationPercent / 100)} inflation a year, your pot {atAge} would
                buy what {formatGBP(result.realValue)} buys today.
              </>
            )}
          </p>

          <table className="result-table result-table--columns">
            <caption>What your contribution costs you in {TAX_YEAR}</caption>
            <thead>
              <tr>
                <td></td>
                <th scope="col">Into your pension a year</th>
                <th scope="col">Cost to you a year</th>
              </tr>
            </thead>
            <tbody>
              {RELIEF_METHODS.map((type) => {
                const method = result.methods[type]
                const blocked =
                  type === 'salarySacrifice' && method.sacrificeCapped && !method.intoPot
                return (
                  <tr key={type}>
                    <th scope="row">
                      {PENSION_TYPES[type]}
                      {type === reliefType && ' (yours)'}
                    </th>
                    {blocked && result.asked > 0 ? (
                      <td colSpan={2}>Not possible at the minimum wage</td>
                    ) : (
                      <>
                        <td>{formatGBP(method.intoPot)}</td>
                        <td>{formatGBP(method.cost)}</td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="result-card__line">
            Yours costs you {formatGBP(chosen.cost / 12)} a month from your take-home pay. Your
            employer&apos;s scheme decides which way tax relief is given.
            {result.methods.reliefAtSource.extraClaim > 0 && (
              <>
                {' '}
                For relief at source, the cost counts{' '}
                {formatGBP(result.methods.reliefAtSource.extraClaim)} of extra relief a year that
                you claim from HMRC, which does not come through your pay.
              </>
            )}
          </p>

          <table className="result-table">
            <caption>When you retire</caption>
            <tbody>
              <tr>
                <th scope="row">
                  {lumpSum.capped
                    ? 'Tax-free, up to the Lump Sum Allowance'
                    : `Up to ${percent(LUMP_SUM.taxFreeShare)} tax-free`}
                </th>
                <td>{formatGBP(lumpSum.taxFree)}</td>
              </tr>
              <tr>
                <th scope="row">The rest, usually taxed when you take it</th>
                <td>{formatGBP(lumpSum.rest)}</td>
              </tr>
            </tbody>
          </table>
          <p className="result-card__line">
            {lumpSum.capped ? (
              <>
                {percent(LUMP_SUM.taxFreeShare)} of your pot would be {formatGBP(lumpSum.quarter)},
                more than the {formatGBP(LUMP_SUM.lumpSumAllowance)} Lump Sum Allowance, the most
                you can usually take tax-free across all your pensions.
              </>
            ) : (
              <>
                You can usually take up to {percent(LUMP_SUM.taxFreeShare)} of a pension tax-free,
                up to the {formatGBP(LUMP_SUM.lumpSumAllowance)} Lump Sum Allowance across all your
                pensions.
              </>
            )}
            {lumpSum.taxFreeToday !== null && (
              <> In today&apos;s money the tax-free amount is {formatGBP(lumpSum.taxFreeToday)}.</>
            )}
          </p>

          <LineChart
            id="pension-chart"
            title="Your pension pot over time"
            description={`A line chart of your pension pot by year until you are ${result.retirementAge}. It reaches ${formatGBP(result.finalValue)} after ${yearsText(result.years)}, against ${formatGBP(finalPaidIn)} paid in.`}
            xLabel="Years from now"
            yLabel="Your pot"
            series={series}
          >
            Your pot reaches {formatGBP(result.finalValue)} {atAge}, in {yearsText(result.years)}.{' '}
            {result.finalValue >= finalPaidIn ? (
              <>
                Of that, {formatGBP(finalPaidIn)} is money paid in and{' '}
                {formatGBP(result.finalValue - finalPaidIn)} is growth
                {hasCharge ? ' after charges' : ''}.
              </>
            ) : (
              <>
                That is {formatGBP(finalPaidIn - result.finalValue)} less than the{' '}
                {formatGBP(finalPaidIn)} paid in, because the charges are more than the growth.
              </>
            )}
          </LineChart>

          <details className="result-card__more">
            <summary>Your pay and pot at the end of each year</summary>
            <div className="table-scroll">
              <table className="result-table result-table--columns">
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Age</th>
                    <th scope="col">Your pay</th>
                    <th scope="col">Paid in that year</th>
                    <th scope="col">Growth that year</th>
                    {hasCharge && <th scope="col">Charges that year</th>}
                    <th scope="col">Your pot</th>
                    {hasInflation && <th scope="col">In today&apos;s money</th>}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.year}>
                      <th scope="row">{row.year}</th>
                      <td>{row.age}</td>
                      <td>{formatGBP(row.pay)}</td>
                      <td>{formatGBP(row.payments)}</td>
                      <td>{formatGBP(row.growth)}</td>
                      {hasCharge && <td>{formatDeduction(row.charges)}</td>}
                      <td>{formatGBP(row.value)}</td>
                      {hasInflation && <td>{formatGBP(row.realValue)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </ResultCard>
      }
      notices={problem ? null : <ResultNotices result={result} period={period} />}
      working={problem ? null : result.working}
      guide={<PensionGuide />}
      guides={['/guides/100k-tax-trap', '/guides/how-to-read-your-payslip', '/guides/budget-2026']}
      related={['/compound-interest-calculator', '/salary-calculator', '/pay-rise-calculator']}
    />
  )
}

/** Notes on the result, and warnings about what was entered. */
function ResultNotices({ result, period }) {
  const notices = []
  const { autoEnrolment, salarySacrifice, annualAllowance } = result
  const payPeriodLimits = AUTO_ENROLMENT.byPayPeriod[result.payFrequency]

  if (annualAllowance.over) {
    notices.push(
      <Notice key="annual-allowance" warning>
        {formatGBP(result.yearlyIntoPot)} a year going into your pension, from you, tax relief and
        your employer, is more than the {formatGBP(ANNUAL_ALLOWANCE.standard)}{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/annual-allowance">
          annual allowance
        </Source>{' '}
        for {TAX_YEAR}. You may have to pay tax on the amount over it, unless you can carry over
        allowance you did not use in the previous {ANNUAL_ALLOWANCE.carryForwardYears} tax years.
      </Notice>,
    )
  }

  if (salarySacrifice.limited) {
    const atMinimum = (
      <>
        A salary sacrifice cannot take your pay below the minimum wage. At{' '}
        {formatAmount(salarySacrifice.hours, 'number')} hours a week and{' '}
        {formatGBPPence(salarySacrifice.hourlyRate)} an hour, the National Living Wage for people
        aged 21 and over from {MINIMUM_WAGE.effectiveFrom}, that is{' '}
        {formatGBPPence(salarySacrifice.minimumCashPay)} over 52 weeks
      </>
    )
    notices.push(
      <Notice key="minimum-wage" warning>
        {atMinimum}
        {salarySacrifice.blocked ? (
          <>
            , which leaves nothing of your {formatGBPPence(result.salary)} salary to sacrifice. Only
            your employer&apos;s contribution goes in.
          </>
        ) : (
          <>
            , so your {formatGBPPence(result.salary)} salary leaves{' '}
            {formatGBPPence(result.salary - salarySacrifice.minimumCashPay)} to sacrifice. Your
            contribution has been limited to that, from the {formatGBPPence(result.asked)} a year
            you entered.
          </>
        )}{' '}
        If you work fewer hours, change &ldquo;Hours you work a week&rdquo; above.
        {result.age < 21 && ' A lower minimum wage applies to people under 21.'}
      </Notice>,
    )
  }

  if (result.belowMinimumPensionAge) {
    notices.push(
      <Notice key="minimum-age">
        From {MINIMUM_PENSION_AGE_RISE.from} the earliest most people can take money from a pension
        rises from {MINIMUM_PENSION_AGE_RISE.now} to {MINIMUM_PENSION_AGE_RISE.to}. Some schemes
        give their members a protected pension age, which can be lower.{' '}
        <Source href="https://www.gov.uk/government/publications/increasing-normal-minimum-pension-age">
          Increasing the normal minimum pension age
        </Source>{' '}
        on gov.uk.
      </Notice>,
    )
  }

  if (result.salary > 0 && autoEnrolment.employerNeedNotPay) {
    notices.push(
      <Notice key="lower-limit">
        You earn {formatGBP(payPeriodLimits.lower)} a {period} or less, so your employer does not
        have to pay into a pension for you. You can usually still{' '}
        <Source href="https://www.gov.uk/workplace-pensions/joining-a-workplace-pension">
          ask to join their pension
        </Source>
        , and they cannot refuse.
      </Notice>,
    )
  } else if (result.salary > 0 && (autoEnrolment.paidTooLittle || autoEnrolment.tooYoung)) {
    notices.push(
      <Notice key="not-automatic">
        Employers must enrol workers aged {AUTO_ENROLMENT.minimumAge} to State Pension age who earn
        at least {formatGBP(AUTO_ENROLMENT.earningsTrigger)} a year into a pension automatically.
        You can usually still{' '}
        <Source href="https://www.gov.uk/workplace-pensions/joining-a-workplace-pension">
          ask to join
        </Source>
        , and your employer cannot refuse. As you earn more than {formatGBP(payPeriodLimits.lower)}{' '}
        a {period}, they must then pay in too.
      </Notice>,
    )
  } else if (autoEnrolment.belowMinimum) {
    notices.push(
      <Notice key="below-minimum">
        Under automatic enrolment at least {percent(AUTO_ENROLMENT.totalMinimum)} of qualifying
        earnings goes in, with at least {percent(AUTO_ENROLMENT.employerMinimum)} from your
        employer: {formatGBP(autoEnrolment.minimumTotal)} and{' '}
        {formatGBP(autoEnrolment.minimumEmployer)} a year on your salary. The figures you entered
        come to less. Some schemes work out the minimum on a different measure of pay.
      </Notice>,
    )
  }

  if (result.netPayLessRelief) {
    notices.push(
      <Notice key="net-pay">
        With a net pay arrangement your contribution comes off your pay before income tax, so if you
        pay little or no income tax you get less relief than relief at source would give (
        {formatGBP(result.methods.reliefAtSource.relief)} a year on these figures). HMRC is paying a{' '}
        <Source href="https://www.gov.uk/government/publications/pension-schemes-newsletter-184-august-2026/newsletter-184-august-2026">
          Low Earner&apos;s Pension Payment
        </Source>
        , from {LOW_EARNER_PENSION_PAYMENT.fromTaxYear}, to people in net pay schemes who get less
        relief because of this, and contacts the people who qualify. It is not included here.
      </Notice>,
    )
  }

  if (salarySacrifice.overNiFreeLimit > 0) {
    notices.push(
      <Notice key="sacrifice-cap">
        From {SALARY_SACRIFICE_CHANGE.startDate}, only the first{' '}
        {formatGBP(SALARY_SACRIFICE_CHANGE.niFreeLimit)} a year of pension contributions made
        through salary sacrifice will be free of National Insurance.{' '}
        {formatGBP(salarySacrifice.overNiFreeLimit)} of yours is over that on these figures, so you
        and your employer would pay National Insurance on it. Income tax relief does not change.
        This calculator uses the rules for {TAX_YEAR}.{' '}
        <Source href="https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029">
          Changes to salary sacrifice for pensions
        </Source>{' '}
        on gov.uk.
      </Notice>,
    )
  }

  if (annualAllowance.mayBeTapered) {
    const { taper } = ANNUAL_ALLOWANCE
    notices.push(
      <Notice key="taper">
        Your salary is over {formatGBP(taper.thresholdIncome)}. If your threshold income is over{' '}
        {formatGBP(taper.thresholdIncome)} and your adjusted income is over{' '}
        {formatGBP(taper.adjustedIncome)}, your{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/annual-allowance">
          annual allowance
        </Source>{' '}
        goes down by £1 for every £2 over {formatGBP(taper.adjustedIncome)}, to no less than{' '}
        {formatGBP(taper.minimum)}. This calculator does not work that out.
      </Notice>,
    )
  }

  notices.push(
    <Notice key="growth">
      Growth is not guaranteed. Investments can go down as well as up, so your pot could be worth
      less than was paid in. This uses the same growth rate and charge every year, which real
      pensions do not earn.
    </Notice>,
    <Notice key="state-pension">
      The full new State Pension is {formatGBPPence(STATE_PENSION.fullWeekly)} a week in {TAX_YEAR},
      or {formatGBPPence(STATE_PENSION.fullWeekly * 52)} a year, for people with{' '}
      {STATE_PENSION.qualifyingYearsForFull} qualifying years of National Insurance. What you get
      depends on your own record, and it is not included in your pot. You can{' '}
      <Source href="https://www.gov.uk/check-state-pension">
        check your State Pension forecast
      </Source>{' '}
      on gov.uk.
    </Notice>,
    <Notice key="later">
      If you flexibly access a pension, for example by taking cash from your pension pot, your
      annual allowance for money purchase pensions such as this one can drop to{' '}
      {formatGBP(ANNUAL_ALLOWANCE.moneyPurchase)}, the Money Purchase Annual Allowance. From{' '}
      {PENSIONS_INHERITANCE_TAX.from}, most unused pension funds and death benefits will count
      towards the value of an estate for{' '}
      <Source href="https://www.gov.uk/government/publications/inheritance-tax-unused-pension-funds-and-death-benefits">
        Inheritance Tax
      </Source>
      .
    </Notice>,
  )

  return notices
}
