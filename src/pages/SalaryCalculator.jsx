import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, Chips, NumberField, SelectField, TextField } from '../components/Fields'
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
import TakeHomePayGuide from '../guides/TakeHomePayGuide'
import { formatDeduction, formatGBP, formatGBPPence, percent } from '../lib/format'
import { PAY_ENTERED_AS, PAY_FREQUENCIES, switchPayPer } from '../lib/payPeriods'
import { PENSION_TYPES, switchPension } from '../lib/pensions'
import { CHILD_BENEFIT_CHARGE, INCOME_TAX } from '../lib/rates/incomeTax'
import { FULL_TIME_HOURS, MINIMUM_WAGE } from '../lib/rates/minimumWage'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { readTaxCode, taxRatesFor } from '../lib/readTaxCode'
import { calculateTakeHomePay } from '../lib/takeHome'
import { MONEY, PERCENTAGE } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-23'

const PAY_PER_NAMES = { year: 'Year', month: 'Month', week: 'Week', day: 'Day', hour: 'Hour' }

// Quick picks for the pension step. They are common choices, not rates.
const PENSION_PERCENTS = [3, 5, 8, 10].map((value) => [value, `${value}%`])

export default function SalaryCalculator() {
  const state = useCalculatorState(
    {
      pay: numberInput('35,000', { label: 'Your pay before tax', ...MONEY, grouped: true }),
      payPer: choiceInput('year', Object.keys(PAY_ENTERED_AS)),
      hours: numberInput(String(FULL_TIME_HOURS), {
        label: 'Hours you work a week',
        min: 1,
        max: 168,
      }),
      days: numberInput('5', { label: 'Days you work a week', min: 0.5, max: 7 }),
      bonus: numberInput('', { label: 'A one-off bonus', ...MONEY, optional: true, grouped: true }),
      region: choiceInput('restOfUk', Object.keys(REGIONS)),
      taxCode: textInput('', { label: 'Your tax code', read: readTaxCode }),
      pensionUnit: choiceInput('percent', ['percent', 'amount']),
      pension: numberInput('', (fields) => ({
        label: 'Your contribution',
        ...(fields.pensionUnit.value === 'percent' ? PERCENTAGE : MONEY),
        optional: true,
      })),
      pensionType: choiceInput('salarySacrifice', Object.keys(PENSION_TYPES)),
      plan: choiceInput('none', STUDENT_LOAN_PLANS),
      hasPostgraduateLoan: checkboxInput(false),
      payFrequency: choiceInput('monthly', Object.keys(PAY_FREQUENCIES)),
      statePensionAge: checkboxInput(false),
    },
    { sharedLinks: true },
  )
  const { pay, hours, days, bonus, taxCode, pension } = state
  const payPer = state.payPer.value
  const region = state.region.value
  const pensionUnit = state.pensionUnit.value
  const pensionType = state.pensionType.value
  const plan = state.plan.value
  const hasPostgraduateLoan = state.hasPostgraduateLoan.value
  const payFrequency = state.payFrequency.value
  const statePensionAge = state.statePensionAge.value

  const { perYear: payDays, period } = PAY_FREQUENCIES[payFrequency]
  const hoursPerWeek = hours.valid ? hours.value : FULL_TIME_HOURS
  const daysPerWeek = days.valid ? days.value : 5
  const settings = { hoursPerWeek, daysPerWeek }
  const isSalarySacrifice = pensionType === 'salarySacrifice'
  const hasPension = pension.valid && pension.value > 0
  // The hours a week are asked under the pay when pay is hourly, and under
  // "More options" when a salary sacrifice needs them for the minimum wage check.
  const asksHoursInOptions = payPer !== 'hour' && isSalarySacrifice && hasPension

  const problem = problemWith(
    ...[
      pay,
      payPer === 'hour' && hours,
      payPer === 'day' && days,
      bonus,
      taxCode,
      pension,
      asksHoursInOptions && hours,
    ].filter(Boolean),
  )

  const code = taxCode.value
  const { scottish, welsh } = taxRatesFor(code, region)

  const result = calculateTakeHomePay({
    pay: pay.value,
    payPer,
    hoursPerWeek,
    daysPerWeek,
    bonus: bonus.value,
    payFrequency,
    taxCode: code,
    scottish,
    welsh,
    pensionType,
    pensionPercent: pensionUnit === 'percent' ? pension.value : 0,
    pensionYearlyAmount: pensionUnit === 'amount' ? pension.value * payDays : 0,
    weeklyHours: hoursPerWeek,
    plan,
    hasPostgraduateLoan,
    paysNationalInsurance: !statePensionAge,
  })

  // Keep the same pay when switching what it is entered for, so £35,000 a
  // year becomes £2,916.67 a month and not £35,000 a month. The exact amount
  // is kept, so switching back gives £35,000 again.
  const changePayPer = (per) => {
    if (pay.valid && pay.value > 0) {
      const next = switchPayPer({
        amount: pay.value,
        from: payPer,
        to: per,
        settings,
        typed: pay.typed,
      })
      pay.setExact(next.amount, next.typed)
    }
    state.payPer.set(per)
  }

  // The same for the pension, between a percentage and an amount each pay
  // day, and for an amount each pay day when pay days change.
  const changePension = (toUnit, toPayDays) => {
    if (hasPension && result.pay > 0) {
      const next = switchPension({
        amount: pension.value,
        unit: pensionUnit,
        payDays,
        pay: result.pay,
        toUnit,
        toPayDays,
        typed: pension.typed,
      })
      pension.setExact(next.amount, next.typed)
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

  const hasLoan = plan !== 'none' || hasPostgraduateLoan
  const showsPension = result.pension.pensionFromPay > 0
  const columns = [result.columns.year, result.columns.month, result.columns.week]
  const row = (label, pick, deduction = true) => (
    <tr>
      <th scope="row">{label}</th>
      {columns.map((column, index) => (
        <td key={index}>{deduction ? formatDeduction(pick(column)) : formatGBP(pick(column))}</td>
      ))}
    </tr>
  )

  const optionsSummary = [
    `Paid ${payFrequency === 'monthly' ? 'monthly' : 'weekly'}`,
    statePensionAge && 'No National Insurance',
  ]
    .filter(Boolean)
    .join(' · ')

  const notices = problem ? null : (
    <ResultNotices result={result} hasBonus={Boolean(result.bonus)} />
  )

  return (
    <CalculatorLayout
      title="Take-home pay calculator"
      lede={`Your pay after income tax, National Insurance, pension and student loan for ${TAX_YEAR}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your pay">
              <FieldRow tight>
                <NumberField id="pay" before="£" decimal field={pay} />
                <SelectField id="pay-per" label="Per" value={payPer} onChange={changePayPer}>
                  {Object.keys(PAY_ENTERED_AS).map((per) => (
                    <option key={per} value={per}>
                      {PAY_PER_NAMES[per]}
                    </option>
                  ))}
                </SelectField>
              </FieldRow>
              <FieldRow>
                {payPer === 'hour' && <NumberField id="hours" decimal field={hours} />}
                {payPer === 'day' && <NumberField id="days" decimal field={days} />}
                <NumberField
                  id="bonus"
                  before="£"
                  decimal
                  optional
                  hint="Before tax, paid once in the tax year."
                  field={bonus}
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
              <CheckboxField
                id="state-pension-age"
                label="National Insurance"
                checked={statePensionAge}
                onChange={state.statePensionAge.set}
              >
                I have reached State Pension age, so I do not pay it
              </CheckboxField>
            </MoreOptions>
          </InputCard>

          <Notice>
            {scottish
              ? 'This uses Scottish income tax rates. National Insurance and student loans are the same across the UK.'
              : REST_OF_UK_NOTE}{' '}
            It assumes you are paid the same on every pay day for the whole tax year. Your pension
            comes from your usual pay, not your bonus.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="You take home"
          figures={[
            { value: formatGBP(result.takeHomePayDay), per: `a ${period}` },
            { value: formatGBP(result.takeHomeAnnual), per: 'a year' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <div className="table-scroll">
            <table className="result-table result-table--total result-table--columns">
              {result.bonus && <caption>Your usual pay, without the bonus</caption>}
              <thead>
                <tr>
                  <td></td>
                  <th scope="col">Year</th>
                  <th scope="col">Month</th>
                  <th scope="col">Week</th>
                </tr>
              </thead>
              <tbody>
                {row('Pay before tax', (c) => c.pay, false)}
                {row(result.incomeTaxName, (c) => c.incomeTax)}
                {row('National Insurance', (c) => c.nationalInsurance)}
                {hasLoan && row('Student loan', (c) => c.studentLoan)}
                {showsPension && row('Pension', (c) => c.pension)}
                {row('Take-home pay', (c) => c.takeHome, false)}
              </tbody>
            </table>
          </div>
          <p className="result-card__line">
            Income tax and National Insurance take {percent(result.effectiveRate)} of your pay.
          </p>

          {result.bonus && (
            <>
              <table className="result-table result-table--total">
                <caption>Your {formatGBP(result.bonus.amount)} bonus</caption>
                <tbody>
                  <tr>
                    <th scope="row">{result.incomeTaxName}</th>
                    <td>{formatDeduction(result.bonus.incomeTax)}</td>
                  </tr>
                  <tr>
                    <th scope="row">National Insurance</th>
                    <td>{formatDeduction(result.bonus.nationalInsurance)}</td>
                  </tr>
                  {hasLoan && (
                    <tr>
                      <th scope="row">Student loan</th>
                      <td>{formatDeduction(result.bonus.studentLoan)}</td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row">You keep</th>
                    <td>{formatGBP(result.bonus.kept)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="result-card__line">
                With your bonus, you take home {formatGBP(result.takeHomeWithBonus)} in {TAX_YEAR}.
              </p>
            </>
          )}

          {result.pension.pensionType === 'reliefAtSource' && result.pension.hmrcTopUp > 0 && (
            <p className="result-card__line">
              With relief at source, HMRC adds {formatGBP(result.pension.hmrcTopUp)} a year to your
              pension on top of the {formatGBP(result.pension.pensionFromPay)} from your pay.
              {result.extraReliefToClaim > 0 && (
                <>
                  {' '}
                  You can also claim {formatGBP(result.extraReliefToClaim)} a year in extra relief
                  from HMRC, which is not in your take-home pay.
                </>
              )}
            </p>
          )}
        </ResultCard>
      }
      notices={notices}
      working={problem ? null : result.working}
      guide={<TakeHomePayGuide />}
      guides={['/guides/how-to-read-your-payslip', '/guides/budget-2026']}
      related={[
        '/pay-rise-calculator',
        '/self-employed-tax-calculator',
        '/student-loan-calculator',
      ]}
    />
  )
}

/** Notes on the result, and warnings about what was entered. */
function ResultNotices({ result, hasBonus }) {
  const { taperStart } = INCOME_TAX
  const notices = []
  const notTakenFromUsualPay = result.incomeTaxDue - result.incomeTax

  if (result.taxNotTaken > 0.5) {
    notices.push(
      <Notice key="limit">
        Your employer cannot take more than half your pay before tax in tax on any pay day. That
        leaves {formatGBP(result.taxNotTaken)} of the tax your code asks for unpaid at the end of
        the tax year, which HMRC will collect another way.
      </Notice>,
    )
  }
  if (hasBonus && notTakenFromUsualPay > 0.5) {
    notices.push(
      <Notice key="limit-bonus">
        Your employer cannot take more than half your pay before tax in tax on any pay day. Tax that
        could not be taken from your usual pay is taken from your bonus, so less of it is left. This
        assumes the bonus is paid on the last pay day of the tax year.
      </Notice>,
    )
  }
  if (result.codeSkipsTaper) {
    notices.push(
      <Notice key="taper-code">
        Your income is over {formatGBP(taperStart)}, where the Personal Allowance goes down by £1
        for every £2. Payroll uses your tax code as it is, so this shows the tax your code takes. If
        your code does not allow for the smaller allowance, you will owe more tax for the year.
      </Notice>,
    )
  } else if (!result.taxCode && result.personalAllowanceUsed < INCOME_TAX.personalAllowance) {
    notices.push(
      <Notice key="taper">
        Your income is over {formatGBP(taperStart)}, so your tax-free Personal Allowance is reduced
        to {formatGBP(result.personalAllowanceUsed)}. You lose £1 of it for every £2 above{' '}
        {formatGBP(taperStart)}.
      </Notice>,
    )
  }
  if (result.pension.sacrificeCapped) {
    notices.push(
      <Notice key="minimum-wage" warning>
        A salary sacrifice cannot take your pay below the minimum wage. For the hours you entered
        that is {formatGBP(result.pension.minimumCashPay)} a year at{' '}
        {formatGBPPence(MINIMUM_WAGE.nationalLivingWage)} an hour, the rate for people aged 21 and
        over. Your pension contribution has been limited to{' '}
        {formatGBP(result.pension.pensionIntoPot)} a year.
      </Notice>,
    )
  } else if (result.pension.moreThanPay) {
    notices.push(
      <Notice key="more-than-pay" warning>
        What you pay into your pension is more than your pay, so it has been limited to your pay.
      </Notice>,
    )
  }
  if (result.childBenefitCharge) {
    notices.push(
      <Notice key="child-benefit">
        Your adjusted net income is over {formatGBP(CHILD_BENEFIT_CHARGE.threshold)}. If you or your
        partner get Child Benefit, you may have to pay some of it back through the High Income Child
        Benefit Charge. That is not included here.
      </Notice>,
    )
  }
  return notices.length > 0 ? notices : null
}
