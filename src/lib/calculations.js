// All figures below are for the 2026/27 UK tax year (6 April 2026 – 5 April 2027).
// Sources: gov.uk / HMRC published rates. Re-check every April when the new tax
// year's figures are confirmed, and update the THRESHOLDS objects below.

export const TAX_YEAR = '2026/27'

export const INCOME_TAX = {
  personalAllowance: 12570,
  basicRateLimit: 50270, // income up to this is taxed at 20% (above the personal allowance)
  higherRateLimit: 125140, // income up to this is taxed at 40%; above it, 45%
  taperStart: 100000, // personal allowance starts reducing above this income
  taperFullyGoneAt: 125140,
}

export const NATIONAL_INSURANCE = {
  primaryThreshold: 12570, // NI starts here
  upperEarningsLimit: 50270, // NI rate drops from 8% to 2% above here
  mainRate: 0.08,
  upperRate: 0.02,
}

export const REDUNDANCY = {
  weeklyPayCapGB: 751, // England, Scotland, Wales
  weeklyPayCapNI: 783, // Northern Ireland
  maxYearsCounted: 20,
  minYearsToQualify: 2,
  taxFreeThreshold: 30000,
}

/**
 * Reduces the £12,570 personal allowance by £1 for every £2 of income
 * above £100,000, until it reaches £0 at £125,140.
 */
export function taperedPersonalAllowance(grossAnnual) {
  const { personalAllowance, taperStart } = INCOME_TAX
  if (grossAnnual <= taperStart) return personalAllowance
  const reduction = Math.floor((grossAnnual - taperStart) / 2)
  return Math.max(0, personalAllowance - reduction)
}

/**
 * Income tax on UK (non-Scottish) rates: 20% / 40% / 45% bands.
 * The £50,270 and £125,140 thresholds are fixed income points —
 * the personal-allowance taper just shrinks the 0% band inside them.
 */
export function calculateIncomeTax(grossAnnual) {
  const pa = taperedPersonalAllowance(grossAnnual)
  const { basicRateLimit, higherRateLimit } = INCOME_TAX
  let tax = 0

  if (grossAnnual > pa) {
    const basicBandTop = Math.min(grossAnnual, basicRateLimit)
    tax += (basicBandTop - pa) * 0.2
  }
  if (grossAnnual > basicRateLimit) {
    const higherBandTop = Math.min(grossAnnual, higherRateLimit)
    tax += (higherBandTop - basicRateLimit) * 0.4
  }
  if (grossAnnual > higherRateLimit) {
    tax += (grossAnnual - higherRateLimit) * 0.45
  }
  return { tax, personalAllowanceUsed: pa }
}

/** Employee Class 1 National Insurance: 8% then 2%. */
export function calculateNationalInsurance(grossAnnual) {
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = NATIONAL_INSURANCE
  let ni = 0
  if (grossAnnual > primaryThreshold) {
    const mainBandTop = Math.min(grossAnnual, upperEarningsLimit)
    ni += (mainBandTop - primaryThreshold) * mainRate
  }
  if (grossAnnual > upperEarningsLimit) {
    ni += (grossAnnual - upperEarningsLimit) * upperRate
  }
  return ni
}

/**
 * Full take-home pay breakdown for England, Wales and Northern Ireland rates.
 * NOTE: Scotland has its own 6-band system (19/20/21/42/45/48%) with different
 * thresholds — deliberately not implemented here. Verify the exact 2026/27
 * Scottish band cut-offs against Revenue Scotland before adding a Scottish mode.
 */
export function calculateTakeHome(grossAnnual) {
  const { tax, personalAllowanceUsed } = calculateIncomeTax(grossAnnual)
  const ni = calculateNationalInsurance(grossAnnual)
  const takeHome = grossAnnual - tax - ni
  return {
    grossAnnual,
    personalAllowanceUsed,
    incomeTax: tax,
    nationalInsurance: ni,
    takeHomeAnnual: takeHome,
    takeHomeMonthly: takeHome / 12,
    takeHomeWeekly: takeHome / 52,
    effectiveRate: grossAnnual > 0 ? (tax + ni) / grossAnnual : 0,
  }
}

/**
 * Statutory redundancy pay. This is the standard age-banded method:
 * counts backward from the current age for each year of service, so a
 * long-serving employee gets 0.5/1/1.5 weeks per year depending on how
 * old they were during *that* year, not just their age today.
 *
 * This is an approximation matching the widely-used simplified method.
 * For a real, live dismissal — especially right on an age-band boundary —
 * verify against the official gov.uk redundancy calculator, since exact
 * employment dates can shift the result by a few days' worth of age.
 */
export function calculateRedundancyPay({ age, yearsOfService, weeklyPay, region = 'GB' }) {
  const { weeklyPayCapGB, weeklyPayCapNI, maxYearsCounted, minYearsToQualify, taxFreeThreshold } =
    REDUNDANCY

  if (yearsOfService < minYearsToQualify) {
    return { qualifies: false, minYearsToQualify }
  }

  const cap = region === 'NI' ? weeklyPayCapNI : weeklyPayCapGB
  const cappedWeeklyPay = Math.min(weeklyPay, cap)
  const cappedYears = Math.min(Math.floor(yearsOfService), maxYearsCounted)

  let totalWeeks = 0
  for (let i = 0; i < cappedYears; i++) {
    const ageDuringYear = age - i
    if (ageDuringYear >= 41) totalWeeks += 1.5
    else if (ageDuringYear >= 22) totalWeeks += 1
    else totalWeeks += 0.5
  }

  const pay = totalWeeks * cappedWeeklyPay
  const maxPossible = cap * 1.5 * maxYearsCounted

  return {
    qualifies: true,
    totalWeeks,
    weeklyPayUsed: cappedWeeklyPay,
    weeklyPayWasCapped: weeklyPay > cap,
    pay: Math.min(pay, maxPossible),
    taxFreeThreshold,
    cap,
  }
}