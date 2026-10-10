import { useMemo } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import ISAGuide from '../guides/ISAGuide'
import { calculateISAAllowance, ISA, TAX_YEAR } from '../lib/calculations'
import { formatGBP, percent } from '../lib/format'
import { MAX_AGE } from '../lib/validation'

export default function ISACalculator() {
  const age = useNumberField('28', { label: 'Your age', whole: true, max: MAX_AGE })
  const cashISA = useNumberField('5000', { label: 'Cash ISA', optional: true })
  const stocksISA = useNumberField('5000', { label: 'Stocks and Shares ISA', optional: true })
  const lisa = useNumberField('4000', { label: 'Lifetime ISA', optional: true })

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

  const payInHint = `What you plan to pay in during ${TAX_YEAR}.`

  return (
    <CalculatorPage
      title="ISA & LISA allowance calculator"
      rates={`${TAX_YEAR} allowances`}
      inputs={
        <>
          <Steps>
            <NumberField id="age" hint="In whole years." size="short" field={age} />
            <NumberField id="cash-isa" hint={payInHint} before="£" optional field={cashISA} />
            <NumberField id="stocks-isa" hint={payInHint} before="£" optional field={stocksISA} />
            <NumberField id="lisa" hint={payInHint} before="£" optional field={lisa} />
          </Steps>

          <Notice>
            From {ISA.cashLimitChangeDate}, people under {ISA.cashLimitFullAllowanceAge} will only
            be able to pay {formatGBP(ISA.cashLimitUnder65AfterChange)} a year into cash ISAs. This
            calculator uses the {TAX_YEAR} rules. The guide below explains the change.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label={`Allowance left for ${TAX_YEAR}`}
            figure={formatGBP(result.remainingAllowance)}
            detail={<>of the {formatGBP(ISA.overallAllowance)} allowance for all your ISAs</>}
            prompt={problem}
          >
            <table className="result-table">
              <tbody>
                <tr>
                  <th scope="row">Total you plan to pay in</th>
                  <td>{formatGBP(result.totalContributions)}</td>
                </tr>
                <tr>
                  <th scope="row">Overall allowance</th>
                  <td>{formatGBP(ISA.overallAllowance)}</td>
                </tr>
                <tr>
                  <th scope="row">Lifetime ISA government bonus ({percent(ISA.lisaBonusRate)})</th>
                  <td>{formatGBP(result.lisaBonus)}</td>
                </tr>
              </tbody>
            </table>
          </ResultPanel>

          {!problem && result.overallOverLimit && (
            <Notice warning>
              Your total of {formatGBP(result.totalContributions)} is over the{' '}
              {formatGBP(ISA.overallAllowance)} allowance for all your ISAs in {TAX_YEAR}. You
              cannot pay in more than the allowance.
            </Notice>
          )}

          {!problem && result.lisaOverLimit && (
            <Notice warning>
              A Lifetime ISA has its own limit of {formatGBP(ISA.lisaLimit)} a tax year, even if you
              have allowance left overall. The figures above count only {formatGBP(ISA.lisaLimit)}.
            </Notice>
          )}

          {!problem && result.tooYoungForISA && (
            <Notice>
              You must be {ISA.minAge} or over to open an ISA, so this allowance does not apply to
              you yet. Under-18s can have a Junior ISA, which has its own separate limit.
            </Notice>
          )}

          {!problem && lisa.value > 0 && !result.tooYoungForISA && !result.lisaAllowedAtAge && (
            <Notice>
              You cannot pay into a Lifetime ISA once you are {ISA.lisaMaxContributionAge}, so the
              Lifetime ISA amount has been left out of the total and earns no bonus.
            </Notice>
          )}

          {!problem && lisa.value > 0 && result.lisaAllowedAtAge && !result.lisaEligibleToOpen && (
            <Notice>
              You can only open a new Lifetime ISA between ages {ISA.lisaMinOpenAge} and{' '}
              {ISA.lisaMaxOpenAge - 1}. If you already hold one, you can keep paying in until you
              are {ISA.lisaMaxContributionAge}. The figures above assume you already have one.
            </Notice>
          )}
        </>
      }
      guide={<ISAGuide />}
      related={['/mortgage-overpayment-calculator', '/stamp-duty-calculator', '/salary-calculator']}
    />
  )
}
