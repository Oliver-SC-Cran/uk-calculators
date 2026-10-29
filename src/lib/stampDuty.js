// The stamp duty calculator, for England and Northern Ireland. Its rates are in
// rates/stampDuty.js, by tax year.

import { formatGBP, percent } from './format.js'
import { atLeastZero } from './numbers.js'
import { STAMP_DUTY_RATES } from './rates/stampDuty.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, total } from './working.js'

/**
 * The slices of an amount, each taxed at its band's rate plus any surcharge.
 * Whole-number percentages keep the sums exact.
 */
function slices(amount, bands, surcharge = 0) {
  const breakdown = []
  let from = 0
  for (const band of bands) {
    if (amount <= from) break
    const to = Math.min(amount, band.upTo)
    const ratePercent = Math.round((band.rate + surcharge) * 100)
    breakdown.push({
      from,
      to,
      rate: ratePercent / 100,
      amountInBand: to - from,
      tax: ((to - from) * ratePercent) / 100,
    })
    from = band.upTo
  }
  return breakdown
}

/** The working lines for each slice of a price. */
const sliceLines = (breakdown) =>
  breakdown.map((slice) =>
    add('Tax on this part of the price', slice.tax, {
      rate: slice.rate,
      on: slice.amountInBand,
      from: slice.from,
      to: slice.to,
    }),
  )

// Rounds down to the pound. The small allowance stops a sum such as 0.1 + 0.2
// coming out a hair under the pound it should be.
const downToPound = (amount) => Math.floor(amount + 1e-9)
const toPenny = (amount) => Math.round(amount * 100) / 100

/**
 * Stamp duty for one residential purchase by an individual.
 * buyerType is 'homeMover', 'firstTimeBuyer' or 'additional'.
 *
 * The tax is charged in slices, like income tax. Surcharges are added to the
 * rate of every slice, including the first one. The total is rounded down to
 * the whole pound.
 */
export function calculateStampDuty({
  price,
  buyerType = 'homeMover',
  nonResident = false,
  taxYear,
}) {
  const rates = forTaxYear(STAMP_DUTY_RATES, taxYear)
  const { firstTimeBuyer, additionalPropertySurcharge, nonResidentSurcharge } = rates
  const amount = atLeastZero(price)

  const isFirstTimeBuyer = buyerType === 'firstTimeBuyer'
  const firstTimeBuyerOverLimit = isFirstTimeBuyer && amount > firstTimeBuyer.maxPrice
  const reliefApplies = isFirstTimeBuyer && !firstTimeBuyerOverLimit
  const bands = reliefApplies ? firstTimeBuyer.bands : rates.bands

  const surchargesApply = amount >= rates.surchargeMinimumPrice
  const additionalApplies = buyerType === 'additional' && surchargesApply
  const nonResidentApplies = Boolean(nonResident) && surchargesApply
  const surcharge =
    (additionalApplies ? additionalPropertySurcharge : 0) +
    (nonResidentApplies ? nonResidentSurcharge : 0)

  const breakdown = slices(amount, bands, surcharge)
  const tax = Math.floor(breakdown.reduce((sum, band) => sum + band.tax, 0))

  return {
    price: amount,
    tax,
    effectiveRate: amount > 0 ? tax / amount : 0,
    breakdown,
    reliefApplies,
    firstTimeBuyerOverLimit,
    additionalApplies,
    nonResidentApplies,
    // Buying an additional property or as a non-resident, but under the minimum price.
    surchargeWaived:
      amount > 0 && (buyerType === 'additional' || Boolean(nonResident)) && !surchargesApply,
    working: [
      part(
        'Stamp duty',
        sliceLines(breakdown),
        total('Stamp duty, rounded down to the pound', tax, { rounding: 'down' }),
      ),
      part('Rates used', [
        info('The price', amount),
        reliefApplies && info('First-time buyer rates apply up to', firstTimeBuyer.maxPrice),
        surcharge > 0 && info('Added to the rate on every part', surcharge, { unit: 'percent' }),
      ]),
    ],
  }
}

