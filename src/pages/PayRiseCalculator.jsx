import { useMemo, useState } from 'react'
import RelatedCalculators from '../components/RelatedCalculators'
import ResultDisclaimer from '../components/ResultDisclaimer'
import PayRiseGuide from '../guides/PayRiseGuide'
import { INCOME_TAX, MINIMUM_WAGE, STUDENT_LOAN, TAX_YEAR } from '../lib/calculations'
import { formatGBP, formatGBPPence, percent } from '../lib/format'
import {
  calculatePayRise,
  CHILD_BENEFIT_CHARGE,
  FULL_TIME_HOURS,
  PENSION_TYPES,
} from '../lib/payRise'

const number = (text) => Number(text) || 0

function newSalaryFrom(current, riseType, riseAmount) {
  if (riseType === 'percent') return current * (1 + riseAmount / 100)
  if (riseType === 'pounds') return current + riseAmount
  return riseAmount
}

const riseLabels = {
  newSalary: 'New salary (£)',
  percent: 'Rise (%)',
  pounds: 'Rise (£ a year)',
}

function Warning({ code, result, plan }) {
  const { basicRateLimit, taperStart, taperFullyGoneAt, basicRate, higherRate } = INCOME_TAX

  if (code === 'higher-rate') {
    return (
      <div className="notice notice--warning">
        This rise takes your taxable pay over {formatGBP(basicRateLimit)}. The part above that is
        taxed at {percent(higherRate)}, not {percent(basicRate)}. The pay below it is taxed as
        before.
      </div>
    )
  }
  if (code === 'taper') {
    return (
      <div className="notice notice--warning">
        This rise takes your income over {formatGBP(taperStart)}. From there you lose £1 of tax-free
        personal allowance for every £2 you earn, until it runs out at {formatGBP(taperFullyGoneAt)}
        . You keep much less of each pound in that range.
      </div>
    )
  }
  if (code === 'inside-taper') {
    return (
      <div className="notice notice--warning">
        Your income is already between {formatGBP(taperStart)} and {formatGBP(taperFullyGoneAt)},
        where you lose £1 of personal allowance for every £2 you earn. That is why you keep so
        little of this rise.
      </div>
    )
  }
  if (code === 'taper-reclaim') {
    return (
      <div className="notice notice--warning">
        Your pay goes over {formatGBP(taperStart)}, so your payslip may show less personal
        allowance. Your pension contributions keep your adjusted net income at{' '}
        {formatGBP(result.after.adjustedNetIncome)}, under the limit, so you can claim the allowance
        back from HMRC. It is included in the relief to claim shown above.
      </div>
    )
  }
  if (code === 'child-benefit') {
    return (
      <div className="notice notice--warning">
        This rise takes your adjusted net income over {formatGBP(CHILD_BENEFIT_CHARGE.threshold)}.
        If you or your partner get Child Benefit, you may have to pay some of it back through the
        High Income Child Benefit Charge. That is not included in these figures.
      </div>
    )
  }
  if (code === 'student-loan') {
    return (
      <div className="notice notice--warning">
        This rise takes you over the {STUDENT_LOAN[plan].label} threshold of{' '}
        {formatGBP(STUDENT_LOAN[plan].threshold)} a year, so student loan repayments start.
      </div>
    )
  }
  if (code === 'postgraduate-loan') {
    return (
      <div className="notice notice--warning">
        This rise takes you over the Postgraduate Loan threshold of{' '}
        {formatGBP(STUDENT_LOAN.postgraduate.threshold)} a year, so those repayments start.
      </div>
    )
  }
  if (code === 'minimum-wage') {
    return (
      <div className="notice notice--warning">
        A salary sacrifice cannot take your pay below the minimum wage. For the hours you entered
        that is {formatGBP(result.after.minimumCashPay)} a year at{' '}
        {formatGBPPence(MINIMUM_WAGE.nationalLivingWage)} an hour, the rate for people aged 21 and
        over. Your pension contribution has been limited to {formatGBP(result.after.pensionIntoPot)}{' '}
        a year.
      </div>
    )
  }
  return null
}

