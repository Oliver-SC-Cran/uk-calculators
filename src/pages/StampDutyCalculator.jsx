import { useMemo } from 'react'
import CalculatorLayout from '../components/CalculatorLayout'
import { CheckboxField, Chips, NumberField, RadioField, SelectField } from '../components/Fields'
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
import { calculateSharedOwnershipStampDuty, calculateStampDuty } from '../lib/stampDuty'
import { formatAmount, formatGBP, formatGBPPence, percent } from '../lib/format'
import { MONEY, PERCENTAGE } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-30'

const { sharedOwnership } = STAMP_DUTY
const asPercent = (rate) => Math.round(rate * 10000) / 100

// How the home is being bought, picked at the top of the inputs.
const HOW_BUYING = [
  ['outright', 'Buying outright', 'Including a shared ownership resale'],
  ['sharedOwnership', 'Shared ownership', 'A new lease from a housing association or council'],
]

// Quick picks for the share. The smallest and largest are the limits on a
// new lease. The ones between are common shares, not advice.
const SHARES = [
  asPercent(sharedOwnership.minimumShare),
  25,
  40,
  50,
  asPercent(sharedOwnership.maximumShare),
].map((value) => [value, `${value}%`])

// What the "Your lease and rent rises" row says while it is closed.
function leaseSummary(leaseYears, rentRise) {
  if (!leaseYears.valid || !rentRise.valid) return 'Check these figures'
  const rise =
    rentRise.value === 0
      ? 'no rent rise'
      : `rent up ${formatAmount(rentRise.value / 100, 'percent')} a year`
  return `${leaseYears.value}-year lease, ${rise}`
}

