// The minimum wage checker. Its rates are in rates/minimumWage.js, by tax year.

import { atLeastZero } from './numbers.js'
import { FULL_TIME_HOURS, MINIMUM_WAGE_RATES } from './rates/minimumWage.js'
import { forTaxYear } from './rates/taxYear.js'

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
    return { entitled: false, minAge }
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

  return {
    entitled: true,
    applicableRate,
    bandLabel,
    shortfall,
    isUnderpaid: shortfall > 0,
    weeklyAtMinimum: applicableRate * FULL_TIME_HOURS,
    annualAtMinimum: applicableRate * FULL_TIME_HOURS * 52,
  }
}
