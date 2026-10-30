// The mileage allowance calculator: what someone who uses their own vehicle
// for work can claim back, or pays tax on, for a tax year. The rates are in
// rates/mileage.js, by tax year, including 2027/28, whose rate above 10,000
// miles Budget 2026 announced.
//
// The rules, from HMRC's Employment Income Manual (EIM31230 to EIM31415) and
// National Insurance Manual (NIM05830 to NIM05870), checked on 30 October 2026:
// - The approved amount is the business miles in the tax year times the rate
//   for the kind of vehicle. A car or van has one rate for the first 10,000
//   miles and another above that (EIM31230).
// - What the employer paid is set against it (EIM31235). If they paid less,
//   the difference is Mileage Allowance Relief, which comes off taxable pay.
//   If they paid more, the difference is taxable and goes on form P11D.
// - The relief saves income tax at the rates on the top slice of pay, and
//   never more than the tax paid. A taxable amount costs income tax the same
//   way. Both are worked out as the tax with and without it, so the bands, the
//   Personal Allowance taper and Scottish rates all count.
// - National Insurance is due only on what is paid above the highest rate for
//   the kind of vehicle, for every mile (55p for a car or van), and there is
//   no relief from it (NIM05833, NIM05835). Payroll works it out on each pay
//   day. This works it out on the year, which comes to the same when the rate
//   per mile is the same all year.
// - Passenger payments: up to 5p a mile for each fellow employee carried on
//   business in a car or van are free of tax (EIM31405) and National Insurance
//   (NIM05870). More than that is taxable. Less gives no relief (EIM31410).
//
// It covers one kind of vehicle for one employer. Cars and vans count
// together, and other kinds are worked out on their own (EIM31275).

import { calculateIncomeTax, incomeTaxLabel } from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { MILEAGE_RATES } from './rates/mileage.js'
import { CURRENT_TAX_YEAR, forTaxYear } from './rates/taxYear.js'
import { add, info, part, subtract, total } from './working.js'

/** The kinds of vehicle, as MILEAGE_RATES names them. */
export const VEHICLES = ['carOrVan', 'motorcycle', 'bicycle']

// An amount to the penny. Worked on the figure as written, so 12,000 miles at
// 50.8p comes to exactly £6,096 and not a little more or less.
const penny = (pounds) => Math.round(Number((pounds * 100).toPrecision(12))) / 100

/** Miles times a rate in pounds a mile, to the penny. */
export const amountFor = (miles, rate) => penny(atLeastZero(miles) * rate)

const formatMiles = (miles) => miles.toLocaleString('en-GB')

/**
 * The approved amount for a year's business miles in one kind of vehicle.
 * vehicleRates is that kind's entry from MILEAGE_RATES. bands are the miles
 * at each rate: two for a car or van (the first 10,000 and the rest), one
 * for anything else.
 */
export function approvedAmount(miles, vehicleRates) {
  const all = atLeastZero(miles)
  const { firstMiles, firstMilesRate, laterMilesRate, rate } = vehicleRates
  const bands = Number.isFinite(firstMiles)
    ? [
        {
          label: `First ${formatMiles(firstMiles)} business miles`,
          miles: Math.min(all, firstMiles),
          rate: firstMilesRate,
        },
        {
          label: `Business miles above ${formatMiles(firstMiles)}`,
          miles: Math.max(0, all - firstMiles),
          rate: laterMilesRate,
        },
      ]
    : [{ label: 'Business miles', miles: all, rate }]
  for (const band of bands) band.amount = amountFor(band.miles, band.rate)
  return { bands, total: penny(bands.reduce((sum, band) => sum + band.amount, 0)) }
}

/**
 * HMRC's three steps for one kind of vehicle (EIM31235): what the employer
 * paid for the year, less the approved amount. relief is the Mileage Allowance
 * Relief when they paid less, and taxable what is taxed when they paid more.
 */
export function compareWithApproved(miles, paid, vehicleRates) {
  const { bands, total: approved } = approvedAmount(miles, vehicleRates)
  const paidForYear = penny(atLeastZero(paid))
  return {
    bands,
    approved,
    paid: paidForYear,
    relief: penny(Math.max(0, approved - paidForYear)),
    taxable: penny(Math.max(0, paidForYear - approved)),
  }
}

/**
 * What an employer pays for the year at a rate per mile, in pounds. rateAbove
 * is a different rate for a car or van's miles above 10,000, or null when the
 * rate is the same for every mile.
 */
export function employerPays(miles, rate, rateAbove, vehicleRates) {
  const all = atLeastZero(miles)
  const perMile = atLeastZero(rate)
  const { firstMiles } = vehicleRates
  if (rateAbove === null || rateAbove === undefined || !Number.isFinite(firstMiles)) {
    return amountFor(all, perMile)
  }
  const first = Math.min(all, firstMiles)
  return penny(amountFor(first, perMile) + amountFor(all - first, atLeastZero(rateAbove)))
}

