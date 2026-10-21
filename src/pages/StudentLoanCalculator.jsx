import { useMemo } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import StudentLoanPlanField from '../components/StudentLoanPlanField'
import { STUDENT_LOAN_PLANS } from '../components/choices'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  useCalculatorState,
} from '../components/useCalculatorState'
import StudentLoanGuide from '../guides/StudentLoanGuide'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { calculateStudentLoanRepayment } from '../lib/studentLoans'
import { formatGBP } from '../lib/format'
import { MONEY } from '../lib/validation'

export default function StudentLoanCalculator() {
  const state = useCalculatorState({
    salary: numberInput('30000', { label: 'Your salary', ...MONEY }),
    plan: choiceInput('plan2', STUDENT_LOAN_PLANS),
    hasPostgraduateLoan: checkboxInput(false),
  })
  const { salary } = state
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value

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
            <StudentLoanPlanField
              hint="Choose 'No undergraduate loan' if you only have a Postgraduate Loan."
              plan={plan}
              onPlanChange={state.plan.set}
              hasPostgraduateLoan={hasPostgraduateLoan}
              onPostgraduateChange={state.hasPostgraduateLoan.set}
            />
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
      guides={['/guides/how-to-read-your-payslip']}
      related={['/salary-calculator', '/pay-rise-calculator', '/minimum-wage-calculator']}
    />
  )
}
