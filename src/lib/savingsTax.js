// The savings interest tax calculator: the income tax someone pays because of
// their savings interest, in a tax year. The figures are in rates/incomeTax.js
// (savingsTax, and incomeTax for the bands), by tax year, including 2027/28,
// whose savings rates Budget 2026 announced.
//
// The rules, from gov.uk's "Tax on savings interest" and HMRC's tax
// calculation summary notes (SA110, 2026):
// - Interest is the top slice of income. The Personal Allowance goes against
//   other income first (the law from 2027/28, and what HMRC's working sheet
//   does for 2026/27). What is left of it covers interest.
// - The starting rate for savings: up to £5,000 of interest at 0%, less £1 for
//   every £1 of other income above the Personal Allowance.
// - The Personal Savings Allowance: £1,000, or £500 if taxable income with the
//   interest goes over the basic rate band, or nothing over £125,140. Interest
//   it covers still fills up the bands.
// - The rest is taxed at the savings rates in the UK bands. Scottish and Welsh
//   taxpayers pay UK rates on savings in the UK bands too.
// - Interest counts towards the income that tapers the Personal Allowance
//   over £100,000. The allowance it takes away from other income is taxed at
//   the rates for other income, which are Scottish ones in Scotland.
//
// So the answer is the extra income tax because of the interest. The page
// says what it leaves out: dividends, pension contributions, Gift Aid and
// Marriage Allowance.

import { calculateIncomeTax, taperedPersonalAllowance } from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { CURRENT_TAX_YEAR, forTaxYear } from './rates/taxYear.js'
import { add, info, part, subtract, total } from './working.js'

/** A year's interest on a balance at a yearly rate (AER), such as 4.5 for 4.5%. */
export const interestFrom = ({ balance, ratePercent }) =>
  (atLeastZero(balance) * atLeastZero(ratePercent)) / 100

/**
 * The tax on savings interest for one tax year. otherIncome is taxable income
 * other than savings and dividends, for the year: pay, pensions and profit.
 *
 * In a year with no Scottish rates yet (2027/28 until the Scottish Parliament
 * sets them), the tax on other income uses the current year's Scottish rates.
 * otherIncomeRatesYear says which year's rates that part used, and it only
 * matters when the interest takes away some of the Personal Allowance.
 */
