import { useMemo, useState } from 'react'
import { calculateTakeHome, TAX_YEAR } from '../lib/calculations'

const formatGBP = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)

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

      <div className="result">
        <p className="result__figure">{formatGBP(result.takeHomeAnnual)}</p>
        <p className="result__label">Estimated take-home pay per year</p>

        <table className="result-table">
          <tbody>
            <tr>
              <td>Gross salary</td>
              <td>{formatGBP(result.grossAnnual)}</td>
            </tr>
            <tr>
              <td>Income tax</td>
              <td>-{formatGBP(result.incomeTax)}</td>
            </tr>
            <tr>
              <td>National Insurance</td>
              <td>-{formatGBP(result.nationalInsurance)}</td>
            </tr>
            <tr>
              <td>Take-home per month</td>
              <td>{formatGBP(result.takeHomeMonthly)}</td>
            </tr>
            <tr>
              <td>Effective tax + NI rate</td>
              <td>{(result.effectiveRate * 100).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="notice">
        This uses standard England/Wales/Northern Ireland rates, not Scottish rates, which have
        different bands. It also assumes no student loan, pension contribution, or other
        deductions.
      </div>

      <div className="methodology">
        <h2>How this is calculated</h2>
        <p>
          Personal allowance is £12,570, reducing by £1 for every £2 earned above £100,000 (fully
          gone at £125,140). Income above the allowance is taxed at 20% up to £50,270, 40% up to
          £125,140, then 45% above that. Employee National Insurance is 8% on earnings between
          £12,570 and £50,270, then 2% above. Figures are published by HMRC for the {TAX_YEAR} tax
          year — see{' '}
          <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noreferrer">
            gov.uk/income-tax-rates
          </a>
          .
        </p>
      </div>
    </>
  )
}