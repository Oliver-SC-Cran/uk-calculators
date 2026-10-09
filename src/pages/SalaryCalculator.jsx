import ResultDisclaimer from '../components/ResultDisclaimer'
import { formatGBP } from '../lib/format'
import RelatedCalculators from '../components/RelatedCalculators'
import { useMemo, useState } from 'react'
import TakeHomePayGuide from '../guides/TakeHomePayGuide'
import { calculateTakeHome, TAX_YEAR } from '../lib/calculations'

export default function SalaryCalculator() {
  const [salaryInput, setSalaryInput] = useState('35000')

  const grossAnnual = Number(salaryInput) || 0
  const result = useMemo(() => calculateTakeHome(grossAnnual), [grossAnnual])

  return (
    <>
      <h1>Take-home pay calculator</h1>
      <p className="lede">
        England, Wales and Northern Ireland rates for the {TAX_YEAR} tax year. Enter your gross
        annual salary before tax.
      </p>

      <div className="field">
        <label htmlFor="salary">Gross annual salary (£)</label>
        <input
          id="salary"
          type="number"
          inputMode="numeric"
          min="0"
          step="500"
          value={salaryInput}
          onChange={(event) => setSalaryInput(event.target.value)}
        />
      </div>

      <div className="result" aria-live="polite">
        <p className="result__figure">{formatGBP(result.takeHomeAnnual)}</p>
        <p className="result__label">Estimated take-home pay per year</p>

        <table className="result-table">
          <tbody>
            <tr>
              <th scope="row">Gross salary</th>
              <td>{formatGBP(result.grossAnnual)}</td>
            </tr>
            <tr>
              <th scope="row">Income tax</th>
              <td>{formatGBP(-result.incomeTax || 0)}</td>
            </tr>
            <tr>
              <th scope="row">National Insurance</th>
              <td>{formatGBP(-result.nationalInsurance || 0)}</td>
            </tr>
            <tr>
              <th scope="row">Take-home per month</th>
              <td>{formatGBP(result.takeHomeMonthly)}</td>
            </tr>
            <tr>
              <th scope="row">Effective tax + NI rate</th>
              <td>{(result.effectiveRate * 100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>

        <ResultDisclaimer />
      </div>

      <div className="notice">
        This uses the rates for England, Wales and Northern Ireland. Scotland has different income
        tax bands. It assumes no pension contributions, student loan or other deductions.
      </div>

      <TakeHomePayGuide />

      <RelatedCalculators
        paths={[
          '/pay-rise-calculator',
          '/self-employed-tax-calculator',
          '/student-loan-calculator',
        ]}
      />
    </>
  )
}
