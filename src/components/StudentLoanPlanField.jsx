import { STUDENT_LOAN } from '../lib/rates/studentLoans'
import { STUDENT_LOAN_PLANS } from './choices'
import { Checkbox, SelectField } from './Fields'

// Every plan but 'none', which has its own wording.
const PLANS = STUDENT_LOAN_PLANS.filter((plan) => plan !== 'none')

/**
 * The step that asks which student loan someone has. A Postgraduate Loan is
 * repaid alongside any plan, so it is a tick box under the list. Plan names
 * come from STUDENT_LOAN.
 */
export default function StudentLoanPlanField({
  plan,
  onPlanChange,
  hasPostgraduateLoan,
  onPostgraduateChange,
  ...rest
}) {
  return (
    <SelectField
      id="plan"
      label="Your student loan plan"
      value={plan}
      onChange={onPlanChange}
      below={
        <Checkbox checked={hasPostgraduateLoan} onChange={onPostgraduateChange}>
          I also have a Postgraduate Loan (Master's or Doctoral)
        </Checkbox>
      }
      {...rest}
    >
      <option value="none">No undergraduate loan</option>
      {PLANS.map((key) => (
        <option key={key} value={key}>
          {STUDENT_LOAN[key].label}
        </option>
      ))}
    </SelectField>
  )
}
