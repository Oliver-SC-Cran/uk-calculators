import CalculatorLayout from '../components/CalculatorLayout'
import { Chips, NumberField, RadioField } from '../components/Fields'
import { FieldRow, InputCard, InputNote, InputSection, MoreOptions } from '../components/InputCard'
import Notice from '../components/Notice'
import RegionField from '../components/RegionField'
import { REGIONS, REST_OF_UK_NOTE } from '../components/choices'
import ResultCard from '../components/ResultCard'
import Source from '../components/Source'
import {
  choiceInput,
  numberInput,
  problemWith,
  useCalculatorState,
} from '../components/useCalculatorState'
import MileageAllowanceGuide from '../guides/MileageAllowanceGuide'
import { formatGBP, formatGBPPence, formatNumber, formatPence } from '../lib/format'
import { incomeTaxLabel } from '../lib/incomeTax'
import { calculateMileageAllowance, VEHICLES } from '../lib/mileage'
import { BUDGET_2026 } from '../lib/rates/budget'
import {
  CAR_OR_VAN_RATE_BEFORE_APRIL_2026,
  MILEAGE,
  MILEAGE_CLAIMS,
  MILEAGE_RATES,
} from '../lib/rates/mileage'
import { NEXT_TAX_YEAR, NEXT_TAX_YEAR_START, TAX_YEAR, TAX_YEAR_END } from '../lib/rates/taxYear'
import { MILES, MONEY, PENCE_PER_MILE } from '../lib/validation'

// Change this by hand whenever the calculator's figures or rules change.
const LAST_UPDATED = '2026-10-30'

const VEHICLE_NAMES = {
  carOrVan: 'Car or van',
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
}

const { firstMiles } = MILEAGE.carOrVan
const firstMilesText = formatNumber(firstMiles)
const nextCarRates = MILEAGE_RATES[NEXT_TAX_YEAR].carOrVan
const pence = (rate) => String(Number((rate * 100).toPrecision(12)))

// Quick picks for what an employer pays: nothing, the approved rates, and for
// a car or van the rate before 6 April 2026.
const RATE_CHIPS = {
  carOrVan: [
    0,
    MILEAGE.carOrVan.laterMilesRate,
    CAR_OR_VAN_RATE_BEFORE_APRIL_2026,
    MILEAGE.carOrVan.firstMilesRate,
  ],
  motorcycle: [0, MILEAGE.motorcycle.rate],
  bicycle: [0, MILEAGE.bicycle.rate],
}
const chipsFor = (vehicle) =>
  RATE_CHIPS[vehicle].map((rate) => [pence(rate), rate === 0 ? 'Nothing' : formatPence(rate)])

// The last day a claim for the current tax year can be made: 4 years after
// the end of the tax year.
const lastDayToClaim = TAX_YEAR_END.replace(
  /\d{4}$/,
  (year) => Number(year) + MILEAGE_CLAIMS.yearsAfterTaxYear,
)

