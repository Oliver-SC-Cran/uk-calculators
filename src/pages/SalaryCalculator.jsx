import { useMemo } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { useNumberField } from '../components/useNumberField'
import TakeHomePayGuide from '../guides/TakeHomePayGuide'
import { calculateTakeHome, TAX_YEAR } from '../lib/calculations'
import { formatGBP, percent } from '../lib/format'

export default function SalaryCalculator() {
  const salary = useNumberField('35000', { label: 'Your salary' })

  const result = useMemo(() => calculateTakeHome(salary.value), [salary.value])

  return (
    <CalculatorPage
      title="Take-home pay calculator"
      rates={`${TAX_YEAR} rates`}
      inputs={
        <>
          <Steps>
            <NumberField id="salary" hint="For a year, before tax." before="£" field={salary} />
          </Steps>

          <Notice>
            This uses the rates for England, Wales and Northern Ireland. Scotland has different
            income tax bands. It assumes no pension contributions, student loan or other deductions.
          </Notice>
        </>
      }
      result={
        <ResultPanel
          label="You take home"
          figure={formatGBP(result.takeHomeMonthly)}
          detail={<>a month, or {formatGBP(result.takeHomeAnnual)} a year</>}
          prompt={!salary.valid && 'Enter your salary to see your take-home pay.'}
          link={{ to: '/pay-rise-calculator', text: 'Getting a rise? See how much you would keep' }}
        >
          <table className="result-table result-table--total">
            <tbody>
              <tr>
                <th scope="row">Salary before tax</th>
                <td>{formatGBP(result.grossAnnual)}</td>
              </tr>
              <tr>
                <th scope="row">Income tax</th>
                <td>{formatGBP(-result.incomeTax || 0)}</td>
              </tr>
              <tr>
                <th scope="row">National Insurance</th>
                <td>{formatGBP(-result.nationalInsurance || 0)}</td>
              </tr>
              <tr>
                <th scope="row">Share of pay taken in tax and National Insurance</th>
                <td>{percent(result.effectiveRate)}</td>
              </tr>
              <tr>
                <th scope="row">Take-home pay a year</th>
                <td>{formatGBP(result.takeHomeAnnual)}</td>
              </tr>
            </tbody>
          </table>
        </ResultPanel>
      }
      guide={<TakeHomePayGuide />}
      related={[
        '/pay-rise-calculator',
        '/self-employed-tax-calculator',
        '/student-loan-calculator',
      ]}
    />
  )
}