/**
 * The net present value of the rent on a lease, as HMRC works it out for
 * stamp duty: each year's rent is discounted at 3.5% a year, compounded, so
 * the rent in year 2 is divided by 1.035 twice.
 *
 * yearlyRent is the rent in the first year. It goes up by yearlyRise (0.03
 * for 3%) at the start of each year up to the fifth. After the fifth year
 * every year counts at the highest rent in the first five, so later rises
 * are left out.
 */
export function rentNetPresentValue({ yearlyRent, years, yearlyRise = 0, taxYear }) {
  const { rentDiscountRate, rentYearsKnown } = forTaxYear(STAMP_DUTY_RATES, taxYear).sharedOwnership
  const rent = atLeastZero(yearlyRent)
  const leaseYears = Math.floor(atLeastZero(years))
  const rise = atLeastZero(yearlyRise)
  const discount = (year) => (1 + rentDiscountRate) ** year

  const knownYears = []
  for (let year = 1; year <= Math.min(rentYearsKnown, leaseYears); year += 1) {
    const yearRent = rent * (1 + rise) ** (year - 1)
    knownYears.push({ year, rent: yearRent, presentValue: yearRent / discount(year) })
  }
  const highestRent = knownYears.reduce((highest, each) => Math.max(highest, each.rent), 0)
  let laterValue = 0
  for (let year = rentYearsKnown + 1; year <= leaseYears; year += 1) {
    laterValue += highestRent / discount(year)
  }
  const knownValue = knownYears.reduce((sum, each) => sum + each.presentValue, 0)
  return {
    value: knownValue + laterValue,
    knownYears,
    highestRent,
    laterYears: Math.max(0, leaseYears - rentYearsKnown),
    laterValue,
  }
}

/**
 * The most yearly rent that a lease of this many years can have before any
 * tax is due on it, if the rent never rises. For the guide.
 */
export function largestUntaxedRent({ years, taxYear }) {
  const { rentNilBand } = forTaxYear(STAMP_DUTY_RATES, taxYear).sharedOwnership
  const perPound = rentNetPresentValue({ yearlyRent: 1, years, taxYear }).value
  return perPound > 0 ? rentNilBand / perPound : Infinity
}

/** The working for the net present value of the rent. */
function rentWorking(npv, { monthlyRent, yearlyRent, leaseYears, rates }) {
  const { rentDiscountRate, rentYearsKnown } = rates
  const pence = { unit: 'gbpPence' }
  const rises = npv.knownYears.some((each) => Math.abs(each.rent - yearlyRent) > 0.005)
  const lines = []
  if (rises) {
    for (const { year, rent } of npv.knownYears) {
      const label =
        year === rentYearsKnown && npv.laterYears > 0
          ? `Rent in year ${year} and each year after`
          : `Rent in year ${year}`
      const extra = year === 1 ? { count: 12, each: monthlyRent } : {}
      lines.push(info(label, rent, { ...pence, ...extra }))
    }
  } else {
    lines.push(info('Rent each year', yearlyRent, { ...pence, count: 12, each: monthlyRent }))
  }
  for (const { year, presentValue } of npv.knownYears) {
    lines.push(add(`Year ${year}, discounted`, presentValue, pence))
  }
  if (npv.laterYears > 0) {
    const first = rentYearsKnown + 1
    const label =
      leaseYears === first
        ? `Year ${first}, discounted`
        : `Years ${first} to ${leaseYears}, discounted`
    lines.push(add(label, npv.laterValue, pence))
  }
  return part(
    'The net present value of the rent',
    lines,
    total('Net present value of the rent', npv.value, pence),
    `Each year's rent is discounted by ${percent(rentDiscountRate)} a year, compounded, to give its value today. After year ${rentYearsKnown}, every year counts at the highest rent in the first ${rentYearsKnown} years.`,
  )
}

