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

// Scottish income tax for 2026/27, paid by people whose main home is in
// Scotland on earnings, pensions and profits. The Scottish Parliament agreed
// these rates on 19 February 2026. The personal allowance and its taper are
// the same across the UK, and so is National Insurance.
// Sources: https://www.gov.uk/scottish-income-tax
//          https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/2026-to-2027/
export const SCOTTISH_INCOME_TAX = {
  // Each limit is the income up to which that rate applies, for someone with
  // the full personal allowance.
  starterRateLimit: 16537, // 19% above the personal allowance, up to this
  basicRateLimit: 29526, // then 20%
  intermediateRateLimit: 43662, // then 21%. The higher rate starts above this
  higherRateLimit: 75000, // then 42%
  advancedRateLimit: 125140, // then 45%. Above it, 48%
  starterRate: 0.19,
  basicRate: 0.2,
  intermediateRate: 0.21,
  higherRate: 0.42,
  advancedRate: 0.45,
  topRate: 0.48,
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
 * The income tax bands, measured on taxable income (income minus the personal
 * allowance). Each rate applies to the slice of taxable income up to `upTo`.
 *
 * The bands are fixed widths. The basic rate band is £37,700 wide in 2026/27,
 * so when the taper shrinks the allowance, the lost allowance is taxed at the
 * top of the bands, not the bottom. The last limit (£125,140) is not reduced
 * by the allowance, because there is none left by then.
 *
 * reliefAtSource is the gross amount paid into a relief at source pension. It
 * raises the basic and higher rate limits in England, Wales and Northern
 * Ireland. In Scotland it raises every limit except the starter rate one,
 * because income taxed at 19% already gets its relief at 20%. That gives
 * gov.uk's figures for the extra relief: 20% and 25%, or in Scotland 1%, 22%,
 * 25% and 28%. gov.uk publishes the percentages, not this method.
 */
function incomeTaxBands({ scottish, reliefAtSource }) {
  const { personalAllowance } = INCOME_TAX
  if (scottish) {
    const s = SCOTTISH_INCOME_TAX
    return [
      { upTo: s.starterRateLimit - personalAllowance, rate: s.starterRate },
      { upTo: s.basicRateLimit - personalAllowance + reliefAtSource, rate: s.basicRate },
      {
        upTo: s.intermediateRateLimit - personalAllowance + reliefAtSource,
        rate: s.intermediateRate,
      },
      { upTo: s.higherRateLimit - personalAllowance + reliefAtSource, rate: s.higherRate },
      { upTo: s.advancedRateLimit + reliefAtSource, rate: s.advancedRate },
      { upTo: Infinity, rate: s.topRate },
    ]
  }
  const { basicRateLimit, higherRateLimit, basicRate, higherRate, additionalRate } = INCOME_TAX
  return [
    { upTo: basicRateLimit - personalAllowance + reliefAtSource, rate: basicRate },
    { upTo: higherRateLimit + reliefAtSource, rate: higherRate },
    { upTo: Infinity, rate: additionalRate },
  ]
}

/**
 * Income tax for the year. By default this uses the rates for England, Wales
 * and Northern Ireland (20%, 40% and 45%). With scottish, it uses the six
 * Scottish rates in SCOTTISH_INCOME_TAX. The personal allowance and its taper
 * are the same for both.
 *
 * reliefAtSourceGross is the gross amount paid into a relief at source
 * pension (what was paid plus the 20% relief the provider claimed). It raises
 * the band limits by that amount, and comes off the income used for the
 * allowance taper. That gives the tax someone owes once they have claimed
 * their extra relief.
 *
 * topRate is the rate on the last pound, or 0 if no tax is due.
 */
export function calculateIncomeTax(
  grossAnnual,
  { reliefAtSourceGross = 0, scottish = false } = {},
) {
  const gross = atLeastZero(grossAnnual)
  const reliefAtSource = atLeastZero(reliefAtSourceGross)
  const pa = taperedPersonalAllowance(gross - reliefAtSource)
  const taxable = Math.max(0, gross - pa)

  let tax = 0
  let topRate = 0
  let from = 0
  for (const band of incomeTaxBands({ scottish, reliefAtSource })) {
    const inBand = Math.max(0, Math.min(taxable, band.upTo) - from)
    if (inBand > 0) topRate = band.rate
    tax += inBand * band.rate
    from = band.upTo
  }
  return { tax, personalAllowanceUsed: pa, topRate }
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
 * Full take-home pay breakdown. scottish switches income tax to the Scottish
 * rates. National Insurance is the same either way.
 */
export function calculateTakeHome(grossAnnual, { scottish = false } = {}) {
  const gross = atLeastZero(grossAnnual)
  const { tax, personalAllowanceUsed } = calculateIncomeTax(gross, { scottish })
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
  lisaTerminalIllnessMonths: 12, // no charge if terminally ill with less than this to live
  // Announced change: regulations laid before Parliament on 14 September 2026.
  cashLimitChangeDate: '6 April 2027',
  cashLimitUnder65AfterChange: 12000,
  cashLimitFullAllowanceAge: 65,
  // From the same date, the flat-rate charge on interest paid on cash held in a
  // stocks and shares or innovative finance ISA. The ISA manager pays it.
  // Source: HMRC's tax information and impact note of 17 September 2026,
  // https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit
  cashInterestChargeRateAfterChange: 0.22,
}

// The planned First Time Buyer ISA, which will be offered in place of the
// Lifetime ISA once it is available. Only what gov.uk confirms. Re-check when
// the government announces the new account's limits, bonus and price cap.
// Sources: https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation
//          https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html
export const LIFETIME_ISA_REFORM = {
  checkedOn: '20 October 2026',
  consultationOpened: '22 June 2026',
  consultationClosed: '18 August 2026',
  lisaLimitFixedUntil: '5 April 2031', // the £4,000 limit stays the same until then
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

// Used in the guides only. No calculator depends on these.
// Sources: https://www.gov.uk/tax-free-childcare
//          https://www.gov.uk/free-childcare-if-working/check-youre-eligible
//          https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay
export const CHILDCARE = {
  // Tax-Free Childcare and free childcare for working parents both stop if
  // either parent expects an adjusted net income over this in the tax year.
  adjustedNetIncomeLimit: 100000,
  taxFreeChildcareMaxPerChild: 2000, // the most the government adds in a year
}

// Source: https://www.gov.uk/tax-codes/how-to-update-your-tax-code and
//         https://www.gov.uk/tax-codes/emergency-tax-codes
export const TAX_CODE_TIMES = {
  newCodeWorkingDays: 15, // HMRC tells you and your employer a new code within this
  newJobDays: 35, // how long HMRC can take to update a code after you start a job
}

export const AUTO_ENROLMENT = {
  totalMinimum: 0.08, // of a band of earnings, from employer and employee together
  employerMinimum: 0.03,
  employeeMinimum: 0.05,
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

// The mortgage overpayment calculator is in mortgage.js.
export const MORTGAGE = {
  // Many lenders allow this much to be overpaid each year without a charge,
  // usually during a fixed or discounted deal (source: MoneyHelper). It is
  // typical, not a rule.
  typicalOverpaymentLimit: 0.1,
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

// Stamp Duty Land Tax on residential property in England and Northern Ireland.
// These rates are not tied to the tax year. They have applied since 1 April 2025.
// Source: https://www.gov.uk/stamp-duty-land-tax/residential-property-rates
export const STAMP_DUTY = {
  ratesFrom: '1 April 2025',
  // Each rate applies to the slice of the price up to that amount.
  bands: [
    { upTo: 125000, rate: 0 },
    { upTo: 250000, rate: 0.02 },
    { upTo: 925000, rate: 0.05 },
    { upTo: 1500000, rate: 0.1 },
    { upTo: Infinity, rate: 0.12 },
  ],
  // First-time buyer relief. Over maxPrice there is no relief at all.
  firstTimeBuyer: {
    maxPrice: 500000,
    bands: [
      { upTo: 300000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
    ],
  },
  additionalPropertySurcharge: 0.05, // added to every band
  nonResidentSurcharge: 0.02, // added to every band
  surchargeMinimumPrice: 40000, // the surcharges apply to purchases of this much or more
  returnDeadlineDays: 14, // to send a return and pay, counted from completion
  replaceMainHomeMonths: 36, // time to sell a previous main home and avoid or reclaim the surcharge
  refundClaimMonths: 12, // time to claim that refund
  nonResidentDays: 183, // days in the UK in the 12 months before buying to count as resident
}

/**
 * Stamp duty for one residential purchase by an individual.
 * buyerType is 'homeMover', 'firstTimeBuyer' or 'additional'.
 *
 * The tax is charged in slices, like income tax. Surcharges are added to the
 * rate of every slice, including the first one. The total is rounded down to
 * the whole pound.
 */
export function calculateStampDuty({ price, buyerType = 'homeMover', nonResident = false }) {
  const { firstTimeBuyer, additionalPropertySurcharge, nonResidentSurcharge } = STAMP_DUTY
  const amount = atLeastZero(price)

  const isFirstTimeBuyer = buyerType === 'firstTimeBuyer'
  const firstTimeBuyerOverLimit = isFirstTimeBuyer && amount > firstTimeBuyer.maxPrice
  const reliefApplies = isFirstTimeBuyer && !firstTimeBuyerOverLimit
  const bands = reliefApplies ? firstTimeBuyer.bands : STAMP_DUTY.bands

  const surchargesApply = amount >= STAMP_DUTY.surchargeMinimumPrice
  const additionalApplies = buyerType === 'additional' && surchargesApply
  const nonResidentApplies = Boolean(nonResident) && surchargesApply
  const surcharge =
    (additionalApplies ? additionalPropertySurcharge : 0) +
    (nonResidentApplies ? nonResidentSurcharge : 0)

  const breakdown = []
  let from = 0
  for (const band of bands) {
    if (amount <= from) break
    const to = Math.min(amount, band.upTo)
    // Whole-number percentages keep the sums exact.
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

  const tax = Math.floor(breakdown.reduce((total, band) => total + band.tax, 0))

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
  }
}

// Self-employment figures for 2026/27.
// Sources: https://www.gov.uk/self-employed-national-insurance-rates
//          https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income
//          https://www.gov.uk/understand-self-assessment-bill/payments-on-account
export const SELF_EMPLOYED = {
  class4: {
    lowerProfitsLimit: 12570, // Class 4 NI starts on profits above this
    upperProfitsLimit: 50270, // the rate drops from 6% to 2% above this
    mainRate: 0.06,
    upperRate: 0.02,
  },
  // Class 2 no longer has to be paid. It is treated as paid on profits of
  // smallProfitsThreshold or more, and can be paid voluntarily below that.
  class2: {
    smallProfitsThreshold: 7105,
    voluntaryWeeklyRate: 3.65,
  },
  tradingAllowance: 1000, // can be claimed instead of actual expenses
  paymentsOnAccount: {
    minimumBill: 1000, // no payments on account if the Self Assessment bill is under this
    deductedAtSourceShare: 0.8, // or if more than this share of all tax was deducted at source
  },
  // Self Assessment dates for the 2026/27 tax year.
  registerBy: '5 October 2027',
  paperReturnBy: '31 October 2027',
  payBy: '31 January 2028',
  secondPaymentOnAccountBy: '31 July 2028',
  nextTaxYear: '2027/28',
  // Making Tax Digital for Income Tax: who has to use it, and from when.
  makingTaxDigital: [
    { incomeOver: 50000, inTaxYear: '2024/25', from: '6 April 2026' },
    { incomeOver: 30000, inTaxYear: '2025/26', from: '6 April 2027' },
    { incomeOver: 20000, inTaxYear: '2026/27', from: '6 April 2028' },
  ],
}

/**
 * Student loan repayments worked out the Self Assessment way: on income for
 * the whole year against the yearly threshold, not month by month. gov.uk
 * example: Plan 1 on £42,000 is 9% of (£42,000 - £26,900) = £1,359.
 */
export function calculateStudentLoanForYear({ income, plan, hasPostgraduateLoan }) {
  const total = atLeastZero(income)
  const forPlan = (loan) =>
    Math.floor((Math.max(0, total - loan.threshold) * Math.round(loan.rate * 100)) / 100)
  const undergradPlan = plan && plan !== 'none' ? STUDENT_LOAN[plan] : null
  const undergrad = undergradPlan ? forPlan(undergradPlan) : 0
  const postgrad = hasPostgraduateLoan ? forPlan(STUDENT_LOAN.postgraduate) : 0
  return { undergrad, postgrad, total: undergrad + postgrad }
}

/** Class 4 National Insurance on self-employed profit: 6% then 2%. */
export function calculateClass4NationalInsurance(profit) {
  const { lowerProfitsLimit, upperProfitsLimit, mainRate, upperRate } = SELF_EMPLOYED.class4
  const amount = atLeastZero(profit)
  const inMainBand = Math.max(0, Math.min(amount, upperProfitsLimit) - lowerProfitsLimit)
  const aboveUpperLimit = Math.max(0, amount - upperProfitsLimit)
  return inMainBand * mainRate + aboveUpperLimit * upperRate
}

// Statutory Maternity Pay, Statutory Paternity Pay and Maternity Allowance.
// These rates apply from April 2026 and change each April.
// Sources: https://www.gov.uk/maternity-pay-leave/pay
//          https://www.gov.uk/paternity-pay-leave/pay
//          https://www.gov.uk/maternity-allowance/what-youll-get
export const PARENTAL_PAY = {
  ratesFrom: 'April 2026',
  weeklyRate: 194.32, // the flat rate for SMP, SPP and Maternity Allowance
  earningsShare: 0.9, // or 90% of average weekly earnings, if that is lower
  // To qualify, average weekly earnings must be at least this. It is the limit
  // for qualifying weeks that end between these two dates (the 2026/27 tax year).
  lowerEarningsLimit: 129,
  lowerEarningsLimitFrom: '2026-04-06',
  lowerEarningsLimitTo: '2027-04-05',
  continuousWeeks: 26, // weeks with the employer by the qualifying week
  qualifyingWeekBeforeDue: 15, // the qualifying week is this many weeks before the week the baby is due
  earliestLeaveWeeksBeforeDue: 11,
  noticeDays: 28, // notice to give an employer before pay starts
  maternity: {
    payWeeks: 39,
    higherRateWeeks: 6, // the first weeks, paid at 90% of earnings with no cap
    leaveWeeks: 52,
  },
  paternity: {
    payWeeks: 2,
    leaveMustEndWithinWeeks: 52, // of the birth
  },
  sharedParental: {
    leaveWeeks: 50,
    payWeeks: 37,
  },
  maternityAllowance: {
    payWeeks: 39,
    testPeriodWeeks: 66, // the weeks before the baby is due that are looked at
    weeksWorked: 26, // employed or self-employed for this many of them
    weeklyEarnings: 30, // earning at least this much a week
    weeksEarning: 13, // in at least this many weeks
    selfEmployedMinimum: 27, // lowest weekly rate for the self-employed
  },
}
