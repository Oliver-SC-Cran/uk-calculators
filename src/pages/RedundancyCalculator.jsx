import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import RedundancyGuide from '../guides/RedundancyGuide'
import { calculateRedundancyPay, TAX_YEAR_START } from '../lib/calculations'
import { formatGBP } from '../lib/format'
import { MAX_AGE } from '../lib/validation'

export default function RedundancyCalculator() {
  const age = useNumberField('45', { label: 'Your age', whole: true, max: MAX_AGE })
  const years = useNumberField('10', {
    label: 'Your years with your employer',
    whole: true,
    max: MAX_AGE,
  })
  const weeklyPay = useNumberField('600', { label: 'Your weekly pay' })
  const [region, setRegion] = useState('GB')

  const problem = problemWith(age, years, weeklyPay)

  const result = useMemo(
    () =>
      calculateRedundancyPay({
        age: age.value,
        yearsOfService: years.value,
        weeklyPay: weeklyPay.value,
        region,
      }),
    [age.value, years.value, weeklyPay.value, region],
  )

  const notQualifying =
    !result.qualifies &&
    (result.reason === 'service-too-long'
      ? 'Check your age and your years with your employer.'
      : 'Based on what you entered, you would not qualify yet.')

  return (
    <CalculatorPage
      title="Statutory redundancy pay calculator"
      meta={`Limits from ${TAX_YEAR_START} · checked against gov.uk and nidirect`}
      inputs={
        <>
          <Steps>
            <NumberField id="age" hint="In whole years." size="short" field={age} />
            <NumberField
              id="years"
              hint="Full years only, without a break."
              size="short"
              field={years}
            />
            <NumberField
              id="weekly-pay"
              hint="Before tax. Use your average over the 12 weeks before you were given notice."
              before="£"
              decimal
              field={weeklyPay}
            />
            <SelectField
              id="region"
              label="Where in the UK"
              hint="Northern Ireland has its own weekly pay limit."
              value={region}
              onChange={setRegion}
            >
              <option value="GB">England, Scotland or Wales</option>
              <option value="NI">Northern Ireland</option>
            </SelectField>
          </Steps>

          <Notice>
            This is the legal minimum. Your employer may pay more under your contract or a company
            scheme. It works in whole years of age and service, so exact dates can shift the result
            if you are close to an age boundary.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label="Statutory redundancy pay"
            figure={result.qualifies && formatGBP(result.pay)}
            detail={
              result.qualifies && (
                <>
                  for {result.totalWeeks} weeks' pay at {formatGBP(result.weeklyPayUsed)} a week
                  {result.weeklyPayWasCapped ? ', the most that counts' : ''}
                </>
              )
            }
            prompt={problem ?? notQualifying}
          >
            {result.qualifies && (
              <table className="result-table">
                <tbody>
                  <tr>
                    <th scope="row">Weeks' pay awarded</th>
                    <td>{result.totalWeeks}</td>
                  </tr>
                  <tr>
                    <th scope="row">Weekly pay used</th>
                    <td>
                      {formatGBP(result.weeklyPayUsed)}
                      {result.weeklyPayWasCapped ? ' (capped)' : ''}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Tax-free up to</th>
                    <td>{formatGBP(result.taxFreeThreshold)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </ResultPanel>

          {!problem && result.reason === 'service-too-long' && (
            <Notice>
              Service that started before age {result.earliestServiceAge} does not count, and the
              official gov.uk calculator will not accept it.
            </Notice>
          )}

          {!problem && result.reason === 'too-few-years' && (
            <Notice>
              Statutory redundancy pay requires at least {result.minYearsToQualify} full years of
              continuous service.
            </Notice>
          )}
        </>
      }
      guide={<RedundancyGuide />}
      related={['/salary-calculator', '/maternity-pay-calculator', '/minimum-wage-calculator']}
    />
  )
}
