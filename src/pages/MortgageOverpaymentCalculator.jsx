import { useMemo, useState } from 'react'
import { calculateMortgageOverpayment } from '../lib/calculations'

const formatGBP = (value) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)

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
        See how much interest and time a monthly overpayment could save on your remaining
        mortgage.
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

      {result && (
        <>
          <div className="result">
            <p className="result__figure">{formatGBP(result.interestSaved)}</p>
            <p className="result__label">Interest saved over the life of the mortgage</p>

            <table className="result-table">
              <tbody>
                <tr>
                  <td>Standard monthly payment</td>
                  <td>{formatGBP(result.standardPayment)}</td>
                </tr>
                <tr>
                  <td>New monthly payment</td>
                  <td>{formatGBP(result.newPayment)}</td>
                </tr>
                <tr>
                  <td>Time saved</td>
                  <td>{formatYearsMonths(result.monthsSaved)}</td>
                </tr>
                <tr>
                  <td>New payoff time</td>
                  <td>{formatYearsMonths(result.newTermMonths)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="notice">
            This compares your current deal's rate held constant for the full remaining term.
            Real mortgages usually have a fixed period followed by a rate that can change, and
            most lenders cap penalty-free overpayments at 10% of the balance a year. Check your
            mortgage's specific overpayment allowance before committing to a regular extra
            payment.
          </div>
        </>
      )}

      <div className="methodology">
        <h2>How this is calculated</h2>
        <p>
          This uses the standard repayment mortgage formula to work out your normal monthly
          payment, then adds your overpayment on top and works out month by month how much faster
          the balance clears and how much less interest builds up along the way, compared with
          paying only the standard amount for the full original term.
        </p>
      </div>
    </>
  )
}