// All figures below are for the 2026/27 UK tax year (6 April 2026 to 5 April 2027).
// Sources: gov.uk / HMRC published rates. Re-check every April when the new tax
// year's figures are confirmed, and update the constants below.

export const TAX_YEAR = '2026/27'
export const TAX_YEAR_START = '6 April 2026'
export const TAX_YEAR_END = '5 April 2027'

export const INCOME_TAX = {
  personalAllowance: 12570,
  basicRateLimit: 50270, // income up to this is taxed at 20% (above the personal allowance)
  higherRateLimit: 125140, // income up to this is taxed at 40%; above it, 45%
  taperStart: 100000, // personal allowance starts reducing above this income
  taperFullyGoneAt: 125140,
  basicRate: 0.2,
  higherRate: 0.4,
  additionalRate: 0.45,
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
  earliestServiceAge: 15, // the gov.uk calculator rejects service that started before this age
  taxFreeThreshold: 30000,
  claimWithinMonths: 6, // time limit to apply, from the date the job ends
}

// Inputs come straight from form fields, so treat anything that is not a
// positive number (blank, negative, not a number) as zero.
const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

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
 * The bands are measured on taxable income (income minus the personal
 * allowance). The basic rate band is a fixed width, £37,700 in 2026/27, so
 * when the taper shrinks the allowance, the lost allowance is taxed at the
 * higher rate, not the basic rate.
 *
 * reliefAtSourceGross is the gross amount paid into a relief at source
 * pension (what was paid plus the basic rate relief the provider claimed).
 * It widens the basic rate band and raises the higher rate limit by that
 * amount, and comes off the income used for the allowance taper. That gives
 * the tax someone owes once they have claimed their extra relief.
 */
export function calculateIncomeTax(grossAnnual, { reliefAtSourceGross = 0 } = {}) {
  const gross = atLeastZero(grossAnnual)
  const reliefAtSource = atLeastZero(reliefAtSourceGross)
  const pa = taperedPersonalAllowance(gross - reliefAtSource)
  const { personalAllowance, basicRateLimit, higherRateLimit } = INCOME_TAX
  const { basicRate, higherRate, additionalRate } = INCOME_TAX

  const taxable = Math.max(0, gross - pa)
  const basicBand = basicRateLimit - personalAllowance + reliefAtSource
  const higherLimit = higherRateLimit + reliefAtSource
  const inBasicBand = Math.min(taxable, basicBand)
  const inHigherBand = Math.max(0, Math.min(taxable, higherLimit) - basicBand)
  const inAdditionalBand = Math.max(0, taxable - higherLimit)

  const tax =
    inBasicBand * basicRate + inHigherBand * higherRate + inAdditionalBand * additionalRate
  return { tax, personalAllowanceUsed: pa }
}

/** Employee Class 1 National Insurance: 8% then 2%. */
export function calculateNationalInsurance(grossAnnual) {
  const gross = atLeastZero(grossAnnual)
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = NATIONAL_INSURANCE
  let ni = 0
  if (gross > primaryThreshold) {
    const mainBandTop = Math.min(gross, upperEarningsLimit)
    ni += (mainBandTop - primaryThreshold) * mainRate
  }
  if (gross > upperEarningsLimit) {
    ni += (gross - upperEarningsLimit) * upperRate
  }
  return ni
}

/**
 * Full take-home pay breakdown for England, Wales and Northern Ireland rates.
 * NOTE: Scotland has its own 6-band system with different thresholds, which
 * is deliberately not implemented here. Verify the exact 2026/27 Scottish
 * band cut-offs against gov.scot before adding a Scottish mode.
 */
export function calculateTakeHome(grossAnnual) {
  const gross = atLeastZero(grossAnnual)
  const { tax, personalAllowanceUsed } = calculateIncomeTax(gross)
  const ni = calculateNationalInsurance(gross)
  const takeHome = gross - tax - ni
  return {
    grossAnnual: gross,
    personalAllowanceUsed,
    incomeTax: tax,
    nationalInsurance: ni,
    takeHomeAnnual: takeHome,
    takeHomeMonthly: takeHome / 12,
    takeHomeWeekly: takeHome / 52,
    effectiveRate: gross > 0 ? (tax + ni) / gross : 0,
  }
}