/**
 * Stamp duty on a new shared ownership lease from a housing association,
 * council or other approved body, worked out both ways you can pay it.
 *
 * - In stages: the usual rates on the price of your share, plus 1% of the
 *   net present value of the rent above £125,000. Nothing more is due on
 *   later shares until your share goes over 80%.
 * - With a market value election: the usual rates on the full market value
 *   in the lease, all at once. The rent is not taxed, and nothing more is
 *   due on later shares.
 *
 * First-time buyer relief works with both if the full market value is
 * £500,000 or less. Paying in stages, its rates apply to the price of your
 * share and the rent is not taxed. With the election, they apply to the full
 * market value. buyerType is 'homeMover' or 'firstTimeBuyer'. The higher
 * rates for additional properties and the non-resident surcharge are not
 * covered.
 *
 * sharePercent is 40 for 40%, and rentRisePercent 3 for 3% a year for the
 * first five years. monthlyRent left out (null) means it is estimated at
 * 2.75% a year of the value of the landlord's share, to the penny. The tax on
 * the price and the tax on the rent are each rounded down to the pound.
 */
export function calculateSharedOwnershipStampDuty({
  marketValue,
  sharePercent,
  monthlyRent = null,
  leaseYears,
  rentRisePercent = 0,
  buyerType = 'homeMover',
  taxYear,
}) {
  const rates = forTaxYear(STAMP_DUTY_RATES, taxYear)
  const { firstTimeBuyer, sharedOwnership } = rates
  const { rentNilBand, rentRate, typicalRentRate } = sharedOwnership

  const value = atLeastZero(marketValue)
  const share = Math.min(1, atLeastZero(sharePercent) / 100)
  const sharePrice = toPenny(value * share)
  const landlordShareValue = value - sharePrice
  const rentEstimated = monthlyRent === null || monthlyRent === undefined
  const rentEachMonth = rentEstimated
    ? toPenny((landlordShareValue * typicalRentRate) / 12)
    : atLeastZero(monthlyRent)
  const yearlyRent = rentEachMonth * 12
  const rentRise = atLeastZero(rentRisePercent) / 100
  const years = Math.floor(atLeastZero(leaseYears))

  const isFirstTimeBuyer = buyerType === 'firstTimeBuyer'
  const firstTimeBuyerOverLimit = isFirstTimeBuyer && value > firstTimeBuyer.maxPrice
  const reliefApplies = isFirstTimeBuyer && !firstTimeBuyerOverLimit
  const ratesFor = reliefApplies ? 'firstTimeBuyer' : 'homeMover'

  const onShare = calculateStampDuty({ price: sharePrice, buyerType: ratesFor, taxYear })
  const onValue = calculateStampDuty({ price: value, buyerType: ratesFor, taxYear })

  const npv = rentNetPresentValue({ yearlyRent, years, yearlyRise: rentRise, taxYear })
  const rentTaxable = Math.max(0, npv.value - rentNilBand)
  const rentTaxExact = reliefApplies ? 0 : rentTaxable * rentRate
  const rentTax = downToPound(rentTaxExact)
  const stagesTax = onShare.tax + rentTax

  const working = [
    part(
      'Stamp duty now if you pay in stages',
      [add('Tax on your share of the price', onShare.tax), add('Tax on the rent', rentTax)],
      total('Stamp duty now if you pay in stages', stagesTax),
      reliefApplies ? 'With first-time buyer relief, the rent is not taxed.' : undefined,
    ),
    part(
      'Stamp duty now with a market value election',
      [info('Full market value', value), ...sliceLines(onValue.breakdown)],
      total('Stamp duty with a market value election, rounded down to the pound', onValue.tax, {
        rounding: 'down',
      }),
      'With a market value election the rent is not taxed, and nothing more is due when you buy more shares.',
    ),
    part(
      'Tax on your share of the price',
      [
        info('Your share of the price', sharePrice, { rate: share, on: value }),
        ...sliceLines(onShare.breakdown),
      ],
      total('Tax on your share of the price, rounded down to the pound', onShare.tax, {
        rounding: 'down',
      }),
    ),
  ]
  if (!reliefApplies) {
    working.push(
      part(
        'Tax on the rent',
        [
          info('Net present value of the rent', npv.value, { unit: 'gbpPence' }),
          info('Not taxed up to', rentNilBand),
          rentTaxable > 0 &&
            add('Tax on the part above that', rentTaxExact, {
              unit: 'gbpPence',
              rate: rentRate,
              on: rentTaxable,
            }),
        ],
        total('Tax on the rent, rounded down to the pound', rentTax, { rounding: 'down' }),
        `Nothing is due on the first ${formatGBP(rentNilBand)} of the net present value of the rent.`,
      ),
      rentWorking(npv, {
        monthlyRent: rentEachMonth,
        yearlyRent,
        leaseYears: years,
        rates: sharedOwnership,
      }),
    )
  }
  working.push(
    part('Rates used', [
      info('Full market value', value),
      info('Your share', share, { unit: 'percent' }),
      rentEstimated &&
        info(
          "Yearly rent estimated from the landlord's share",
          landlordShareValue * typicalRentRate,
          {
            unit: 'gbpPence',
            rate: typicalRentRate,
            on: landlordShareValue,
          },
        ),
      info(rentEstimated ? 'Monthly rent used, to the penny' : 'Monthly rent', rentEachMonth, {
        unit: 'gbpPence',
      }),
      info('Yearly rent rise for the first five years', rentRise, { unit: 'percent' }),
      info('Length of the lease', years, { unit: 'years' }),
      reliefApplies && info('First-time buyer rates apply up to', firstTimeBuyer.maxPrice),
    ]),
  )

  return {
    marketValue: value,
    share,
    sharePrice,
    landlordShareValue,
    monthlyRent: rentEachMonth,
    yearlyRent,
    rentEstimated,
    rentRise,
    leaseYears: years,
    reliefApplies,
    firstTimeBuyerOverLimit,
    rent: {
      netPresentValue: npv.value,
      knownYears: npv.knownYears,
      highestRent: npv.highestRent,
      taxable: rentTaxable,
      taxed: !reliefApplies,
      tax: rentTax,
    },
    inStages: { price: sharePrice, priceTax: onShare.tax, rentTax, tax: stagesTax },
    election: { price: value, tax: onValue.tax, breakdown: onValue.breakdown },
    working,
  }
}

