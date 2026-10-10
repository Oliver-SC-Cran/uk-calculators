import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { CheckboxField, NumberField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import MinimumWageGuide from '../guides/MinimumWageGuide'
import { checkMinimumWage, MINIMUM_WAGE } from '../lib/calculations'
import { formatGBPPence } from '../lib/format'
import { MAX_AGE } from '../lib/validation'

export default function MinimumWageCalculator() {
  const age = useNumberField('22', { label: 'Your age', whole: true, max: MAX_AGE })
  const hourlyRate = useNumberField('11.50', { label: 'Your hourly pay' })
  const [isApprentice, setIsApprentice] = useState(false)

  const problem = problemWith(age, hourlyRate)

  const result = useMemo(
    () => checkMinimumWage({ age: age.value, hourlyRate: hourlyRate.value, isApprentice }),
    [age.value, hourlyRate.value, isApprentice],
  )

  const tooYoung = !result.entitled && `Enter an age of ${result.minAge} or over.`

  return (
    <CalculatorPage
      title="Minimum wage checker"
      rates={`Rates from ${MINIMUM_WAGE.effectiveFrom}`}
      inputs={
        <>
          <Steps>
            <NumberField id="age" hint="In whole years." size="short" field={age} />
            <NumberField
              id="hourly-rate"
              hint="Before tax, in pounds and pence."
              before="£"
              decimal
              size="short"
              field={hourlyRate}
            />
            <CheckboxField
              id="apprentice"
              label="Apprenticeships"
              checked={isApprentice}
              onChange={setIsApprentice}
            >
              I'm an apprentice under 19, or 19 or over and in the first year of my apprenticeship
            </CheckboxField>
          </Steps>

          <Notice>
            These rates apply across the UK. The guide below explains who is not covered and what
            counts towards your pay.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label="Your legal minimum"
            figure={result.entitled && formatGBPPence(result.applicableRate)}
            detail={result.entitled && <>an hour ({result.bandLabel})</>}
            prompt={problem ?? tooYoung}
            link={{ to: '/salary-calculator', text: 'See your take-home pay after tax' }}
          >
            {result.entitled && (
              <table className="result-table">
                <tbody>
                  <tr>
                    <th scope="row">Your hourly pay</th>
                    <td>{formatGBPPence(hourlyRate.value)}</td>
                  </tr>
                  <tr>
                    <th scope="row">The minimum at 37.5 hours a week</th>
                    <td>{formatGBPPence(result.weeklyAtMinimum)}</td>
                  </tr>
                  <tr>
                    <th scope="row">The minimum over a year</th>
                    <td>{formatGBPPence(result.annualAtMinimum)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </ResultPanel>

          {!problem && !result.entitled && (
            <Notice>
              You must be at least school leaving age (usually {result.minAge}) to get the National
              Minimum Wage.
            </Notice>
          )}

          {!problem && result.isUnderpaid && (
            <Notice warning>
              Based on what you've entered, you may be paid {formatGBPPence(result.shortfall)} an
              hour below the legal minimum for your age. Check the age and apprentice options first,
              as they change which rate applies. If they are right, the guide below explains how to
              report it.
            </Notice>
          )}
        </>
      }
      guide={<MinimumWageGuide />}
      related={['/salary-calculator', '/maternity-pay-calculator', '/redundancy-calculator']}
    />
  )
}
