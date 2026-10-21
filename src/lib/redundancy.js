// The statutory redundancy pay calculator. Its limits are in
// rates/redundancy.js, by tax year.

import { atLeastZero } from './numbers.js'
import { REDUNDANCY_RATES } from './rates/redundancy.js'
import { forTaxYear } from './rates/taxYear.js'
import { add, info, part, total } from './working.js'

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

  const years = { unit: 'years' }
  if (fullYears < minYearsToQualify) {
    return {
      qualifies: false,
      reason: 'too-few-years',
      minYearsToQualify,
      working: [
        part('Why you would not qualify yet', [
          info('Full years with your employer', fullYears, years),
          info('Full years needed', minYearsToQualify, years),
        ]),
      ],
    }
  }
  if (fullYears > age - earliestServiceAge) {
    return {
      qualifies: false,
      reason: 'service-too-long',
      earliestServiceAge,
      working: [
        part('Why these figures do not work', [
          info('Your age', age, years),
          info('Full years with your employer', fullYears, years),
          info('The youngest age service counts from', earliestServiceAge, years),
        ]),
      ],
    }
  }

  const cap = region === 'NI' ? weeklyPayCapNI : weeklyPayCapGB
  const cappedWeeklyPay = Math.min(atLeastZero(weeklyPay), cap)
  const cappedYears = Math.min(fullYears, maxYearsCounted)

  let totalWeeks = 0
  // Years in each age band, for the working.
  const yearsIn = { older: 0, middle: 0, younger: 0 }
  for (let i = 0; i < cappedYears; i++) {
    const ageAtStartOfYear = age - i - 1
    if (ageAtStartOfYear >= 41) {
      totalWeeks += 1.5
      yearsIn.older++
    } else if (ageAtStartOfYear >= 22) {
      totalWeeks += 1
      yearsIn.middle++
    } else {
      totalWeeks += 0.5
      yearsIn.younger++
    }
  }
  // Half-weeks times whole pence keeps the sum exact before rounding down.
  const exactPay = (Math.round(totalWeeks * 2) * Math.round(cappedWeeklyPay * 100)) / 200
  const weeks = { unit: 'weeks' }
  const band = (label, count, each) =>
    count > 0 && add(label, count * each, { ...weeks, count, each })

  return {
    qualifies: true,
    totalWeeks,
    weeklyPayUsed: cappedWeeklyPay,
    weeklyPayWasCapped: weeklyPay > cap,
    pay: Math.floor(exactPay),
    taxFreeThreshold,
    cap,
    working: [
      part(
        'Statutory redundancy pay',
        [
          add("Weeks' pay at your weekly pay", exactPay, {
            count: totalWeeks,
            each: cappedWeeklyPay,
          }),
        ],
        total('Statutory redundancy pay, rounded down to the pound', Math.floor(exactPay), {
          rounding: 'down',
        }),
      ),
      part(
        "Weeks' pay for your years of service",
        [
          info('Full years counted, up to the most that count', cappedYears, years),
          band('Years from age 41', yearsIn.older, 1.5),
          band('Years from age 22 to 40', yearsIn.middle, 1),
          band('Years under age 22', yearsIn.younger, 0.5),
        ],
        total("Weeks' pay", totalWeeks, weeks),
      ),
      part('Weekly pay used', [
        info('Your weekly pay', atLeastZero(weeklyPay), { unit: 'gbpPence' }),
        info('The most that counts', cap),
        info('Weekly pay used', cappedWeeklyPay, { unit: 'gbpPence' }),
      ]),
    ],
  }
}
