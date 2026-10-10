import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { Checkbox, NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { useNumberField } from '../components/useNumberField'
import StudentLoanGuide from '../guides/StudentLoanGuide'
import { calculateStudentLoanRepayment, TAX_YEAR } from '../lib/calculations'
import { formatGBP } from '../lib/format'

export default function StudentLoanCalculator() {
  const salary = useNumberField('30000', { label: 'Your salary' })
  const [plan, setPlan] = useState('plan2')
  const [hasPostgraduateLoan, setHasPostgraduateLoan] = useState(false)

  const result = useMemo(
    () => calculateStudentLoanRepayment({ grossAnnual: salary.value, plan, hasPostgraduateLoan }),
    [salary.value, plan, hasPostgraduateLoan],
  )

  return (
    <CalculatorPage
      title="Student loan repayment calculator"
      rates={`${TAX_YEAR} rates`}
      inputs={
        <>
          <Steps>
            <NumberField id="salary" hint="For a year, before tax." before="£" field={salary} />
            <SelectField
              id="plan"
              label="Your student loan plan"
              hint="Choose 'No undergraduate loan' if you only have a Postgraduate Loan."
              value={plan}
              onChange={setPlan}
              below={
                <Checkbox checked={hasPostgraduateLoan} onChange={setHasPostgraduateLoan}>
                  I also have a Postgraduate Loan (Master's or Doctoral)
                </Checkbox>
              }
            >
              <option value="none">No undergraduate loan</option>
              <option value="plan1">Plan 1</option>
              <option value="plan2">Plan 2</option>
              <option value="plan4">Plan 4 (Scotland)</option>
              <option value="plan5">Plan 5</option>
            </SelectField>
          </Steps>

          <Notice>
            This is for an employee paid the same amount every month. The guide below explains how
            repayments work if you are self-employed.
          </Notice>
        </>
      }
      result={
        <ResultPanel
          label="You repay"
          figure={formatGBP(result.totalMonthly)}
          detail={<>a month, or {formatGBP(result.totalAnnual)} a year</>}
          prompt={!salary.valid && 'Enter your salary to see your student loan repayment.'}
          link={{ to: '/salary-calculator', text: 'See your take-home pay after tax' }}
        >
          <table className="result-table result-table--total">
            <tbody>
              <tr>
                <th scope="row">Undergraduate plan, a month</th>
                <td>{formatGBP(result.undergradMonthly)}</td>
              </tr>
              <tr>
                <th scope="row">Postgraduate Loan, a month</th>
                <td>{formatGBP(result.postgradMonthly)}</td>
              </tr>
              <tr>
                <th scope="row">Total a year</th>
                <td>{formatGBP(result.totalAnnual)}</td>
              </tr>
            </tbody>
          </table>
        </ResultPanel>
      }
      guide={<StudentLoanGuide />}
      related={['/salary-calculator', '/pay-rise-calculator', '/minimum-wage-calculator']}
    />
  )
}
