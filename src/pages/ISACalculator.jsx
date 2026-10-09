import ResultDisclaimer from '../components/ResultDisclaimer'
import { formatGBP, percent } from '../lib/format'
import ISAGuide from '../guides/ISAGuide'
import RelatedCalculators from '../components/RelatedCalculators'
import { useMemo, useState } from 'react'
import { calculateISAAllowance, ISA, TAX_YEAR } from '../lib/calculations'

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

      <div aria-live="polite">
        <div className="result">
          <p className="result__figure">{formatGBP(result.remainingAllowance)}</p>
          <p className="result__label">Remaining allowance this tax year</p>

          <table className="result-table">
            <tbody>
              <tr>
                <th scope="row">Total contributions entered</th>
                <td>{formatGBP(result.totalContributions)}</td>
              </tr>
              <tr>
                <th scope="row">Overall allowance</th>
                <td>{formatGBP(ISA.overallAllowance)}</td>
              </tr>
              <tr>
                <th scope="row">Lifetime ISA government bonus ({percent(ISA.lisaBonusRate)})</th>
                <td>{formatGBP(result.lisaBonus)}</td>
              </tr>
            </tbody>
          </table>

          <ResultDisclaimer />
        </div>

        {result.overallOverLimit && (
          <div className="notice notice--warning">
            Your total of {formatGBP(result.totalContributions)} is over the{' '}
            {formatGBP(ISA.overallAllowance)} allowance for all your ISAs this tax year. You cannot
            pay in more than the allowance.
          </div>
        )}

        {result.lisaOverLimit && (
          <div className="notice notice--warning">
            A Lifetime ISA has its own limit of {formatGBP(ISA.lisaLimit)} a tax year, even if you
            have allowance left overall. The figures above count only {formatGBP(ISA.lisaLimit)}.
          </div>
        )}

        {result.tooYoungForISA && (
          <div className="notice">
            You must be {ISA.minAge} or over to open an ISA, so this allowance does not apply to you
            yet. Under-18s can have a Junior ISA, which has its own separate limit.
          </div>
        )}

        {Number(lisa) > 0 && !result.tooYoungForISA && !result.lisaAllowedAtAge && (
          <div className="notice">
            You cannot pay into a Lifetime ISA once you are {ISA.lisaMaxContributionAge}, so the
            Lifetime ISA amount has been left out of the total and earns no bonus.
          </div>
        )}

        {Number(lisa) > 0 && result.lisaAllowedAtAge && !result.lisaEligibleToOpen && (
          <div className="notice">
            You can only open a new Lifetime ISA between ages {ISA.lisaMinOpenAge} and{' '}
            {ISA.lisaMaxOpenAge - 1}. If you already hold one, you can keep paying in until you are{' '}
            {ISA.lisaMaxContributionAge}. The figures above assume you already have one.
          </div>
        )}
      </div>

      <div className="notice">
        From {ISA.cashLimitChangeDate}, people under {ISA.cashLimitFullAllowanceAge} will only be
        able to pay {formatGBP(ISA.cashLimitUnder65AfterChange)} a year into cash ISAs. This
        calculator uses the {TAX_YEAR} rules. The guide below explains the change.
      </div>

      <ISAGuide />

      <RelatedCalculators
        paths={['/mortgage-overpayment-calculator', '/stamp-duty-calculator', '/salary-calculator']}
      />
    </>
  )
}