/** The extra employee National Insurance on `extra` on top of a year's pay, by band. */
function extraNationalInsurance(pay, extra, taxYear) {
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = forTaxYear(
    INCOME_TAX_RATES,
    taxYear,
  ).nationalInsurance
  const slice = (name, from, to, rate) => {
    const on = Math.max(0, Math.min(pay + extra, to) - Math.max(pay, from))
    return { name, rate, on, amount: penny(on * rate) }
  }
  return [
    slice('Main rate', primaryThreshold, upperEarningsLimit, mainRate),
    slice('Upper rate', upperEarningsLimit, Infinity, upperRate),
  ]
}

/**
 * Mileage Allowance Relief, or the taxable amount, for one tax year.
 *
 * - vehicle: 'carOrVan', 'motorcycle' or 'bicycle'.
 * - miles: business miles in the tax year.
 * - employerRate: what the employer pays a mile, in pounds (0.45 for 45p).
 *   employerRateAbove is a different rate above 10,000 miles in a car or
 *   van, or null for the same rate.
 * - passengerMiles, passengers and passengerRate: miles with fellow
 *   employees carried on business, how many, and what the employer pays for
 *   each a mile. Cars and vans only.
 * - pay: pay for the year before tax, without mileage payments.
 *
 * In a year with no Scottish rates or National Insurance rates yet (2027/28),
 * the current year's are used, and taxRatesYear and niRatesYear say so.
 */
