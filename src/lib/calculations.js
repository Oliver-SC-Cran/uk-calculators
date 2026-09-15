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

export const ISA = {
  overallAllowance: 20000, // combined limit across Cash, Stocks & Shares and LISA
  lisaLimit: 4000, // counts within the overall allowance, not on top of it
  lisaBonusRate: 0.25,
  lisaMinOpenAge: 18,
  lisaMaxOpenAge: 40, // must open a LISA before your 40th birthday
  lisaMaxContributionAge: 50, // existing LISA holders can keep contributing until 50
}

/**
 * ISA & LISA allowance check for the current tax year.
 * NOTE: from April 2027, the Cash ISA allowance is due to reduce to £12,000 for
 * under-65s (Stocks & Shares stays at £20,000) — this calculator covers the
 * current, unchanged 2026/27 rules. Revisit before April 2027.
 */
export function calculateISAAllowance({ cashISA, stocksISA, lisa, age }) {
  const { overallAllowance, lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA

  const lisaCapped = Math.min(lisa, lisaLimit)
  const lisaOverLimit = lisa > lisaLimit
  const totalContributions = cashISA + stocksISA + lisaCapped
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
  }
}

export const MINIMUM_WAGE = {
  // Rates from 1 April 2026 (£/hour)
  nationalLivingWage: 12.71, // age 21+
  age18to20: 10.85,
  under18: 8.0,
  apprentice: 8.0,
}

/**
 * Works out which statutory minimum wage band applies and whether the
 * hourly rate entered meets it.
 */
export function checkMinimumWage({ age, hourlyRate, isApprentice }) {
  const { nationalLivingWage, age18to20, under18, apprentice } = MINIMUM_WAGE

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

  const shortfall = Math.max(0, applicableRate - hourlyRate)
  const isUnderpaid = shortfall > 0

  return {
    applicableRate,
    bandLabel,
    shortfall,
    isUnderpaid,
    weeklyAtMinimum: applicableRate * 37.5,
    annualAtMinimum: applicableRate * 37.5 * 52,
  }
}

export const STUDENT_LOAN = {
  // Annual thresholds for 2026/27
  plan1: { threshold: 26900, rate: 0.09, label: 'Plan 1' },
  plan2: { threshold: 29385, rate: 0.09, label: 'Plan 2' },
  plan4: { threshold: 33795, rate: 0.09, label: 'Plan 4 (Scotland)' },
  plan5: { threshold: 25000, rate: 0.09, label: 'Plan 5' },
  postgraduate: { threshold: 21000, rate: 0.06, label: 'Postgraduate Loan' },
}

/**
 * Student loan repayments for the 2026/27 tax year. A person can have an
 * undergraduate plan (1, 2, 4 or 5) and a Postgraduate Loan at the same
 * time, and both are repaid together, so this returns each separately
 * plus the combined total.
 */
export function calculateStudentLoanRepayment({ grossAnnual, plan, hasPostgraduateLoan }) {
  const undergradPlan = plan && plan !== 'none' ? STUDENT_LOAN[plan] : null

  const undergradRepayment = undergradPlan
    ? Math.max(0, grossAnnual - undergradPlan.threshold) * undergradPlan.rate
    : 0

  const postgradRepayment = hasPostgraduateLoan
    ? Math.max(0, grossAnnual - STUDENT_LOAN.postgraduate.threshold) * STUDENT_LOAN.postgraduate.rate
    : 0

  const totalAnnual = undergradRepayment + postgradRepayment

  return {
    undergradRepayment,
    postgradRepayment,
    totalAnnual,
    totalMonthly: totalAnnual / 12,
  }
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
  const monthlyRate = annualRatePercent / 100 / 12
  const totalMonths = Math.round(remainingYears * 12)

  if (balance <= 0 || totalMonths <= 0) {
    return null
  }

  const standardPayment =
    monthlyRate === 0
      ? balance / totalMonths
      : (balance * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)

  const standardTotalInterest = standardPayment * totalMonths - balance

  // Simulate with the overpayment added on top of the standard payment.
  let remaining = balance
  let month = 0
  let interestPaid = 0
  const payment = standardPayment + monthlyOverpayment
  const safetyCapMonths = totalMonths * 2 + 24

  while (remaining > 0.01 && month < safetyCapMonths) {
    const interest = remaining * monthlyRate
    let principal = payment - interest
    if (principal <= 0) {
      break
    }
    if (principal > remaining) principal = remaining
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