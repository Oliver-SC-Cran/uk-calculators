import { useMemo, useState } from 'react'
import { calculateISAAllowance, ISA, TAX_YEAR } from '../lib/calculations'

const formatGBP = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)

export default function ISACalculator() {
  const [cashISA, setCashISA] = useState('5000')
  const [stocksISA, setStocksISA] = useState('5000')
  const [lisa, setLisa] = useState('4000')
  const [age, setAge] = useState('28')

  const result = useMemo(
    () =>
      calculateISAAllowance({
        cashISA: Number(cashISA) || 0,
        stocksISA: Number(stocksISA) || 0,
        lisa: Number(lisa) || 0,
        age: Number(age) || 0,
      }),
    [cashISA, stocksISA, lisa, age],
  )

  return (
    <>
      <h1>ISA & LISA allowance calculator</h1>
      <p className="lede">
        Check your combined ISA allowance and Lifetime ISA government bonus for the {TAX_YEAR} tax
        year.
      </p>

      <div className="field">
        <label htmlFor="age">Your age</label>
        <input
          id="age"
          type="number"
          min="0"
          max="100"
          value={age}
          onChange={(event) => setAge(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="cash-isa">Planned Cash ISA contribution (£)</label>
        <input
          id="cash-isa"
          type="number"
          min="0"
          step="500"
          value={cashISA}
          onChange={(event) => setCashISA(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="stocks-isa">Planned Stocks & Shares ISA contribution (£)</label>
        <input
          id="stocks-isa"
          type="number"
          min="0"
          step="500"
          value={stocksISA}
          onChange={(event) => setStocksISA(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="lisa">Planned Lifetime ISA contribution (£)</label>
        <input
          id="lisa"
          type="number"
          min="0"
          step="500"
          value={lisa}
          onChange={(event) => setLisa(event.target.value)}
        />
      </div>

      <div className="result">
        <p className="result__figure">{formatGBP(result.remainingAllowance)}</p>
        <p className="result__label">Remaining allowance this tax year</p>

        <table className="result-table">
          <tbody>
            <tr>
              <td>Total contributions entered</td>
              <td>{formatGBP(result.totalContributions)}</td>
            </tr>
            <tr>
              <td>Overall allowance</td>
              <td>{formatGBP(ISA.overallAllowance)}</td>
            </tr>
            <tr>
              <td>Lifetime ISA government bonus (25%)</td>
              <td>{formatGBP(result.lisaBonus)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {result.overallOverLimit && (
        <div className="notice">
          Your total ({formatGBP(result.totalContributions)}) is over the combined{' '}
          {formatGBP(ISA.overallAllowance)} allowance across all your ISAs this tax year.
          Contributions beyond the allowance aren't permitted in an ISA wrapper.
        </div>
      )}

      {result.lisaOverLimit && (
        <div className="notice">
          The Lifetime ISA has its own separate limit of {formatGBP(ISA.lisaLimit)} per tax year,
          even if you have allowance left overall — the calculation above has capped it
          accordingly.
        </div>
      )}

      {Number(lisa) > 0 && !result.lisaEligibleToOpen && (
        <div className="notice">
          You can only open a new Lifetime ISA between ages 18 and 39. If you already hold one,
          you can keep contributing until age 50 — this just affects opening a new one.
        </div>
      )}

      <div className="notice">
        From April 2027, the Cash ISA allowance is due to reduce to £12,000 a year for people
        under 65 (the Stocks & Shares ISA allowance stays at £20,000). This calculator reflects
        the current {TAX_YEAR} rules — check back nearer April 2027 if you're planning ahead.
      </div>

      <div className="methodology">
        <h2>How this is calculated</h2>
        <p>
          You can put up to £20,000 total across a Cash ISA, Stocks & Shares ISA and Lifetime ISA
          combined in {TAX_YEAR}. The Lifetime ISA has its own £4,000 sub-limit inside that £20,000
          — it isn't an extra £4,000 on top. The government adds a 25% bonus on what you pay into
          a LISA, up to £1,000 a year on the full £4,000. See{' '}
          <a href="https://www.gov.uk/individual-savings-accounts" target="_blank" rel="noreferrer">
            gov.uk/individual-savings-accounts
          </a>
          .
        </p>
      </div>
    </>
  )
}