export const ISA = {
  overallAllowance: 20000, // combined limit across Cash, Stocks & Shares and LISA
  minAge: 18, // you must be 18 or over to open an ISA
  lisaLimit: 4000, // counts within the overall allowance, not on top of it
  lisaBonusRate: 0.25,
  lisaMinOpenAge: 18,
  lisaMaxOpenAge: 40, // must open a LISA before your 40th birthday
  lisaMaxContributionAge: 50, // existing LISA holders can keep contributing until 50
  lisaAccessAge: 60, // withdrawals are free of the charge from this age
  lisaWithdrawalChargeRate: 0.25, // on withdrawals that are not for a first home or after 60
  lisaPropertyCap: 450000, // most a first home can cost
  lisaMonthsBeforePurchase: 12, // months between first payment in and buying
  // Announced change: regulations laid before Parliament on 14 September 2026.
  cashLimitChangeDate: '6 April 2027',
  cashLimitUnder65AfterChange: 12000,
  cashLimitFullAllowanceAge: 65,
}

/**
 * ISA & LISA allowance check for the current tax year.
 * NOTE: from April 2027, the Cash ISA allowance is due to reduce to £12,000 for
 * under-65s (Stocks & Shares stays at £20,000). This calculator covers the
 * current, unchanged 2026/27 rules. Revisit before April 2027.
 */
export function calculateISAAllowance({ cashISA, stocksISA, lisa, age }) {
  const { overallAllowance, minAge, lisaLimit, lisaBonusRate } = ISA
  const { lisaMinOpenAge, lisaMaxOpenAge, lisaMaxContributionAge } = ISA

  const cash = atLeastZero(cashISA)
  const stocks = atLeastZero(stocksISA)
  const lisaEntered = atLeastZero(lisa)

  // Nobody under 18 or aged 50 or over can pay into a Lifetime ISA, so a LISA
  // amount entered at those ages earns no bonus and uses no allowance.
  const lisaAllowedAtAge = age >= lisaMinOpenAge && age < lisaMaxContributionAge
  const lisaCapped = lisaAllowedAtAge ? Math.min(lisaEntered, lisaLimit) : 0
  const lisaOverLimit = lisaAllowedAtAge && lisaEntered > lisaLimit
  const totalContributions = cash + stocks + lisaCapped
  const overallOverLimit = totalContributions > overallAllowance
  const remainingAllowance = Math.max(0, overallAllowance - totalContributions)
  const lisaBonus = lisaCapped * lisaBonusRate
  const lisaEligibleToOpen = age >= lisaMinOpenAge && age < lisaMaxOpenAge

  return {
    totalContributions,
    remainingAllowance,
    overallOverLimit,
    lisaCapped,
    lisaOverLimit,
    lisaBonus,
    lisaEligibleToOpen,
    lisaAllowedAtAge,
    tooYoungForISA: age < minAge,
  }
}

export const MINIMUM_WAGE = {
  // Rates from 1 April 2026 (£/hour)
  effectiveFrom: '1 April 2026',
  nationalLivingWage: 12.71, // age 21+
  age18to20: 10.85,
  under18: 8.0,
  apprentice: 8.0,
  minAge: 16, // workers must be at least school leaving age, which is usually 16
}

/**
 * Works out which statutory minimum wage band applies and whether the
 * hourly rate entered meets it. Anyone under school leaving age is not
 * entitled to the minimum wage at all.
 */
export function checkMinimumWage({ age, hourlyRate, isApprentice }) {
  const { nationalLivingWage, age18to20, under18, apprentice, minAge } = MINIMUM_WAGE

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
    weeklyAtMinimum: applicableRate * 37.5,
    annualAtMinimum: applicableRate * 37.5 * 52,
  }
}

export const STUDENT_LOAN = {
  // Annual thresholds for 2026/27
  plan1: { threshold: 26900, rate: 0.09, label: 'Plan 1', writeOffYears: 25 },
  plan2: { threshold: 29385, rate: 0.09, label: 'Plan 2', writeOffYears: 30 },
  plan4: { threshold: 33795, rate: 0.09, label: 'Plan 4 (Scotland)', writeOffYears: 30 },
  plan5: { threshold: 25000, rate: 0.09, label: 'Plan 5', writeOffYears: 40 },
  postgraduate: { threshold: 21000, rate: 0.06, label: 'Postgraduate Loan', writeOffYears: 30 },
}

/**
 * One month's repayment on one loan, the way gov.uk works it out for someone
 * paid monthly: the monthly threshold is the annual one divided by 12 and
 * rounded down to the pound (£26,900 becomes £2,241), and the repayment is
 * rounded down to the pound too.
 */
