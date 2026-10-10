import { useMemo, useState } from 'react'
import CalculatorPage from '../components/CalculatorPage'
import { CheckboxField, NumberField, SelectField, Steps } from '../components/Fields'
import Notice from '../components/Notice'
import ResultPanel from '../components/ResultPanel'
import { problemWith, useNumberField } from '../components/useNumberField'
import StampDutyGuide from '../guides/StampDutyGuide'
import { calculateStampDuty, STAMP_DUTY } from '../lib/calculations'
import { formatGBP, percent } from '../lib/format'

export default function StampDutyCalculator() {
  const price = useNumberField('300000', { label: 'The property price' })
  const [buyerType, setBuyerType] = useState('homeMover')
  const [nonResident, setNonResident] = useState(false)

  const problem = problemWith(price)

  const result = useMemo(
    () => calculateStampDuty({ price: price.value, buyerType, nonResident }),
    [price.value, buyerType, nonResident],
  )

  return (
    <CalculatorPage
      title="Stamp duty calculator"
      rates={`Rates from ${STAMP_DUTY.ratesFrom}`}
      inputs={
        <>
          <Steps>
            <NumberField id="price" hint="What you are paying for it." before="£" field={price} />
            <SelectField
              id="buyer-type"
              label="What you are buying"
              value={buyerType}
              onChange={setBuyerType}
            >
              <option value="homeMover">My next home (I am selling my current one)</option>
              <option value="firstTimeBuyer">My first home</option>
              <option value="additional">An additional property (second home or buy-to-let)</option>
            </SelectField>
            <CheckboxField
              id="non-resident"
              label="UK residence"
              checked={nonResident}
              onChange={setNonResident}
            >
              I am not a UK resident (in the UK for fewer than {STAMP_DUTY.nonResidentDays} days in
              the 12 months before buying)
            </CheckboxField>
          </Steps>

          <Notice>
            This covers England and Northern Ireland only. Scotland has Land and Buildings
            Transaction Tax and Wales has Land Transaction Tax, with their own rates, and neither is
            covered here. It is for one home bought by a person, not a company, and does not cover
            shared ownership, new leases with rent, or mixed-use property.
          </Notice>
        </>
      }
      result={
        <>
          <ResultPanel
            label="Stamp duty to pay"
            figure={formatGBP(result.tax)}
            detail={<>which is {percent(result.effectiveRate)} of the price</>}
            prompt={problem}
            link={{
              to: '/mortgage-overpayment-calculator',
              text: 'See what overpaying a mortgage could save',
            }}
          >
            {result.breakdown.length > 0 && (
              <table className="result-table result-table--total">
                <caption>How it is worked out</caption>
                <thead>
                  <tr>
                    <th scope="col">Part of the price</th>
                    <th scope="col">Rate</th>
                    <th scope="col">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((band) => (
                    <tr key={band.from}>
                      <th scope="row">
                        {band.from === 0
                          ? `First ${formatGBP(band.to)}`
                          : `${formatGBP(band.from)} to ${formatGBP(band.to)}`}
                      </th>
                      <td>{percent(band.rate)}</td>
                      <td>{formatGBP(band.tax)}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Total</th>
                    <td></td>
                    <td>{formatGBP(result.tax)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </ResultPanel>

          {!problem && result.firstTimeBuyerOverLimit && (
            <Notice warning>
              First-time buyer relief does not apply to homes over{' '}
              {formatGBP(STAMP_DUTY.firstTimeBuyer.maxPrice)}, so this uses the standard rates on
              the whole price.
            </Notice>
          )}

          {!problem && result.additionalApplies && (
            <Notice>
              This includes the {percent(STAMP_DUTY.additionalPropertySurcharge)} higher rate for
              additional properties, which is added to every part of the price.
            </Notice>
          )}

          {!problem && result.nonResidentApplies && (
            <Notice>
              This includes the {percent(STAMP_DUTY.nonResidentSurcharge)} surcharge for buyers who
              are not UK resident, which is added to every part of the price.
            </Notice>
          )}

          {!problem && result.surchargeWaived && (
            <Notice>
              The higher rates and the non-resident surcharge only apply to purchases of{' '}
              {formatGBP(STAMP_DUTY.surchargeMinimumPrice)} or more, so neither is included.
            </Notice>
          )}
        </>
      }
      guide={<StampDutyGuide />}
      related={['/mortgage-overpayment-calculator', '/isa-calculator']}
    />
  )
}
