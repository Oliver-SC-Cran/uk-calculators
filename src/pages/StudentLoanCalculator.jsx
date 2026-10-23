import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { NumberField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import StudentLoanPlanField from '../components/StudentLoanPlanField'
import { STUDENT_LOAN_PLANS } from '../components/choices'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import StudentLoanGuide from '../guides/StudentLoanGuide'
import { FULL_TIME_HOURS } from '../lib/rates/minimumWage'
import { STUDENT_LOAN } from '../lib/rates/studentLoans'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { calculateStudentLoanRepayment } from '../lib/studentLoans'
import { formatGBP } from '../lib/format'
import { PAY_ENTERED_AS, switchPayPer, yearlyPayFrom } from '../lib/payPeriods'
import { MONEY } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-22'

const PAY_PER_NAMES = { year: 'Year', month: 'Month', week: 'Week', day: 'Day', hour: 'Hour' }
const PER_WORDS = {
  year: 'a year',
  month: 'a month',
  week: 'a week',
  day: 'a day',
  hour: 'an hour',
}

export default function StudentLoanCalculator() {
  const state = useCalculatorState(
    {
      salary: numberInput('30,000', { label: 'Your salary', ...MONEY, grouped: true }),
      payPer: choiceInput('year', Object.keys(PAY_ENTERED_AS)),
      hours: numberInput(String(FULL_TIME_HOURS), {
        label: 'Hours you work a week',
        min: 1,
        max: 168,
      }),
      days: numberInput('5', { label: 'Days you work a week', min: 0.5, max: 7 }),
      plan: choiceInput('plan2', STUDENT_LOAN_PLANS),
      hasPostgraduateLoan: checkboxInput(false),
    },
    { sharedLinks: true },
  )
  const { salary, hours, days } = state
  const payPer = state.payPer.value
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value

  const settings = {
    hoursPerWeek: hours.valid ? hours.value : FULL_TIME_HOURS,
    daysPerWeek: days.valid ? days.value : 5,
  }
  const yearly = yearlyPayFrom(salary.value, payPer, settings)

  const problem = !salary.valid
    ? 'Enter your salary to see your student loan repayment.'
    : problemWith(...[payPer === 'hour' && hours, payPer === 'day' && days].filter(Boolean))

  const result = useMemo(
    () => calculateStudentLoanRepayment({ grossAnnual: yearly, plan, hasPostgraduateLoan }),
    [yearly, plan, hasPostgraduateLoan],
  )

  // Keep the same pay when switching what it is entered for, so £30,000 a
  // year becomes £2,500 a month and not £30,000 a month.
  const changePayPer = (per) => {
    if (salary.valid && yearly > 0) {
      const next = switchPayPer({
        amount: salary.value,
        from: payPer,
        to: per,
        settings,
        typed: salary.typed,
      })
      salary.setExact(next.amount, next.typed)
    }
    state.payPer.set(per)
  }

  const undergradLabel = plan === 'none' ? 'Undergraduate plan' : STUDENT_LOAN[plan].label
  const row = (label, week, month) => (
    <tr>
      <th scope="row">{label}</th>
      <td>{formatGBP(week)}</td>
      <td>{formatGBP(month)}</td>
      <td>{formatGBP(month * 12)}</td>
    </tr>
  )

  return (
    <CalculatorLayout
      title="Student loan repayment calculator"
      lede={`What you repay on Plan 1, 2, 4 or 5 and a Postgraduate Loan from your pay in ${TAX_YEAR}, on a weekly or monthly payslip.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your pay">
              <FieldRow tight>
                <NumberField id="salary" hint="Before tax." before="£" decimal field={salary} />
                <SelectField id="pay-per" label="Per" value={payPer} onChange={changePayPer}>
                  {Object.keys(PAY_ENTERED_AS).map((per) => (
                    <option key={per} value={per}>
                      {PAY_PER_NAMES[per]}
                    </option>
                  ))}
                </SelectField>
              </FieldRow>
              {(payPer === 'hour' || payPer === 'day') && (
                <FieldRow>
                  {payPer === 'hour' && <NumberField id="hours" decimal field={hours} />}
                  {payPer === 'day' && <NumberField id="days" decimal field={days} />}
                </FieldRow>
              )}
            </InputSection>

            <InputSection title="Student loan">
              <StudentLoanPlanField
                hint="Choose 'No undergraduate loan' if you only have a Postgraduate Loan."
                plan={plan}
                onPlanChange={state.plan.set}
                hasPostgraduateLoan={hasPostgraduateLoan}
                onPostgraduateChange={state.hasPostgraduateLoan.set}
              />
            </InputSection>
          </InputCard>

          <Notice>
            This is for an employee paid the same amount on every pay day. The guide below explains
            how repayments work if you are self-employed.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="You repay"
          figures={[
            { value: formatGBP(result.totalMonthly), per: 'a month' },
            { value: formatGBP(result.totalAnnual), per: 'a year' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <div className="table-scroll">
            <table className="result-table result-table--total result-table--columns">
              <thead>
                <tr>
                  <td></td>
                  <th scope="col">Week</th>
                  <th scope="col">Month</th>
                  <th scope="col">Year</th>
                </tr>
              </thead>
              <tbody>
                {row(undergradLabel, result.undergradWeekly, result.undergradMonthly)}
                {row('Postgraduate Loan', result.postgradWeekly, result.postgradMonthly)}
                {row('Total', result.totalWeekly, result.totalMonthly)}
              </tbody>
            </table>
          </div>
          <p className="result-card__line">
            The week and month columns are what a weekly or monthly payslip takes, each with that
            pay day's threshold, and the year is 12 monthly payslips. Paid weekly, 52 payslips come
            to {formatGBP(result.totalAnnualPaidWeekly)} a year.
            {payPer !== 'year' && payPer !== 'month' && payPer !== 'week' && (
              <>
                {' '}
                Your pay {PER_WORDS[payPer]} comes to {formatGBP(yearly)} a year.
              </>
            )}
          </p>
        </ResultCard>
      }
      working={problem ? null : [...result.working, ...result.weeklyWorking]}
      guide={<StudentLoanGuide />}
      guides={['/guides/how-to-read-your-payslip']}
      related={['/salary-calculator', '/pay-rise-calculator', '/minimum-wage-calculator']}
    />
  )
}
