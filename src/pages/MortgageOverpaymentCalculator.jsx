import ResultDisclaimer from '../components/ResultDisclaimer'
import { formatGBP, percent } from '../lib/format'
import MortgageOverpaymentGuide from '../guides/MortgageOverpaymentGuide'
import RelatedCalculators from '../components/RelatedCalculators'
import { useMemo, useState } from 'react'
import { calculateMortgageOverpayment, MORTGAGE } from '../lib/calculations'

function formatYearsMonths(totalMonths) {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (years === 0) return `${months} mo`
  if (months === 0) return `${years} yr`
  return `${years} yr ${months} mo`
}

export default function MortgageOverpaymentCalculator() {
  const [balance, setBalance] = useState('200000')
  const [rate, setRate] = useState('4.5')
  const [years, setYears] = useState('25')
  const [overpayment, setOverpayment] = useState('200')

  const result = useMemo(
    () =>
      calculateMortgageOverpayment({
        balance: Number(balance) || 0,
        annualRatePercent: Number(rate) || 0,
        remainingYears: Number(years) || 0,
        monthlyOverpayment: Number(overpayment) || 0,
      }),
    [balance, rate, years, overpayment],
  )

  return (
    <>
      <h1>Mortgage overpayment calculator</h1>
      <p className="lede">
        See how much interest and time a monthly overpayment could save on your remaining mortgage.
      </p>

      <div className="field-row">
        <div className="field">
          <label htmlFor="balance">Outstanding mortgage balance (£)</label>
          <input
            id="balance"
            type="number"
            min="0"
            step="1000"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="rate">Interest rate (% a year)</label>
          <input
            id="rate"
            type="number"
            min="0"
            step="0.1"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="years">Years remaining on the mortgage</label>
          <input
            id="years"
            type="number"
            min="1"
            max="40"
            value={years}
            onChange={(event) => setYears(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="overpayment">Extra monthly overpayment (£)</label>
          <input
            id="overpayment"
            type="number"
            min="0"
            step="10"
            value={overpayment}
            onChange={(event) => setOverpayment(event.target.value)}
          />
        </div>
      </div>

      <div aria-live="polite">
        {result && (
          <>
            <div className="result">
              <p className="result__figure">{formatGBP(result.interestSaved)}</p>
              <p className="result__label">Interest saved over the life of the mortgage</p>

              <table className="result-table">
                <tbody>
                  <tr>
                    <th scope="row">Standard monthly payment</th>
                    <td>{formatGBP(result.standardPayment)}</td>
                  </tr>
                  <tr>
                    <th scope="row">New monthly payment</th>
                    <td>{formatGBP(result.newPayment)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Time saved</th>
                    <td>{formatYearsMonths(result.monthsSaved)}</td>
                  </tr>
                  <tr>
                    <th scope="row">New payoff time</th>
                    <td>{formatYearsMonths(result.newTermMonths)}</td>
                  </tr>
                </tbody>
              </table>

              <ResultDisclaimer />
            </div>

            <div className="notice">
              This assumes your interest rate stays the same for the rest of the term. Most
              mortgages have a fixed period and then a rate that can change. Many lenders let you
              overpay {percent(MORTGAGE.typicalOverpaymentLimit)} of the balance a year without a
              charge, so check your own limit first.
            </div>
          </>
        )}
      </div>

      <MortgageOverpaymentGuide />

      <RelatedCalculators paths={['/isa-calculator', '/salary-calculator']} />
    </>
  )
}