export function calculateMileageAllowance({
  vehicle = 'carOrVan',
  miles,
  employerRate,
  employerRateAbove = null,
  passengerMiles = 0,
  passengers = 1,
  passengerRate = 0,
  pay,
  scottish = false,
  taxYear,
}) {
  const year = taxYear ?? CURRENT_TAX_YEAR
  const mileageRates = forTaxYear(MILEAGE_RATES, year)
  const vehicleRates = mileageRates[vehicle]
  if (!VEHICLES.includes(vehicle)) throw new Error(`There are no mileage rates for ${vehicle}`)
  const businessMiles = atLeastZero(miles)
  const yearPay = atLeastZero(pay)

  // The three steps.
  const paid = employerPays(businessMiles, employerRate, employerRateAbove, vehicleRates)
  const { bands, approved, relief, taxable } = compareWithApproved(
    businessMiles,
    paid,
    vehicleRates,
  )

  // Passenger payments, for each passenger on each mile.
  const carriesPassengers = vehicle === 'carOrVan'
  const passengerMilesInAll = carriesPassengers
    ? Math.min(atLeastZero(passengerMiles), businessMiles) * Math.max(1, atLeastZero(passengers))
    : 0
  const passengerPaid = amountFor(passengerMilesInAll, atLeastZero(passengerRate))
  const passengerTaxFree = amountFor(passengerMilesInAll, mileageRates.passenger.rate)
  const passengerTaxable = penny(Math.max(0, passengerPaid - passengerTaxFree))

  const taxableInAll = penny(taxable + passengerTaxable)
  const kind = relief > 0 ? 'relief' : taxableInAll > 0 ? 'taxable' : 'even'
  const headline = kind === 'relief' ? relief : taxableInAll

  // Income tax with and without the relief or the taxable amount.
  const incomeRates = forTaxYear(INCOME_TAX_RATES, year)
  const taxRatesYear = scottish && !incomeRates.scottishIncomeTax ? CURRENT_TAX_YEAR : year
  const taxOn = (amount) => calculateIncomeTax(amount, { scottish, taxYear: taxRatesYear }).tax
  const payAfter = Math.max(0, yearPay + taxableInAll - relief)
  // Each to the penny, so the lines in the working add up to the difference.
  const taxBefore = penny(taxOn(yearPay))
  const taxAfter = penny(taxOn(payAfter))
  const taxSaved = penny(Math.max(0, taxBefore - taxAfter))
  const extraTax = penny(Math.max(0, taxAfter - taxBefore))

  // National Insurance on what is paid above the highest rate, for every mile.
  const { firstMilesRate, laterMilesRate, rate } = vehicleRates
  const niFreeRate = Number.isFinite(firstMilesRate)
    ? Math.max(firstMilesRate, laterMilesRate)
    : rate
  const niFree = amountFor(businessMiles, niFreeRate)
  const niOnMileage = penny(Math.max(0, paid - niFree))
  const niLiable = penny(niOnMileage + passengerTaxable)
  const niRatesYear = incomeRates.nationalInsurance ? year : CURRENT_TAX_YEAR
  const niBands = extraNationalInsurance(yearPay, niLiable, niRatesYear)
  const nationalInsurance = penny(niBands.reduce((sum, band) => sum + band.amount, 0))

  const taxName = incomeTaxLabel(scottish)
  const taxWords = scottish ? taxName : 'income tax'
  // What changes the tax: the relief, the taxable amount, or now and then both.
  const changes =
    relief > 0 && passengerTaxable > 0
      ? 'the relief and taxable passenger payments'
      : relief > 0
        ? 'the relief'
        : 'the taxable amount'
  const ratesNote =
    taxRatesYear === year
      ? ''
      : ` It uses the ${taxRatesYear} Scottish rates, as the ${year} ones are not set yet.`
  const pence = { unit: 'gbpPence' }
  const bandLine = (line) => (band) =>
    line(band.label, band.amount, { count: band.miles, each: band.rate, unit: 'gbpPence' })
  // The bands with miles in them, or the first one when there are none.
  const shownBands = bands.filter((band, index) => band.miles > 0 || index === 0)

  const working = [
    kind === 'taxable'
      ? part(
          `Taxable mileage payments in ${year}`,
          [
            add('Paid by your employer', paid, pence),
            ...shownBands.map(bandLine(subtract)),
            passengerTaxable > 0 &&
              add('Passenger payments above the tax-free rate', passengerTaxable, pence),
          ],
          total('Taxable amount', taxableInAll, pence),
          'Your employer reports what they pay above the approved amount on form P11D, and it is taxed as pay.',
        )
      : part(
          `Mileage Allowance Relief for ${year}`,
          [...shownBands.map(bandLine(add)), subtract('Paid by your employer', paid, pence)],
          total('Mileage Allowance Relief', relief, { ...pence, rounding: 'notBelowZero' }),
          'The approved amount is your business miles times the approved rates. You can claim the part your employer did not pay.',
        ),
    kind !== 'even' &&
      taxAfter <= taxBefore &&
      part(
        `${taxName} it saves in ${year}`,
        [
          info('Your pay before tax', yearPay, pence),
          info(`Your pay with ${changes}`, payAfter, pence),
          add(`${taxName} without ${changes}`, taxBefore, pence),
          subtract(`${taxName} with ${changes}`, taxAfter, pence),
        ],
        total(`${taxName} it saves`, taxSaved, pence),
        `The relief comes off your pay before tax is worked out, so it saves tax at your highest rates, and never more than the tax you pay.${ratesNote}`,
      ),
    kind !== 'even' &&
      taxAfter > taxBefore &&
      part(
        `Extra ${taxWords} in ${year}`,
        [
          info('Your pay before tax', yearPay, pence),
          info(`Your pay with ${changes}`, payAfter, pence),
          add(`${taxName} with ${changes}`, taxAfter, pence),
          subtract(`${taxName} without ${changes}`, taxBefore, pence),
        ],
        total(`Extra ${taxWords}`, extraTax, pence),
        `The taxable amount is added to your pay, so it is taxed at your highest rates.${ratesNote}`,
      ),
    niLiable > 0 &&
      part(
        `National Insurance on mileage payments in ${year}`,
        [
          info('Paid by your employer for your miles', paid, pence),
          info('Free of National Insurance', niFree, {
            count: businessMiles,
            each: niFreeRate,
            unit: 'gbpPence',
          }),
          niOnMileage > 0 && info('Mileage payments above that', niOnMileage, pence),
          passengerTaxable > 0 &&
            info('Passenger payments above the tax-free rate', passengerTaxable, pence),
          ...niBands
            .filter((band) => band.on > 0)
            .map((band) => add(band.name, band.amount, { rate: band.rate, on: band.on, ...pence })),
        ],
        total('National Insurance', nationalInsurance, pence),
        `National Insurance uses the highest approved rate for every business mile, with no relief. Payroll works it out on each pay day, so it can differ a little if your miles change through the year.${
          niRatesYear === year ? '' : ` It uses the ${niRatesYear} National Insurance rates.`
        }`,
      ),
    passengerMilesInAll > 0 &&
      part(
        `Passenger payments in ${year}`,
        [
          info('Passenger miles', passengerMilesInAll, { unit: 'number' }),
          add('Paid by your employer for passengers', passengerPaid, pence),
          subtract('Tax-free amount', passengerTaxFree, {
            count: passengerMilesInAll,
            each: mileageRates.passenger.rate,
            unit: 'gbpPence',
          }),
        ],
        total('Taxable passenger payments', passengerTaxable, {
          ...pence,
          rounding: 'notBelowZero',
        }),
        'Each mile counts once for each passenger. There is no relief when your employer pays less than the tax-free rate.',
      ),
  ].filter(Boolean)

  return {
    taxYear: year,
    vehicle,
    miles: businessMiles,
    bands,
    approved,
    paid,
    relief,
    taxable,
    passenger: {
      miles: passengerMilesInAll,
      paid: passengerPaid,
      taxFree: passengerTaxFree,
      taxable: passengerTaxable,
    },
    taxableInAll,
    kind,
    headline,
    pay: yearPay,
    taxBefore,
    taxAfter,
    taxSaved,
    extraTax,
    taxRatesYear,
    niFreeRate,
    niFree,
    niLiable,
    nationalInsurance,
    niRatesYear,
    working,
  }
}
