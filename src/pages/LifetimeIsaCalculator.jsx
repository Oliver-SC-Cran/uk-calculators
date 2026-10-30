import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { Chips, NumberField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import {
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import LifetimeIsaGuide from '../guides/LifetimeIsaGuide'
import { ISA, LIFETIME_ISA_REFORM } from '../lib/rates/isa'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP, formatGBPPence, percent } from '../lib/format'
import { projectLifetimeIsa, switchContribution } from '../lib/lifetimeIsa'
import { MONEY, WHOLE_YEARS } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-29'

// Quick picks for what is paid in. They are common amounts, not advice. The
// last one each month is the most that keeps within the yearly limit.
const mostEachMonth = Math.floor((ISA.lisaLimit / 12) * 100) / 100
const amountChoice = (value) => [
  value,
  Number.isInteger(value) ? formatGBP(value) : formatGBPPence(value),
]
const AMOUNTS = {
  monthly: [50, 100, 200, mostEachMonth].map(amountChoice),
  yearly: [1000, 2000, ISA.lisaLimit].map(amountChoice),
}

export default function LifetimeIsaCalculator() {
  const { lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA
  const { lisaMaxContributionAge, lisaAccessAge, lisaWithdrawalChargeRate } = ISA
  const { lisaPropertyCap, lisaMonthsBeforePurchase, lisaTerminalIllnessMonths } = ISA
  const { lisaOverCapChargeRate, lisaOverCapChargeFrom } = ISA

  const state = useCalculatorState(
    {
      frequency: choiceInput('monthly', Object.keys(AMOUNTS)),
      goal: choiceInput('home', ['home', 'retirement']),
      age: numberInput('30', { label: 'Your age', ...WHOLE_YEARS }),
      balance: numberInput('', {
        label: 'Already in your Lifetime ISA',
        name: 'what is already in your Lifetime ISA',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      // The box says "a month" or "a year", so the label does not need to.
      amount: numberInput('200', {
        label: 'What you pay in',
        name: 'the amount you pay in',
        ...MONEY,
        grouped: true,
      }),
      growth: numberInput('4', {
        label: 'Expected growth each year',
        name: 'the expected growth',
        max: 50,
        optional: true,
      }),
      // At least a year older than the age entered above.
      purchaseAge: numberInput('35', (fields) => ({
        label: 'Your age when you buy',
        name: 'your age when you buy',
        ...WHOLE_YEARS,
        min: fields.age.valid ? fields.age.value + 1 : 0,
      })),
    },
    { sharedLinks: true },
  )
  const { age, balance, amount, growth, purchaseAge } = state
  const frequency = state.frequency.value
  const goal = state.goal.value

  const isHome = goal === 'home'
  const problem = problemWith(age, balance, amount, growth, ...(isHome ? [purchaseAge] : []))

  // Keep the same amount when switching between monthly and yearly.
  const changeFrequency = (next) => {
    if (amount.valid && next !== frequency) {
      const switched = switchContribution({
        amount: amount.value,
        from: frequency,
        to: next,
        typed: amount.typed,
      })
      amount.setExact(switched.amount, switched.typed)
    }
    state.frequency.set(next)
  }

  const result = useMemo(
    () =>
      projectLifetimeIsa({
        age: age.value,
        currentBalance: balance.value,
        contribution: amount.value,
        frequency,
        growthPercent: growth.value,
        goal,
        purchaseAge: purchaseAge.value,
      }),
    [age.value, balance.value, amount.value, frequency, growth.value, goal, purchaseAge.value],
  )

  // Ages at which there is nothing to show.
  const cannotOpen =
    (result.tooYoung &&
      `You must be ${lisaMinOpenAge} or over to open a Lifetime ISA. Enter your age to see a projection.`) ||
    (result.tooOldToOpen &&
      `You can only open a Lifetime ISA before you are ${lisaMaxOpenAge}. If you already have one, enter what is in it.`) ||
    (!isHome &&
      result.years === 0 &&
      `From ${lisaAccessAge} you can take your savings out without a charge.`)

  const atGoal = isHome ? `when you buy at ${result.goalAge}` : `at ${lisaAccessAge}`
  const { withdrawal } = result
  const shows = !problem && !cannotOpen

  // Warnings about what was entered, and notes on the result. The note on the
  // First Time Buyer ISA is always shown.
  const notices = []
  if (shows && result.overLimit) {
    notices.push(
      <Notice key="over-limit" warning>
        You can pay in up to {formatGBP(lisaLimit)} a year. The figures stop your payments once{' '}
        {formatGBP(lisaLimit)} has gone in each year, so they use less than you entered.
      </Notice>,
    )
  }
  if (shows && result.pastPayingAge) {
    notices.push(
      <Notice key="past-paying-age">
        From {lisaMaxContributionAge} you cannot pay in or get the bonus, but your account stays
        open and your savings can still grow.
      </Notice>,
    )
  }
  if (shows && isHome) {
    notices.push(
      <Notice key="home">
        To use it for your first home with no charge, the home must cost{' '}
        {formatGBP(lisaPropertyCap)} or less, you must buy with a mortgage, and a conveyancer or
        solicitor must act for you. From {lisaOverCapChargeFrom}, a home that costs more but meets
        the other rules has a {percent(lisaOverCapChargeRate)} charge, which takes back the bonus
        and leaves what you paid in. Otherwise the {percent(lisaWithdrawalChargeRate)} charge
        applies.
      </Notice>,
    )
  }
  notices.push(
    <Notice key="reform">
      Checked on {LIFETIME_ISA_REFORM.checkedOn}: from {LIFETIME_ISA_REFORM.firstTimeBuyerIsa.from},
      a new First Time Buyer ISA replaces the Lifetime ISA for new savers. A Lifetime ISA opened
      before then carries on under the current rules, which these figures use. See HM Treasury's{' '}
      <a
        href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation"
        target="_blank"
        rel="noreferrer"
      >
        response on the First Time Buyer ISA
      </a>{' '}
      on gov.uk.
    </Notice>,
  )

  return (
    <CalculatorLayout
      title="Lifetime ISA calculator: bonus, savings and withdrawal charge"
      lede={`What a Lifetime ISA could grow to with the ${percent(lisaBonusRate)} government bonus, and what you would get back after the ${percent(lisaWithdrawalChargeRate)} withdrawal charge, using the ${TAX_YEAR} rules.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="About you">
              <FieldRow>
                <NumberField id="age" hint="In whole years." field={age} />
                <NumberField
                  id="balance"
                  hint="Leave it blank if you are opening one."
                  before="£"
                  decimal
                  optional
                  field={balance}
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Paying in">
              <FieldRow>
                <NumberField
                  id="amount"
                  hint={`Up to ${formatGBP(lisaLimit)} a year. The ${percent(lisaBonusRate)} bonus is added on top.`}
                  before="£"
                  after={frequency === 'monthly' ? 'a month' : 'a year'}
                  decimal
                  size="full"
                  field={amount}
                  below={
                    <Chips
                      label={frequency === 'monthly' ? 'Common monthly amounts' : 'Common amounts'}
                      options={AMOUNTS[frequency]}
                      current={amount.text}
                      onPick={amount.setText}
                    />
                  }
                />
              </FieldRow>
              <FieldRow>
                <SelectField
                  id="frequency"
                  label="How often you pay in"
                  value={frequency}
                  onChange={changeFrequency}
                >
                  <option value="monthly">Each month</option>
                  <option value="yearly">Once a year</option>
                </SelectField>
                <NumberField
                  id="growth"
                  hint="After fees. Enter 0 to leave growth out, for example for cash. Growth is not guaranteed, and investments can fall in value."
                  after="%"
                  decimal
                  optional
                  field={growth}
                />
              </FieldRow>
            </InputSection>

            <InputSection title="What you are saving for">
              <FieldRow>
                <SelectField id="goal" label="Your goal" value={goal} onChange={state.goal.set}>
                  <option value="home">Your first home</option>
                  <option value="retirement">{`Later life, from ${lisaAccessAge}`}</option>
                </SelectField>
                {isHome && (
                  <NumberField
                    id="purchase-age"
                    hint={`At least a year from now. You can only use the money for a home at least ${lisaMonthsBeforePurchase} months after your first payment in.`}
                    field={purchaseAge}
                  />
                )}
              </FieldRow>
            </InputSection>
          </InputCard>

          <Notice>
            Years are counted from today rather than by tax year. The bonus is added when you pay
            in, and growth is the same every year. Payments and the bonus stop at{' '}
            {lisaMaxContributionAge}, or when you buy your home if that is sooner.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="Projected value"
          figures={[
            { value: formatGBP(result.value), per: atGoal },
            { value: formatGBP(result.bonus), per: 'government bonus' },
          ]}
          prompt={problem ?? cannotOpen}
          shareLink={state.shareLink}
        >
          <p className="result-card__line">
            {result.payingYears > 0 ? (
              <>
                After paying in for {result.payingYears}{' '}
                {result.payingYears === 1 ? 'year' : 'years'}, until you are {result.lastPayingAge}.
              </>
            ) : (
              <>With no more payments in.</>
            )}
          </p>
          <table className="result-table result-table--total">
            <tbody>
              {withdrawal.putIn > result.paidIn && (
                <tr>
                  <th scope="row">Already in your Lifetime ISA</th>
                  <td>{formatGBP(withdrawal.putIn - result.paidIn)}</td>
                </tr>
              )}
              <tr>
                <th scope="row">You pay in</th>
                <td>{formatGBP(result.paidIn)}</td>
              </tr>
              <tr>
                <th scope="row">Government bonus</th>
                <td>{formatGBP(result.bonus)}</td>
              </tr>
              <tr>
                <th scope="row">Growth</th>
                <td>{formatGBP(result.growth)}</td>
              </tr>
              <tr>
                <th scope="row">Projected value</th>
                <td>{formatGBP(result.value)}</td>
              </tr>
            </tbody>
          </table>
          <p className="result-card__line">
            Growth is not guaranteed. Investments can go down as well as up, so you could get back
            less than you put in.
          </p>

          <section className="result-card__section" aria-labelledby="withdrawal-heading">
            <h3 id="withdrawal-heading">Withdrawing for another reason</h3>
            <table className="result-table">
              <caption>If you took it all out {atGoal}</caption>
              <tbody>
                <tr>
                  <th scope="row">Projected value</th>
                  <td>{formatGBP(result.value)}</td>
                </tr>
                <tr>
                  <th scope="row">{percent(lisaWithdrawalChargeRate)} withdrawal charge</th>
                  <td>{formatGBP(-withdrawal.charge || 0)}</td>
                </tr>
                <tr>
                  <th scope="row">You would get</th>
                  <td>{formatGBP(withdrawal.afterCharge)}</td>
                </tr>
                <tr>
                  <th scope="row">You put in</th>
                  <td>{formatGBP(withdrawal.putIn)}</td>
                </tr>
                <tr>
                  <th scope="row">
                    {withdrawal.shortfall > 0 ? 'Less than you put in' : 'More than you put in'}
                  </th>
                  <td>{formatGBP(Math.abs(withdrawal.shortfall))}</td>
                </tr>
              </tbody>
            </table>
            <p className="result-card__line">
              The charge is {percent(lisaWithdrawalChargeRate)} of everything you take out,
              including the bonus and any growth, so with little or no growth you get back less than
              you paid in. It does not apply if you use the money for your first home, take it out
              from {lisaAccessAge}, or are terminally ill with less than {lisaTerminalIllnessMonths}{' '}
              months to live. A first home over {formatGBP(lisaPropertyCap)} has a{' '}
              {percent(lisaOverCapChargeRate)} charge instead. What is already in your account
              counts here as money you put in.
            </p>
          </section>
        </ResultCard>
      }
      notices={notices}
      working={shows ? result.working : null}
      guide={<LifetimeIsaGuide />}
      guides={['/guides/budget-2026']}
      related={['/isa-calculator', '/stamp-duty-calculator', '/mortgage-overpayment-calculator']}
    />
  )
}
