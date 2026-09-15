import { useMemo, useState } from 'react'
import { checkMinimumWage } from '../lib/calculations'

const formatGBP = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value)

export default function MinimumWageCalculator() {
  const [age, setAge] = useState('22')
  const [hourlyRate, setHourlyRate] = useState('11.50')
  const [isApprentice, setIsApprentice] = useState(false)

  const result = useMemo(
    () =>
      checkMinimumWage({
        age: Number(age) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        isApprentice,
      }),
    [age, hourlyRate, isApprentice],
  )

  return (
    <>
      <h1>Minimum wage checker</h1>
      <p className="lede">
        Check your hourly rate against the National Living Wage and National Minimum Wage rates
        from 1 April 2026.
      </p>

      <div className="field-row">
        <div className="field">
          <label htmlFor="age">Your age</label>
          <input
            id="age"
            type="number"
            min="16"
            max="100"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="hourly-rate">What you're paid per hour (£)</label>
          <input
            id="hourly-rate"
            type="number"
            min="0"
            step="0.05"
            value={hourlyRate}
            onChange={(event) => setHourlyRate(event.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={isApprentice}
            onChange={(event) => setIsApprentice(event.target.checked)}
            style={{ width: 'auto', marginRight: '0.5rem' }}
          />
          I'm an apprentice under 19, or 19+ and in my first year of an apprenticeship
        </label>
      </div>

      <div className="result">
        <p className="result__figure">{formatGBP(result.applicableRate)}/hr</p>
        <p className="result__label">Your legal minimum ({result.bandLabel})</p>

        <table className="result-table">
          <tbody>
            <tr>
              <td>At 37.5 hours a week</td>
              <td>{formatGBP(result.weeklyAtMinimum)}</td>
            </tr>
            <tr>
              <td>Over a year</td>
              <td>{formatGBP(result.annualAtMinimum)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {result.isUnderpaid && (
        <div className="notice">
          Based on what you've entered, you may be paid {formatGBP(result.shortfall)} an hour
          below the legal minimum for your age band. If this is accurate, you can report it
          confidentially and free of charge via the Acas helpline or gov.uk. Double-check your age
          band and employment type first, since apprenticeships and first-job exemptions can
          affect which rate applies.
        </div>
      )}

      <div className="methodology">
        <h2>How this is calculated</h2>
        <p>
          Rates from 1 April 2026: £12.71 an hour for workers aged 21 and over (the National
          Living Wage), £10.85 for ages 18 to 20, and £8.00 for under 18s and apprentices. These
          rates change every April, usually announced in the preceding Autumn Budget. See{' '}
          <a href="https://www.gov.uk/national-minimum-wage-rates" target="_blank" rel="noreferrer">
            gov.uk/national-minimum-wage-rates
          </a>
          .
        </p>
      </div>
    </>
  )
}