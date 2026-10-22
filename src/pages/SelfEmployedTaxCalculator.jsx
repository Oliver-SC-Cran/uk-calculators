import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, NumberField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import RegionField from '../components/RegionField'
import { REGIONS, REST_OF_UK_NOTE, STUDENT_LOAN_PLANS } from '../components/choices'
import ResultCard from '../components/ResultCard'
import StudentLoanPlanField from '../components/StudentLoanPlanField'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import SelfEmployedTaxGuide from '../guides/SelfEmployedTaxGuide'
import { SCOTTISH_INCOME_TAX } from '../lib/rates/incomeTax'
import { SELF_EMPLOYED } from '../lib/rates/selfEmployed'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP, percent } from '../lib/format'
import { MONEY } from '../lib/validation'
import { calculateSelfEmployedTax } from '../lib/selfEmployed'
import { incomeTaxLabel } from '../lib/incomeTax'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-22'

export default function SelfEmployedTaxCalculator() {
  const state = useCalculatorState(
    {
      income: numberInput('35,000', {
        label: 'Your self-employed income',
        ...MONEY,
        grouped: true,
      }),
      expenses: numberInput('5,000', {
        label: 'Your allowable expenses',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      job: numberInput('', {
        label: 'Your salary from a job',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      useTradingAllowance: checkboxInput(false),
      plan: choiceInput('none', STUDENT_LOAN_PLANS),
      hasPostgraduateLoan: checkboxInput(false),
      region: choiceInput('restOfUk', Object.keys(REGIONS)),
    },
    { sharedLinks: true },
  )
  const { income, expenses, job } = state
  const useTradingAllowance = state.useTradingAllowance.value
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value
  const region = state.region.value
  const scottish = region === 'scotland'

  // Expenses are only asked for when the trading allowance is not used.
  const problem = problemWith(income, ...(useTradingAllowance ? [] : [expenses]), job)

  const result = useMemo(
    () =>
      calculateSelfEmployedTax({
        income: income.value,
        expenses: expenses.value,
        useTradingAllowance,
        employmentIncome: job.value,
        plan,
        hasPostgraduateLoan,
        scottish,
      }),
    [
      income.value,
      expenses.value,
      useTradingAllowance,
      job.value,
      plan,
      hasPostgraduateLoan,
      scottish,
    ],
  )

  const { tradingAllowance, payBy, secondPaymentOnAccountBy, nextTaxYear } = SELF_EMPLOYED
  const hasJob = result.employmentIncome > 0

  // Notes on the result.
  const notices = []
  if (!problem && result.mustRegisterWithNothingToPay) {
    notices.push(
      <Notice key="register">
        You have no tax to pay, but your self-employed income is over {formatGBP(tradingAllowance)},
        so you still need to register for Self Assessment and send a tax return. The deadline to
        register is 5 October after the end of the tax year, which is {SELF_EMPLOYED.registerBy} for{' '}
        {TAX_YEAR}. You can{' '}
        <a href="https://www.gov.uk/register-for-self-assessment" target="_blank" rel="noreferrer">
          register for Self Assessment on gov.uk
        </a>
        .
      </Notice>,
    )
  }
  if (!problem && result.underTradingAllowance) {
    notices.push(
      <Notice key="under-allowance">
        Self-employed income of {formatGBP(tradingAllowance)} or less in a tax year is covered by
        the trading allowance. You usually do not need to tell HMRC about it.
      </Notice>,
    )
  }
  if (!problem && useTradingAllowance && result.turnover > 0) {
    notices.push(
      <Notice key="allowance-not-spent">
        The trading allowance is not money you spent, so the take-home figure is your income less
        tax. If you had real costs, take them off yourself.
      </Notice>,
    )
  }
  if (!problem && result.tradingAllowanceWouldBeBetter) {
    notices.push(
      <Notice key="allowance-better">
        Your expenses are under {formatGBP(tradingAllowance)}. Ticking the trading allowance box
        would give you a lower profit.
      </Notice>,
    )
  }

  return (
    <CalculatorLayout
      title="Self-employed tax calculator"
      lede={`Income tax, Class 4 National Insurance and student loan on your self-employed profit for ${TAX_YEAR}, and when to pay them.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your self-employment">
              <FieldRow>
                <NumberField
                  id="income"
                  hint="For a year, before expenses."
                  before="£"
                  decimal
                  field={income}
                />
                {!useTradingAllowance && (
                  <NumberField
                    id="expenses"
                    hint="For a year. Leave it blank if you have none."
                    before="£"
                    decimal
                    optional
                    field={expenses}
                  />
                )}
              </FieldRow>
              <CheckboxField
                id="trading-allowance"
                label="Trading allowance"
                checked={useTradingAllowance}
                onChange={state.useTradingAllowance.set}
              >
                Use the {formatGBP(tradingAllowance)} trading allowance instead of my actual
                expenses
              </CheckboxField>
            </InputSection>

            <InputSection title="A job as well">
              <FieldRow>
                <NumberField
                  id="employment-income"
                  hint="For a year, before tax. Leave it blank if you do not have a job as well."
                  before="£"
                  decimal
                  optional
                  field={job}
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Tax">
              <FieldRow>
                <RegionField value={region} onChange={state.region.set} size="full" />
              </FieldRow>
            </InputSection>

            <InputSection title="Student loan">
              <StudentLoanPlanField
                plan={plan}
                onPlanChange={state.plan.set}
                hasPostgraduateLoan={hasPostgraduateLoan}
                onPostgraduateChange={state.hasPostgraduateLoan.set}
              />
            </InputSection>
          </InputCard>

          <Notice>
            {scottish
              ? 'This uses Scottish income tax rates. Class 4 National Insurance and student loans are the same across the UK.'
              : REST_OF_UK_NOTE}{' '}
            It is for sole traders, assumes your salary is taxed through PAYE on a standard tax
            code, and does not cover losses, pension contributions or other income such as savings
            interest or rent.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="Tax to pay on your self-employed profit"
          figures={[
            { value: formatGBP(result.totalBill), per: `for ${TAX_YEAR}` },
            { value: formatGBP(result.setAsideMonthly), per: 'a month to set aside' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <table className="result-table result-table--total">
            <caption>What you owe on your profit</caption>
            <tbody>
              <tr>
                <th scope="row">{incomeTaxLabel(scottish)}</th>
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
                <th scope="row">Share of your self-employed income</th>
                <td>{percent(result.setAsideShare)}</td>
              </tr>
              <tr>
                <th scope="row">Total tax bill</th>
                <td>{formatGBP(result.totalBill)}</td>
              </tr>
            </tbody>
          </table>

          <table className="result-table result-table--total">
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
          <p className="result-card__line">
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
                  <th scope="row">
                    {scottish
                      ? `Bands below the ${percent(SCOTTISH_INCOME_TAX.higherRate)} rate left for your profit`
                      : 'Basic rate band left for your profit'}
                  </th>
                  <td>{formatGBP(result.basicRateBandLeft)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : result.working}
      guide={<SelfEmployedTaxGuide />}
      guides={['/guides/100k-tax-trap']}
      related={['/salary-calculator', '/pay-rise-calculator', '/student-loan-calculator']}
    />
  )
}