export default function StampDutyCalculator() {
  const state = useCalculatorState(
    {
      buying: choiceInput(
        'outright',
        HOW_BUYING.map(([value]) => value),
      ),
      price: numberInput('300,000', (fields) =>
        fields.buying.value === 'sharedOwnership'
          ? { label: 'Full market value', name: 'the full market value', ...MONEY, grouped: true }
          : { label: 'The property price', ...MONEY, grouped: true },
      ),
      buyerType: choiceInput('homeMover', ['homeMover', 'firstTimeBuyer', 'additional']),
      nonResident: checkboxInput(false),
      share: numberInput('40', {
        label: 'Your share',
        name: 'the share you are buying',
        min: asPercent(sharedOwnership.minimumShare),
        max: asPercent(sharedOwnership.maximumShare),
      }),
      rent: numberInput('', {
        label: 'Your monthly rent',
        name: 'your monthly rent',
        ...MONEY,
        optional: true,
        grouped: true,
      }),
      leaseYears: numberInput(String(sharedOwnership.newModelLeaseYears), {
        label: 'Length of the lease',
        name: 'the length of the lease',
        min: 1,
        max: 999,
        whole: true,
      }),
      rentRise: numberInput(String(asPercent(sharedOwnership.typicalRentRise)), {
        label: 'Yearly rent rise for the first five years',
        name: 'the yearly rent rise',
        ...PERCENTAGE,
      }),
    },
    { sharedLinks: true },
  )
  const { price, share, rent, leaseYears, rentRise } = state
  const isShared = state.buying.value === 'sharedOwnership'
  // The higher rates for additional properties are not covered for shared
  // ownership, so a link that asks for both is read as a home mover.
  const buyerType =
    isShared && state.buyerType.value === 'additional' ? 'homeMover' : state.buyerType.value
  const nonResident = state.nonResident.value

  const problem = isShared
    ? problemWith(price, share, rent, leaseYears, rentRise)
    : problemWith(price)

  const result = useMemo(
    () => calculateStampDuty({ price: price.value, buyerType, nonResident }),
    [price.value, buyerType, nonResident],
  )
  const rentBlank = rent.isBlank
  const shared = useMemo(
    () =>
      isShared
        ? calculateSharedOwnershipStampDuty({
            marketValue: price.value,
            sharePercent: share.value,
            monthlyRent: rentBlank ? null : rent.value,
            leaseYears: leaseYears.value,
            rentRisePercent: rentRise.value,
            buyerType,
          })
        : null,
    [
      isShared,
      price.value,
      share.value,
      rentBlank,
      rent.value,
      leaseYears.value,
      rentRise.value,
      buyerType,
    ],
  )

  // Switching to shared ownership from an additional property picks "My next home".
  const changeBuying = (next) => {
    if (next === 'sharedOwnership' && state.buyerType.value === 'additional') {
      state.buyerType.set('homeMover')
    }
    state.buying.set(next)
  }

  // Notes on the result, and a warning about what was entered.
  const notices = []
  if (!problem && isShared) {
    if (shared.firstTimeBuyerOverLimit) {
      notices.push(
        <Notice key="first-time-buyer" warning>
          First-time buyer relief does not apply when the full market value is over{' '}
          {formatGBP(STAMP_DUTY.firstTimeBuyer.maxPrice)}, so this uses the standard rates both
          ways.
        </Notice>,
      )
    }
    if (shared.rentEstimated) {
      notices.push(
        <Notice key="rent">
          No rent was entered, so this uses {formatGBPPence(shared.monthlyRent)} a month, which is{' '}
          {formatAmount(sharedOwnership.typicalRentRate, 'percent')} a year of the{' '}
          {formatGBP(shared.landlordShareValue)} share the landlord keeps. Most landlords charge
          this, but your lease gives your rent.
        </Notice>,
      )
    }
    if (shared.rent.taxed) {
      notices.push(
        <Notice key="rise">
          Shared ownership rent usually rises with inflation, so the rise used here is an estimate,
          and so is the tax on the rent. Where the rent for the first{' '}
          {sharedOwnership.rentYearsKnown} years is not known yet, the tax on it is worked out again
          at the end of year {sharedOwnership.rentYearsKnown} of the lease, using the rent actually
          charged, and it can go up or down.
        </Notice>,
      )
    }
    notices.push(
      <Notice key="return">
        If you pay in stages, a stamp duty return must be sent even when there is nothing to pay. A
        market value election is made in the return, or by amending it within{' '}
        {sharedOwnership.electionAmendMonths} months of the filing date, and it cannot be undone.
      </Notice>,
    )
  }
  if (!problem && !isShared && result.firstTimeBuyerOverLimit) {
    notices.push(
      <Notice key="first-time-buyer" warning>
        First-time buyer relief does not apply to homes over{' '}
        {formatGBP(STAMP_DUTY.firstTimeBuyer.maxPrice)}, so this uses the standard rates on the
        whole price.
      </Notice>,
    )
  }
  if (!problem && !isShared && result.additionalApplies) {
    notices.push(
      <Notice key="additional">
        This includes the {percent(STAMP_DUTY.additionalPropertySurcharge)} higher rate for
        additional properties, which is added to every part of the price.
      </Notice>,
    )
  }
  if (!problem && !isShared && result.nonResidentApplies) {
    notices.push(
      <Notice key="non-resident">
        This includes the {percent(STAMP_DUTY.nonResidentSurcharge)} surcharge for buyers who are
        not UK resident, which is added to every part of the price.
      </Notice>,
    )
  }
  if (!problem && !isShared && result.surchargeWaived) {
    notices.push(
      <Notice key="waived">
        The higher rates and the non-resident surcharge only apply to purchases of{' '}
        {formatGBP(STAMP_DUTY.surchargeMinimumPrice)} or more, so neither is included.
      </Notice>,
    )
  }

  const staircasingOver = percent(sharedOwnership.staircasingTaxedOver)

  const sharedResult = shared && (
    <>
      <table className="result-table result-table--total result-table--columns">
        <caption>The two ways to pay</caption>
        <thead>
          <tr>
            <td></td>
            <th scope="col">In stages</th>
            <th scope="col">Market value election</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Price taxed</th>
            <td>{formatGBP(shared.sharePrice)}</td>
            <td>{formatGBP(shared.marketValue)}</td>
          </tr>
          <tr>
            <th scope="row">Tax on the price</th>
            <td>{formatGBP(shared.inStages.priceTax)}</td>
            <td>{formatGBP(shared.election.tax)}</td>
          </tr>
          <tr>
            <th scope="row">Tax on the rent</th>
            <td>{shared.rent.taxed ? formatGBP(shared.inStages.rentTax) : 'Not taxed'}</td>
            <td>Not taxed</td>
          </tr>
          <tr>
            <th scope="row">Stamp duty now</th>
            <td>{formatGBP(shared.inStages.tax)}</td>
            <td>{formatGBP(shared.election.tax)}</td>
          </tr>
        </tbody>
      </table>
      <table className="result-table result-table--columns result-table--wrap">
        <caption>Buying more shares later</caption>
        <thead>
          <tr>
            <td></td>
            <th scope="col">In stages</th>
            <th scope="col">Market value election</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Up to {staircasingOver} in all</th>
            <td>No tax</td>
            <td>No tax</td>
          </tr>
          <tr>
            <th scope="row">Shares that take you over {staircasingOver}</th>
            <td>Taxed</td>
            <td>No tax</td>
          </tr>
        </tbody>
      </table>
      <p className="result-card__line">
        {shared.rent.taxed ? (
          <>
            Your rent of {formatGBPPence(shared.monthlyRent)} a month
            {shared.rentRise > 0
              ? `, rising ${formatAmount(shared.rentRise, 'percent')} a year for the first ${sharedOwnership.rentYearsKnown} years,`
              : ''}{' '}
            is worth {formatGBP(Math.floor(shared.rent.netPresentValue))} over the{' '}
            {shared.leaseYears}-year lease. Tax on the rent is {percent(sharedOwnership.rentRate)}{' '}
            of anything over {formatGBP(sharedOwnership.rentNilBand)}.
          </>
        ) : (
          <>With first-time buyer relief the rent is not taxed, whichever way you pay.</>
        )}
      </p>
    </>
  )

  const outrightResult = result.breakdown.length > 0 && (
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
  )

  const figures = isShared
    ? [
        { value: formatGBP(shared.inStages.tax), per: 'now if you pay in stages' },
        { value: formatGBP(shared.election.tax), per: 'now with a market value election' },
      ]
    : [
        { value: formatGBP(result.tax), per: 'stamp duty' },
        { value: percent(result.effectiveRate), per: 'of the price' },
      ]

  return (
    <CalculatorLayout
      title="Stamp duty calculator"
      lede={`Stamp Duty Land Tax on a home in England or Northern Ireland, bought outright or through shared ownership, using the rates from ${STAMP_DUTY.ratesFrom}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="How you are buying">
              <RadioField
                id="buying"
                label="How you are buying"
                hideLabel
                value={state.buying.value}
                onChange={changeBuying}
                options={HOW_BUYING}
              />
            </InputSection>

            <InputSection title="The property">
              <FieldRow>
                <NumberField
                  id="price"
                  hint={
                    isShared
                      ? 'The full value of the home, as stated in your lease.'
                      : 'What you are paying for it.'
                  }
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
                  {!isShared && (
                    <option value="additional">
                      An additional property (second home or buy-to-let)
                    </option>
                  )}
                </SelectField>
              </FieldRow>
            </InputSection>

            {isShared && (
              <InputSection title="Your share and rent">
                <FieldRow>
                  <NumberField
                    id="share"
                    hint="The share of the home you are buying now."
                    after="%"
                    decimal
                    field={share}
                    below={
                      <Chips
                        label="Common shares"
                        options={SHARES}
                        current={share.text}
                        onPick={share.setText}
                      />
                    }
                  />
                  <NumberField
                    id="rent"
                    hint={`The rent on the landlord's share. Leave it blank to use ${formatAmount(sharedOwnership.typicalRentRate, 'percent')} a year of the landlord's share.`}
                    before="£"
                    decimal
                    optional
                    field={rent}
                  />
                </FieldRow>
              </InputSection>
            )}

            {isShared ? (
              <MoreOptions
                title="Your lease and rent rises"
                summary={leaseSummary(leaseYears, rentRise)}
              >
                <FieldRow>
                  <NumberField
                    id="lease-years"
                    hint={`New shared ownership leases are for at least ${sharedOwnership.newModelLeaseYears} years. Your lease gives its length.`}
                    after="years"
                    field={leaseYears}
                  />
                  <NumberField
                    id="rent-rise"
                    hint={`Set to ${percent(sharedOwnership.typicalRentRise)}, a typical rise (CPI + 1%), an estimate. Your lease says how your rent goes up. Enter 0 for no rise.`}
                    after="%"
                    decimal
                    field={rentRise}
                  />
                </FieldRow>
              </MoreOptions>
            ) : (
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
            )}
          </InputCard>

          {isShared ? (
            <Notice>
              This covers a new shared ownership lease in England or Northern Ireland from a housing
              association, council or other approved body. It does not cover the higher rates for
              additional properties or the surcharge for buyers who are not UK resident. Buying a
              share from someone who already owns it is a resale: you take over their lease, so it
              is taxed like any other purchase on the price you pay. Choose "Buying outright" for
              that. If the freehold is not available under your lease, a market value election is
              charged on the open market premium and minimum rent stated in the lease, so enter that
              premium as the full market value. This does not work out any tax on the minimum rent.
            </Notice>
          ) : (
            <Notice>
              This covers England and Northern Ireland only. Scotland has Land and Buildings
              Transaction Tax and Wales has Land Transaction Tax, with their own rates, and neither
              is covered here. It is for one home bought by a person, not a company. It does not
              cover mixed-use property, or a new lease with rent other than shared ownership, which
              you can choose above.
            </Notice>
          )}
        </>
      }
      result={
        <ResultCard
          label={isShared ? 'Stamp duty to pay now' : 'Stamp duty to pay'}
          figures={figures}
          prompt={problem}
          shareLink={state.shareLink}
        >
          {isShared ? sharedResult : outrightResult}
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : isShared ? shared.working : result.working}
      guide={<StampDutyGuide />}
      guides={['/guides/first-time-buyer-isa-vs-lifetime-isa']}
      related={['/mortgage-overpayment-calculator', '/isa-calculator']}
    />
  )
}
