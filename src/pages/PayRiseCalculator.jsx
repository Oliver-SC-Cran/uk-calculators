import { useMemo } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import RegionField from '../components/RegionField'
import { REGIONS, REST_OF_UK_NOTE, STUDENT_LOAN_PLANS } from '../components/choices'
import ResultPanel from '../components/ResultPanel'
import StudentLoanPlanField from '../components/StudentLoanPlanField'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import PayRiseGuide from '../guides/PayRiseGuide'
import {
  CHILD_BENEFIT_CHARGE,
  INCOME_TAX,
  NATIONAL_INSURANCE,
  SCOTTISH_INCOME_TAX,
} from '../lib/rates/incomeTax'
import { FULL_TIME_HOURS, MINIMUM_WAGE } from '../lib/rates/minimumWage'
import { STUDENT_LOAN } from '../lib/rates/studentLoans'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP, formatGBPPence, percent } from '../lib/format'
import { MONEY, PERCENTAGE } from '../lib/validation'
import { calculatePayRise, newSalaryFrom, riseEnteredAs } from '../lib/payRise'
import { PENSION_TYPES } from '../lib/pensions'
import { incomeTaxLabel } from '../lib/incomeTax'

// The label and hint for the rise, for each way of entering it.
const riseFields = {
  newSalary: { label: 'Your new salary', hint: 'For a year, before tax.' },
  percent: { label: 'The rise as a percentage', hint: 'A percentage of your current salary.' },
  pounds: { label: 'The rise in pounds', hint: 'For a year, before tax.' },
}

function Warning({ code, result, plan, scottish }) {
  const { basicRateLimit, taperStart, taperFullyGoneAt, basicRate, higherRate } = INCOME_TAX
  const scotland = SCOTTISH_INCOME_TAX

  if (code === 'higher-rate' && scottish) {
    return (
      <Notice warning>
        This rise takes your taxable pay over {formatGBP(scotland.intermediateRateLimit)}. The part
        above that is taxed at {percent(scotland.higherRate)}, not{' '}
        {percent(scotland.intermediateRate)}, and National Insurance stays at{' '}
        {percent(NATIONAL_INSURANCE.mainRate)} up to{' '}
        {formatGBP(NATIONAL_INSURANCE.upperEarningsLimit)}. The pay below it is taxed as before.
      </Notice>
    )
  }
  if (code === 'advanced-rate') {
    return (
      <Notice warning>
        This rise takes your taxable pay over {formatGBP(scotland.higherRateLimit)}. The part above
        that is taxed at {percent(scotland.advancedRate)}, not {percent(scotland.higherRate)}. The
        pay below it is taxed as before.
      </Notice>
    )
  }
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
  const state = useCalculatorState({
    riseType: choiceInput('newSalary', Object.keys(riseFields)),
    plan: choiceInput('none', STUDENT_LOAN_PLANS),
    hasPostgraduateLoan: checkboxInput(false),
    pensionType: choiceInput('salarySacrifice', Object.keys(PENSION_TYPES)),
    region: choiceInput('restOfUk', Object.keys(REGIONS)),
    currentSalary: numberInput('45000', { label: 'Your current salary', ...MONEY }),
    // The label says how the rise is entered.
    rise: numberInput('55000', (fields) => ({ label: riseFields[fields.riseType.value].label })),
    pension: numberInput('5', {
      label: 'Your pension contribution',
      ...PERCENTAGE,
      optional: true,
    }),
    hours: numberInput(String(FULL_TIME_HOURS), {
      label: 'The hours you work a week',
      min: 1,
      max: 168,
    }),
  })
  const { currentSalary, rise, pension, hours } = state
  const riseType = state.riseType.value
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value
  const pensionType = state.pensionType.value
  const region = state.region.value
  const scottish = region === 'scotland'

  const isSalarySacrifice = pensionType === 'salarySacrifice'
  const problem = problemWith(currentSalary, rise, pension, ...(isSalarySacrifice ? [hours] : []))

  const current = currentSalary.value
  const next = Math.max(0, newSalaryFrom(current, riseType, rise.value))

  // Keep the same rise when switching how it is entered, so a new salary of
  // £55,000 does not turn into a rise of 55,000%.
  const changeRiseType = (type) => {
    state.riseType.set(type)
    rise.setText(String(riseEnteredAs(type, current, next)))
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
        scottish,
      }),
    [current, next, plan, hasPostgraduateLoan, pension.value, pensionType, weeklyHours, scottish],
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
            <RegionField value={region} onChange={state.region.set} />
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
            <StudentLoanPlanField
              plan={plan}
              onPlanChange={state.plan.set}
              hasPostgraduateLoan={hasPostgraduateLoan}
              onPostgraduateChange={state.hasPostgraduateLoan.set}
            />
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
              onChange={state.pensionType.set}
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
            {scottish
              ? 'This uses Scottish income tax rates. National Insurance and student loans are the same across the UK.'
              : REST_OF_UK_NOTE}{' '}
            Your pension is worked out as a percentage of your full salary, and money your employer
            pays in is left out because it does not change your take-home pay.
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
                  <th scope="row">{incomeTaxLabel(scottish)}</th>
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
                {after.topTaxRate > 0 && after.topTaxRate < INCOME_TAX.basicRate && (
                  <>
                    That is {percent(INCOME_TAX.basicRate)} relief, although your top rate of income
                    tax is {percent(after.topTaxRate)}. You do not pay back the difference.
                  </>
                )}
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
              <Warning key={code} code={code} result={result} plan={plan} scottish={scottish} />
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
      guides={['/guides/100k-tax-trap']}
      related={['/salary-calculator', '/student-loan-calculator', '/minimum-wage-calculator']}
    />
  )
}
