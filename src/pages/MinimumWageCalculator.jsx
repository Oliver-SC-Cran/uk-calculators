import ResultDisclaimer from '../components/ResultDisclaimer'
import { formatGBPPence as formatGBP } from '../lib/format'
import MinimumWageGuide from '../guides/MinimumWageGuide'
import RelatedCalculators from '../components/RelatedCalculators'
import { useMemo, useState } from 'react'
import { checkMinimumWage } from '../lib/calculations'

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
        Check your hourly rate against the National Living Wage and National Minimum Wage rates from
        1 April 2026.
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

      <div className="field field--checkbox">
        <label>
          <input
            type="checkbox"
            checked={isApprentice}
            onChange={(event) => setIsApprentice(event.target.checked)}
          />
          I'm an apprentice under 19, or 19+ and in my first year of an apprenticeship
        </label>
      </div>

      <div aria-live="polite">
        {result.entitled ? (
          <div className="result">
            <p className="result__figure">{formatGBP(result.applicableRate)}/hr</p>
            <p className="result__label">Your legal minimum ({result.bandLabel})</p>

            <table className="result-table">
              <tbody>
                <tr>
                  <th scope="row">At 37.5 hours a week</th>
                  <td>{formatGBP(result.weeklyAtMinimum)}</td>
                </tr>
                <tr>
                  <th scope="row">Over a year</th>
                  <td>{formatGBP(result.annualAtMinimum)}</td>
                </tr>
              </tbody>
            </table>

            <ResultDisclaimer />
          </div>
        ) : (
          <div className="notice">
            Enter an age of {result.minAge} or over. You must be at least school leaving age
            (usually {result.minAge}) to get the National Minimum Wage.
          </div>
        )}

        {result.isUnderpaid && (
          <div className="notice notice--warning">
            Based on what you've entered, you may be paid {formatGBP(result.shortfall)} an hour
            below the legal minimum for your age. Check the age and apprentice options above first,
            as they change which rate applies. If they are right, the guide below explains how to
            report it.
          </div>
        )}
      </div>

      <MinimumWageGuide />

      <RelatedCalculators
        paths={['/salary-calculator', '/maternity-pay-calculator', '/redundancy-calculator']}
      />
    </>
  )
}
