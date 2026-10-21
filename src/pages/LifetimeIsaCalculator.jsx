import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import LifetimeIsaGuide from '../guides/LifetimeIsaGuide'
import { ISA, LIFETIME_ISA_REFORM } from '../lib/rates/isa'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP, percent } from '../lib/format'
import { contributionAs, projectLifetimeIsa } from '../lib/lifetimeIsa'
import { MAX_AGE } from '../lib/validation'

const amountFields = {
  monthly: { label: 'The amount you pay in each month' },
  yearly: { label: 'The amount you pay in each year' },
}

export default function LifetimeIsaCalculator() {
  const { lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA
  const { lisaMaxContributionAge, lisaAccessAge, lisaWithdrawalChargeRate } = ISA
  const { lisaPropertyCap, lisaMonthsBeforePurchase, lisaTerminalIllnessMonths } = ISA

  const [frequency, setFrequency] = useState('monthly')
  const [goal, setGoal] = useState('home')

  const age = useNumberField('30', { label: 'Your age', whole: true, max: MAX_AGE })
  const balance = useNumberField('', {
    label: 'Already in your Lifetime ISA',
    name: 'what is already in your Lifetime ISA',
    optional: true,
  })
  const amount = useNumberField('200', { label: amountFields[frequency].label })
  const growth = useNumberField('4', {
    label: 'Expected growth each year',
    name: 'the expected growth',
    max: 50,
    optional: true,
  })
  const purchaseAge = useNumberField('35', {
    label: 'Your age when you buy',
    name: 'your age when you buy',
    whole: true,
    min: age.valid ? age.value + 1 : 0,
    max: MAX_AGE,
  })

  const isHome = goal === 'home'
  const problem = problemWith(age, balance, amount, growth, ...(isHome ? [purchaseAge] : []))

  // Keep the same amount when switching between monthly and yearly.
  const changeFrequency = (next) => {
    if (amount.valid && next !== frequency) {
      amount.setText(String(contributionAs(next, amount.value)))
    }
    setFrequency(next)
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

  return (
    <CalculatorPage
      title="Lifetime ISA calculator"
      rates={`${TAX_YEAR} rules`}
      inputs={
        <>
          <Steps>
            <NumberField id="age" hint="In whole years." size="short" field={age} />
            <NumberField
              id="balance"
              hint="Leave it blank if you are opening one."
              before="£"
              optional
              field={balance}
            />
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
              id="amount"
              hint={`Up to ${formatGBP(lisaLimit)} a year. The ${percent(lisaBonusRate)} bonus is added on top.`}
              before="£"
              field={amount}
            />
            <NumberField
              id="growth"
              hint="After fees. Enter 0 to leave growth out, for example for cash. Growth is not guaranteed, and investments can fall in value."
              after="%"
              decimal
              size="short"
              optional
              field={growth}
            />
            <SelectField id="goal" label="What you are saving for" value={goal} onChange={setGoal}>
              <option value="home">Your first home</option>
              <option value="retirement">{`Later life, from ${lisaAccessAge}`}</option>
            </SelectField>
            {isHome && (
              <NumberField
                id="purchase-age"
                hint={`At least a year from now. You can only use the money for a home at least ${lisaMonthsBeforePurchase} months after your first payment in.`}
                size="short"
                field={purchaseAge}
              />
            )}
          </Steps>

          <Notice>
            Years are counted from today rather than by tax year. The bonus is added when you pay
            in, and growth is the same every year. Payments and the bonus stop at{' '}
            {lisaMaxContributionAge}, or when you buy your home if that is sooner.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label={`Projected value ${atGoal}`}
            figure={formatGBP(result.value)}
            detail={
              result.payingYears > 0 ? (
                <>
                  after paying in for {result.payingYears}{' '}
                  {result.payingYears === 1 ? 'year' : 'years'}, until you are{' '}
                  {result.lastPayingAge}
                </>
              ) : (
                <>with no more payments in</>
              )
            }
            prompt={problem ?? cannotOpen}
            link={{
              to: '/isa-calculator',
              text: `Check your ISA allowance for ${TAX_YEAR}`,
            }}
          >
            <table className="result-table result-table--total">
              <tbody>
                {result.withdrawal.putIn > result.paidIn && (
                  <tr>
                    <th scope="row">Already in your Lifetime ISA</th>
                    <td>{formatGBP(result.withdrawal.putIn - result.paidIn)}</td>
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
            <p className="result__note">
              Growth is not guaranteed. Investments can go down as well as up, so you could get back
              less than you put in.
            </p>
          </ResultPanel>

          {!problem && !cannotOpen && result.overLimit && (
            <Notice warning>
              You can pay in up to {formatGBP(lisaLimit)} a year. The figures stop your payments
              once {formatGBP(lisaLimit)} has gone in each year, so they use less than you entered.
            </Notice>
          )}

          {!problem && !cannotOpen && result.pastPayingAge && (
            <Notice>
              From {lisaMaxContributionAge} you cannot pay in or get the bonus, but your account
              stays open and your savings can still grow.
            </Notice>
          )}

          {!problem && !cannotOpen && isHome && (
            <Notice>
              To use it for your first home, the home must cost {formatGBP(lisaPropertyCap)} or
              less, you must buy with a mortgage, and a conveyancer or solicitor must act for you.
              Otherwise the {percent(lisaWithdrawalChargeRate)} charge below applies.
            </Notice>
          )}

          <Notice>
            A planned change, checked on {LIFETIME_ISA_REFORM.checkedOn}: the government is planning
            a new First Time Buyer ISA, which will be offered in place of the Lifetime ISA once it
            is available. Its limits, bonus and property price cap will be announced later. Until
            then you can still open a Lifetime ISA, and anyone who has one can keep paying in under
            the current rules indefinitely. These figures use today's rules. See the{' '}
            <a
              href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation"
              target="_blank"
              rel="noreferrer"
            >
              First Time Buyer ISA consultation
            </a>{' '}
            on gov.uk.
          </Notice>
        </>
      }
      breakdown={
        !problem &&
        !cannotOpen && (
          <>
            <div className="breakdown__tables">
              <table className="result-table">
                <caption>If you took it all out {atGoal} for another reason</caption>
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
            </div>
            <p className="breakdown__note">
              The charge is {percent(lisaWithdrawalChargeRate)} of everything you take out,
              including the bonus and any growth, so with little or no growth you get back less than
              you paid in. It does not apply if you use the money for your first home, take it out
              from {lisaAccessAge}, or are terminally ill with less than {lisaTerminalIllnessMonths}{' '}
              months to live. What is already in your account counts here as money you put in.
            </p>
          </>
        )
      }
      guide={<LifetimeIsaGuide />}
      related={['/isa-calculator', '/stamp-duty-calculator', '/mortgage-overpayment-calculator']}
    />
  )
}
