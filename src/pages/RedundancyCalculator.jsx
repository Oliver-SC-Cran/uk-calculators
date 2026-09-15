import { useMemo, useState } from 'react'
import { calculateRedundancyPay, TAX_YEAR } from '../lib/calculations'

const formatGBP = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)

export default function RedundancyCalculator() {
  const [age, setAge] = useState('45')
  const [years, setYears] = useState('10')
  const [weeklyPay, setWeeklyPay] = useState('600')
  const [region, setRegion] = useState('GB')

  const result = useMemo(
    () =>
      calculateRedundancyPay({
        age: Number(age) || 0,
        yearsOfService: Number(years) || 0,
        weeklyPay: Number(weeklyPay) || 0,
        region,
      }),
    [age, years, weeklyPay, region],
  )

  return (
    <>
      <h1>Statutory redundancy pay calculator</h1>
      <p className="lede">
        Works out the legal minimum redundancy payment for the {TAX_YEAR} tax year. This is the
        statutory minimum only. Your actual package may be higher if your employer offers
        enhanced redundancy terms.
      </p>

      <div className="field-row">
        <div className="field">
          <label htmlFor="age">Your age</label>
          <input
            id="age"
            type="number"
            min="16"
            max="80"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="years">Full years of service</label>
          <input
            id="years"
            type="number"
            min="0"
            max="40"
            value={years}
            onChange={(event) => setYears(event.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="weekly-pay">Gross weekly pay (£)</label>
          <input
            id="weekly-pay"
            type="number"
            min="0"
            step="10"
            value={weeklyPay}
            onChange={(event) => setWeeklyPay(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="region">Region</label>
          <select id="region" value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="GB">England, Scotland or Wales</option>
            <option value="NI">Northern Ireland</option>
          </select>
        </div>
      </div>

      {result.qualifies ? (
        <div className="result">
          <p className="result__figure">{formatGBP(result.pay)}</p>
          <p className="result__label">Estimated statutory redundancy pay</p>

          <table className="result-table">
            <tbody>
              <tr>
                <td>Weeks' pay awarded</td>
                <td>{result.totalWeeks}</td>
              </tr>
              <tr>
                <td>Weekly pay used</td>
                <td>
                  {formatGBP(result.weeklyPayUsed)}
                  {result.weeklyPayWasCapped ? ' (capped)' : ''}
                </td>
              </tr>
              <tr>
                <td>Tax-free up to</td>
                <td>{formatGBP(result.taxFreeThreshold)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="notice">
          Statutory redundancy pay requires at least {result.minYearsToQualify} full years of
          continuous service. Based on what you've entered, you wouldn't currently qualify.
        </div>
      )}

      <div className="methodology">
        <h2>How this is calculated</h2>
        <p>
          For each full year of service, you get 0.5 week's pay if you were under 22 that year, 1
          week's pay if you were 22 to 40, or 1.5 weeks' pay if you were 41 or over. This counts
          back from your current age, up to a maximum of 20 years' service. Weekly pay is capped at
          £751 (England, Scotland and Wales) or £783 (Northern Ireland) for {TAX_YEAR}, even if
          you earn more. The first £30,000 is tax-free. This is a standard approximation. For an
          actual dismissal, especially close to an age-band birthday, check the exact figure
          against the official calculator at{' '}
          <a href="https://www.gov.uk/calculate-your-redundancy-pay" target="_blank" rel="noreferrer">
            gov.uk/calculate-your-redundancy-pay
          </a>
          .
        </p>
      </div>
    </>
  )
}