export default function PayRiseCalculator() {
  const [currentSalary, setCurrentSalary] = useState('45000')
  const [riseType, setRiseType] = useState('newSalary')
  const [riseAmount, setRiseAmount] = useState('55000')
  const [plan, setPlan] = useState('none')
  const [hasPostgraduateLoan, setHasPostgraduateLoan] = useState(false)
  const [pensionPercent, setPensionPercent] = useState('5')
  const [pensionType, setPensionType] = useState('salarySacrifice')
  const [weeklyHours, setWeeklyHours] = useState(String(FULL_TIME_HOURS))

  const current = number(currentSalary)
  const next = Math.max(0, newSalaryFrom(current, riseType, number(riseAmount)))

  // Keep the same rise when switching how it is entered, so a new salary of
  // £55,000 does not turn into a rise of 55,000%.
  const changeRiseType = (event) => {
    const type = event.target.value
    // Whole pounds for amounts, and enough decimal places on a percentage
    // that switching back gives the same number of pounds.
    const amounts = {
      newSalary: Math.round(next),
      percent: current > 0 ? Number((((next - current) / current) * 100).toFixed(4)) : 0,
      pounds: Math.round(next - current),
    }
    setRiseType(type)
    setRiseAmount(String(amounts[type]))
  }

  const result = useMemo(
    () =>
      calculatePayRise({
        currentSalary: current,
        newSalary: next,
        plan,
        hasPostgraduateLoan,
        pensionPercent: number(pensionPercent),
        pensionType,
        weeklyHours: number(weeklyHours) || FULL_TIME_HOURS,
      }),
    [current, next, plan, hasPostgraduateLoan, pensionPercent, pensionType, weeklyHours],
  )

  const { before, after, goesTo } = result
  const isRise = result.rise > 0
  const hasPension = after.pensionIntoPot > 0 || before.pensionIntoPot > 0
  const isReliefAtSource = pensionType === 'reliefAtSource'

  return (
    <>
      <h1>Pay rise calculator</h1>
      <p className="lede">
        See how much of a pay rise you keep after income tax, National Insurance, student loan and
        pension, using the rates for the {TAX_YEAR} tax year.
      </p>

      <div className="field">
        <label htmlFor="current-salary">Current salary (£ a year, before tax)</label>
        <input
          id="current-salary"
          type="number"
          min="0"
          step="500"
          value={currentSalary}
          onChange={(event) => setCurrentSalary(event.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="rise-type">How to enter the rise</label>
          <select id="rise-type" value={riseType} onChange={changeRiseType}>
            <option value="newSalary">As a new salary</option>
            <option value="percent">As a percentage</option>
            <option value="pounds">As an amount in pounds</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rise-amount">{riseLabels[riseType]}</label>
          <input
            id="rise-amount"
            type="number"
            min="0"
            step={riseType === 'percent' ? '0.5' : '500'}
            value={riseAmount}
            onChange={(event) => setRiseAmount(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="plan">Student loan plan</label>
        <select id="plan" value={plan} onChange={(event) => setPlan(event.target.value)}>
          <option value="none">No undergraduate loan</option>
          <option value="plan1">Plan 1</option>
          <option value="plan2">Plan 2</option>
          <option value="plan4">Plan 4 (Scotland)</option>
          <option value="plan5">Plan 5</option>
        </select>
      </div>

      <div className="field field--checkbox">
        <label>
          <input
            type="checkbox"
            checked={hasPostgraduateLoan}
            onChange={(event) => setHasPostgraduateLoan(event.target.checked)}
          />
          I also have a Postgraduate Loan (Master's or Doctoral)
        </label>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="pension-percent">Pension contribution (% of salary)</label>
          <input
            id="pension-percent"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={pensionPercent}
            onChange={(event) => setPensionPercent(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pension-type">How your pension is taken</label>
          <select
            id="pension-type"
            value={pensionType}
            onChange={(event) => setPensionType(event.target.value)}
          >
            {Object.entries(PENSION_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pensionType === 'salarySacrifice' && (
        <div className="field">
          <label htmlFor="weekly-hours">Hours you work a week</label>
          <input
            id="weekly-hours"
            type="number"
            min="1"
            max="80"
            step="0.5"
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(event.target.value)}
          />
        </div>
      )}

      <div aria-live="polite">
        <div className="result">
          {isRise ? (
            <>
              <p className="result__figure">{formatGBP(result.kept)}</p>
              <p className="result__label">
                What you keep of a {formatGBP(result.rise)} rise each year, which is{' '}
                {percent(result.keptShare)} of it
              </p>
            </>
          ) : (
            <p className="result__label">
              Enter a new salary that is higher than your current one to see how much of the rise
              you keep.
            </p>
          )}

          <table className="result-table">
            <caption>Take-home pay</caption>
            <thead>
              <tr>
                <td></td>
                <th scope="col">Now</th>
                <th scope="col">After</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Salary</th>
                <td>{formatGBP(before.salary)}</td>
                <td>{formatGBP(after.salary)}</td>
              </tr>
              <tr>
                <th scope="row">Take-home a year</th>
                <td>{formatGBP(before.takeHomeAnnual)}</td>
                <td>{formatGBP(after.takeHomeAnnual)}</td>
              </tr>
              <tr>
                <th scope="row">Take-home a month</th>
                <td>{formatGBP(before.takeHomeMonthly)}</td>
                <td>{formatGBP(after.takeHomeMonthly)}</td>
              </tr>
            </tbody>
          </table>

          {isRise && (
            <table className="result-table">
              <caption>Where the {formatGBP(result.rise)} goes each year</caption>
              <tbody>
                <tr>
                  <th scope="row">Income tax</th>
                  <td>{formatGBP(goesTo.incomeTax)}</td>
                </tr>
                <tr>
                  <th scope="row">National Insurance</th>
                  <td>{formatGBP(goesTo.nationalInsurance)}</td>
                </tr>
                <tr>
                  <th scope="row">Student loan</th>
                  <td>{formatGBP(goesTo.studentLoan)}</td>
                </tr>
                <tr>
                  <th scope="row">Your pension</th>
                  <td>{formatGBP(goesTo.pension)}</td>
                </tr>
                <tr>
                  <th scope="row">You keep</th>
                  <td>{formatGBP(result.kept)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {hasPension && isReliefAtSource && (
            <p className="result__note">
              With relief at source, HMRC adds {formatGBP(after.hmrcTopUp)} a year to your pension
              on top of the {formatGBP(after.pensionFromPay)} from your pay.{' '}
              {after.extraReliefToClaim > 0 && (
                <>
                  You can also claim {formatGBP(after.extraReliefToClaim)} a year in extra relief
                  from HMRC, which is not in your take-home pay above.
                </>
              )}
            </p>
          )}

          <ResultDisclaimer />
        </div>

        {result.warnings.map((code) => (
          <Warning key={code} code={code} result={result} plan={plan} />
        ))}
      </div>

      <div className="notice">
        This uses the rates for England, Wales and Northern Ireland. Scotland has different income
        tax bands and is not covered. Your pension is worked out as a percentage of your full
        salary, and money your employer pays in is left out because it does not change your
        take-home pay.
      </div>

      <PayRiseGuide />

      <RelatedCalculators
        paths={['/salary-calculator', '/student-loan-calculator', '/minimum-wage-calculator']}
      />
    </>
  )
}
