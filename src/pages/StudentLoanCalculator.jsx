import ResultDisclaimer from '../components/ResultDisclaimer'
import { formatGBP } from '../lib/format'
import StudentLoanGuide from '../guides/StudentLoanGuide'
import RelatedCalculators from '../components/RelatedCalculators'
import { useMemo, useState } from 'react'
import { calculateStudentLoanRepayment, TAX_YEAR } from '../lib/calculations'

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
        Work out your monthly student loan repayment for the {TAX_YEAR} tax year, based on your plan
        type and salary.
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

      <div className="result" aria-live="polite">
        <p className="result__figure">{formatGBP(result.totalMonthly)}/mo</p>
        <p className="result__label">Estimated total student loan repayment</p>

        <table className="result-table">
          <tbody>
            <tr>
              <th scope="row">Undergraduate plan repayment</th>
              <td>{formatGBP(result.undergradMonthly)}/mo</td>
            </tr>
            <tr>
              <th scope="row">Postgraduate Loan repayment</th>
              <td>{formatGBP(result.postgradMonthly)}/mo</td>
            </tr>
            <tr>
              <th scope="row">Total per year</th>
              <td>{formatGBP(result.totalAnnual)}</td>
            </tr>
          </tbody>
        </table>

        <ResultDisclaimer />
      </div>

      <StudentLoanGuide />

      <RelatedCalculators
        paths={['/salary-calculator', '/pay-rise-calculator', '/minimum-wage-calculator']}
      />
    </>
  )
}
