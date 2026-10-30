import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { Chips, NumberField, SelectField, TextField } from '../components/Fields'
import { FieldRow, InputCard, InputNote, InputSection, MoreOptions } from '../components/InputCard'
import Notice from '../components/Notice'
import RegionField from '../components/RegionField'
import { REGIONS, REST_OF_UK_NOTE, STUDENT_LOAN_PLANS } from '../components/choices'
import ResultCard from '../components/ResultCard'
import StudentLoanPlanField from '../components/StudentLoanPlanField'
import TaxCodeNote from '../components/TaxCodeNote'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  textInput,
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
import { formatGBP, formatGBPPence, formatNumber, percent } from '../lib/format'
import { MONEY, PERCENTAGE } from '../lib/validation'
import { PAY_ENTERED_AS, PAY_FREQUENCIES, switchPayPer, yearlyPayFrom } from '../lib/payPeriods'
import { calculatePayRise, newSalaryFrom, riseEnteredAs } from '../lib/payRise'
import { PENSION_TYPES, switchPension } from '../lib/pensions'
import { incomeTaxLabel } from '../lib/incomeTax'
import { readTaxCode, taxRatesFor } from '../lib/readTaxCode'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-23'

const PAY_PER_NAMES = { year: 'Year', month: 'Month', week: 'Week', day: 'Day', hour: 'Hour' }
const PER_WORDS = {
  year: 'a year',
  month: 'a month',
  week: 'a week',
  day: 'a day',
  hour: 'an hour',
}

// The label for the rise, for each way of entering it.
const riseFields = {
  newSalary: { label: 'Your new salary' },
  percent: { label: 'The rise as a percentage' },
  pounds: { label: 'The rise in pounds' },
}

// Quick picks. They are common choices, not rates or advice.
const RISE_PERCENTS = [3, 5, 10].map((value) => [value, `${value}%`])
const PENSION_PERCENTS = [3, 5, 8, 10].map((value) => [value, `${value}%`])

function Warning({ code, result, plan, scottish }) {
  const { taperStart, taperFullyGoneAt, basicRate, higherRate } = INCOME_TAX
  const scotland = SCOTTISH_INCOME_TAX
  const { thresholds, after } = result

  if (code === 'higher-rate' && scottish) {
    return (
      <Notice warning>
        This rise takes your taxable pay over {formatGBP(thresholds.higherRate)}. The part above
        that is taxed at {percent(scotland.higherRate)}, not {percent(scotland.intermediateRate)},
        and National Insurance stays at {percent(NATIONAL_INSURANCE.mainRate)} up to{' '}
        {formatGBP(NATIONAL_INSURANCE.upperEarningsLimit)}. The pay below it is taxed as before.
      </Notice>
    )
  }
  if (code === 'advanced-rate') {
    return (
      <Notice warning>
        This rise takes your taxable pay over {formatGBP(thresholds.advancedRate)}. The part above
        that is taxed at {percent(scotland.advancedRate)}, not {percent(scotland.higherRate)}. The
        pay below it is taxed as before.
      </Notice>
    )
  }
  if (code === 'higher-rate') {
    return (
      <Notice warning>
        This rise takes your taxable pay over {formatGBP(thresholds.higherRate)}. The part above
        that is taxed at {percent(higherRate)}, not {percent(basicRate)}. The pay below it is taxed
        as before.
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
        {formatGBP(after.adjustedNetIncome)}, under the limit, so you can claim the allowance back
        from HMRC. It is included in the relief to claim shown above.
      </Notice>
    )
  }
  if (code === 'taper-code') {
    return (
      <Notice>
        Your income is over {formatGBP(taperStart)}, where the Personal Allowance goes down by £1
        for every £2. Payroll uses your tax code as it is, so this shows the tax your code takes. If
        your code does not allow for the smaller allowance, you will owe more tax for the year.
      </Notice>
    )
  }
  if (code === 'tax-limit') {
    return (
      <Notice>
        Your employer cannot take more than half your pay before tax in tax on any pay day. After
        the rise that leaves {formatGBP(after.taxNotTaken)} of the tax your code asks for unpaid at
        the end of the tax year, which HMRC will collect another way.
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
        that is {formatGBP(after.minimumCashPay)} a year at{' '}
        {formatGBPPence(MINIMUM_WAGE.nationalLivingWage)} an hour, the rate for people aged 21 and
        over. Your pension contribution has been limited to {formatGBP(after.pensionIntoPot)} a
        year.
      </Notice>
    )
  }
  return null
}

