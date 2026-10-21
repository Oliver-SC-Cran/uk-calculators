// The minimum wage checker. Its rates are in rates/minimumWage.js, by tax year.

import { atLeastZero } from './numbers.js'
import { FULL_TIME_HOURS, MINIMUM_WAGE_RATES } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, subtract, total } from './working.js'

/**
 * Works out which statutory minimum wage band applies and whether the
 * hourly rate entered meets it. Anyone under school leaving age is not
 * entitled to the minimum wage at all.
 */
export function checkMinimumWage({ age, hourlyRate, isApprentice, taxYear }) {
  const { nationalLivingWage, age18to20, under18, apprentice, minAge } = forTaxYear(
    MINIMUM_WAGE_RATES,
    taxYear,
  )

  if (!(age >= minAge)) {
    return {
      entitled: false,
      minAge,
      working: [
        part('Who the minimum wage covers', [
          Number.isFinite(age) && info('Your age', age, { unit: 'years' }),
          info('School leaving age, usually', minAge, { unit: 'years' }),
        ]),
      ],
    }
  }

  let applicableRate
  let bandLabel
  if (isApprentice) {
    applicableRate = apprentice
    bandLabel = 'Apprentice rate'
  } else if (age >= 21) {
    applicableRate = nationalLivingWage
    bandLabel = 'National Living Wage (21+)'
  } else if (age >= 18) {
    applicableRate = age18to20
    bandLabel = '18 to 20 rate'
  } else {
    applicableRate = under18
    bandLabel = 'Under 18 rate'
  }

  // Work in whole pence so 12.71 - 11.50 is exactly 1.21.
  const shortfallPence =
    Math.round(applicableRate * 100) - Math.round(atLeastZero(hourlyRate) * 100)
  const shortfall = Math.max(0, shortfallPence) / 100
  const pay = atLeastZero(hourlyRate)
  const weeklyAtMinimum = applicableRate * FULL_TIME_HOURS
  const annualAtMinimum = applicableRate * FULL_TIME_HOURS * 52
  const pence = { unit: 'gbpPence' }

  return {
    entitled: true,
    applicableRate,
    bandLabel,
    shortfall,
    isUnderpaid: shortfall > 0,
    weeklyAtMinimum,
    annualAtMinimum,
    working: [
      part(
        'Your legal minimum',
        [info('Your age', age, { unit: 'years' }), add(bandLabel, applicableRate, pence)],
        total('Legal minimum an hour', applicableRate, pence),
      ),
      part(
        'Your pay against the minimum',
        [
          add('Legal minimum an hour', applicableRate, pence),
          subtract('Your hourly pay', pay, pence),
        ],
        total('Below the minimum by, an hour', shortfall, { ...pence, rounding: 'notBelowZero' }),
      ),
      part(
        'The minimum for a full-time week',
        [
          add('Hours a week at the minimum', weeklyAtMinimum, {
            ...pence,
            count: FULL_TIME_HOURS,
            each: applicableRate,
          }),
        ],
        total('The minimum a week', weeklyAtMinimum, pence),
      ),
      part(
        'The minimum over a year',
        [add('Weeks in a year', annualAtMinimum, { ...pence, count: 52, each: weeklyAtMinimum })],
        total('The minimum a year', annualAtMinimum, pence),
      ),
    ],
  }
}
