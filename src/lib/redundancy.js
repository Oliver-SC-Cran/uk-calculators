// The statutory redundancy pay calculator. Its limits are in
// rates/redundancy.js, by tax year.

import { atLeastZero } from './numbers.js'
import { REDUNDANCY_RATES } from './rates/redundancy.js'
import { forTaxYear } from './rates/taxYear.js'

/**
 * Statutory redundancy pay. This is the standard age-banded method:
 * counts backward from the current age for each year of service, so a
 * long-serving employee gets 0.5/1/1.5 weeks per year depending on how
 * old they were during *that* year, not just their age today.
 *
 * A year only counts at the higher rate if the employee was 22 (or 41) or
 * older for the whole of it, so each year is banded by the age they were
 * when it started. Like the gov.uk calculator, the result is rounded down
 * to the whole pound, and service that started before age 15 is rejected.
 *
 * It works in whole years of age. For a real, live dismissal, especially
 * right on an age-band boundary, verify against the official gov.uk
 * redundancy calculator, since exact employment dates can shift the result.
 */
export function calculateRedundancyPay({ age, yearsOfService, weeklyPay, region = 'GB', taxYear }) {
  const limits = forTaxYear(REDUNDANCY_RATES, taxYear)
  const { weeklyPayCapGB, weeklyPayCapNI, maxYearsCounted, minYearsToQualify } = limits
  const { earliestServiceAge, taxFreeThreshold } = limits

  const fullYears = Math.floor(atLeastZero(yearsOfService))

  if (fullYears < minYearsToQualify) {
    return { qualifies: false, reason: 'too-few-years', minYearsToQualify }
  }
  if (fullYears > age - earliestServiceAge) {
    return { qualifies: false, reason: 'service-too-long', earliestServiceAge }
  }

  const cap = region === 'NI' ? weeklyPayCapNI : weeklyPayCapGB
  const cappedWeeklyPay = Math.min(atLeastZero(weeklyPay), cap)
  const cappedYears = Math.min(fullYears, maxYearsCounted)

  let totalWeeks = 0
  for (let i = 0; i < cappedYears; i++) {
    const ageAtStartOfYear = age - i - 1
    if (ageAtStartOfYear >= 41) totalWeeks += 1.5
    else if (ageAtStartOfYear >= 22) totalWeeks += 1
    else totalWeeks += 0.5
  }

  return {
    qualifies: true,
    totalWeeks,
    weeklyPayUsed: cappedWeeklyPay,
    weeklyPayWasCapped: weeklyPay > cap,
    // Half-weeks times whole pence keeps the sum exact before rounding down.
    pay: Math.floor((Math.round(totalWeeks * 2) * Math.round(cappedWeeklyPay * 100)) / 200),
    taxFreeThreshold,
    cap,
  }
}
