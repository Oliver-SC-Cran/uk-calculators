import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { Checkbox, NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import PayRiseGuide from '../guides/PayRiseGuide'
import { INCOME_TAX, MINIMUM_WAGE, STUDENT_LOAN, TAX_YEAR } from '../lib/calculations'
import { formatGBP, formatGBPPence, percent } from '../lib/format'
import {
  calculatePayRise,
  CHILD_BENEFIT_CHARGE,
  FULL_TIME_HOURS,
  PENSION_TYPES,
} from '../lib/payRise'

function newSalaryFrom(current, riseType, riseAmount) {
  if (riseType === 'percent') return current * (1 + riseAmount / 100)
  if (riseType === 'pounds') return current + riseAmount
  return riseAmount
}

// The label and hint for the rise, for each way of entering it.
const riseFields = {
  newSalary: { label: 'Your new salary', hint: 'For a year, before tax.' },
  percent: { label: 'The rise as a percentage', hint: 'A percentage of your current salary.' },
  pounds: { label: 'The rise in pounds', hint: 'For a year, before tax.' },
}

function Warning({ code, result, plan }) {
  const { basicRateLimit, taperStart, taperFullyGoneAt, basicRate, higherRate } = INCOME_TAX

  if (code === 'higher-rate') {
    return (
      <Notice warning>
        This rise takes your taxable pay over {formatGBP(basicRateLimit)}. The part above that is
        taxed at {percent(higherRate)}, not {percent(basicRate)}. The pay below it is taxed as
        before.
      </Notice>
    )
  }
  if (code === 'taper') {
    return (
      <Notice warning>
        This rise takes your income over {formatGBP(taperStart)}. From there you lose £1 of tax-free
        personal allowance for every £2 you earn, until it runs out at {formatGBP(taperFullyGoneAt)}
        . You keep much less of each pound in that range.
      </Notice>
    )
  }
  if (code === 'inside-taper') {
    return (
      <Notice warning>
        Your income is already between {formatGBP(taperStart)} and {formatGBP(taperFullyGoneAt)},
        where you lose £1 of personal allowance for every £2 you earn. That is why you keep so
        little of this rise.
      </Notice>
    )
  }
  if (code === 'taper-reclaim') {
    return (
      <Notice warning>
        Your pay goes over {formatGBP(taperStart)}, so your payslip may show less personal
        allowance. Your pension contributions keep your adjusted net income at{' '}
        {formatGBP(result.after.adjustedNetIncome)}, under the limit, so you can claim the allowance
        back from HMRC. It is included in the relief to claim shown above.
      </Notice>
    )
  }
  if (code === 'child-benefit') {
    return (
      <Notice warning>
        This rise takes your adjusted net income over {formatGBP(CHILD_BENEFIT_CHARGE.threshold)}.
        If you or your partner get Child Benefit, you may have to pay some of it back through the
        High Income Child Benefit Charge. That is not included in these figures.
      </Notice>
    )
  }
  if (code === 'student-loan') {
    return (
      <Notice warning>
        This rise takes you over the {STUDENT_LOAN[plan].label} threshold of{' '}
        {formatGBP(STUDENT_LOAN[plan].threshold)} a year, so student loan repayments start.
      </Notice>
    )
  }
  if (code === 'postgraduate-loan') {
    return (
      <Notice warning>
        This rise takes you over the Postgraduate Loan threshold of{' '}
        {formatGBP(STUDENT_LOAN.postgraduate.threshold)} a year, so those repayments start.
      </Notice>
    )
  }
  if (code === 'minimum-wage') {
    return (
      <Notice warning>
        A salary sacrifice cannot take your pay below the minimum wage. For the hours you entered
        that is {formatGBP(result.after.minimumCashPay)} a year at{' '}
        {formatGBPPence(MINIMUM_WAGE.nationalLivingWage)} an hour, the rate for people aged 21 and
        over. Your pension contribution has been limited to {formatGBP(result.after.pensionIntoPot)}{' '}
        a year.
      </Notice>
    )
  }
  return null
}

export default function PayRiseCalculator() {
  const [riseType, setRiseType] = useState('newSalary')
  const [plan, setPlan] = useState('none')
  const [hasPostgraduateLoan, setHasPostgraduateLoan] = useState(false)
  const [pensionType, setPensionType] = useState('salarySacrifice')

  const currentSalary = useNumberField('45000', { label: 'Your current salary' })
  const rise = useNumberField('55000', { label: riseFields[riseType].label })
  const pension = useNumberField('5', {
    label: 'Your pension contribution',
    max: 100,
    optional: true,
  })
  const hours = useNumberField(String(FULL_TIME_HOURS), {
    label: 'The hours you work a week',
    min: 1,
    max: 168,
  })

  const isSalarySacrifice = pensionType === 'salarySacrifice'
  const problem = problemWith(currentSalary, rise, pension, ...(isSalarySacrifice ? [hours] : []))

  const current = currentSalary.value
  const next = Math.max(0, newSalaryFrom(current, riseType, rise.value))

  // Keep the same rise when switching how it is entered, so a new salary of
  // £55,000 does not turn into a rise of 55,000%.
  const changeRiseType = (type) => {
    // Whole pounds for amounts, and enough decimal places on a percentage
    // that switching back gives the same number of pounds.
    const amounts = {
      newSalary: Math.round(next),
      percent: current > 0 ? Number((((next - current) / current) * 100).toFixed(4)) : 0,
      pounds: Math.round(next - current),
    }
    setRiseType(type)
    rise.setText(String(amounts[type]))
  }

  // The hours only matter for salary sacrifice. When that step is hidden, a
  // full-time week stands in for whatever was last typed there.
  const weeklyHours = hours.valid ? hours.value : FULL_TIME_HOURS

  const result = useMemo(
    () =>
      calculatePayRise({
        currentSalary: current,
        newSalary: next,
        plan,
        hasPostgraduateLoan,
        pensionPercent: pension.value,
        pensionType,
        weeklyHours,
      }),
    [current, next, plan, hasPostgraduateLoan, pension.value, pensionType, weeklyHours],
  )

  const { before, after, goesTo } = result
  const isRise = result.rise > 0
  const hasPension = after.pensionIntoPot > 0 || before.pensionIntoPot > 0
  const isReliefAtSource = pensionType === 'reliefAtSource'

  const noRise =
    !isRise &&
    'Enter a new salary that is higher than your current one to see how much of the rise you keep.'

  return (
    <CalculatorPage
      title="Pay rise calculator"
      rates={`${TAX_YEAR} rates`}
      inputs={
        <>
          <Steps>
            <NumberField
              id="current-salary"
              hint="For a year, before tax."
              before="£"
              field={currentSalary}
            />
            <SelectField
              id="rise-type"
              label="How to enter the rise"
              value={riseType}
              onChange={changeRiseType}
            >
              <option value="newSalary">As a new salary</option>
              <option value="percent">As a percentage</option>
              <option value="pounds">As an amount in pounds</option>
            </SelectField>
            <NumberField
              id="rise-amount"
              hint={riseFields[riseType].hint}
              before={riseType === 'percent' ? undefined : '£'}
              after={riseType === 'percent' ? '%' : undefined}
              decimal={riseType === 'percent'}
              field={rise}
            />
            <SelectField
              id="plan"
              label="Your student loan plan"
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
            <NumberField
              id="pension-percent"
              hint="The percentage of your salary that goes in. Leave it blank if you do not pay into a pension."
              after="%"
              decimal
              size="short"
              optional
              field={pension}
            />
            <SelectField
              id="pension-type"
              label="How your pension is taken"
              hint="The guide below explains the three types."
              value={pensionType}
              onChange={setPensionType}
            >
              {Object.entries(PENSION_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            {isSalarySacrifice && (
              <NumberField
                id="weekly-hours"
                hint="A salary sacrifice cannot take your pay below the minimum wage for these hours."
                decimal
                size="short"
                field={hours}
              />
            )}
          </Steps>

          <Notice>
            This uses the rates for England, Wales and Northern Ireland. Scotland has different
            income tax bands and is not covered. Your pension is worked out as a percentage of your
            full salary, and money your employer pays in is left out because it does not change your
            take-home pay.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label="You keep"
            figure={formatGBP(result.kept)}
            detail={
              <>
                a year from a {formatGBP(result.rise)} rise, which is {percent(result.keptShare)} of
                it
              </>
            }
            prompt={problem ?? noRise}
          >
            <table className="result-table result-table--total">
              <caption>Where the {formatGBP(result.rise)} goes each year</caption>
              <tbody>
                <tr>
                  <th scope="row">Income tax</th>
                  <td>{formatGBP(goesTo.incomeTax)}</td>
                </tr>
                <tr>
                  <th scope="row">National Insurance</th>
                  <td>{formatGBP(goesTo.nationalInsurance)}</td>
                </tr>
                <tr>
                  <th scope="row">Student loan</th>
                  <td>{formatGBP(goesTo.studentLoan)}</td>
                </tr>
                <tr>
                  <th scope="row">Your pension</th>
                  <td>{formatGBP(goesTo.pension)}</td>
                </tr>
                <tr>
                  <th scope="row">You keep</th>
                  <td>{formatGBP(result.kept)}</td>
                </tr>
              </tbody>
            </table>

            {hasPension && isReliefAtSource && (
              <p className="result__note">
                With relief at source, HMRC adds {formatGBP(after.hmrcTopUp)} a year to your pension
                on top of the {formatGBP(after.pensionFromPay)} from your pay.{' '}
                {after.extraReliefToClaim > 0 && (
                  <>
                    You can also claim {formatGBP(after.extraReliefToClaim)} a year in extra relief
                    from HMRC, which is not in your take-home pay above.
                  </>
                )}
              </p>
            )}
          </ResultPanel>

          {!problem &&
            result.warnings.map((code) => (
              <Warning key={code} code={code} result={result} plan={plan} />
            ))}
        </>
      }
      breakdown={
        !problem && (
          <div className="breakdown__tables">
            <table className="result-table">
              <caption>Take-home pay, now and after the rise</caption>
              <thead>
                <tr>
                  <td></td>
                  <th scope="col">Now</th>
                  <th scope="col">After</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Salary</th>
                  <td>{formatGBP(before.salary)}</td>
                  <td>{formatGBP(after.salary)}</td>
                </tr>
                <tr>
                  <th scope="row">Take-home a year</th>
                  <td>{formatGBP(before.takeHomeAnnual)}</td>
                  <td>{formatGBP(after.takeHomeAnnual)}</td>
                </tr>
                <tr>
                  <th scope="row">Take-home a month</th>
                  <td>{formatGBP(before.takeHomeMonthly)}</td>
                  <td>{formatGBP(after.takeHomeMonthly)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      }
      guide={<PayRiseGuide />}
      related={['/salary-calculator', '/student-loan-calculator', '/minimum-wage-calculator']}
    />
  )
}
