import { useMemo, useState } from 'react'
import { calculateStudentLoanRepayment, TAX_YEAR } from '../lib/calculations'

const formatGBP = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)

export default function StudentLoanCalculator() {
  const [salary, setSalary] = useState('30000')
  const [plan, setPlan] = useState('plan2')
  const [hasPostgraduateLoan, setHasPostgraduateLoan] = useState(false)

  const result = useMemo(
    () =>
      calculateStudentLoanRepayment({
        grossAnnual: Number(salary) || 0,
        plan,
        hasPostgraduateLoan,
      }),
    [salary, plan, hasPostgraduateLoan],
  )

  return (
    <>
      <h1>Student loan repayment calculator</h1>
      <p className="lede">
        Work out your monthly student loan repayment for the {TAX_YEAR} tax year, based on your
        plan type and salary.
      </p>

      <div className="field">
        <label htmlFor="salary">Gross annual salary (£)</label>
        <input
          id="salary"
          type="number"
          min="0"
          step="500"
          value={salary}
          onChange={(event) => setSalary(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="plan">Your undergraduate plan</label>
        <select id="plan" value={plan} onChange={(event) => setPlan(event.target.value)}>
          <option value="none">No undergraduate loan</option>
          <option value="plan1">Plan 1</option>
          <option value="plan2">Plan 2</option>
          <option value="plan4">Plan 4 (Scotland)</option>
          <option value="plan5">Plan 5</option>
        </select>
      </div>

      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={hasPostgraduateLoan}
            onChange={(event) => setHasPostgraduateLoan(event.target.checked)}
            style={{ width: 'auto', marginRight: '0.5rem' }}
          />
          I also have a Postgraduate Loan (Master's or Doctoral)
        </label>
      </div>

      <div className="result">
        <p className="result__figure">{formatGBP(result.totalMonthly)}/mo</p>
        <p className="result__label">Estimated total student loan repayment</p>

        <table className="result-table">
          <tbody>
            <tr>
              <td>Undergraduate plan repayment</td>
              <td>{formatGBP(result.undergradRepayment / 12)}/mo</td>
            </tr>
            <tr>
              <td>Postgraduate Loan repayment</td>
              <td>{formatGBP(result.postgradRepayment / 12)}/mo</td>
            </tr>
            <tr>
              <td>Total per year</td>
              <td>{formatGBP(result.totalAnnual)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="methodology">
        <h2>Which plan am I on?</h2>
        <p>
          Plan 1 covers English and Welsh students who started before September 2012, and
          Northern Irish students of any year. Plan 2 covers English and Welsh students who
          started between September 2012 and July 2023. Plan 5 covers English and Welsh students
          starting from August 2023 onwards. Plan 4 covers Scottish students funded through SAAS.
          A Postgraduate Loan is separate and can run alongside any of these.
        </p>
        <h2>How this is calculated</h2>
        <p>
          You repay 9% of income above your plan's threshold (6% for a Postgraduate Loan), and
          the two are calculated and repaid independently, then added together. Thresholds for{' '}
          {TAX_YEAR}: Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Plan 5 £25,000, Postgraduate
          Loan £21,000. Several of these thresholds are frozen for a few years rather than rising
          every April, so check{' '}
          <a href="https://www.gov.uk/repaying-your-student-loan" target="_blank" rel="noreferrer">
            gov.uk/repaying-your-student-loan
          </a>{' '}
          for the current figures.
        </p>
      </div>
    </>
  )
}