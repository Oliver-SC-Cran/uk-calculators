import { useMemo, useState, useSyncExternalStore } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { DateField, NumberField, Steps } from '../components/Fields'
import LineChart from '../components/LineChart'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import MortgageOverpaymentGuide from '../guides/MortgageOverpaymentGuide'
import { monthAfter } from '../lib/dates'
import { MORTGAGE } from '../lib/rates/mortgage'
import { formatGBP, formatMonthYear, percent, yearsAndMonths } from '../lib/format'
import { calculateMortgageOverpayment } from '../lib/mortgage'

// Today as 'YYYY-MM-DD', in the visitor's own time zone.
function today() {
  const now = new Date()
  const pad = (number) => String(number).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// For useSyncExternalStore: today's date does not need watching while the page is open.
const neverChanges = () => () => {}

// [3, 4, 5] becomes "years 3 to 5", [2] "year 2" and [2, 4] "years 2 and 4".
function whichYears(list) {
  if (list.length === 1) return `year ${list[0]}`
  const inARow = list.every((year, index) => index === 0 || year === list[index - 1] + 1)
  if (inARow) return `years ${list[0]} to ${list[list.length - 1]}`
  return `years ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

// The points for the chart: what is owed at the start, after a lump sum, and
// at the end of each year until it is paid off.
function balanceLines(result, balance) {
  const without = [[0, balance]]
  const overpaying = [[0, balance]]
  for (const row of result.years) {
    without.push([row.endMonth / 12, row.standardBalance])
    if (row.startBalance <= 0) continue
    if (row.year * 12 - 11 === result.lumpSumMonth && result.lumpSumPaid > 0) {
      overpaying.push([row.year - 1, row.startBalance - result.lumpSumPaid])
    }
    overpaying.push([Math.min(row.endMonth, result.newTermMonths) / 12, row.balance])
  }
  return { without, overpaying }
}

export default function MortgageOverpaymentCalculator() {
  const balance = useNumberField('200000', { label: 'What you still owe', min: 1 })
  const rate = useNumberField('4.5', { label: 'Your interest rate', max: 100 })
  const years = useNumberField('25', { label: 'The years left on your mortgage', min: 1, max: 50 })
  const overpayment = useNumberField('200', {
    label: 'The extra you pay each month',
    optional: true,
  })
  const lumpSum = useNumberField('', { label: 'A one-off lump sum', optional: true })
  const lumpSumYear = useNumberField('1', {
    label: 'The year you pay it',
    name: 'the year you pay the lump sum',
    min: 1,
    max: 50,
    whole: true,
  })
  const limit = useNumberField(String(MORTGAGE.typicalOverpaymentLimit * 100), {
    label: "Your lender's yearly overpayment limit",
    name: 'the yearly overpayment limit',
    max: 100,
    optional: true,
  })
  const dealYears = useNumberField('5', {
    label: 'Years left on your fixed or discounted deal',
    name: 'the years left on your deal',
    max: 50,
    optional: true,
  })

  // The date can only be read in the browser. The page is built with no date,
  // and React fills in today once it has loaded. A date the visitor picks
  // takes over from then on.
  const todayInBrowser = useSyncExternalStore(neverChanges, today, () => '')
  const [chosenDate, setStartDate] = useState(null)
  const startDate = chosenDate ?? todayInBrowser

  const hasLumpSum = lumpSum.valid && lumpSum.value > 0
  const hasLimit = limit.valid && !limit.isBlank

  const result = useMemo(
    () =>
      calculateMortgageOverpayment({
        balance: balance.value,
        annualRatePercent: rate.value,
        remainingYears: years.value,
        monthlyOverpayment: overpayment.value,
        lumpSum: hasLumpSum ? lumpSum.value : 0,
        lumpSumYear: lumpSumYear.value,
        overpaymentLimit: hasLimit ? limit.value / 100 : null,
        overpaymentLimitYears: dealYears.isBlank ? null : dealYears.value,
      }),
    [
      balance.value,
      rate.value,
      years.value,
      overpayment.value,
      hasLumpSum,
      lumpSum.value,
      lumpSumYear.value,
      hasLimit,
      limit.value,
      dealYears.isBlank,
      dealYears.value,
    ],
  )

  // The sums can still fail on figures that pass each check, such as a very
  // high rate over a very long term.
  const problem =
    problemWith(
      balance,
      rate,
      years,
      overpayment,
      lumpSum,
      ...(hasLumpSum ? [lumpSumYear] : []),
      limit,
      dealYears,
    ) ?? (result ? null : 'These figures cannot be worked out. Check the rate and the years left.')

  const ends = (months) =>
    startDate ? formatMonthYear(monthAfter(startDate, months)) : `In ${yearsAndMonths(months)}`
  const overpays = result && (result.monthsSaved > 0 || result.lumpSumPaid > 0)
  const lines = result && balanceLines(result, balance.value)

  // For the chart summary: what is owed part way through, with and without.
  const checkYear = result && result.newTermMonths >= 60 ? 5 : 1
  const checkRow = result && result.years[checkYear - 1]

  // The allowance table shows the years the limit applies, up to five if no deal length is given.
  const allowanceRows =
    result && hasLimit
      ? result.years.filter(
          (row) => row.startBalance > 0 && row.year <= (dealYears.isBlank ? 5 : dealYears.value),
        )
      : []
  const over = result ? result.yearsOverAllowance : []
  const firstOver = over.length > 0 && result.years[over[0] - 1]

  return (
    <CalculatorPage
      title="Mortgage overpayment and early repayment calculator"
      meta="Works from the figures you enter"
      inputs={
        <>
          <Steps>
            <NumberField
              id="balance"
              hint="Your outstanding mortgage balance."
              before="£"
              field={balance}
            />
            <NumberField
              id="rate"
              hint="The yearly rate you pay now."
              after="%"
              decimal
              size="short"
              field={rate}
            />
            <NumberField
              id="years"
              hint="Part years are fine, such as 12.5."
              decimal
              size="short"
              field={years}
            />
            <NumberField
              id="overpayment"
              hint="On top of your normal monthly payment."
              before="£"
              optional
              field={overpayment}
            />
            <NumberField
              id="lump-sum"
              hint="Paid once, as well as any monthly overpayment. Leave it blank if you are not paying one."
              before="£"
              optional
              field={lumpSum}
            />
            {hasLumpSum && (
              <NumberField
                id="lump-sum-year"
                hint="Year 1 means straight away, year 2 means a year from the start date, and so on."
                size="short"
                field={lumpSumYear}
              />
            )}
            <DateField
              id="start-date"
              label="Start date"
              hint="Usually today. Your first payment is a month after this."
              optional
              value={startDate}
              onChange={setStartDate}
            />
            <NumberField
              id="limit"
              hint="A share of what you owe at the start of each year. Many lenders allow 10%. Leave it blank to skip the check."
              after="%"
              decimal
              size="short"
              optional
              field={limit}
            />
            <NumberField
              id="deal-years"
              hint="Limits and early repayment charges usually only apply during a deal. Leave it blank to check every year."
              decimal
              size="short"
              optional
              field={dealYears}
            />
          </Steps>

          <Notice>
            This assumes your interest rate stays the same for the rest of the term, and that your
            monthly payment stays the same, so overpaying makes your mortgage end sooner. Most
            mortgages have a fixed period and then a rate that can change. It is for a repayment
            mortgage, not interest-only.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label="Interest you could save"
            figure={result && formatGBP(result.interestSaved)}
            detail={
              result &&
              (result.monthsSaved > 0 ? (
                <>and your mortgage would be paid off {yearsAndMonths(result.monthsSaved)} sooner</>
              ) : (
                <>over the rest of your mortgage</>
              ))
            }
            prompt={problem}
            link={{ to: '/stamp-duty-calculator', text: 'Buying a home? Work out the stamp duty' }}
          >
            {result && (
              <table className="result-table">
                <tbody>
                  <tr>
                    <th scope="row">Normal monthly payment</th>
                    <td>{formatGBP(result.standardPayment)}</td>
                  </tr>
                  {result.newPayment > result.standardPayment && (
                    <tr>
                      <th scope="row">With your monthly overpayment</th>
                      <td>{formatGBP(result.newPayment)}</td>
                    </tr>
                  )}
                  {result.lumpSumPaid > 0 && (
                    <tr>
                      <th scope="row">Lump sum in year {lumpSumYear.value}</th>
                      <td>{formatGBP(result.lumpSumPaid)}</td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row">Paid off</th>
                    <td>{ends(result.newTermMonths)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Without overpaying</th>
                    <td>{ends(result.originalTermMonths)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </ResultPanel>

          {!problem && firstOver && (
            <Notice warning>
              Your overpayments would be over your lender's limit in {whichYears(over)}. In year{' '}
              {firstOver.year} you would overpay {formatGBP(firstOver.overpaid)}, and the limit is{' '}
              {formatGBP(firstOver.allowance)}, which is {percent(limit.value / 100)} of the{' '}
              {formatGBP(firstOver.startBalance)} you would owe at the start of that year. You could
              be charged an early repayment charge, so check your mortgage offer.
            </Notice>
          )}

          {!problem && result.lumpSumNotAllUsed && (
            <Notice>
              {result.lumpSumPaid > 0 ? (
                <>
                  Only {formatGBP(result.lumpSumPaid)} of the lump sum is needed to pay off what is
                  left.
                </>
              ) : (
                <>
                  Your mortgage would be paid off before year {lumpSumYear.value}, so the lump sum
                  is not needed.
                </>
              )}
            </Notice>
          )}
        </>
      }
      breakdown={
        !problem && (
          <>
            <div className="breakdown__tables">
              <LineChart
                id="balance-chart"
                title="What you owe over time"
                description={
                  overpays
                    ? `A line chart of your mortgage balance by year. With overpayments it reaches £0 after ${yearsAndMonths(result.newTermMonths)}. Without, it takes ${yearsAndMonths(result.originalTermMonths)}.`
                    : `A line chart of your mortgage balance by year. It reaches £0 after ${yearsAndMonths(result.originalTermMonths)}.`
                }
                xLabel="Years from the start date"
                yLabel="What you owe"
                series={
                  overpays
                    ? [
                        { name: 'Without overpaying', points: lines.without, variant: 'compare' },
                        {
                          name: 'With your overpayments',
                          points: lines.overpaying,
                          variant: 'main',
                        },
                      ]
                    : [{ name: 'Your balance', points: lines.without, variant: 'main' }]
                }
              >
                {overpays ? (
                  <>
                    With your overpayments the balance reaches £0 after{' '}
                    {yearsAndMonths(result.newTermMonths)}, against{' '}
                    {yearsAndMonths(result.originalTermMonths)} without.
                    {checkRow && checkRow.balance > 0 && (
                      <>
                        {' '}
                        After {checkYear === 1 ? '1 year' : `${checkYear} years`} you would owe{' '}
                        {formatGBP(checkRow.balance)} in place of{' '}
                        {formatGBP(checkRow.standardBalance)}.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Without overpaying, the balance falls to £0 over{' '}
                    {yearsAndMonths(result.originalTermMonths)}. It falls slowly at first, because
                    more of each payment goes on interest while the balance is high.
                  </>
                )}
              </LineChart>

              {allowanceRows.length > 0 && (
                <table className="result-table">
                  <caption>Your overpayment allowance</caption>
                  <thead>
                    <tr>
                      <td></td>
                      <th scope="col">Limit</th>
                      <th scope="col">You overpay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowanceRows.map((row) => (
                      <tr key={row.year}>
                        <th scope="row">Year {row.year}</th>
                        <td>{formatGBP(row.allowance)}</td>
                        <td>{formatGBP(row.overpaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {hasLimit && (
              <p className="breakdown__note">
                The most you can overpay in year 1 without a charge is{' '}
                {formatGBP(result.firstYearAllowance)}, or about{' '}
                {formatGBP(result.firstYearAllowance / 12)} a month. Here the limit is{' '}
                {percent(limit.value / 100)} of what you owe at the start of each year, so it falls
                as the balance falls. Lenders work it out in different ways, so check your mortgage
                offer.
              </p>
            )}

            <details>
              <summary>Balance at the end of each year</summary>
              <table className="result-table">
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Without overpaying</th>
                    <th scope="col">With your overpayments</th>
                  </tr>
                </thead>
                <tbody>
                  {result.years.map((row) => (
                    <tr key={row.year}>
                      <th scope="row">{row.year}</th>
                      <td>{formatGBP(row.standardBalance)}</td>
                      <td>{formatGBP(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )
      }
      guide={<MortgageOverpaymentGuide />}
      guides={['/guides/overpay-mortgage-or-save']}
      related={['/stamp-duty-calculator', '/isa-calculator', '/lifetime-isa-calculator']}
    />
  )
}