/**
 * Stamp duty on buying more of a shared ownership home (staircasing) when the
 * first share was paid for in stages, the way gov.uk and HMRC's manual
 * (SDLTM27065) set out. For the guide's worked example.
 *
 * Nothing is due while your share stays at 80% or less. For a share that
 * takes you over 80%, and any after it, work out the tax on everything paid
 * so far (paidBefore and this share's price) at the rates in force on the
 * day, then pay this share's part of it: that tax times this share's price
 * over the total paid. First-time buyer relief does not apply to later
 * shares. With a market value election, nothing more is due.
 */
export function staircasingStampDuty({
  paidBefore,
  sharePrice,
  shareAfterPercent,
  electionMade = false,
  taxYear,
}) {
  const { staircasingTaxedOver } = forTaxYear(STAMP_DUTY_RATES, taxYear).sharedOwnership
  const before = atLeastZero(paidBefore)
  const price = atLeastZero(sharePrice)
  const totalPaid = before + price
  const overLimit = atLeastZero(shareAfterPercent) / 100 > staircasingTaxedOver + 1e-12
  const taxed = !electionMade && overLimit && price > 0
  if (!taxed) return { tax: 0, taxed, totalPaid, taxOnTotal: 0, fraction: 0 }
  const taxOnTotal = calculateStampDuty({ price: totalPaid, taxYear }).tax
  const fraction = price / totalPaid
  return { tax: downToPound(taxOnTotal * fraction), taxed, totalPaid, taxOnTotal, fraction }
}