export default function MileageAllowanceCalculator() {
  const state = useCalculatorState(
    {
      vehicle: choiceInput('carOrVan', VEHICLES),
      miles: numberInput('12,000', {
        label: 'Business miles in the tax year',
        name: 'your business miles',
        ...MILES,
        grouped: true,
      }),
      rate: numberInput(pence(CAR_OR_VAN_RATE_BEFORE_APRIL_2026), {
        label: 'What your employer pays a mile',
        ...PENCE_PER_MILE,
      }),
      rateAbove: numberInput('', {
        label: `What they pay a mile above ${firstMilesText} miles`,
        ...PENCE_PER_MILE,
        optional: true,
      }),
      passengerMiles: numberInput('0', (fields) => ({
        label: 'Miles with work passengers',
        ...MILES,
        grouped: true,
        max: fields.miles.valid ? fields.miles.value : Infinity,
      })),
      passengers: numberInput('1', { label: 'Number of passengers', min: 1, whole: true }),
      passengerRate: numberInput('0', {
        label: 'What your employer pays a passenger a mile',
        ...PENCE_PER_MILE,
      }),
      pay: numberInput('35,000', { label: 'Your pay for the year', ...MONEY, grouped: true }),
      region: choiceInput('restOfUk', Object.keys(REGIONS)),
    },
    { sharedLinks: true },
  )
  const { miles, rate, rateAbove, passengerMiles, passengers, passengerRate, pay } = state
  const vehicle = state.vehicle.value
  const carOrVan = vehicle === 'carOrVan'
  const region = state.region.value
  const scottish = region === 'scotland'

  const problem = problemWith(
    miles,
    rate,
    ...(carOrVan ? [rateAbove, passengerMiles, passengers, passengerRate] : []),
    pay,
  )
  const settings = {
    vehicle,
    miles: miles.value,
    employerRate: rate.value / 100,
    employerRateAbove: carOrVan && !rateAbove.isBlank ? rateAbove.value / 100 : null,
    passengerMiles: carOrVan ? passengerMiles.value : 0,
    passengers: passengers.value,
    passengerRate: passengerRate.value / 100,
    pay: pay.value,
    scottish,
  }
  const now = calculateMileageAllowance({ ...settings, taxYear: TAX_YEAR })
  const next = calculateMileageAllowance({ ...settings, taxYear: NEXT_TAX_YEAR })
  const years = [now, next]

  const anyRelief = years.some((year) => year.kind === 'relief')
  const anyTaxable = years.some((year) => year.kind === 'taxable')
  const label = anyRelief
    ? anyTaxable
      ? 'Relief you can claim, or the amount taxed'
      : 'Mileage Allowance Relief you can claim'
    : anyTaxable
      ? 'Taxable mileage payments'
      : 'Mileage Allowance Relief you can claim'
  // A year with nothing either way takes the words of the other year.
  const taxableWords = (result) =>
    result.kind === 'taxable' || (result.kind === 'even' && anyTaxable && !anyRelief)
  const per = (result) =>
    taxableWords(result) ? `taxable in ${result.taxYear}` : `to claim for ${result.taxYear}`

  const taxName = incomeTaxLabel(scottish)
  const taxWords = scottish ? taxName : 'income tax'
  const niRate = formatPence(now.niFreeRate)

  // A row of the breakdown, left out when it is nothing in both years.
  const row = (rowLabel, valueNow, valueNext) =>
    valueNow > 0 || valueNext > 0 ? (
      <tr key={rowLabel}>
        <th scope="row">{rowLabel}</th>
        <td>{formatGBPPence(valueNow)}</td>
        <td>{formatGBPPence(valueNext)}</td>
      </tr>
    ) : null
  const taxFreePassengers = (result) => Math.min(result.passenger.paid, result.passenger.taxFree)
  const approvedRise = next.approved - now.approved

  const notices = []
  if (!problem) {
    if (anyRelief) {
      const overPostalLimit = years.filter(
        (result) => result.relief > MILEAGE_CLAIMS.postalClaimLimit,
      )
      notices.push(
        <Notice key="claim">
          To claim, keep a mileage log with the reason for each journey and the postcodes where it
          started and ended. If you send a Self Assessment tax return, claim on it. If not,{' '}
          <Source href="https://www.tax.service.gov.uk/claim-tax-relief-expenses/">
            HMRC&apos;s online service
          </Source>{' '}
          tells you whether you can claim and how, and you can claim{' '}
          <Source href="https://www.gov.uk/guidance/send-an-income-tax-relief-claim-for-job-expenses-by-post-or-phone">
            by post on form P87
          </Source>{' '}
          if your job expenses for the tax year come to {formatGBP(MILEAGE_CLAIMS.postalClaimLimit)}{' '}
          or less. You can claim up to {MILEAGE_CLAIMS.yearsAfterTaxYear} years after the end of the
          tax year, so until {lastDayToClaim} for {TAX_YEAR}.
          {overPostalLimit.length > 0 && (
            <>
              {' '}
              Your relief is over {formatGBP(MILEAGE_CLAIMS.postalClaimLimit)} for{' '}
              {overPostalLimit.map((result) => result.taxYear).join(' and ')}, so you cannot claim
              it by post. gov.uk&apos;s page on claiming by post says to fill in a Self Assessment
              tax return instead.
            </>
          )}
        </Notice>,
      )
    }
    if (anyTaxable) {
      notices.push(
        <Notice key="taxable">
          Your employer reports what they pay above the approved amount to HMRC on form P11D, and it
          is taxed as pay.
        </Notice>,
      )
    }
    if (years.some((result) => result.niLiable > 0)) {
      notices.push(
        <Notice key="national-insurance">
          National Insurance is due on what your employer pays above {niRate} a mile, the highest
          approved rate for your vehicle, for every business mile.
          {carOrVan && (
            <>
              {' '}
              Budget 2026 said the {formatPence(nextCarRates.laterMilesRate)} rate from{' '}
              {NEXT_TAX_YEAR_START} will also apply to National Insurance, but these rules already
              use {niRate} for every mile, so it is not yet clear what will change. This uses{' '}
              {niRate} in both years.
            </>
          )}
          {years.some((result) => result.passenger.taxable > 0) && (
            <>
              {' '}
              It is also due on passenger payments above {formatPence(MILEAGE.passenger.rate)} a
              mile.
            </>
          )}{' '}
          For {NEXT_TAX_YEAR} it uses the {TAX_YEAR} National Insurance rates.
        </Notice>,
      )
    }
    if (carOrVan && now.miles > firstMiles) {
      notices.push(
        <Notice key="regulations">
          The {formatPence(nextCarRates.laterMilesRate)} rate above {firstMilesText} miles was
          announced at Budget 2026 on {BUDGET_2026.date}. The government will set it in regulations
          before {NEXT_TAX_YEAR_START}.
        </Notice>,
      )
    }
    if (
      scottish &&
      next.taxRatesYear !== NEXT_TAX_YEAR &&
      (next.taxSaved > 0 || next.extraTax > 0)
    ) {
      notices.push(
        <Notice key="scottish-rates">
          The Scottish Parliament has not set the Scottish income tax rates for {NEXT_TAX_YEAR} yet,
          so the {NEXT_TAX_YEAR} tax figure uses the {TAX_YEAR} ones. It will change when the{' '}
          {NEXT_TAX_YEAR} rates are set.
        </Notice>,
      )
    }
  }

  const optionsSummary = [
    rateAbove.isBlank || !rateAbove.valid
      ? 'Same rate for every mile'
      : `${formatPence(rateAbove.value / 100)} above ${firstMilesText} miles`,
    passengerMiles.value > 0 && passengerMiles.valid ? 'passengers' : 'no passengers',
  ].join(', ')

  return (
    <CalculatorLayout
      title="Mileage allowance calculator"
      lede={`Tax relief on business miles in your own vehicle in ${TAX_YEAR}, and from ${NEXT_TAX_YEAR_START}, when the car and van rate above ${firstMilesText} miles rises to ${formatPence(nextCarRates.laterMilesRate)}.`}
      updated={LAST_UPDATED}
      inputs={
        <>
          <InputCard>
            <InputSection title="Your miles">
              <RadioField
                id="vehicle"
                label="Your vehicle"
                value={vehicle}
                onChange={state.vehicle.set}
                options={VEHICLES.map((each) => [each, VEHICLE_NAMES[each]])}
              />
              <FieldRow>
                <NumberField
                  id="miles"
                  hint="Journeys for work in your own vehicle, from 6 April to 5 April. Not your usual journey to work, unless it is to a temporary workplace."
                  after="miles"
                  decimal
                  size="full"
                  field={miles}
                />
              </FieldRow>
              <InputNote>
                An electrically assisted pedal bike counts as a bicycle, and any other electric bike
                as a motorcycle.
              </InputNote>
            </InputSection>

            <InputSection title="What your employer pays">
              <FieldRow>
                <NumberField
                  id="rate"
                  hint="For each business mile. Enter 0 if they pay nothing."
                  after="p"
                  decimal
                  size="full"
                  field={rate}
                  below={
                    <Chips
                      label="Common rates"
                      options={chipsFor(vehicle)}
                      current={rate.text}
                      onPick={rate.setText}
                    />
                  }
                />
              </FieldRow>
            </InputSection>

            <InputSection title="Tax">
              <FieldRow>
                <NumberField
                  id="pay"
                  hint="Before tax, without mileage payments. Add any other taxable income."
                  before="£"
                  decimal
                  field={pay}
                />
                <RegionField value={region} onChange={state.region.set} />
              </FieldRow>
            </InputSection>

            {carOrVan && (
              <MoreOptions
                title={`Rate above ${firstMilesText} miles and passengers`}
                summary={optionsSummary}
              >
                <FieldRow>
                  <NumberField
                    id="rate-above"
                    hint="Leave it blank if they pay the same rate for every mile."
                    after="p"
                    decimal
                    optional
                    size="full"
                    field={rateAbove}
                  />
                </FieldRow>
                <FieldRow>
                  <NumberField
                    id="passenger-miles"
                    hint="Business miles with a colleague who is also travelling for work."
                    after="miles"
                    decimal
                    field={passengerMiles}
                  />
                  <NumberField id="passengers" hint="On those miles." field={passengers} />
                </FieldRow>
                <FieldRow>
                  <NumberField
                    id="passenger-rate"
                    hint={`For each passenger. Up to ${formatPence(MILEAGE.passenger.rate)} a mile is tax-free.`}
                    after="p"
                    decimal
                    size="full"
                    field={passengerRate}
                  />
                </FieldRow>
              </MoreOptions>
            )}
          </InputCard>

          <Notice>
            {scottish
              ? 'This uses Scottish income tax rates for the tax your relief saves. The mileage rates and National Insurance are the same across the UK.'
              : REST_OF_UK_NOTE}{' '}
            It works out one kind of vehicle for one employer, with the same miles and rates in both
            tax years. Cars and vans count together. If you use two kinds, such as a car and a
            bicycle, work each out on its own, and if you have two jobs with employers in the same
            group, add their miles together. Miles in a company car or van are not covered.
          </Notice>
        </>
      }
      result={
        <ResultCard
          label={label}
          figures={years.map((result) => ({
            value: formatGBPPence(result.headline),
            per: per(result),
          }))}
          prompt={problem}
          shareLink={state.shareLink}
        >
          <table className="result-table result-table--columns">
            <caption>Your miles against the approved rates</caption>
            <thead>
              <tr>
                <td></td>
                <th scope="col">{TAX_YEAR}</th>
                <th scope="col">{NEXT_TAX_YEAR}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Approved amount</th>
                <td>{formatGBPPence(now.approved)}</td>
                <td>{formatGBPPence(next.approved)}</td>
              </tr>
              <tr>
                <th scope="row">Paid by your employer</th>
                <td>{formatGBPPence(now.paid)}</td>
                <td>{formatGBPPence(next.paid)}</td>
              </tr>
              {row('Mileage Allowance Relief to claim', now.relief, next.relief)}
              {row('Taxable amount', now.taxable, next.taxable)}
              {row('Passenger payments, tax-free', taxFreePassengers(now), taxFreePassengers(next))}
              {row('Passenger payments, taxable', now.passenger.taxable, next.passenger.taxable)}
              {row(`${taxName} it saves`, now.taxSaved, next.taxSaved)}
              {row(`Extra ${taxWords}`, now.extraTax, next.extraTax)}
              {row('National Insurance', now.nationalInsurance, next.nationalInsurance)}
            </tbody>
          </table>
          <p className="result-card__line">
            {carOrVan && approvedRise > 0.005 ? (
              <>
                The approved rate above {firstMilesText} miles goes up from{' '}
                {formatPence(MILEAGE.carOrVan.laterMilesRate)} to{' '}
                {formatPence(nextCarRates.laterMilesRate)} on {NEXT_TAX_YEAR_START}, which adds{' '}
                {formatGBPPence(approvedRise)} to your approved amount.
              </>
            ) : (
              <>The approved rates for your miles are the same in both years.</>
            )}
          </p>
        </ResultCard>
      }
      notices={notices.length > 0 ? notices : null}
      working={problem ? null : bothYears(now, next)}
      guide={<MileageAllowanceGuide />}
      guides={['/guides/budget-2026']}
      related={['/self-employed-tax-calculator', '/salary-calculator']}
    />
  )
}

// The working for both years: what can be claimed or is taxed in each, then
// the tax, National Insurance and passenger payments for each year.
function bothYears(now, next) {
  const [nowFirst, ...nowDetail] = now.working
  const [nextFirst, ...nextDetail] = next.working
  return [nowFirst, nextFirst, ...nowDetail, ...nextDetail]
}
