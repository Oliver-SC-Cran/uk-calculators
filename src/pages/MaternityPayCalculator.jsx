import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, DateField, NumberField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import {
  checkboxInput,
  choiceInput,
  dateInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import MaternityPayGuide from '../guides/MaternityPayGuide'
import { PARENTAL_PAY } from '../lib/rates/parentalPay'
import { formatDate, formatDateShort, formatGBPPence } from '../lib/format'
import {
  averageWeeklyEarnings,
  calculateMaternityPay,
  calculatePaternityPay,
} from '../lib/parentalPay'
import { switchPayPer } from '../lib/payPeriods'
import { MONEY } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-23'

const payLabels = {
  weekly: 'Your average weekly pay',
  monthly: 'Your monthly pay',
  annual: 'Your yearly salary',
}

// The pay periods in payPeriods.js, for switching how pay is entered.
const PERIOD_PER = { annual: 'year', monthly: 'month', weekly: 'week' }

function WhyNot({ result }) {
  const { lowerEarningsLimit, continuousWeeks } = PARENTAL_PAY
  return (
    <Notice warning>
      Why you do not qualify:
      <ul>
        {result.reasons.includes('service') && (
          <li>
            You need to have worked for your employer for at least {continuousWeeks} weeks by the
            qualifying week. For this due date that means starting by{' '}
            {formatDate(result.employedSince)}.
          </li>
        )}
        {result.reasons.includes('earnings') && (
          <li>
            Your average weekly earnings of {formatGBPPence(result.averageWeeklyEarnings)} are under
            the {formatGBPPence(lowerEarningsLimit)} a week needed.
          </li>
        )}
      </ul>
    </Notice>
  )
}

function KeyDates({ result, children }) {
  return (
    <table className="result-table result-table--wrap">
      <caption>Key dates</caption>
      <tbody>
        <tr>
          <th scope="row">Qualifying week</th>
          <td>
            {formatDate(result.qualifyingWeekStart)} to {formatDate(result.qualifyingWeekEnd)}
          </td>
        </tr>
        <tr>
          <th scope="row">Tell your employer by</th>
          <td>{formatDate(result.tellEmployerBy)}</td>
        </tr>
        {children}
      </tbody>
    </table>
  )
}

export default function MaternityPayCalculator() {
  const state = useCalculatorState(
    {
      payType: choiceInput('maternity', ['maternity', 'paternity']),
      // A fixed date, so the page is the same wherever and whenever it is built.
      dueDate: dateInput('2027-03-01', { label: 'The date the baby is due' }),
      leaveStart: dateInput('', { label: 'The date maternity pay starts', optional: true }),
      payPeriod: choiceInput('annual', Object.keys(payLabels)),
      workedContinuously: checkboxInput(true),
      // The label says how the pay is entered.
      pay: numberInput('30,000', (fields) => ({
        label: payLabels[fields.payPeriod.value],
        ...MONEY,
        grouped: true,
      })),
    },
    { sharedLinks: true },
  )
  const { pay } = state
  const due = state.dueDate
  const payType = state.payType.value
  const dueDate = due.text
  const leaveStart = state.leaveStart.text
  const payPeriod = state.payPeriod.value
  const workedContinuously = state.workedContinuously.value

  const earnings = averageWeeklyEarnings({ amount: pay.value, period: payPeriod })
  const isMaternity = payType === 'maternity'

  const result = useMemo(() => {
    const inputs = { dueDate, averageWeeklyEarnings: earnings, workedContinuously }
    return isMaternity
      ? calculateMaternityPay({ ...inputs, leaveStart })
      : calculatePaternityPay(inputs)
  }, [isMaternity, dueDate, leaveStart, earnings, workedContinuously])

  // Keep the same pay when switching how it is entered, so £30,000 a year
  // becomes £2,500 a month and not £30,000 a month. The exact amount is kept,
  // so switching back gives £30,000 again.
  const changePayPeriod = (next) => {
    if (pay.valid && pay.value > 0) {
      const switched = switchPayPer({
        amount: pay.value,
        from: PERIOD_PER[payPeriod],
        to: PERIOD_PER[next],
        settings: {},
        typed: pay.typed,
      })
      pay.setExact(switched.amount, switched.typed)
    }
    state.payPeriod.set(next)
  }

  // The calculation returns nothing when the due date is missing or not a
  // real date, and the due date field then says so.
  const problem = problemWith(due, pay)

  const { maternity, paternity, maternityAllowance, weeklyRate, ratesFrom } = PARENTAL_PAY
  const payName = isMaternity ? 'Statutory Maternity Pay' : 'Statutory Paternity Pay'
  const qualifies = !problem && result.qualifies
  const doesNotQualify = !problem && !result.qualifies

  const figures = !qualifies
    ? []
    : isMaternity
      ? [
          {
            value: formatGBPPence(result.total),
            per: `over ${maternity.payWeeks} weeks, before tax`,
          },
          {
            value: formatGBPPence(result.higherWeekly),
            per: `a week for the first ${maternity.higherRateWeeks} weeks`,
          },
        ]
      : [
          {
            value: formatGBPPence(result.total),
            per: `for ${paternity.payWeeks} weeks, before tax`,
          },
          { value: formatGBPPence(result.weekly), per: 'a week' },
        ]

  // Maternity Allowance, shown under "you do not qualify" when it may apply.
  const allowance = doesNotQualify && isMaternity && result.allowanceMayApply && (
    <>
      <table className="result-table result-table--total">
        <caption>Maternity Allowance you might get instead</caption>
        <tbody>
          <tr>
            <th scope="row">Each week</th>
            <td>{formatGBPPence(result.allowanceWeekly)}</td>
          </tr>
          <tr>
            <th scope="row">Total over {maternityAllowance.payWeeks} weeks</th>
            <td>{formatGBPPence(result.allowanceTotal)}</td>
          </tr>
        </tbody>
      </table>
      <p className="result-card__line">
        Maternity Allowance is paid by the government, not your employer. You could get it if you
        were employed or self-employed for at least {maternityAllowance.weeksWorked} of the{' '}
        {maternityAllowance.testPeriodWeeks} weeks before the baby is due, and earned{' '}
        {formatGBPPence(maternityAllowance.weeklyEarnings)} a week or more in at least{' '}
        {maternityAllowance.weeksEarning} of them. You claim it yourself on{' '}
        <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
          gov.uk
        </a>
        .
      </p>
    </>
  )

  // Why there is no figure, notes on the result, and warnings.
  const notices = []
  if (doesNotQualify) notices.push(<WhyNot key="why-not" result={result} />)
  if (doesNotQualify && isMaternity && !result.allowanceMayApply) {
    notices.push(
      <Notice key="no-allowance">
        Maternity Allowance needs earnings of at least{' '}
        {formatGBPPence(maternityAllowance.weeklyEarnings)} a week in{' '}
        {maternityAllowance.weeksEarning} of the {maternityAllowance.testPeriodWeeks} weeks before
        the baby is due, so it may not apply either. Check on{' '}
        <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
          gov.uk
        </a>
        , because the test looks at your best weeks, not your average.
      </Notice>,
    )
  }
  if (doesNotQualify && !isMaternity) {
    notices.push(
      <Notice key="unpaid-leave">
        You can still take paternity leave, which you are entitled to from your first day in a job,
        but it would be unpaid unless your employer has its own scheme. Maternity Allowance is only
        for the person having the baby.
      </Notice>,
    )
  }
  if (qualifies && isMaternity && result.leaveStartTooEarly) {
    notices.push(
      <Notice key="too-early" warning>
        Maternity leave usually cannot start before {formatDate(result.earliestLeaveStart)}, which
        is {PARENTAL_PAY.earliestLeaveWeeksBeforeDue} weeks before the week the baby is due.
      </Notice>,
    )
  }
  if (!problem && result.limitMayDiffer) {
    notices.push(
      <Notice key="limit">
        The {formatGBPPence(PARENTAL_PAY.lowerEarningsLimit)} earnings limit used here is for
        qualifying weeks in the 2026/27 tax year. Your qualifying week falls outside it, so the
        limit that applies to you may be different.
      </Notice>,
    )
  }

  return (
    <CalculatorLayout
      title="Maternity and paternity pay calculator"
      lede={`Statutory Maternity Pay or Paternity Pay, how much and when, at the rates from ${ratesFrom}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="What to work out">
              <FieldRow>
                <SelectField
                  id="pay-type"
                  label="The pay you want to work out"
                  size="full"
                  value={payType}
                  onChange={state.payType.set}
                >
                  <option value="maternity">Statutory Maternity Pay</option>
                  <option value="paternity">Statutory Paternity Pay</option>
                </SelectField>
              </FieldRow>
            </InputSection>

            <InputSection title="Dates">
              <FieldRow>
                <DateField
                  id="due-date"
                  label="The date the baby is due"
                  value={dueDate}
                  onChange={due.setText}
                  error={due.error}
                />
                {isMaternity && (
                  <DateField
                    id="leave-start"
                    label="The date maternity pay starts"
                    hint="Leave it blank to use the due date."
                    optional
                    value={leaveStart}
                    onChange={state.leaveStart.setText}
                  />
                )}
              </FieldRow>
            </InputSection>

            <InputSection title="Your pay and job">
              <FieldRow>
                <NumberField id="pay-amount" hint="Before tax." before="£" decimal field={pay} />
                <SelectField
                  id="pay-period"
                  label="How to enter your pay"
                  value={payPeriod}
                  onChange={changePayPeriod}
                >
                  <option value="annual">Yearly salary</option>
                  <option value="monthly">Monthly pay</option>
                  <option value="weekly">Average weekly pay</option>
                </SelectField>
              </FieldRow>
              <CheckboxField
                id="worked-continuously"
                label="Your time with your employer"
                checked={workedContinuously}
                onChange={state.workedContinuously.set}
              >
                {result
                  ? `I have worked for my employer continuously since ${formatDate(result.employedSince)} or earlier (at least ${PARENTAL_PAY.continuousWeeks} weeks by the qualifying week)`
                  : `I will have worked for my employer continuously for at least ${PARENTAL_PAY.continuousWeeks} weeks by the qualifying week`}
              </CheckboxField>
            </InputSection>
          </InputCard>

          <Notice>
            These are the legal minimums. Your employer can pay more under its own scheme, so check
            your contract. The weekly rate of {formatGBPPence(weeklyRate)} applies from {ratesFrom}{' '}
            and changes each April, so weeks after April 2027 may be paid at a higher rate.
            Paternity leave rules are different in Northern Ireland.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label={payName}
          figures={figures}
          prompt={problem ?? (doesNotQualify && 'Based on what you entered, you do not qualify.')}
          withPrompt={allowance}
          shareLink={state.shareLink}
        >
          {qualifies && (
            <>
              <table className="result-table result-table--total">
                <caption>What you get</caption>
                <tbody>
                  <tr>
                    <th scope="row">Average weekly earnings</th>
                    <td>{formatGBPPence(result.averageWeeklyEarnings)}</td>
                  </tr>
                  {isMaternity ? (
                    <>
                      <tr>
                        <th scope="row">First {maternity.higherRateWeeks} weeks, each week</th>
                        <td>{formatGBPPence(result.higherWeekly)}</td>
                      </tr>
                      <tr>
                        <th scope="row">Next {result.standardWeeks} weeks, each week</th>
                        <td>{formatGBPPence(result.standardWeekly)}</td>
                      </tr>
                      <tr>
                        <th scope="row">Total over {maternity.payWeeks} weeks</th>
                        <td>{formatGBPPence(result.total)}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <th scope="row">Each week</th>
                        <td>{formatGBPPence(result.weekly)}</td>
                      </tr>
                      <tr>
                        <th scope="row">Total for {paternity.payWeeks} weeks</th>
                        <td>{formatGBPPence(result.total)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {isMaternity ? (
                <KeyDates result={result}>
                  <tr>
                    <th scope="row">Earliest that leave can start</th>
                    <td>{formatDate(result.earliestLeaveStart)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Ask for maternity pay by</th>
                    <td>{formatDate(result.claimPayBy)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Maternity pay runs</th>
                    <td>
                      {formatDate(result.leaveStart)} to {formatDate(result.payEnd)}
                    </td>
                  </tr>
                </KeyDates>
              ) : (
                <KeyDates result={result}>
                  <tr>
                    <th scope="row">Leave must end by (if born on the due date)</th>
                    <td>{formatDate(result.leaveMustEndBy)}</td>
                  </tr>
                </KeyDates>
              )}

              {isMaternity && (
                <details className="result-card__more">
                  <summary>Week-by-week dates and amounts ({maternity.payWeeks} weeks)</summary>
                  <table className="result-table result-table--wrap">
                    <thead>
                      <tr>
                        <th scope="col">Week</th>
                        <th scope="col">Dates</th>
                        <th scope="col">Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.weeks.map((week) => (
                        <tr key={week.number}>
                          <th scope="row">{week.number}</th>
                          <td>
                            {formatDateShort(week.start)} to {formatDateShort(week.end)}
                          </td>
                          <td>{formatGBPPence(week.amount)}</td>
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
      working={problem ? null : result.working}
      guide={<MaternityPayGuide />}
      related={['/salary-calculator', '/redundancy-calculator', '/minimum-wage-calculator']}
    />
  )
}