export function calculateSavingsTax({ otherIncome, interest, scottish = false, taxYear }) {
  const year = taxYear ?? CURRENT_TAX_YEAR
  const rates = forTaxYear(INCOME_TAX_RATES, year)
  const { incomeTax, savingsTax } = rates
  const other = atLeastZero(otherIncome)
  const savings = atLeastZero(interest)

  // The Personal Allowance, tapered on all income, set against other income first.
  const allowance = taperedPersonalAllowance(other + savings, { taxYear: year })
  const allowanceForOther = Math.min(allowance, other)
  const taxableOther = other - allowanceForOther
  const coveredByAllowance = Math.min(savings, allowance - allowanceForOther)
  const taxableSavings = savings - coveredByAllowance
  const taxableIncome = taxableOther + taxableSavings

  // The starting rate for savings, then the Personal Savings Allowance.
  const startingRateBand = Math.max(0, savingsTax.startingRateForSavings - taxableOther)
  const coveredByStartingRate = Math.min(taxableSavings, startingRateBand)
  const basicRateBand = incomeTax.basicRateLimit - incomeTax.personalAllowance
  const additionalRateFrom = incomeTax.higherRateLimit
  const psaBand =
    taxableIncome > additionalRateFrom
      ? 'additional'
      : taxableIncome > basicRateBand
        ? 'higher'
        : 'basic'
  const personalSavingsAllowance = savingsTax.personalSavingsAllowance[psaBand]
  const coveredByPsa = Math.min(taxableSavings - coveredByStartingRate, personalSavingsAllowance)

  // The rest of the interest, taxed in the UK bands above everything before it.
  const bandLimits = [
    { name: 'Basic rate', band: 'basic', upTo: basicRateBand },
    { name: 'Higher rate', band: 'higher', upTo: additionalRateFrom },
    { name: 'Additional rate', band: 'additional', upTo: Infinity },
  ]
  let from = taxableOther + coveredByStartingRate + coveredByPsa
  let left = taxableSavings - coveredByStartingRate - coveredByPsa
  const bands = []
  for (const { name, band, upTo } of bandLimits) {
    const on = Math.max(0, Math.min(left, upTo - from))
    const rate = savingsTax.rates[band]
    bands.push({ name, band, rate, on, tax: on * rate })
    left -= on
    from += on
  }
  const taxOnInterest = bands.reduce((sum, each) => sum + each.tax, 0)

  // The Personal Allowance the interest takes away from other income.
  const allowanceWithout = taperedPersonalAllowance(other, { taxYear: year })
  const otherIncomeRatesYear = scottish && !rates.scottishIncomeTax ? CURRENT_TAX_YEAR : year
  const taxOnOther = (personalAllowance) =>
    calculateIncomeTax(other, {
      scottish,
      allowance: personalAllowance,
      taxYear: otherIncomeRatesYear,
    }).tax
  const otherTaxWith = taxOnOther(allowance)
  const otherTaxWithout = taxOnOther(allowanceWithout)
  const taxFromLostAllowance = Math.max(0, otherTaxWith - otherTaxWithout)

  const totalTax = taxOnInterest + taxFromLostAllowance

  const working = [
    part(
      `Tax on your savings interest in ${year}`,
      [
        info('Your savings interest', savings),
        coveredByAllowance > 0 && info('Covered by your Personal Allowance', coveredByAllowance),
        coveredByStartingRate > 0 &&
          info('Covered by the starting rate for savings', coveredByStartingRate),
        coveredByPsa > 0 && info('Covered by your Personal Savings Allowance', coveredByPsa),
        ...bands
          .filter((each) => each.on > 0)
          .map((each) =>
            add(`${each.name} on savings`, each.tax, {
              rate: each.rate,
              on: each.on,
              unit: 'gbpPence',
            }),
          ),
        taxFromLostAllowance > 0 &&
          add(
            'Tax on other income from the Personal Allowance the interest takes away',
            taxFromLostAllowance,
            {
              unit: 'gbpPence',
            },
          ),
      ],
      total('Tax because of your savings interest', totalTax, { unit: 'gbpPence' }),
    ),
    part(
      'Your allowances',
      [
        info('Your Personal Allowance', allowance),
        info('Used by your other income', allowanceForOther),
        info('Left for your interest', allowance - allowanceForOther),
        info('Starting rate for savings', savingsTax.startingRateForSavings),
        info('Less your other income above the Personal Allowance', taxableOther),
        info('Starting rate band left', startingRateBand),
        info('Taxable income with the interest', taxableIncome),
        info('Your Personal Savings Allowance', personalSavingsAllowance),
      ],
      null,
      'The Personal Savings Allowance is the full amount up to the basic rate band of taxable income, half of it above that, and nothing in the additional rate band. Scottish taxpayers use these UK bands for savings.',
    ),
    taxFromLostAllowance > 0 &&
      part(
        'The Personal Allowance the interest takes away',
        [
          info('Income for the Personal Allowance taper', other + savings),
          info('Personal Allowance without the interest', allowanceWithout),
          info('Personal Allowance with the interest', allowance),
          add('Tax on your other income with the interest', otherTaxWith, { unit: 'gbpPence' }),
          subtract('Tax on your other income without it', otherTaxWithout, { unit: 'gbpPence' }),
        ],
        total('Extra tax on your other income', taxFromLostAllowance, { unit: 'gbpPence' }),
        'The allowance goes down by one pound for every two pounds of income over the taper start, and the interest counts towards that income.',
      ),
  ].filter(Boolean)

  return {
    taxYear: year,
    otherIncome: other,
    interest: savings,
    personalAllowance: allowance,
    personalAllowanceWithoutInterest: allowanceWithout,
    coveredByAllowance,
    startingRateBand,
    coveredByStartingRate,
    psaBand,
    personalSavingsAllowance,
    coveredByPsa,
    bands,
    taxOnInterest,
    taxFromLostAllowance,
    otherIncomeRatesYear,
    total: totalTax,
    working,
  }
}

/**
 * How much less tax there would be if `moved` of the interest were earned in
 * an ISA instead, where it is not taxed. The same settings as calculateSavingsTax.
 */
export function taxSavedInIsa({ moved, ...settings }) {
  const interest = atLeastZero(settings.interest)
  const without = calculateSavingsTax({
    ...settings,
    interest: interest - Math.min(atLeastZero(moved), interest),
  })
  return calculateSavingsTax(settings).total - without.total
}
