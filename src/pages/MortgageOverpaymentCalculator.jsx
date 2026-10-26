import { useMemo, useSyncExternalStore } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { Chips, DateField, NumberField, RadioField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputSection, MoreOptions } from '../components/InputCard'
import LineChart from '../components/LineChart'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import {
  choiceInput,
  dateInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import MortgageOverpaymentGuide from '../guides/MortgageOverpaymentGuide'
import { monthAfter, paymentsByEndOf } from '../lib/dates'
import { MORTGAGE } from '../lib/rates/mortgage'
import { formatAmount, formatGBP, formatMonthYear, percent, yearsAndMonths } from '../lib/format'
import {
  calculateMortgageOverpayment,
  compareOffsetAndOverpaying,
  overpaymentToBeMortgageFree,
} from '../lib/mortgage'
import { MONEY, PERCENTAGE } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-26'

// What the calculator can work out, picked at the top of the inputs.
const MODES = [
  ['overpay', "I'll overpay a set amount", 'See what it saves'],
  ['target', 'I want to be mortgage-free by a set date', 'See what to overpay each month'],
]

// Quick picks for the monthly overpayment. They are common amounts, not advice.
const OVERPAYMENTS = [100, 200, 300, 500].map((value) => [value, formatGBP(value)])

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

// "4 years 2 months" for the result strip, where each number stays on the
// same line as its unit (a non-breaking space), so a narrow strip breaks it
// into two lines at most.
const timeSaved = (months) =>
  yearsAndMonths(months)
    .replace(' and ', ' ')
    .replace(/(\d+) /g, '$1 ')

// What the "Your deal and overpayment limit" row says while it is closed.
function limitSummary(limit, dealYears) {
  if (!limit.valid || !dealYears.valid) return 'Check these figures'
  if (limit.isBlank) return 'No limit check'
  const years = dealYears.isBlank ? 'every year' : `for ${formatAmount(dealYears.value, 'years')}`
  return `${percent(limit.value / 100)} a year, ${years}`
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
  // The date can only be read in the browser. The page is built with no date,
  // and React fills in today once it has loaded. A date the visitor picks
  // takes over from then on.
  const todayInBrowser = useSyncExternalStore(neverChanges, today, () => '')

  const state = useCalculatorState(
    {
      mode: choiceInput(
        'overpay',
        MODES.map(([value]) => value),
      ),
      balance: numberInput('200,000', {
        label: 'What you still owe',
        ...MONEY,
        min: 1,
        grouped: true,
      }),
      rate: numberInput('4.5', { label: 'Your interest rate', ...PERCENTAGE }),
      years: numberInput('25', { label: 'The years left on your mortgage', min: 1, max: 50 }),
      overpayment: numberInput('200', {
        label: 'The extra you pay each month',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      lumpSum: numberInput('', {
        label: 'A one-off lump sum',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      lumpSumYear: numberInput('1', {
        label: 'The year you pay it',
        name: 'the year you pay the lump sum',
        min: 1,
        max: 50,
        whole: true,
      }),
      // null until the visitor picks a date. Until then the start date is today.
      startDate: dateInput(null, { label: 'Start date', optional: true }),
      limit: numberInput(String(MORTGAGE.typicalOverpaymentLimit * 100), {
        label: "Your lender's yearly overpayment limit",
        name: 'the yearly overpayment limit',
        ...PERCENTAGE,
        optional: true,
      }),
      dealYears: numberInput('5', {
        label: 'Years left on your fixed or discounted deal',
        name: 'the years left on your deal',
        max: 50,
        optional: true,
      }),
      offset: numberInput('', {
        label: 'Savings in an offset account',
        name: 'your offset savings',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      targetType: choiceInput('years', ['years', 'year']),
      targetYears: numberInput('15', {
        label: 'Mortgage-free in',
        name: 'how many years until you want to be mortgage-free',
        min: 1,
        max: 50,
      }),
      targetYear: numberInput('', {
        label: 'Mortgage-free by the end of',
        name: 'the year you want to be mortgage-free by',
        min: 2000,
        max: 2100,
        whole: true,
      }),
    },
    { sharedLinks: true },
  )
  const { balance, rate, years, overpayment, lumpSum, lumpSumYear, limit, dealYears } = state
  const { offset, targetYears, targetYear } = state
  const isTarget = state.mode.value === 'target'
  const targetType = state.targetType.value
  const startDate = state.startDate.text ?? todayInBrowser

  const hasLumpSum = lumpSum.valid && lumpSum.value > 0
  const hasLimit = limit.valid && !limit.isBlank
  const hasOffset = offset.valid && offset.value > 0

  // How many monthly payments there are until the target. A target year
  // counts every payment up to the end of December that year.
  let targetMonths = null
  if (isTarget && targetType === 'years' && targetYears.valid) {
    targetMonths = Math.round(targetYears.value * 12)
  }
  if (isTarget && targetType === 'year' && targetYear.valid && startDate) {
    targetMonths = paymentsByEndOf(startDate, targetYear.value)
  }

  // Everything but the monthly overpayment, which the target mode works out.
  const settings = useMemo(
    () => ({
      balance: balance.value,
      annualRatePercent: rate.value,
      remainingYears: years.value,
      lumpSum: hasLumpSum ? lumpSum.value : 0,
      lumpSumYear: lumpSumYear.value,
      offsetSavings: hasOffset ? offset.value : 0,
      overpaymentLimit: hasLimit ? limit.value / 100 : null,
      overpaymentLimitYears: dealYears.isBlank ? null : dealYears.value,
    }),
    [
      balance.value,
      rate.value,
      years.value,
      hasLumpSum,
      lumpSum.value,
      lumpSumYear.value,
      hasOffset,
      offset.value,
      hasLimit,
      limit.value,
      dealYears.isBlank,
      dealYears.value,
    ],
  )

  const monthly = overpayment.value
  const overpaid = useMemo(
    () =>
      isTarget ? null : calculateMortgageOverpayment({ ...settings, monthlyOverpayment: monthly }),
    [isTarget, settings, monthly],
  )
  const target = useMemo(
    () =>
      isTarget && targetMonths >= 1
        ? overpaymentToBeMortgageFree({ ...settings, targetMonths })
        : null,
    [isTarget, settings, targetMonths],
  )
  // With offset savings as well, what each saves on its own.
  const compared = useMemo(
    () =>
      !isTarget && hasOffset && (monthly > 0 || hasLumpSum)
        ? compareOffsetAndOverpaying({ ...settings, monthlyOverpayment: monthly })
        : null,
    [isTarget, hasOffset, monthly, hasLumpSum, settings],
  )
  // In the target mode, what would be needed without the offset savings.
  const targetWithoutOffset = useMemo(
    () =>
      target && hasOffset
        ? overpaymentToBeMortgageFree({ ...settings, offsetSavings: 0, targetMonths })
        : null,
    [target, hasOffset, settings, targetMonths],
  )
  const result = isTarget ? target?.result : overpaid

  // Only the steps for the mode chosen are checked. The year of the lump sum
  // only matters when there is one. A target year needs a start date, and
  // must not be over before the first payment. The sums can still fail on
  // figures that pass each check, such as a very high rate over a very long term.
  const targetField = targetType === 'years' ? targetYears : targetYear
  let targetProblem = null
  if (isTarget && targetType === 'year' && targetYear.valid && !startDate) {
    targetProblem = 'Enter a start date, or set your target as a number of years.'
  } else if (isTarget && targetType === 'year' && targetMonths !== null && targetMonths < 1) {
    const firstPayment = monthAfter(startDate, 1)
    targetProblem = `Your first payment would be in ${formatMonthYear(firstPayment)}, so enter ${firstPayment.slice(0, 4)} or later.`
  }
  const problem =
    problemWith(
      balance,
      rate,
      years,
      ...(isTarget ? [targetField] : [overpayment]),
      lumpSum,
      ...(hasLumpSum ? [lumpSumYear] : []),
      offset,
      limit,
      dealYears,
    ) ??
    targetProblem ??
    (result ? null : 'These figures cannot be worked out. Check the rate and the years left.')

  const ends = (months) =>
    startDate ? formatMonthYear(monthAfter(startDate, months)) : `In ${yearsAndMonths(months)}`
  // The same, in a sentence.
  const endsIn = (months) =>
    startDate
      ? `in ${formatMonthYear(monthAfter(startDate, months))}`
      : `in ${yearsAndMonths(months)}`
  const changes = result && (result.monthsSaved > 0 || result.lumpSumPaid > 0 || hasOffset)
  const lines = result && balanceLines(result, balance.value)
  // The tables of without and with. In the target mode there is nothing to
  // compare when the mortgage meets the target with no changes at all.
  const showColumns = !isTarget || changes

  // What the schedule with the changes in it is called, in the table and the chart.
  const overpaying = monthly > 0 || hasLumpSum
  let withName = 'With your overpayments'
  if (isTarget && target) {
    if (target.monthlyOverpayment > 0) {
      withName = `With ${formatGBP(target.monthlyOverpayment)} a month extra`
    } else {
      withName = hasOffset ? 'With your offset savings' : 'With your lump sum'
    }
  } else if (hasOffset) {
    withName = overpaying ? 'With offset and overpayments' : 'With your offset savings'
  }

  // The chart's description, which has always said "With overpayments" on its own.
  const chartName = withName === 'With your overpayments' ? 'With overpayments' : withName

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

  // In the target mode, the figure and what it is for.
  const targetLabel =
    target &&
    (startDate
      ? `To be mortgage-free by ${formatMonthYear(monthAfter(startDate, target.targetMonths))}`
      : `To be mortgage-free in ${yearsAndMonths(target.targetMonths)}`)

  // Warnings about what was entered, and notes on the result.
  const notices = []
  if (!problem && firstOver) {
    notices.push(
      <Notice key="over-limit" warning>
        Your overpayments would be over your lender's limit in {whichYears(over)}. In year{' '}
        {firstOver.year} you would overpay {formatGBP(firstOver.overpaid)}, and the limit is{' '}
        {formatGBP(firstOver.allowance)}, which is {percent(limit.value / 100)} of the{' '}
        {formatGBP(firstOver.startBalance)} you would owe at the start of that year. You could be
        charged an early repayment charge, so check your mortgage offer.
      </Notice>,
    )
  }
  if (!problem && result.lumpSumNotAllUsed) {
    notices.push(
      <Notice key="lump-sum">
        {result.lumpSumPaid > 0 ? (
          <>
            Only {formatGBP(result.lumpSumPaid)} of the lump sum is needed to pay off what is left.
          </>
        ) : (
          <>
            Your mortgage would be paid off before year {lumpSumYear.value}, so the lump sum is not
            needed.
          </>
        )}
      </Notice>,
    )
  }

  // Switching to a target year fills it in from the number of years, if it is blank.
  const changeTargetType = (next) => {
    if (next === 'year' && targetYear.isBlank && targetYears.valid && startDate) {
      targetYear.setText(monthAfter(startDate, Math.round(targetYears.value * 12)).slice(0, 4))
    }
    state.targetType.set(next)
  }

  const lumpSumFields = (hint) => (
    <FieldRow>
      <NumberField id="lump-sum" hint={hint} before="£" decimal optional field={lumpSum} />
      <NumberField
        id="lump-sum-year"
        hint="Year 1 means straight away, year 2 a year after the start date."
        field={lumpSumYear}
      />
    </FieldRow>
  )

  const figures = []
  if (result && isTarget) {
    figures.push({ value: formatGBP(target.monthlyOverpayment), per: 'extra each month' })
    if (result.interestSaved >= 0.5) {
      figures.push({ value: formatGBP(result.interestSaved), per: 'interest saved' })
    }
  } else if (result) {
    figures.push({ value: formatGBP(result.interestSaved), per: 'interest saved' })
    if (result.monthsSaved > 0) {
      figures.push({
        value: timeSaved(result.monthsSaved),
        per: (
          <>
            sooner <span className="keep-together">mortgage-free</span>
          </>
        ),
      })
    }
  }

  return (
    <CalculatorLayout
      title="Mortgage overpayment and early repayment calculator"
      lede="See how much interest overpaying or an offset account could save and when you could be mortgage-free, or what to overpay each month to be mortgage-free by a set date. It works from the figures you enter."
      updated={LAST_UPDATED}
      checked={false}
      inputs={
        <>
          <InputCard>
            <InputSection title="What you want to work out">
              <RadioField
                id="mode"
                label="What you want to work out"
                hideLabel
                value={state.mode.value}
                onChange={state.mode.set}
                options={MODES}
              />
            </InputSection>

            <InputSection title="Your mortgage">
              <FieldRow>
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
                  field={rate}
                />
                <NumberField
                  id="years"
                  hint="Part years are fine, such as 12.5."
                  decimal
                  field={years}
                />
                <DateField
                  id="start-date"
                  label="Start date"
                  hint="Usually today. Your first payment is a month after this."
                  optional
                  value={startDate}
                  onChange={state.startDate.setText}
                />
              </FieldRow>
            </InputSection>

            {isTarget ? (
              <InputSection title="Your target">
                <FieldRow>
                  <SelectField
                    id="target-type"
                    label="Set your target as"
                    value={targetType}
                    onChange={changeTargetType}
                  >
                    <option value="years">A number of years</option>
                    <option value="year">A year</option>
                  </SelectField>
                  {targetType === 'years' ? (
                    <NumberField
                      id="target-years"
                      hint="From the start date. Part years are fine."
                      after="years"
                      decimal
                      field={targetYears}
                    />
                  ) : (
                    <NumberField
                      id="target-year"
                      hint="Your last payment falls in this year or before."
                      field={targetYear}
                    />
                  )}
                </FieldRow>
                {lumpSumFields('Paid once, as well as the monthly overpayment worked out here.')}
              </InputSection>
            ) : (
              <InputSection title="What you'll overpay">
                <FieldRow>
                  <NumberField
                    id="overpayment"
                    hint="On top of your normal monthly payment."
                    before="£"
                    decimal
                    optional
                    size="full"
                    field={overpayment}
                    below={
                      <Chips
                        label="Common monthly amounts"
                        options={OVERPAYMENTS}
                        current={overpayment.text}
                        onPick={overpayment.setText}
                      />
                    }
                  />
                </FieldRow>
                {lumpSumFields('Paid once, as well as any monthly overpayment.')}
              </InputSection>
            )}

            <InputSection title="Offset mortgage">
              <FieldRow>
                <NumberField
                  id="offset"
                  hint="Savings linked to your mortgage, so you pay no interest on that much of what you owe. Leave it blank if you do not have an offset mortgage."
                  before="£"
                  decimal
                  optional
                  size="full"
                  field={offset}
                />
              </FieldRow>
            </InputSection>

            <MoreOptions
              title="Your deal and overpayment limit"
              summary={limitSummary(limit, dealYears)}
            >
              <FieldRow>
                <NumberField
                  id="deal-years"
                  hint="Limits and early repayment charges usually only apply during a deal. Leave it blank to check every year."
                  decimal
                  optional
                  field={dealYears}
                />
                <NumberField
                  id="limit"
                  hint="A share of what you owe at the start of each year. Many lenders allow 10%. Leave it blank to skip the check."
                  after="%"
                  decimal
                  optional
                  field={limit}
                />
              </FieldRow>
            </MoreOptions>
          </InputCard>

          <Notice>
            This assumes your interest rate stays the same for the rest of the term, and that your
            monthly payment stays the same, so overpaying makes your mortgage end sooner. Most
            mortgages have a fixed period and then a rate that can change. It is for a repayment
            mortgage, not interest-only.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label={isTarget ? targetLabel : withName}
          figures={figures}
          prompt={problem}
          shareLink={state.shareLink}
        >
          {result && (
            <>
              {!isTarget && !changes && (
                <p className="result-card__line">
                  Enter a monthly overpayment, a lump sum or offset savings to see what it could
                  save.
                </p>
              )}
              {isTarget && (
                <p className="result-card__line">
                  {target.onTrack ? (
                    <>
                      Your mortgage would be paid off {endsIn(result.newTermMonths)} without paying
                      more each month, so you would meet your target.
                    </>
                  ) : (
                    <>
                      Paying {formatGBP(target.monthlyOverpayment)} a month on top of your normal
                      payment clears your mortgage {endsIn(result.newTermMonths)}. That is the
                      smallest whole-pound amount that meets your target.
                    </>
                  )}
                  {!target.onTrack &&
                    hasLimit &&
                    (over.length === 0 ? (
                      <>
                        {' '}
                        It stays within your lender's {percent(limit.value / 100)} yearly
                        overpayment limit
                        {dealYears.isBlank ? ' in every year' : ' for the rest of your deal'}.
                      </>
                    ) : (
                      <>
                        {' '}
                        It goes over your lender's {percent(limit.value / 100)} yearly overpayment
                        limit in {whichYears(over)}.
                      </>
                    ))}
                </p>
              )}
              {showColumns && (
                <div className="table-scroll">
                  <table className="result-table result-table--columns result-table--wrap">
                    <thead>
                      <tr>
                        <td></td>
                        <th scope="col">Without overpaying</th>
                        <th scope="col">{withName}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Monthly payment</th>
                        <td>{formatGBP(result.standardPayment)}</td>
                        <td>{formatGBP(result.newPayment)}</td>
                      </tr>
                      {result.lumpSumPaid > 0 && (
                        <tr>
                          <th scope="row">Lump sum in year {lumpSumYear.value}</th>
                          <td>None</td>
                          <td>{formatGBP(result.lumpSumPaid)}</td>
                        </tr>
                      )}
                      <tr>
                        <th scope="row">Paid off</th>
                        <td>{ends(result.originalTermMonths)}</td>
                        <td>{ends(result.newTermMonths)}</td>
                      </tr>
                      <tr>
                        <th scope="row">Total interest</th>
                        <td>{formatGBP(result.standardTotalInterest)}</td>
                        <td>{formatGBP(result.newTotalInterest)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {hasOffset && (
                <p className="result-card__line">
                  {result.savingsCoverMonth === 0 ? (
                    <>Your offset savings cover everything you owe, so no interest is charged.</>
                  ) : (
                    <>
                      This assumes your {formatGBP(result.offsetSavings)} of savings stays in the
                      offset account for the whole term and earns no interest. What you owe would be
                      down to that much {endsIn(result.savingsCoverMonth)}, so you could clear the
                      mortgage with your savings then.
                    </>
                  )}
                  {targetWithoutOffset &&
                    targetWithoutOffset.monthlyOverpayment !== target.monthlyOverpayment && (
                      <>
                        {' '}
                        Without the offset you would need to pay{' '}
                        {formatGBP(targetWithoutOffset.monthlyOverpayment)} a month extra.
                      </>
                    )}
                </p>
              )}

              {compared && (
                <div className="table-scroll">
                  <table className="result-table result-table--columns result-table--wrap">
                    <caption>What each one saves</caption>
                    <thead>
                      <tr>
                        <td></td>
                        <th scope="col">Interest saved</th>
                        <th scope="col">Sooner mortgage-free</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [`Offsetting ${formatGBP(offset.value)}`, compared.offsetOnly],
                        ['Your overpayments', compared.overpayingOnly],
                        ['Both together', compared.both],
                      ].map(([name, each]) => (
                        <tr key={name}>
                          <th scope="row">{name}</th>
                          <td>{formatGBP(each.interestSaved)}</td>
                          <td>{each.monthsSaved > 0 ? timeSaved(each.monthsSaved) : 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <LineChart
                id="balance-chart"
                title="What you owe over time"
                description={
                  changes
                    ? `A line chart of your mortgage balance by year. ${chartName} it reaches £0 after ${yearsAndMonths(result.newTermMonths)}. Without, it takes ${yearsAndMonths(result.originalTermMonths)}.`
                    : `A line chart of your mortgage balance by year. It reaches £0 after ${yearsAndMonths(result.originalTermMonths)}.`
                }
                xLabel="Years from the start date"
                yLabel="What you owe"
                series={
                  changes
                    ? [
                        { name: 'Without overpaying', points: lines.without, variant: 'compare' },
                        { name: withName, points: lines.overpaying, variant: 'main' },
                      ]
                    : [{ name: 'Your balance', points: lines.without, variant: 'main' }]
                }
              >
                {changes ? (
                  <>
                    {withName} the balance reaches £0 after {yearsAndMonths(result.newTermMonths)},
                    against {yearsAndMonths(result.originalTermMonths)} without.
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

              {hasLimit && (
                <p className="result-card__line">
                  The most you can overpay in year 1 without a charge is{' '}
                  {formatGBP(result.firstYearAllowance)}, or about{' '}
                  {formatGBP(result.firstYearAllowance / 12)} a month. Here the limit is{' '}
                  {percent(limit.value / 100)} of what you owe at the start of each year, so it
                  falls as the balance falls. Lenders work it out in different ways, so check your
                  mortgage offer.
                </p>
              )}

              {showColumns && (
                <details className="result-card__more">
                  <summary>Balance at the end of each year</summary>
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th scope="col">Year</th>
                        <th scope="col">Without overpaying</th>
                        <th scope="col">{withName}</th>
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
              )}
            </>
          )}
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : isTarget ? target.working : result.working}
      guide={<MortgageOverpaymentGuide />}
      guides={['/guides/overpay-mortgage-or-save']}
      related={['/stamp-duty-calculator', '/isa-calculator', '/lifetime-isa-calculator']}
    />
  )
}
