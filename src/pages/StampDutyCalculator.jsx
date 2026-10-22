import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, NumberField, SelectField } from '../components/Fields'
import { FieldRow, InputCard, InputSection, MoreOptions } from '../components/InputCard'
import Notice from '../components/Notice'
import ResultCard from '../components/ResultCard'
import {
  checkboxInput,
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import StampDutyGuide from '../guides/StampDutyGuide'
import { STAMP_DUTY } from '../lib/rates/stampDuty'
import { calculateStampDuty } from '../lib/stampDuty'
import { formatGBP, percent } from '../lib/format'
import { MONEY } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-22'

export default function StampDutyCalculator() {
  const state = useCalculatorState(
    {
      price: numberInput('300,000', { label: 'The property price', ...MONEY, grouped: true }),
      buyerType: choiceInput('homeMover', ['homeMover', 'firstTimeBuyer', 'additional']),
      nonResident: checkboxInput(false),
    },
    { sharedLinks: true },
  )
  const { price } = state
  const buyerType = state.buyerType.value
  const nonResident = state.nonResident.value

  const problem = problemWith(price)

  const result = useMemo(
    () => calculateStampDuty({ price: price.value, buyerType, nonResident }),
    [price.value, buyerType, nonResident],
  )

  // Notes on the result, and a warning about what was entered.
  const notices = []
  if (!problem && result.firstTimeBuyerOverLimit) {
    notices.push(
      <Notice key="first-time-buyer" warning>
        First-time buyer relief does not apply to homes over{' '}
        {formatGBP(STAMP_DUTY.firstTimeBuyer.maxPrice)}, so this uses the standard rates on the
        whole price.
      </Notice>,
    )
  }
  if (!problem && result.additionalApplies) {
    notices.push(
      <Notice key="additional">
        This includes the {percent(STAMP_DUTY.additionalPropertySurcharge)} higher rate for
        additional properties, which is added to every part of the price.
      </Notice>,
    )
  }
  if (!problem && result.nonResidentApplies) {
    notices.push(
      <Notice key="non-resident">
        This includes the {percent(STAMP_DUTY.nonResidentSurcharge)} surcharge for buyers who are
        not UK resident, which is added to every part of the price.
      </Notice>,
    )
  }
  if (!problem && result.surchargeWaived) {
    notices.push(
      <Notice key="waived">
        The higher rates and the non-resident surcharge only apply to purchases of{' '}
        {formatGBP(STAMP_DUTY.surchargeMinimumPrice)} or more, so neither is included.
      </Notice>,
    )
  }

  return (
    <CalculatorLayout
      title="Stamp duty calculator"
      lede={`Stamp Duty Land Tax on a home in England or Northern Ireland, using the rates from ${STAMP_DUTY.ratesFrom}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="The property">
              <FieldRow>
                <NumberField
                  id="price"
                  hint="What you are paying for it."
                  before="£"
                  decimal
                  field={price}
                />
                <SelectField
                  id="buyer-type"
                  label="What you are buying"
                  size="full"
                  value={buyerType}
                  onChange={state.buyerType.set}
                >
                  <option value="homeMover">My next home (I am selling my current one)</option>
                  <option value="firstTimeBuyer">My first home</option>
                  <option value="additional">
                    An additional property (second home or buy-to-let)
                  </option>
                </SelectField>
              </FieldRow>
            </InputSection>

            <MoreOptions summary={nonResident ? 'Not a UK resident' : 'UK resident'}>
              <CheckboxField
                id="non-resident"
                label="UK residence"
                checked={nonResident}
                onChange={state.nonResident.set}
              >
                I am not a UK resident (in the UK for fewer than {STAMP_DUTY.nonResidentDays} days
                in the 12 months before buying)
              </CheckboxField>
            </MoreOptions>
          </InputCard>

          <Notice>
            This covers England and Northern Ireland only. Scotland has Land and Buildings
            Transaction Tax and Wales has Land Transaction Tax, with their own rates, and neither is
            covered here. It is for one home bought by a person, not a company, and does not cover
            shared ownership, new leases with rent, or mixed-use property.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label="Stamp duty to pay"
          figures={[
            { value: formatGBP(result.tax), per: 'stamp duty' },
            { value: percent(result.effectiveRate), per: 'of the price' },
          ]}
          prompt={problem}
          shareLink={state.shareLink}
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
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : result.working}
      guide={<StampDutyGuide />}
      related={['/mortgage-overpayment-calculator', '/isa-calculator']}
    />
  )
}
