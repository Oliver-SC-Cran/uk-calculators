import { useMemo, useState } from 'react'
import RelatedCalculators from '../components/RelatedCalculators'
import ResultDisclaimer from '../components/ResultDisclaimer'
import MaternityPayGuide from '../guides/MaternityPayGuide'
import { PARENTAL_PAY } from '../lib/calculations'
import { formatDate, formatDateShort, formatGBPPence } from '../lib/format'
import {
  averageWeeklyEarnings,
  calculateMaternityPay,
  calculatePaternityPay,
} from '../lib/parentalPay'

const payLabels = {
  weekly: 'Average weekly pay before tax (£)',
  monthly: 'Monthly pay before tax (£)',
  annual: 'Yearly salary before tax (£)',
}

function WhyNot({ result, payName }) {
  const { lowerEarningsLimit, continuousWeeks } = PARENTAL_PAY
  return (
    <div className="notice notice--warning">
      Based on what you entered, you do not qualify for {payName}.
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
    </div>
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
  const [payAmount, setPayAmount] = useState('30000')
  const [workedContinuously, setWorkedContinuously] = useState(true)

  const earnings = averageWeeklyEarnings({ amount: Number(payAmount) || 0, period: payPeriod })
  const isMaternity = payType === 'maternity'

  const result = useMemo(() => {
    const inputs = { dueDate, averageWeeklyEarnings: earnings, workedContinuously }
    return isMaternity
      ? calculateMaternityPay({ ...inputs, leaveStart })
      : calculatePaternityPay(inputs)
  }, [isMaternity, dueDate, leaveStart, earnings, workedContinuously])

  const { maternity, paternity, maternityAllowance, weeklyRate, ratesFrom } = PARENTAL_PAY
  const payName = isMaternity ? 'Statutory Maternity Pay' : 'Statutory Paternity Pay'

  return (
    <>
      <h1>Maternity and paternity pay calculator</h1>
      <p className="lede">
        Work out Statutory Maternity Pay or Statutory Paternity Pay, whether you qualify, and the
        dates that matter, using the rates from {ratesFrom}.
      </p>

      <div className="field">
        <label htmlFor="pay-type">Which pay do you want to work out?</label>
        <select id="pay-type" value={payType} onChange={(event) => setPayType(event.target.value)}>
          <option value="maternity">Statutory Maternity Pay</option>
          <option value="paternity">Statutory Paternity Pay</option>
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="due-date">Date the baby is due</label>
          <input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        {isMaternity && (
          <div className="field">
            <label htmlFor="leave-start">Date maternity pay starts (optional)</label>
            <input
              id="leave-start"
              type="date"
              value={leaveStart}
              onChange={(event) => setLeaveStart(event.target.value)}
            />
          </div>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="pay-period">How to enter your pay</label>
          <select
            id="pay-period"
            value={payPeriod}
            onChange={(event) => setPayPeriod(event.target.value)}
          >
            <option value="annual">Yearly salary</option>
            <option value="monthly">Monthly pay</option>
            <option value="weekly">Average weekly pay</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="pay-amount">{payLabels[payPeriod]}</label>
          <input
            id="pay-amount"
            type="number"
            min="0"
            step={payPeriod === 'annual' ? '500' : '10'}
            value={payAmount}
            onChange={(event) => setPayAmount(event.target.value)}
          />
        </div>
      </div>

      <div className="field field--checkbox">
        <label>
          <input
            type="checkbox"
            checked={workedContinuously}
            onChange={(event) => setWorkedContinuously(event.target.checked)}
          />
          {result
            ? `I have worked for my employer continuously since ${formatDate(result.employedSince)} or earlier (at least ${PARENTAL_PAY.continuousWeeks} weeks by the qualifying week)`
            : `I will have worked for my employer continuously for at least ${PARENTAL_PAY.continuousWeeks} weeks by the qualifying week`}
        </label>
      </div>

      <div aria-live="polite">
        {!result && <div className="notice notice--warning">Enter the date the baby is due.</div>}

        {result && result.qualifies && isMaternity && (
          <div className="result">
            <p className="result__figure">{formatGBPPence(result.total)}</p>
            <p className="result__label">
              Statutory Maternity Pay over {maternity.payWeeks} weeks, before tax
            </p>

            <table className="result-table">
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

            <details className="result__details">
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

            <ResultDisclaimer />
          </div>
        )}

        {result && result.qualifies && !isMaternity && (
          <div className="result">
            <p className="result__figure">{formatGBPPence(result.total)}</p>
            <p className="result__label">
              Statutory Paternity Pay for {paternity.payWeeks} weeks, before tax
            </p>

            <table className="result-table">
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

            <KeyDates result={result}>
              <tr>
                <th scope="row">Leave must end by (if born on the due date)</th>
                <td>{formatDate(result.leaveMustEndBy)}</td>
              </tr>
            </KeyDates>

            <ResultDisclaimer />
          </div>
        )}

        {result && !result.qualifies && <WhyNot result={result} payName={payName} />}

        {result && !result.qualifies && isMaternity && result.allowanceMayApply && (
          <div className="result">
            <p className="result__figure">{formatGBPPence(result.allowanceTotal)}</p>
            <p className="result__label">
              Maternity Allowance you might get instead, over {maternityAllowance.payWeeks} weeks
            </p>
            <table className="result-table">
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
              Maternity Allowance is paid by the government, not your employer. You could get it if
              you were employed or self-employed for at least {maternityAllowance.weeksWorked} of
              the {maternityAllowance.testPeriodWeeks} weeks before the baby is due, and earned{' '}
              {formatGBPPence(maternityAllowance.weeklyEarnings)} a week or more in at least{' '}
              {maternityAllowance.weeksEarning} of them. You claim it yourself on{' '}
              <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
                gov.uk
              </a>
              .
            </p>
            <ResultDisclaimer />
          </div>
        )}

        {result && !result.qualifies && isMaternity && !result.allowanceMayApply && (
          <div className="notice">
            Maternity Allowance needs earnings of at least{' '}
            {formatGBPPence(maternityAllowance.weeklyEarnings)} a week in{' '}
            {maternityAllowance.weeksEarning} of the {maternityAllowance.testPeriodWeeks} weeks
            before the baby is due, so it may not apply either. Check on{' '}
            <a href="https://www.gov.uk/maternity-allowance" target="_blank" rel="noreferrer">
              gov.uk
            </a>
            , because the test looks at your best weeks, not your average.
          </div>
        )}

        {result && !result.qualifies && !isMaternity && (
          <div className="notice">
            You can still take paternity leave, which you are entitled to from your first day in a
            job, but it would be unpaid unless your employer has its own scheme. Maternity Allowance
            is only for the person having the baby.
          </div>
        )}

        {result && isMaternity && result.qualifies && result.leaveStartTooEarly && (
          <div className="notice notice--warning">
            Maternity leave usually cannot start before {formatDate(result.earliestLeaveStart)},
            which is {PARENTAL_PAY.earliestLeaveWeeksBeforeDue} weeks before the week the baby is
            due.
          </div>
        )}

        {result && result.limitMayDiffer && (
          <div className="notice">
            The {formatGBPPence(PARENTAL_PAY.lowerEarningsLimit)} earnings limit used here is for
            qualifying weeks in the 2026/27 tax year. Your qualifying week falls outside it, so the
            limit that applies to you may be different.
          </div>
        )}
      </div>

      <div className="notice">
        These are the legal minimums. Your employer can pay more under its own scheme, so check your
        contract. The weekly rate of {formatGBPPence(weeklyRate)} applies from {ratesFrom} and
        changes each April, so weeks after April 2027 may be paid at a higher rate. Paternity leave
        rules are different in Northern Ireland.
      </div>

      <MaternityPayGuide />

      <RelatedCalculators
        paths={['/salary-calculator', '/redundancy-calculator', '/minimum-wage-calculator']}
      />
    </>
  )
}
