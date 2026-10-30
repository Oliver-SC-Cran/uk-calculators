import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, Chips, NumberField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputSection, MoreOptions } from '../components/InputCard'
import LineChart from '../components/LineChart'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import Source from '../components/Source'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import CompoundInterestGuide from '../guides/CompoundInterestGuide'
import { calculateCompoundInterest } from '../lib/compoundInterest'
import { formatAmount, formatDeduction, formatGBP, percent, yearsAndMonths } from '../lib/format'
import { GROWTH } from '../lib/rates/growth'
import { MONEY } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-30'

const MAX_AMOUNT = 10_000_000
const MAX_YEARS = 100

// A share as the text typed in a percentage field: 0.05 becomes '5'.
const percentText = (share) => String(Number((share * 100).toFixed(4)))
// Quick picks: the FCA's projection rates for ISAs and pensions, and the
// inflation target. They are official figures, not forecasts.
const RATE_PICKS = Object.values(GROWTH.fcaProjectionRates).map((share) => [
  percentText(share),
  percent(share),
])
const INFLATION_PICKS = [[percentText(GROWTH.inflationTarget), percent(GROWTH.inflationTarget)]]

const yearsText = (years) => `${years} ${years === 1 ? 'year' : 'years'}`

// What the "More options" row says while it is closed.
function optionsSummary(compounding, charge, inflation) {
  const parts = [compounding === 'yearly' ? 'Interest added yearly' : 'Interest added monthly']
  parts.push(
    charge.valid && charge.value > 0 ? `${percent(charge.value / 100)} charge` : 'no charge',
  )
  if (inflation.valid && inflation.value > 0)
    parts.push(`${percent(inflation.value / 100)} inflation`)
  return parts.join(', ')
}