export default function PayRiseCalculator() {
  const state = useCalculatorState(
    {
      riseType: choiceInput('newSalary', Object.keys(riseFields)),
      plan: choiceInput('none', STUDENT_LOAN_PLANS),
      hasPostgraduateLoan: checkboxInput(false),
      pensionType: choiceInput('salarySacrifice', Object.keys(PENSION_TYPES)),
      region: choiceInput('restOfUk', Object.keys(REGIONS)),
      currentSalary: numberInput('45,000', {
        label: 'Your current salary',
        ...MONEY,
        grouped: true,
      }),
      payPer: choiceInput('year', Object.keys(PAY_ENTERED_AS)),
      days: numberInput('5', { label: 'Days you work a week', min: 0.5, max: 7 }),
      // The label says how the rise is entered. Amounts in pounds are grouped.
      rise: numberInput('55,000', (fields) => ({
        label: riseFields[fields.riseType.value].label,
        grouped: fields.riseType.value !== 'percent',
      })),
      taxCode: textInput('', { label: 'Your tax code', read: readTaxCode }),
      pensionUnit: choiceInput('percent', ['percent', 'amount']),
      pension: numberInput('5', (fields) => ({
        label: 'Your pension contribution',
        ...(fields.pensionUnit.value === 'percent' ? PERCENTAGE : { ...MONEY, grouped: true }),
        optional: true,
      })),
      hours: numberInput(String(FULL_TIME_HOURS), {
        label: 'The hours you work a week',
        min: 1,
        max: 168,
      }),
      payFrequency: choiceInput('monthly', Object.keys(PAY_FREQUENCIES)),
    },
    { sharedLinks: true },
  )
  const { currentSalary, days, rise, taxCode, pension, hours } = state
  const riseType = state.riseType.value
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value
  const pensionType = state.pensionType.value
  const region = state.region.value
  const payPer = state.payPer.value
  const pensionUnit = state.pensionUnit.value
  const payFrequency = state.payFrequency.value
  const { perYear: payDays, period } = PAY_FREQUENCIES[payFrequency]

  const code = taxCode.value
  const { scottish, welsh } = taxRatesFor(code, region)

  // The hours a week turn hourly pay into a year, and set the minimum wage a
  // salary sacrifice cannot go below. A full-time week stands in for them
  // when they are not asked.
  const hoursPerWeek = hours.valid ? hours.value : FULL_TIME_HOURS
  const daysPerWeek = days.valid ? days.value : 5
  const settings = { hoursPerWeek, daysPerWeek }

  // Pay and the rise are entered for the same period, then turned into a year.
  const currentPer = currentSalary.value
  const nextPer = Math.max(0, newSalaryFrom(currentPer, riseType, rise.value))
  const current = yearlyPayFrom(currentPer, payPer, settings)
  const next = yearlyPayFrom(nextPer, payPer, settings)

  const isSalarySacrifice = pensionType === 'salarySacrifice'
  const hasPension = pension.valid && pension.value > 0
  // The hours are asked under the pay when pay is hourly, and under "More
  // options" when a salary sacrifice needs them for the minimum wage check.
  const asksHoursInOptions = payPer !== 'hour' && isSalarySacrifice && hasPension

  const problem = problemWith(
    ...[
      currentSalary,
      payPer === 'hour' && hours,
      payPer === 'day' && days,
      rise,
      taxCode,
      pension,
      asksHoursInOptions && hours,
    ].filter(Boolean),
  )

  const result = useMemo(
    () =>
      calculatePayRise({
        currentSalary: current,
        newSalary: next,
        plan,
        hasPostgraduateLoan,
        pensionPercent: pensionUnit === 'percent' ? pension.value : 0,
        pensionYearlyAmount: pensionUnit === 'amount' ? pension.value * payDays : 0,
        pensionType,
        weeklyHours: hoursPerWeek,
        scottish,
        welsh,
        taxCode: code,
        payFrequency,
      }),
    [
      current,
      next,
      plan,
      hasPostgraduateLoan,
      pensionUnit,
      pension.value,
      payDays,
      pensionType,
      hoursPerWeek,
      scottish,
      welsh,
      code,
      payFrequency,
    ],
  )

  // Keep the same rise when switching how it is entered, so a new salary of
  // £55,000 does not turn into a rise of 55,000%.
  const changeRiseType = (type) => {
    state.riseType.set(type)
    rise.setText(String(riseEnteredAs(type, currentPer, nextPer, payPer === 'year' ? 0 : 2)))
  }

  // Keep the same pay and rise when switching what they are entered for, so
  // £45,000 a year becomes £3,750 a month and not £45,000 a month. The exact
  // amounts are kept, so switching back gives £45,000 again.
  const changePayPer = (per) => {
    const switchField = (field) => {
      const switched = switchPayPer({
        amount: field.value,
        from: payPer,
        to: per,
        settings,
        typed: field.typed,
      })
      field.setExact(switched.amount, switched.typed)
    }
    if (currentSalary.valid && current > 0) {
      switchField(currentSalary)
      if (riseType !== 'percent' && rise.valid) switchField(rise)
    }
    state.payPer.set(per)
  }

  // The same for the pension, between a percentage and an amount each pay
  // day, and for an amount each pay day when pay days change.
  const changePension = (toUnit, toPayDays) => {
    if (hasPension && current > 0) {
      const switched = switchPension({
        amount: pension.value,
        unit: pensionUnit,
        payDays,
        pay: current,
        toUnit,
        toPayDays,
        typed: pension.typed,
      })
      pension.setExact(switched.amount, switched.typed)
    }
  }
  const changePensionUnit = (unit) => {
    changePension(unit, payDays)
    state.pensionUnit.set(unit)
  }
  const changePayFrequency = (frequency) => {
    if (pensionUnit === 'amount') changePension('amount', PAY_FREQUENCIES[frequency].perYear)
    state.payFrequency.set(frequency)
  }

  const { before, after, goesTo } = result
  const isRise = result.rise > 0
  const showsPension = after.pensionIntoPot > 0 || before.pensionIntoPot > 0
  const isReliefAtSource = pensionType === 'reliefAtSource'
  const taxName = incomeTaxLabel(scottish, welsh)

  const noRise =
    !isRise &&
    'Enter a new salary that is higher than your current one to see how much of the rise you keep.'
  const shows = !problem && !noRise

  const optionsSummary = [
    `Paid ${payFrequency}`,
    asksHoursInOptions && `${formatNumber(hoursPerWeek)} hours a week`,
  ]
    .filter(Boolean)
    .join(' · ')

  const goesRow = (label, amount) => (
    <tr>
      <th scope="row">{label}</th>
      <td>{formatGBP(amount)}</td>
      <td>{formatGBP(amount / 12)}</td>
    </tr>
  )

  // Shown with the result, and on its own for a pay cut, where there is no
  // rise to share out but take-home pay still changes.
  const takeHomeTable = (
    <table className="result-table result-table--columns">
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
  )

  const notices = []
  if (!problem) {
    for (const warning of result.warnings) {
      notices.push(
        <Warning key={warning} code={warning} result={result} plan={plan} scottish={scottish} />,
      )
    }
    if (after.moreThanPay || before.moreThanPay) {
      notices.push(
        <Notice key="more-than-pay" warning>
          What you pay into your pension is more than your pay, so it has been limited to your pay.
        </Notice>,
      )
    }
  }

  return (
    <CalculatorLayout
      title="Pay rise calculator"
      lede={`How much of a pay rise you keep after income tax, National Insurance, student loan and pension in ${TAX_YEAR}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your pay">
              <FieldRow tight>
                <NumberField id="current-salary" before="£" decimal field={currentSalary} />
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

            <InputSection title="Your rise">
              <FieldRow>
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
                  hint={
                    riseType === 'percent'
                      ? 'A percentage of your current salary.'
                      : `For ${PER_WORDS[payPer]}, before tax.`
                  }
                  before={riseType === 'percent' ? undefined : '£'}
                  after={riseType === 'percent' ? '%' : undefined}
                  decimal
                  field={rise}
                  below={
                    riseType === 'percent' && (
                      <Chips
                        label="Common rises"
                        options={RISE_PERCENTS}
                        current={rise.text}
                        onPick={rise.setText}
                      />
                    )
                  }
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Tax">
              <FieldRow>
                <RegionField value={region} onChange={state.region.set} size="full" />
                <TextField
                  id="tax-code"
                  optional
                  hint={`On your payslip. Leave it blank to use the standard Personal Allowance of ${formatGBP(INCOME_TAX.personalAllowance)}.`}
                  describe={code ? 'tax-code-note' : undefined}
                  field={taxCode}
                />
              </FieldRow>
              {code && (
                <InputNote id="tax-code-note">
                  <TaxCodeNote code={code} region={region} />
                </InputNote>
              )}
            </InputSection>

            <InputSection title="Pension">
              <FieldRow>
                <NumberField
                  id="pension"
                  before={pensionUnit === 'amount' ? '£' : undefined}
                  after={pensionUnit === 'percent' ? '%' : undefined}
                  decimal
                  optional
                  hint="Leave it blank if you do not pay in."
                  field={pension}
                  below={
                    pensionUnit === 'percent' && (
                      <Chips
                        label="Common percentages"
                        options={PENSION_PERCENTS}
                        current={pension.text}
                        onPick={pension.setText}
                      />
                    )
                  }
                />
                <SelectField
                  id="pension-unit"
                  label="Paid as"
                  value={pensionUnit}
                  onChange={changePensionUnit}
                >
                  <option value="percent">A percentage of pay</option>
                  <option value="amount">Pounds a {period}</option>
                </SelectField>
                <SelectField
                  id="pension-type"
                  label="How it is taken"
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

            <MoreOptions summary={optionsSummary}>
              <FieldRow>
                <SelectField
                  id="pay-frequency"
                  label="How often you are paid"
                  hint="National Insurance and student loan are worked out on each pay day."
                  value={payFrequency}
                  onChange={changePayFrequency}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </SelectField>
                {asksHoursInOptions && (
                  <NumberField
                    id="hours-options"
                    decimal
                    hint="A salary sacrifice cannot take your pay below the minimum wage for these hours."
                    field={hours}
                  />
                )}
              </FieldRow>
            </MoreOptions>
          </InputCard>

          <Notice>
            {scottish
              ? 'This uses Scottish income tax rates. National Insurance and student loans are the same across the UK.'
              : REST_OF_UK_NOTE}{' '}
            It works out each salary the way the take-home pay calculator does, and assumes you are
            paid the same on every pay day for the whole tax year. Money your employer pays into
            your pension is left out because it does not change your take-home pay.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="You keep"
          figures={[
            { value: formatGBP(result.kept), per: 'a year' },
            { value: formatGBP(result.kept / 12), per: 'a month' },
          ]}
          prompt={problem ?? noRise}
          withPrompt={!problem && noRise && takeHomeTable}
          shareLink={state.shareLink}
        >
          <p className="result-card__line">
            You keep {percent(result.keptShare)} of your {formatGBP(result.rise)} rise.
          </p>
          <div className="table-scroll">
            <table className="result-table result-table--total result-table--columns">
              <caption>Where the {formatGBP(result.rise)} goes</caption>
              <thead>
                <tr>
                  <td></td>
                  <th scope="col">Year</th>
                  <th scope="col">Month</th>
                </tr>
              </thead>
              <tbody>
                {goesRow(taxName, goesTo.incomeTax)}
                {goesRow('National Insurance', goesTo.nationalInsurance)}
                {goesRow('Student loan', goesTo.studentLoan)}
                {goesRow('Your pension', goesTo.pension)}
                {goesRow('You keep', result.kept)}
              </tbody>
            </table>
          </div>

          {takeHomeTable}

          {showsPension && isReliefAtSource && (
            <p className="result-card__line">
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
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={shows ? result.working : null}
      guide={<PayRiseGuide />}
      guides={['/guides/100k-tax-trap', '/guides/budget-2026']}
      related={['/salary-calculator', '/student-loan-calculator', '/minimum-wage-calculator']}
    />
  )
}
