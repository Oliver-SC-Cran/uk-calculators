import RedundancyGuide from '../guides/RedundancyGuide'
import RelatedCalculators from '../components/RelatedCalculators'
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
      ) : result.reason === 'service-too-long' ? (
        <div className="notice">
          Check your age and years of service. Service that started before age{' '}
          {result.earliestServiceAge} does not count, and the official gov.uk calculator will not
          accept it.
        </div>
      ) : (
        <div className="notice">
          Statutory redundancy pay requires at least {result.minYearsToQualify} full years of
          continuous service. Based on what you've entered, you wouldn't currently qualify.
        </div>
      )}

      <RedundancyGuide />

      <RelatedCalculators paths={['/salary-calculator', '/minimum-wage-calculator']} />
    </>
  )
}