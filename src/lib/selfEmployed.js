// The self-employed tax calculator. It puts together the income tax and
// student loan functions with Class 4 National Insurance. Its rates and
// Self Assessment dates are in rates/selfEmployed.js, by tax year.

import { calculateIncomeTax } from './incomeTax.js'
import { atLeastZero } from './numbers.js'
import { INCOME_TAX_RATES } from './rates/incomeTax.js'
import { SELF_EMPLOYED_RATES } from './rates/selfEmployed.js'
import { forTaxYear } from './rates/taxYear.js'
import { calculateStudentLoanForYear, calculateStudentLoanRepayment } from './studentLoans.js'

/** Class 4 National Insurance on self-employed profit: 6% then 2%. */
export function calculateClass4NationalInsurance(profit, { taxYear } = {}) {
  const { lowerProfitsLimit, upperProfitsLimit, mainRate, upperRate } = forTaxYear(
    SELF_EMPLOYED_RATES,
    taxYear,
  ).class4
  const amount = atLeastZero(profit)
  const inMainBand = Math.max(0, Math.min(amount, upperProfitsLimit) - lowerProfitsLimit)
  const aboveUpperLimit = Math.max(0, amount - upperProfitsLimit)
  return inMainBand * mainRate + aboveUpperLimit * upperRate
}

/**
 * Tax on self-employed profit for one tax year, for a sole trader who may
 * also have a job.
 *
 * A job is taxed first, through PAYE. It uses up the personal allowance and
 * the lower tax bands, so the tax on the profit is the tax on everything
 * together minus the tax on the job alone. Student loan works the same way:
 * the repayment on total income for the year, minus what the employer took.
 *
 * scottish uses the Scottish income tax rates, for the job and the profit.
 * Class 4 National Insurance and student loans are the same across the UK.
 */
export function calculateSelfEmployedTax({
  income,
  expenses = 0,
  useTradingAllowance = false,
  employmentIncome = 0,
  plan = 'none',
  hasPostgraduateLoan = false,
  scottish = false,
  taxYear,
}) {
  const { tradingAllowance, paymentsOnAccount, class2 } = forTaxYear(SELF_EMPLOYED_RATES, taxYear)
  const { incomeTax: incomeTaxRates, scottishIncomeTax: scottishRates } = forTaxYear(
    INCOME_TAX_RATES,
    taxYear,
  )
  const turnover = atLeastZero(income)
  const job = atLeastZero(employmentIncome)

  // Costs cannot be more than income here: losses are not covered.
  const costs = useTradingAllowance ? tradingAllowance : atLeastZero(expenses)
  const deducted = Math.min(turnover, costs)
  const profit = turnover - deducted

  const taxOnJob = calculateIncomeTax(job, { scottish, taxYear })
  const taxOnEverything = calculateIncomeTax(job + profit, { scottish, taxYear })
  const incomeTax = taxOnEverything.tax - taxOnJob.tax
  const class4 = calculateClass4NationalInsurance(profit, { taxYear })

  const loanForYear = calculateStudentLoanForYear({
    income: job + profit,
    plan,
    hasPostgraduateLoan,
    taxYear,
  }).total
  const loanThroughJob = calculateStudentLoanRepayment({
    grossAnnual: job,
    plan,
    hasPostgraduateLoan,
    taxYear,
  }).totalAnnual
  const studentLoan = Math.max(0, loanForYear - loanThroughJob)

  const totalBill = incomeTax + class4 + studentLoan
  // The trading allowance is not money spent, so with it take-home is income
  // less tax. With real expenses it is profit less tax.
  const takeHomeAnnual = (useTradingAllowance ? turnover : profit) - totalBill

  // How much of the allowance and basic rate band the job leaves for the profit.
  // For a Scottish taxpayer it is the starter, basic and intermediate bands
  // together: the income left before the higher rate starts.
  const personalAllowance = taxOnEverything.personalAllowanceUsed
  const allowanceUsedByJob = Math.min(job, personalAllowance)
  const higherRateStartsAbove = scottish
    ? scottishRates.intermediateRateLimit
    : incomeTaxRates.basicRateLimit
  const basicRateBandLeft = Math.max(
    0,
    higherRateStartsAbove - Math.max(job, incomeTaxRates.personalAllowance),
  )

  // Payments on account cover income tax and Class 4, not student loan. They
  // are due unless the bill is under £1,000, or more than 80% of all the tax
  // owed for the year was deducted at source (here, through the job).
  const billForPaymentsOnAccount = incomeTax + class4
  const allTaxOwed = taxOnEverything.tax + class4
  const shareDeductedAtSource = allTaxOwed > 0 ? taxOnJob.tax / allTaxOwed : 0
  const paymentsOnAccountApply =
    billForPaymentsOnAccount >= paymentsOnAccount.minimumBill &&
    shareDeductedAtSource <= paymentsOnAccount.deductedAtSourceShare
  const paymentOnAccount = paymentsOnAccountApply ? billForPaymentsOnAccount / 2 : 0

  return {
    turnover,
    deducted,
    profit,
    employmentIncome: job,
    incomeTax,
    class4,
    studentLoan,
    studentLoanThroughJob: loanThroughJob,
    totalBill,
    takeHomeAnnual,
    takeHomeMonthly: takeHomeAnnual / 12,
    setAsideMonthly: totalBill / 12,
    setAsideShare: turnover > 0 ? totalBill / turnover : 0,
    taxOnJob: taxOnJob.tax,
    personalAllowance,
    allowanceUsedByJob,
    allowanceLeftForProfit: personalAllowance - allowanceUsedByJob,
    basicRateBandLeft,
    paymentsOnAccountApply,
    shareDeductedAtSource,
    paymentOnAccount,
    // Assumes no payments on account have already been made for this tax year.
    dueInJanuary: totalBill + paymentOnAccount,
    dueInJuly: paymentOnAccount,
    // Things the page points out.
    underTradingAllowance: turnover > 0 && turnover <= tradingAllowance,
    // Income over the trading allowance has to be reported even when no tax is due.
    mustRegisterWithNothingToPay: turnover > tradingAllowance && totalBill === 0,
    tradingAllowanceWouldBeBetter:
      !useTradingAllowance && turnover > 0 && atLeastZero(expenses) < tradingAllowance,
    belowSmallProfitsThreshold: profit < class2.smallProfitsThreshold,
  }
}
