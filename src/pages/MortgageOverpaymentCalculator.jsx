import { useMemo } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import MortgageOverpaymentGuide from '../guides/MortgageOverpaymentGuide'
import { calculateMortgageOverpayment, MORTGAGE } from '../lib/calculations'
import { formatGBP, percent, yearsAndMonths } from '../lib/format'

export default function MortgageOverpaymentCalculator() {
  const balance = useNumberField('200000', { label: 'What you still owe', min: 1 })
  const rate = useNumberField('4.5', { label: 'Your interest rate', max: 100 })
  const years = useNumberField('25', { label: 'The years left on your mortgage', min: 1, max: 50 })
  const overpayment = useNumberField('200', {
    label: 'The extra you pay each month',
    optional: true,
  })

  const result = useMemo(
    () =>
      calculateMortgageOverpayment({
        balance: balance.value,
        annualRatePercent: rate.value,
        remainingYears: years.value,
        monthlyOverpayment: overpayment.value,
      }),
    [balance.value, rate.value, years.value, overpayment.value],
  )

  // The sums can still fail on figures that pass each check, such as a very
  // high rate over a very long term.
  const problem =
    problemWith(balance, rate, years, overpayment) ??
    (result ? null : 'These figures cannot be worked out. Check the rate and the years left.')

  return (
    <CalculatorPage
      title="Mortgage overpayment calculator"
      meta="Works from the figures you enter"
      inputs={
        <>
          <Steps>
            <NumberField
              id="balance"
              hint="Your outstanding mortgage balance."
              before="£"
              field={balance}
            />
            <NumberField
              id="rate"
              hint="The yearly rate you pay now."
              after="%"
              decimal
              size="short"
              field={rate}
            />
            <NumberField
              id="years"
              hint="Part years are fine, such as 12.5."
              decimal
              size="short"
              field={years}
            />
            <NumberField
              id="overpayment"
              hint="On top of your normal monthly payment."
              before="£"
              optional
              field={overpayment}
            />
          </Steps>

          <Notice>
            This assumes your interest rate stays the same for the rest of the term. Most mortgages
            have a fixed period and then a rate that can change. Many lenders let you overpay{' '}
            {percent(MORTGAGE.typicalOverpaymentLimit)} of the balance a year without a charge, so
            check your own limit first. It is for a repayment mortgage, not interest-only.
          </Notice>
        </>
      }
      result={
        <ResultPanel
          label="Interest you could save"
          figure={result && formatGBP(result.interestSaved)}
          detail={
            result &&
            (result.monthsSaved > 0 ? (
              <>and your mortgage would end {yearsAndMonths(result.monthsSaved)} sooner</>
            ) : (
              <>over the rest of your mortgage</>
            ))
          }
          prompt={problem}
          link={{ to: '/stamp-duty-calculator', text: 'Buying a home? Work out the stamp duty' }}
        >
          {result && (
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
                  <td>{yearsAndMonths(result.monthsSaved)}</td>
                </tr>
                <tr>
                  <th scope="row">New payoff time</th>
                  <td>{yearsAndMonths(result.newTermMonths)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </ResultPanel>
      }
      guide={<MortgageOverpaymentGuide />}
      related={['/stamp-duty-calculator', '/isa-calculator', '/salary-calculator']}
    />
  )
}
