import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { NumberField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import { numberInput, problemWith, useCalculatorState } from '../components/useCalculatorState'
import ISAGuide from '../guides/ISAGuide'
import { calculateISAAllowance } from '../lib/isa'
import { CASH_ISA_CUT_SCRAPPED, ISA } from '../lib/rates/isa'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP, percent } from '../lib/format'
import { MONEY, WHOLE_YEARS } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-29'

export default function ISACalculator() {
  const state = useCalculatorState(
    {
      age: numberInput('28', { label: 'Your age', ...WHOLE_YEARS }),
      cashISA: numberInput('5,000', {
        label: 'Cash ISA',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      stocksISA: numberInput('5,000', {
        label: 'Stocks and Shares ISA',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      lisa: numberInput('4,000', {
        label: 'Lifetime ISA',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
    },
    { sharedLinks: true },
  )
  const { age, cashISA, stocksISA, lisa } = state

  const problem = problemWith(age, cashISA, stocksISA, lisa)

  const result = useMemo(
    () =>
      calculateISAAllowance({
        cashISA: cashISA.value,
        stocksISA: stocksISA.value,
        lisa: lisa.value,
        age: age.value,
      }),
    [cashISA.value, stocksISA.value, lisa.value, age.value],
  )

  // Warnings about what was entered, and notes on the result.
  const notices = []
  if (!problem && result.overallOverLimit) {
    notices.push(
      <Notice key="over-allowance" warning>
        Your total of {formatGBP(result.totalContributions)} is over the{' '}
        {formatGBP(ISA.overallAllowance)} allowance for all your ISAs in {TAX_YEAR}. You cannot pay
        in more than the allowance.
      </Notice>,
    )
  }
  if (!problem && result.lisaOverLimit) {
    notices.push(
      <Notice key="over-lisa-limit" warning>
        A Lifetime ISA has its own limit of {formatGBP(ISA.lisaLimit)} a tax year, even if you have
        allowance left overall. The figures above count only {formatGBP(ISA.lisaLimit)}.
      </Notice>,
    )
  }
  if (!problem && result.tooYoungForISA) {
    notices.push(
      <Notice key="too-young">
        You must be {ISA.minAge} or over to open an ISA, so this allowance does not apply to you
        yet. Under-18s can have a Junior ISA, which has its own separate limit.
      </Notice>,
    )
  }
  if (!problem && lisa.value > 0 && !result.tooYoungForISA && !result.lisaAllowedAtAge) {
    notices.push(
      <Notice key="lisa-age">
        You cannot pay into a Lifetime ISA once you are {ISA.lisaMaxContributionAge}, so the
        Lifetime ISA amount has been left out of the total and earns no bonus.
      </Notice>,
    )
  }
  if (!problem && lisa.value > 0 && result.lisaAllowedAtAge && !result.lisaEligibleToOpen) {
    notices.push(
      <Notice key="lisa-open">
        You can only open a new Lifetime ISA between ages {ISA.lisaMinOpenAge} and{' '}
        {ISA.lisaMaxOpenAge - 1}. If you already hold one, you can keep paying in until you are{' '}
        {ISA.lisaMaxContributionAge}. The figures above assume you already have one.
      </Notice>,
    )
  }

  return (
    <CalculatorLayout
      title="ISA & LISA allowance calculator"
      lede={`How much of your ${formatGBP(ISA.overallAllowance)} ISA allowance is left for ${TAX_YEAR}, and the government bonus on a Lifetime ISA.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="About you">
              <FieldRow>
                <NumberField id="age" hint="In whole years." field={age} />
              </FieldRow>
            </InputSection>

            <InputSection title={`What you plan to pay in during ${TAX_YEAR}`}>
              <FieldRow>
                <NumberField id="cash-isa" before="£" decimal optional field={cashISA} />
                <NumberField id="stocks-isa" before="£" decimal optional field={stocksISA} />
                <NumberField
                  id="lisa"
                  hint={`Up to ${formatGBP(ISA.lisaLimit)} a year, which counts towards your allowance.`}
                  before="£"
                  decimal
                  optional
                  field={lisa}
                />
              </FieldRow>
            </InputSection>
          </InputCard>

          <Notice>
            The planned cut to {formatGBP(CASH_ISA_CUT_SCRAPPED.plannedCashLimit)} for cash ISAs
            from {CASH_ISA_CUT_SCRAPPED.wouldHaveStarted} was scrapped at Budget 2026. The limit
            stays at {formatGBP(ISA.overallAllowance)}, so you can still put it all in cash. This
            calculator uses the {TAX_YEAR} rules.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label={`Allowance left for ${TAX_YEAR}`}
          figures={[
            {
              value: formatGBP(result.remainingAllowance),
              per: `of your ${formatGBP(ISA.overallAllowance)} allowance`,
            },
            { value: formatGBP(result.lisaBonus), per: 'Lifetime ISA bonus' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <table className="result-table result-table--total">
            <tbody>
              <tr>
                <th scope="row">Overall allowance</th>
                <td>{formatGBP(ISA.overallAllowance)}</td>
              </tr>
              <tr>
                <th scope="row">Total you plan to pay in</th>
                <td>{formatGBP(result.totalContributions)}</td>
              </tr>
              <tr>
                <th scope="row">Allowance left</th>
                <td>{formatGBP(result.remainingAllowance)}</td>
              </tr>
            </tbody>
          </table>
          <p className="result-card__line">
            The government adds a {percent(ISA.lisaBonusRate)} bonus to what you pay into a Lifetime
            ISA, on up to {formatGBP(ISA.lisaLimit)} a year.
          </p>
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : result.working}
      guide={<ISAGuide />}
      guides={[
        '/guides/first-time-buyer-isa-vs-lifetime-isa',
        '/guides/cash-isa-changes-april-2027',
        '/guides/budget-2026',
        '/guides/overpay-mortgage-or-save',
      ]}
      related={[
        '/lifetime-isa-calculator',
        '/savings-interest-tax-calculator',
        '/mortgage-overpayment-calculator',
      ]}
    />
  )
}
