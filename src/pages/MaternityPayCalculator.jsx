import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { CheckboxField, DateField, NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import MaternityPayGuide from '../guides/MaternityPayGuide'
import { PARENTAL_PAY } from '../lib/calculations'
import { formatDate, formatDateShort, formatGBPPence } from '../lib/format'
import {
  averageWeeklyEarnings,
  calculateMaternityPay,
  calculatePaternityPay,
} from '../lib/parentalPay'

const payLabels = {
  weekly: 'Your average weekly pay',
  monthly: 'Your monthly pay',
  annual: 'Your yearly salary',
}

const DUE_DATE_NEEDED = 'Enter the date the baby is due.'

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
    <table className="result-table">
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
  const [payType, setPayType] = useState('maternity')
  // A fixed date, so the page is the same wherever and whenever it is built.
  const [dueDate, setDueDate] = useState('2027-03-01')
  const [leaveStart, setLeaveStart] = useState('')
  const [payPeriod, setPayPeriod] = useState('annual')
  const [workedContinuously, setWorkedContinuously] = useState(true)
  const pay = useNumberField('30000', { label: payLabels[payPeriod] })

  const earnings = averageWeeklyEarnings({ amount: pay.value, period: payPeriod })
  const isMaternity = payType === 'maternity'

  const result = useMemo(() => {
    const inputs = { dueDate, averageWeeklyEarnings: earnings, workedContinuously }
    return isMaternity
      ? calculateMaternityPay({ ...inputs, leaveStart })
      : calculatePaternityPay(inputs)
  }, [isMaternity, dueDate, leaveStart, earnings, workedContinuously])

  // The calculation returns nothing when the due date is missing or not a real date.
  const due = { valid: result !== null, isBlank: true, problem: DUE_DATE_NEEDED }
  const problem = problemWith(due, pay)

  const { maternity, paternity, maternityAllowance, weeklyRate, ratesFrom } = PARENTAL_PAY
  const payName = isMaternity ? 'Statutory Maternity Pay' : 'Statutory Paternity Pay'
  const qualifies = !problem && result.qualifies
  const doesNotQualify = !problem && !result.qualifies

  return (
    <CalculatorPage
      title="Maternity and paternity pay calculator"
      rates={`Rates from ${ratesFrom}`}
      inputs={
        <>
          <Steps>
            <SelectField
              id="pay-type"
              label="The pay you want to work out"
              value={payType}
              onChange={setPayType}
            >
              <option value="maternity">Statutory Maternity Pay</option>
              <option value="paternity">Statutory Paternity Pay</option>
            </SelectField>
            <DateField
              id="due-date"
              label="The date the baby is due"
              value={dueDate}
              onChange={setDueDate}
              error={due.valid ? null : DUE_DATE_NEEDED}
            />
            {isMaternity && (
              <DateField
                id="leave-start"
                label="The date maternity pay starts"
                hint="Leave it blank to use the due date."
                optional
                value={leaveStart}
                onChange={setLeaveStart}
              />
            )}
            <SelectField
              id="pay-period"
              label="How to enter your pay"
              value={payPeriod}
              onChange={setPayPeriod}
            >
              <option value="annual">Yearly salary</option>
              <option value="monthly">Monthly pay</option>
              <option value="weekly">Average weekly pay</option>
            </SelectField>
            <NumberField
              id="pay-amount"
              hint="Before tax."
              before="£"
              decimal={payPeriod !== 'annual'}
              field={pay}
            />
            <CheckboxField
              id="worked-continuously"
              label="Your time with your employer"
              checked={workedContinuously}
              onChange={setWorkedContinuously}
            >
              {result
                ? `I have worked for my employer continuously since ${formatDate(result.employedSince)} or earlier (at least ${PARENTAL_PAY.continuousWeeks} weeks by the qualifying week)`
                : `I will have worked for my employer continuously for at least ${PARENTAL_PAY.continuousWeeks} weeks by the qualifying week`}
            </CheckboxField>
          </Steps>

          <Notice>
            These are the legal minimums. Your employer can pay more under its own scheme, so check
            your contract. The weekly rate of {formatGBPPence(weeklyRate)} applies from {ratesFrom}{' '}
            and changes each April, so weeks after April 2027 may be paid at a higher rate.
            Paternity leave rules are different in Northern Ireland.
          </Notice>
        </>
      }
      result={
        <>
          {problem && <ResultPanel label={payName} prompt={problem} />}

          {qualifies && isMaternity && (
            <ResultPanel
              label={payName}
              figure={formatGBPPence(result.total)}
              detail={<>over {maternity.payWeeks} weeks, before tax</>}
              link={{ to: '/salary-calculator', text: 'See your usual take-home pay' }}
            >
              <table className="result-table result-table--total">
                <caption>What you get</caption>
                <tbody>
                  <tr>
                    <th scope="row">Average weekly earnings</th>
                    <td>{formatGBPPence(result.averageWeeklyEarnings)}</td>
                  </tr>
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
                </tbody>
              </table>
            </ResultPanel>
          )}

          {qualifies && !isMaternity && (
            <ResultPanel
              label={payName}
              figure={formatGBPPence(result.total)}
              detail={<>for {paternity.payWeeks} weeks, before tax</>}
              link={{ to: '/salary-calculator', text: 'See your usual take-home pay' }}
            >
              <table className="result-table result-table--total">
                <caption>What you get</caption>
                <tbody>
                  <tr>
                    <th scope="row">Average weekly earnings</th>
                    <td>{formatGBPPence(result.averageWeeklyEarnings)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Each week</th>
                    <td>{formatGBPPence(result.weekly)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total for {paternity.payWeeks} weeks</th>
                    <td>{formatGBPPence(result.total)}</td>
                  </tr>
                </tbody>
              </table>
            </ResultPanel>
          )}

          {doesNotQualify && (
            <>
              <ResultPanel
                label={payName}
                prompt="Based on what you entered, you do not qualify."
              />
              <WhyNot result={result} />
            </>
          )}

          {doesNotQualify && isMaternity && result.allowanceMayApply && (
            <ResultPanel
              label="Maternity Allowance you might get instead"
              figure={formatGBPPence(result.allowanceTotal)}
              detail={<>over {maternityAllowance.payWeeks} weeks</>}
            >
              <table className="result-table result-table--total">
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
              <p className="result__note">
                Maternity Allowance is paid by the government, not your employer. You could get it
                if you were employed or self-employed for at least {maternityAllowance.weeksWorked}{' '}
                of the {maternityAllowance.testPeriodWeeks} weeks before the baby is due, and earned{' '}
                {formatGBPPence(maternityAllowance.weeklyEarnings)} a week or more in at least{' '}
                {maternityAllowance.weeksEarning} of them. You claim it yourself on{' '}
                <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
                  gov.uk
                </a>
                .
              </p>
            </ResultPanel>
          )}

          {doesNotQualify && isMaternity && !result.allowanceMayApply && (
            <Notice>
              Maternity Allowance needs earnings of at least{' '}
              {formatGBPPence(maternityAllowance.weeklyEarnings)} a week in{' '}
              {maternityAllowance.weeksEarning} of the {maternityAllowance.testPeriodWeeks} weeks
              before the baby is due, so it may not apply either. Check on{' '}
              <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
                gov.uk
              </a>
              , because the test looks at your best weeks, not your average.
            </Notice>
          )}

          {doesNotQualify && !isMaternity && (
            <Notice>
              You can still take paternity leave, which you are entitled to from your first day in a
              job, but it would be unpaid unless your employer has its own scheme. Maternity
              Allowance is only for the person having the baby.
            </Notice>
          )}

          {qualifies && isMaternity && result.leaveStartTooEarly && (
            <Notice warning>
              Maternity leave usually cannot start before {formatDate(result.earliestLeaveStart)},
              which is {PARENTAL_PAY.earliestLeaveWeeksBeforeDue} weeks before the week the baby is
              due.
            </Notice>
          )}

          {!problem && result.limitMayDiffer && (
            <Notice>
              The {formatGBPPence(PARENTAL_PAY.lowerEarningsLimit)} earnings limit used here is for
              qualifying weeks in the 2026/27 tax year. Your qualifying week falls outside it, so
              the limit that applies to you may be different.
            </Notice>
          )}
        </>
      }
      breakdown={
        qualifies && (
          <>
            <div className="breakdown__tables">
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
            </div>

            {isMaternity && (
              <details>
                <summary>Week-by-week dates and amounts ({maternity.payWeeks} weeks)</summary>
                <table className="result-table">
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
        )
      }
      guide={<MaternityPayGuide />}
      related={['/salary-calculator', '/redundancy-calculator', '/minimum-wage-calculator']}
    />
  )
}