export default function CompoundInterestCalculator() {
  const state = useCalculatorState(
    {
      start: numberInput('5,000', {
        label: 'Starting amount',
        name: 'a starting amount',
        ...MONEY,
        max: MAX_AMOUNT,
        optional: true,
        grouped: true,
      }),
      payment: numberInput('100', {
        label: 'Regular payment',
        name: 'a regular payment',
        ...MONEY,
        max: MAX_AMOUNT,
        optional: true,
        grouped: true,
      }),
      paymentFrequency: choiceInput('monthly', ['monthly', 'yearly']),
      rate: numberInput(percentText(GROWTH.fcaProjectionRates.intermediate), {
        label: 'Growth or interest rate a year',
        name: 'a growth or interest rate',
        min: 0,
        max: 20,
      }),
      years: numberInput('20', {
        label: 'Years',
        name: 'how many years',
        min: 1,
        max: MAX_YEARS,
        whole: true,
      }),
      compounding: choiceInput('monthly', ['monthly', 'yearly']),
      charge: numberInput('', {
        label: 'Yearly charge',
        name: 'the yearly charge',
        min: 0,
        max: 10,
        optional: true,
      }),
      inflation: numberInput('', {
        label: 'Inflation a year',
        name: 'the inflation rate',
        min: 0,
        max: 20,
        optional: true,
      }),
      fall: checkboxInput(false),
      fallPercent: numberInput('20', {
        label: 'How much the market falls',
        name: 'how much the market falls',
        min: 0,
        max: 100,
      }),
      fallYear: numberInput('1', (fields) => ({
        label: 'The year it falls',
        name: 'the year the market falls',
        min: 1,
        max: fields.years.valid ? fields.years.value : MAX_YEARS,
        whole: true,
      })),
    },
    { sharedLinks: true },
  )
  const { start, payment, rate, years, charge, inflation, fallPercent, fallYear } = state
  const paymentFrequency = state.paymentFrequency.value
  const compounding = state.compounding.value
  const showFall = state.fall.value

  const problem =
    problemWith(
      start,
      payment,
      rate,
      years,
      charge,
      inflation,
      ...(showFall ? [fallPercent, fallYear] : []),
    ) ??
    (start.value > 0 || payment.value > 0 ? null : 'Enter a starting amount or a regular payment.')

  const result = useMemo(
    () =>
      calculateCompoundInterest({
        startAmount: start.value,
        payment: payment.value,
        paymentFrequency,
        ratePercent: rate.value,
        compounding,
        chargePercent: charge.value,
        inflationPercent: inflation.value,
        years: years.value,
        fall: showFall ? { percent: fallPercent.value, year: fallYear.value } : null,
      }),
    [
      start.value,
      payment.value,
      paymentFrequency,
      rate.value,
      compounding,
      charge.value,
      inflation.value,
      years.value,
      showFall,
      fallPercent.value,
      fallYear.value,
    ],
  )
  const { fall } = result
  const fellBy = fall && fall.lost > 0
  const hasCharge = result.charges > 0
  const hasInflation = result.realValue !== null

  // The chart: the pot against what was paid in, or with and without the fall.
  const potLine = [[0, result.startAmount], ...result.rows.map((row) => [row.year, row.value])]
  const series = fellBy
    ? [
        {
          name: 'Without the fall',
          points: [
            [0, result.startAmount],
            ...result.rows.map((r) => [r.year, r.valueWithoutFall]),
          ],
          variant: 'compare',
        },
        { name: 'With the fall', points: potLine, variant: 'main' },
      ]
    : [
        {
          name: 'Paid in',
          points: [[0, result.startAmount], ...result.rows.map((row) => [row.year, row.paidIn])],
          variant: 'compare',
        },
        { name: 'Your pot', points: potLine, variant: 'main' },
      ]

  const rateText = percent(result.ratePercent / 100)
  const backIn = (months) =>
    months === null ? null : months === 0 ? 'straight away' : `after ${yearsAndMonths(months)}`

  const notices = problem
    ? null
    : [
        <Notice key="growth">
          Growth is not guaranteed. Investments can go down as well as up, so you could get back
          less than you put in. This uses the same rate every year, which real savings and
          investments do not earn.
        </Notice>,
        <Notice key="tax">
          Interest, income and gains in an ISA are not taxed, and nor are the investment income and
          gains in a pension, though you{' '}
          <Source href="https://www.gov.uk/tax-on-your-private-pension">
            pay tax when you take money out of a pension
          </Source>
          . Interest on savings outside an ISA may be taxed: the{' '}
          <Link to="/savings-interest-tax-calculator">savings interest tax calculator</Link> works
          it out. Shares and funds held outside an ISA or a pension may have{' '}
          <Source href="https://www.gov.uk/capital-gains-tax/what-you-pay-it-on">
            Capital Gains Tax
          </Source>{' '}
          to pay when you sell them, and{' '}
          <Source href="https://www.gov.uk/tax-on-dividends">tax on their dividends</Source>.
        </Notice>,
      ]

  return (
    <CalculatorLayout
      title="Compound interest calculator"
      lede="What savings or investments could grow to with compound interest and regular payments, after charges and inflation, and what a market fall would do. It works from the figures you enter."
      updated={LAST_UPDATED}
      checked={false}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your money">
              <FieldRow>
                <NumberField
                  id="start"
                  hint="What you have in the pot now."
                  before="£"
                  decimal
                  optional
                  size="full"
                  field={start}
                />
              </FieldRow>
              <FieldRow tight>
                <NumberField
                  id="payment"
                  hint="Paid in at the start of each month or year."
                  before="£"
                  decimal
                  optional
                  field={payment}
                />
                <SelectField
                  id="payment-frequency"
                  label="Paid"
                  value={paymentFrequency}
                  onChange={state.paymentFrequency.set}
                >
                  <option value="monthly">Each month</option>
                  <option value="yearly">Each year</option>
                </SelectField>
              </FieldRow>
            </InputSection>

            <InputSection title="Growth">
              <FieldRow>
                <NumberField
                  id="rate"
                  hint="Before charges. The quick picks are the most the FCA lets firms use for their lower, middle and higher projections for ISAs and pensions. They are not a forecast."
                  after="%"
                  decimal
                  field={rate}
                  below={
                    <Chips
                      label="FCA projection rates for ISAs and pensions"
                      options={RATE_PICKS}
                      current={rate.text}
                      onPick={rate.setText}
                    />
                  }
                />
                <NumberField id="years" hint="Whole years, up to 100." field={years} />
              </FieldRow>
            </InputSection>

            <InputSection title="What if the market falls?">
              <CheckboxField
                id="fall"
                label="A market fall"
                checked={showFall}
                onChange={state.fall.set}
              >
                Show what a one-off fall in the market would do to my pot
              </CheckboxField>
              {showFall && (
                <FieldRow>
                  <NumberField
                    id="fall-percent"
                    hint="The share of your whole pot lost in the fall."
                    after="%"
                    decimal
                    field={fallPercent}
                  />
                  <NumberField
                    id="fall-year"
                    hint="At the start of this year, before that year's payments. Year 1 is now."
                    field={fallYear}
                  />
                </FieldRow>
              )}
            </InputSection>

            <MoreOptions
              title="Interest, charges and inflation"
              summary={optionsSummary(compounding, charge, inflation)}
            >
              <FieldRow>
                <SelectField
                  id="compounding"
                  label="How often interest is added"
                  value={compounding}
                  onChange={state.compounding.set}
                  size="full"
                >
                  <option value="monthly">Each month</option>
                  <option value="yearly">Once a year</option>
                </SelectField>
                <NumberField
                  id="charge"
                  hint="Platform or fund charges, as a share of your pot each year."
                  after="%"
                  decimal
                  optional
                  field={charge}
                />
                <NumberField
                  id="inflation"
                  hint="To show your pot in today's money. The Government's inflation target for the Bank of England is 2%."
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
              </FieldRow>
            </MoreOptions>
          </InputCard>

          <Notice>
            Payments go in at the start of each month or year, and the rate and any charge stay the
            same every year. A fall takes a share off the whole pot, and then growth carries on at
            the same rate. It leaves out tax.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label={`Your pot after ${yearsText(result.years)}`}
          figures={[
            { value: formatGBP(result.finalValue), per: 'at the end' },
            { value: formatGBP(result.growth), per: 'growth earned' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <table className="result-table result-table--total">
            <caption>Where your pot comes from</caption>
            <tbody>
              <tr>
                <th scope="row">Starting amount</th>
                <td>{formatGBP(result.startAmount)}</td>
              </tr>
              <tr>
                <th scope="row">Your payments</th>
                <td>{formatGBP(result.totalPayments)}</td>
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
              {fellBy && (
                <tr>
                  <th scope="row">The market fall</th>
                  <td>{formatDeduction(fall.lost)}</td>
                </tr>
              )}
              <tr>
                <th scope="row">Your pot at the end</th>
                <td>{formatGBP(result.finalValue)}</td>
              </tr>
            </tbody>
          </table>

          <p className="result-card__line">
            {compounding === 'monthly' ? (
              <>
                {rateText} a year, added each month, works out at{' '}
                {formatAmount(result.yearlyRate, 'percent')} over a whole year
              </>
            ) : (
              <>
                {rateText} a year, added once a year, works out at{' '}
                {formatAmount(result.yearlyRate, 'percent')} over a whole year
              </>
            )}
            {hasCharge ? (
              <>
                , or {formatAmount(result.yearlyRateAfterCharges, 'percent')} after the{' '}
                {percent(result.chargePercent / 100)} yearly charge.
              </>
            ) : (
              '.'
            )}
            {hasInflation && (
              <>
                {' '}
                At {percent(result.inflationPercent / 100)} inflation a year, your pot at the end
                would buy what {formatGBP(result.realValue)} buys today.
              </>
            )}
          </p>

          {fall && !fellBy && (
            <p className="result-card__line">
              Your pot is empty at the start of year {fall.year}, so the fall takes nothing off it.
            </p>
          )}

          {fellBy && (
            <>
              <table className="result-table result-table--columns">
                <caption>What the fall does</caption>
                <thead>
                  <tr>
                    <td></td>
                    <th scope="col">Without the fall</th>
                    <th scope="col">With the fall</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Your pot at the end</th>
                    <td>{formatGBP(fall.finalWithoutFall)}</td>
                    <td>{formatGBP(result.finalValue)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="result-card__line">
                At the start of year {fall.year} your pot falls by {percent(fall.fraction)}, from{' '}
                {formatGBP(fall.valueBefore)} to {formatGBP(fall.valueAfter)}.{' '}
                {backIn(fall.monthsToGetBack) ? (
                  <>
                    With your payments carrying on, it is back to {formatGBP(fall.valueBefore)}{' '}
                    {backIn(fall.monthsToGetBack)}.
                  </>
                ) : (
                  <>
                    It does not get back to {formatGBP(fall.valueBefore)} within your{' '}
                    {yearsText(result.years)}.
                  </>
                )}{' '}
                {result.paymentsMade > 0 &&
                  (backIn(fall.monthsToGetBackGrowthOnly) ? (
                    <>
                      From growth alone, with no more payments, it would take{' '}
                      {yearsAndMonths(fall.monthsToGetBackGrowthOnly)}.
                    </>
                  ) : (
                    <>
                      From growth alone, with no more payments, it would not get back in that time.
                    </>
                  ))}
              </p>
              <p className="result-card__line">
                At the end your pot is {formatGBP(fall.gap)} smaller than without the fall: the{' '}
                {formatGBP(fall.lost)} lost, grown at the same rate. Payments made after the fall
                grow just as they would have without it.
              </p>
            </>
          )}

          <LineChart
            id="pot-chart"
            title={fellBy ? 'Your pot with and without the fall' : 'Your pot over time'}
            description={
              fellBy
                ? `A line chart of your pot by year, with and without a ${percent(fall.fraction)} fall at the start of year ${fall.year}. Without the fall it reaches ${formatGBP(fall.finalWithoutFall)} after ${yearsText(result.years)}, and with it ${formatGBP(result.finalValue)}.`
                : `A line chart of your pot by year. It reaches ${formatGBP(result.finalValue)} after ${yearsText(result.years)}, against ${formatGBP(result.paidIn)} paid in.`
            }
            xLabel="Years from now"
            yLabel="Your pot"
            series={series}
          >
            {fellBy ? (
              <>
                The fall at the start of year {fall.year} takes {formatGBP(fall.lost)} off your pot.
                After it, both lines grow at the same rate, so the gap between them widens in pounds
                and never closes.
              </>
            ) : (
              <>
                Your pot reaches {formatGBP(result.finalValue)} after {yearsText(result.years)}.{' '}
                {result.finalValue >= result.paidIn ? (
                  <>
                    Of that, {formatGBP(result.paidIn)} is money paid in and{' '}
                    {formatGBP(result.finalValue - result.paidIn)} is growth
                    {hasCharge ? ' after charges' : ''}.
                  </>
                ) : (
                  <>
                    That is {formatGBP(result.paidIn - result.finalValue)} less than the{' '}
                    {formatGBP(result.paidIn)} paid in, because the charges are more than the
                    growth.
                  </>
                )}
              </>
            )}
          </LineChart>

          <details className="result-card__more">
            <summary>Your pot at the end of each year</summary>
            <div className="table-scroll">
              <table className="result-table result-table--columns">
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Paid in so far</th>
                    <th scope="col">Growth that year</th>
                    {hasCharge && <th scope="col">Charges that year</th>}
                    <th scope="col">Your pot</th>
                    {fellBy && <th scope="col">Without the fall</th>}
                    {hasInflation && <th scope="col">In today&apos;s money</th>}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.year}>
                      <th scope="row">{row.year}</th>
                      <td>{formatGBP(row.paidIn)}</td>
                      <td>{formatGBP(row.growth)}</td>
                      {hasCharge && <td>{formatDeduction(row.charges)}</td>}
                      <td>{formatGBP(row.value)}</td>
                      {fellBy && <td>{formatGBP(row.valueWithoutFall)}</td>}
                      {hasInflation && <td>{formatGBP(row.realValue)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </ResultCard>
      }
      notices={notices}
      working={problem ? null : result.working}
      guide={<CompoundInterestGuide />}
      guides={['/guides/overpay-mortgage-or-save']}
      related={['/isa-calculator', '/lifetime-isa-calculator', '/savings-interest-tax-calculator']}
    />
  )
}
