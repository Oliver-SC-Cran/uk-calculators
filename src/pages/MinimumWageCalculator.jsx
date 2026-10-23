import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, NumberField } from '../components/Fields'
import { FieldRow, InputCard, InputSection } from '../components/InputCard'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import {
  checkboxInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import MinimumWageGuide from '../guides/MinimumWageGuide'
import { checkMinimumWage } from '../lib/minimumWage'
import { FULL_TIME_HOURS, MINIMUM_WAGE } from '../lib/rates/minimumWage'
import { formatGBPPence } from '../lib/format'
import { MONEY, WHOLE_YEARS } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-23'

export default function MinimumWageCalculator() {
  const state = useCalculatorState(
    {
      age: numberInput('22', { label: 'Your age', ...WHOLE_YEARS }),
      hourlyRate: numberInput('11.50', { label: 'Your hourly pay', ...MONEY }),
      isApprentice: checkboxInput(false),
    },
    { sharedLinks: true },
  )
  const { age, hourlyRate } = state
  const isApprentice = state.isApprentice.value

  const problem = problemWith(age, hourlyRate)

  const result = useMemo(
    () => checkMinimumWage({ age: age.value, hourlyRate: hourlyRate.value, isApprentice }),
    [age.value, hourlyRate.value, isApprentice],
  )

  const tooYoung = !result.entitled && `Enter an age of ${result.minAge} or over.`

  // A note on who is covered, and a warning when the pay is under the minimum.
  const notices = []
  if (!problem && !result.entitled) {
    notices.push(
      <Notice key="too-young">
        You must be at least school leaving age (usually {result.minAge}) to get the National
        Minimum Wage.
      </Notice>,
    )
  }
  if (!problem && result.isUnderpaid) {
    notices.push(
      <Notice key="underpaid" warning>
        Based on what you've entered, you may be paid {formatGBPPence(result.shortfall)} an hour
        below the legal minimum for your age. Check the age and apprentice options first, as they
        change which rate applies. If they are right, the guide below explains how to report it.
      </Notice>,
    )
  }

  return (
    <CalculatorLayout
      title="Minimum wage checker"
      lede={`Check your hourly pay against the National Living Wage and National Minimum Wage rates from ${MINIMUM_WAGE.effectiveFrom}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="You and your pay">
              <FieldRow>
                <NumberField id="age" hint="In whole years." field={age} />
                <NumberField
                  id="hourly-rate"
                  hint="Before tax, in pounds and pence."
                  before="£"
                  decimal
                  field={hourlyRate}
                />
              </FieldRow>
              <CheckboxField
                id="apprentice"
                label="Apprenticeships"
                checked={isApprentice}
                onChange={state.isApprentice.set}
              >
                I'm an apprentice under 19, or 19 or over and in the first year of my apprenticeship
              </CheckboxField>
            </InputSection>
          </InputCard>

          <Notice>
            These rates apply across the UK. The guide below explains who is not covered and what
            counts towards your pay.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="Your legal minimum"
          figures={[
            {
              value: formatGBPPence(result.applicableRate ?? 0),
              per: `an hour, the ${result.bandLabel}`,
            },
          ]}
          prompt={problem ?? tooYoung}
          shareLink={state.shareLink}
        >
          <table className="result-table">
            <tbody>
              <tr>
                <th scope="row">Your hourly pay</th>
                <td>{formatGBPPence(hourlyRate.value)}</td>
              </tr>
              <tr>
                <th scope="row">{`The minimum at ${FULL_TIME_HOURS} hours a week`}</th>
                <td>{formatGBPPence(result.weeklyAtMinimum)}</td>
              </tr>
              <tr>
                <th scope="row">The minimum over a year</th>
                <td>{formatGBPPence(result.annualAtMinimum)}</td>
              </tr>
            </tbody>
          </table>
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : result.working}
      guide={<MinimumWageGuide />}
      guides={['/guides/how-to-read-your-payslip']}
      related={['/salary-calculator', '/maternity-pay-calculator', '/redundancy-calculator']}
    />
  )
}