export const monthlyLoanThreshold = ({ threshold }) => Math.floor(threshold / 12)

/**
 * Every step of one month's repayment on one loan, so the guide can show
 * exactly the figures the final answer was worked out from.
 */
export function studentLoanWorking(grossAnnual, plan) {
  const monthlyThreshold = monthlyLoanThreshold(plan)
  // Whole pence and a whole-number percentage keep the rounding exact.
  const payPence = Math.round((atLeastZero(grossAnnual) / 12) * 100)
  const overPence = Math.max(0, payPence - monthlyThreshold * 100)
  const beforeRoundingPence = (overPence * Math.round(plan.rate * 100)) / 100
  return {
    monthlyPay: payPence / 100,
    monthlyThreshold,
    over: overPence / 100,
    beforeRounding: Math.round(beforeRoundingPence) / 100,
    repayment: Math.floor(beforeRoundingPence / 100),
  }
}

const monthlyLoanRepayment = (grossAnnual, plan) => studentLoanWorking(grossAnnual, plan).repayment

/**
 * Student loan repayments for the 2026/27 tax year, for an employee paid the
 * same amount every month. A person can have an undergraduate plan (1, 2, 4
 * or 5) and a Postgraduate Loan at the same time, and both are repaid
 * together, so this returns each separately plus the combined total.
 */
export function calculateStudentLoanRepayment({ grossAnnual, plan, hasPostgraduateLoan }) {
  const gross = atLeastZero(grossAnnual)
  const undergradPlan = plan && plan !== 'none' ? STUDENT_LOAN[plan] : null

  const undergradMonthly = undergradPlan ? monthlyLoanRepayment(gross, undergradPlan) : 0
  const postgradMonthly = hasPostgraduateLoan
    ? monthlyLoanRepayment(gross, STUDENT_LOAN.postgraduate)
    : 0
  const totalMonthly = undergradMonthly + postgradMonthly

  return {
    undergradMonthly,
    postgradMonthly,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
  }
}

export const MORTGAGE = {
  // Many lenders allow this much of the balance to be overpaid each year
  // without a charge (source: MoneyHelper). It is typical, not a rule.
  typicalOverpaymentLimit: 0.1,
}

/**
 * Mortgage overpayment comparison. Uses the standard amortising-loan
 * formula for the normal monthly payment, then simulates month by month
 * with the extra overpayment added to see how much sooner it's paid off
 * and how much interest that saves.
 */
export function calculateMortgageOverpayment({
  balance,
  annualRatePercent,
  remainingYears,
  monthlyOverpayment,
}) {
  const monthlyRate = atLeastZero(annualRatePercent) / 100 / 12
  const totalMonths = Math.round(atLeastZero(remainingYears) * 12)
  const overpayment = atLeastZero(monthlyOverpayment)

  if (!(balance > 0) || totalMonths <= 0) {
    return null
  }

  const standardPayment =
    monthlyRate === 0
      ? balance / totalMonths
      : (balance * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)

  // Absurd inputs (a rate in the millions of percent) overflow the formula.
  if (!Number.isFinite(standardPayment)) {
    return null
  }

  const standardTotalInterest = standardPayment * totalMonths - balance

  // Simulate with the overpayment added on top of the standard payment. It can
  // never take longer than the original term, so stop there at the latest.
  let remaining = balance
  let month = 0
  let interestPaid = 0
  const payment = standardPayment + overpayment

  while (remaining > 0.005 && month < totalMonths) {
    const interest = remaining * monthlyRate
    const principal = Math.min(payment - interest, remaining)
    remaining -= principal
    interestPaid += interest
    month += 1
  }

  const monthsSaved = Math.max(0, totalMonths - month)
  const interestSaved = Math.max(0, standardTotalInterest - interestPaid)

  return {
    standardPayment,
    standardTotalInterest,
    newPayment: payment,
    newTotalInterest: interestPaid,
    newTermMonths: month,
    originalTermMonths: totalMonths,
    monthsSaved,
    interestSaved,
  }
}

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
export function calculateRedundancyPay({ age, yearsOfService, weeklyPay, region = 'GB' }) {
  const { weeklyPayCapGB, weeklyPayCapNI, maxYearsCounted, minYearsToQualify } = REDUNDANCY
  const { earliestServiceAge, taxFreeThreshold } = REDUNDANCY

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
