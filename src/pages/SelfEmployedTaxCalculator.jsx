import { useMemo, useState } from 'react'
import RelatedCalculators from '../components/RelatedCalculators'
import ResultDisclaimer from '../components/ResultDisclaimer'
import SelfEmployedTaxGuide from '../guides/SelfEmployedTaxGuide'
import { SELF_EMPLOYED, TAX_YEAR } from '../lib/calculations'
import { formatGBP, percent } from '../lib/format'
import { calculateSelfEmployedTax } from '../lib/selfEmployed'

const number = (text) => Number(text) || 0

export default function SelfEmployedTaxCalculator() {
  const [income, setIncome] = useState('35000')
  const [expenses, setExpenses] = useState('5000')
  const [useTradingAllowance, setUseTradingAllowance] = useState(false)
  const [employmentIncome, setEmploymentIncome] = useState('0')
  const [plan, setPlan] = useState('none')
  const [hasPostgraduateLoan, setHasPostgraduateLoan] = useState(false)

  const result = useMemo(
    () =>
      calculateSelfEmployedTax({
        income: number(income),
        expenses: number(expenses),
        useTradingAllowance,
        employmentIncome: number(employmentIncome),
        plan,
        hasPostgraduateLoan,
      }),
    [income, expenses, useTradingAllowance, employmentIncome, plan, hasPostgraduateLoan],
  )

  const { tradingAllowance, payBy, secondPaymentOnAccountBy, nextTaxYear } = SELF_EMPLOYED
  const hasJob = result.employmentIncome > 0

  return (
    <>
      <h1>Self-employed tax calculator</h1>
      <p className="lede">
        Work out income tax, Class 4 National Insurance and student loan on your self-employed
        profit for the {TAX_YEAR} tax year, and what to set aside each month.
      </p>

      <div className="field">
        <label htmlFor="income">Self-employed income (£ a year, before expenses)</label>
        <input
          id="income"
          type="number"
          min="0"
          step="500"
          value={income}
          onChange={(event) => setIncome(event.target.value)}
        />
      </div>

      <div className="field field--checkbox">
        <label>
          <input
            type="checkbox"
            checked={useTradingAllowance}
            onChange={(event) => setUseTradingAllowance(event.target.checked)}
          />
          Use the {formatGBP(tradingAllowance)} trading allowance instead of my actual expenses
        </label>
      </div>

      {!useTradingAllowance && (
        <div className="field">
          <label htmlFor="expenses">Allowable expenses (£ a year)</label>
          <input
            id="expenses"
            type="number"
            min="0"
            step="100"
            value={expenses}
            onChange={(event) => setExpenses(event.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="employment-income">
          Salary from a job as well, if you have one (£ a year, before tax)
        </label>
        <input
          id="employment-income"
          type="number"
          min="0"
          step="500"
          value={employmentIncome}
          onChange={(event) => setEmploymentIncome(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="plan">Student loan plan</label>
        <select id="plan" value={plan} onChange={(event) => setPlan(event.target.value)}>
          <option value="none">No undergraduate loan</option>
          <option value="plan1">Plan 1</option>
          <option value="plan2">Plan 2</option>
          <option value="plan4">Plan 4 (Scotland)</option>
          <option value="plan5">Plan 5</option>
        </select>
      </div>

      <div className="field field--checkbox">
        <label>
          <input
            type="checkbox"
            checked={hasPostgraduateLoan}
            onChange={(event) => setHasPostgraduateLoan(event.target.checked)}
          />
          I also have a Postgraduate Loan (Master's or Doctoral)
        </label>
      </div>

      <div aria-live="polite">
        <div className="result">
          <p className="result__figure">{formatGBP(result.totalBill)}</p>
          <p className="result__label">
            Tax bill on your self-employed profit for {TAX_YEAR}, which is{' '}
            {percent(result.setAsideShare)} of your self-employed income
          </p>

          <table className="result-table">
            <caption>Your self-employment</caption>
            <tbody>
              <tr>
                <th scope="row">Income</th>
                <td>{formatGBP(result.turnover)}</td>
              </tr>
              <tr>
                <th scope="row">
                  {useTradingAllowance ? 'Trading allowance' : 'Allowable expenses'}
                </th>
                <td>{formatGBP(-result.deducted || 0)}</td>
              </tr>
              <tr>
                <th scope="row">Profit</th>
                <td>{formatGBP(result.profit)}</td>
              </tr>
            </tbody>
          </table>

          <table className="result-table">
            <caption>What you owe on that profit</caption>
            <tbody>
              <tr>
                <th scope="row">Income tax</th>
                <td>{formatGBP(result.incomeTax)}</td>
              </tr>
              <tr>
                <th scope="row">Class 4 National Insurance</th>
                <td>{formatGBP(result.class4)}</td>
              </tr>
              <tr>
                <th scope="row">Student loan</th>
                <td>{formatGBP(result.studentLoan)}</td>
              </tr>
              <tr>
                <th scope="row">Total tax bill</th>
                <td>{formatGBP(result.totalBill)}</td>
              </tr>
            </tbody>
          </table>

          <table className="result-table">
            <caption>What you keep, and what to put by</caption>
            <tbody>
              <tr>
                <th scope="row">Take-home from self-employment a year</th>
                <td>{formatGBP(result.takeHomeAnnual)}</td>
              </tr>
              <tr>
                <th scope="row">Take-home a month</th>
                <td>{formatGBP(result.takeHomeMonthly)}</td>
              </tr>
              <tr>
                <th scope="row">Set aside each month for the bill</th>
                <td>{formatGBP(result.setAsideMonthly)}</td>
              </tr>
            </tbody>
          </table>

          {hasJob && (
            <table className="result-table">
              <caption>How your job changes the tax on your profit</caption>
              <tbody>
                <tr>
                  <th scope="row">Personal allowance used by your salary</th>
                  <td>{formatGBP(result.allowanceUsedByJob)}</td>
                </tr>
                <tr>
                  <th scope="row">Personal allowance left for your profit</th>
                  <td>{formatGBP(result.allowanceLeftForProfit)}</td>
                </tr>
                <tr>
                  <th scope="row">Basic rate band left for your profit</th>
                  <td>{formatGBP(result.basicRateBandLeft)}</td>
                </tr>
              </tbody>
            </table>
          )}

          <table className="result-table">
            <caption>When you pay</caption>
            <tbody>
              <tr>
                <th scope="row">By {payBy}</th>
                <td>{formatGBP(result.dueInJanuary)}</td>
              </tr>
              <tr>
                <th scope="row">By {secondPaymentOnAccountBy}</th>
                <td>{formatGBP(result.dueInJuly)}</td>
              </tr>
            </tbody>
          </table>

          <p className="result__note">
            {result.paymentsOnAccountApply ? (
              <>
                Payments on account apply. The {payBy} amount is your {TAX_YEAR} bill of{' '}
                {formatGBP(result.totalBill)} plus a first payment of{' '}
                {formatGBP(result.paymentOnAccount)} towards {nextTaxYear}. The second payment of{' '}
                {formatGBP(result.paymentOnAccount)} is due by {secondPaymentOnAccountBy}. This
                assumes you have not already made payments on account for {TAX_YEAR}.
              </>
            ) : (
              <>
                Payments on account do not apply, so the whole bill is due by {payBy}. They start
                when a bill is {formatGBP(SELF_EMPLOYED.paymentsOnAccount.minimumBill)} or more,
                unless more than {percent(SELF_EMPLOYED.paymentsOnAccount.deductedAtSourceShare)} of
                your tax for the year was taken through your pay.
              </>
            )}
          </p>

          <ResultDisclaimer />
        </div>

        {result.mustRegisterWithNothingToPay && (
          <div className="notice">
            You have no tax to pay, but your self-employed income is over{' '}
            {formatGBP(tradingAllowance)}, so you still need to register for Self Assessment and
            send a tax return. The deadline to register is 5 October after the end of the tax year,
            which is {SELF_EMPLOYED.registerBy} for {TAX_YEAR}. You can{' '}
            <a
              href="https://www.gov.uk/register-for-self-assessment"
              target="_blank"
              rel="noreferrer"
            >
              register for Self Assessment on gov.uk
            </a>
            .
          </div>
        )}

        {result.underTradingAllowance && (
          <div className="notice">
            Self-employed income of {formatGBP(tradingAllowance)} or less in a tax year is covered
            by the trading allowance. You usually do not need to tell HMRC about it.
          </div>
        )}

        {useTradingAllowance && result.turnover > 0 && (
          <div className="notice">
            The trading allowance is not money you spent, so the take-home figure is your income
            less tax. If you had real costs, take them off yourself.
          </div>
        )}

        {result.tradingAllowanceWouldBeBetter && (
          <div className="notice">
            Your expenses are under {formatGBP(tradingAllowance)}. Ticking the trading allowance box
            above would give you a lower profit.
          </div>
        )}
      </div>

      <div className="notice">
        This uses the rates for England, Wales and Northern Ireland. Scotland has different income
        tax bands and is not covered. It is for sole traders, assumes your salary is taxed through
        PAYE on a standard tax code, and does not cover losses, pension contributions or other
        income such as savings interest or rent.
      </div>

      <SelfEmployedTaxGuide />

      <RelatedCalculators
        paths={['/salary-calculator', '/pay-rise-calculator', '/student-loan-calculator']}
      />
    </>
  )
}
