// The self-employed tax calculator. It puts together the income tax, Class 4
// National Insurance and student loan functions in calculations.js, and
// contains no rates or thresholds of its own.

import {
  calculateClass4NationalInsurance,
  calculateIncomeTax,
  calculateStudentLoanForYear,
  calculateStudentLoanRepayment,
  INCOME_TAX,
  SELF_EMPLOYED,
} from './calculations.js'

const atLeastZero = (value) => (Number.isFinite(value) ? Math.max(0, value) : 0)

/**
 * Tax on self-employed profit for one tax year, for a sole trader who may
 * also have a job.
 *
 * A job is taxed first, through PAYE. It uses up the personal allowance and
 * the lower tax bands, so the tax on the profit is the tax on everything
 * together minus the tax on the job alone. Student loan works the same way:
 * the repayment on total income for the year, minus what the employer took.
 */
export function calculateSelfEmployedTax({
  income,
  expenses = 0,
  useTradingAllowance = false,
  employmentIncome = 0,
  plan = 'none',
  hasPostgraduateLoan = false,
}) {
  const { tradingAllowance, paymentsOnAccount, class2 } = SELF_EMPLOYED
  const turnover = atLeastZero(income)
  const job = atLeastZero(employmentIncome)

  // Costs cannot be more than income here: losses are not covered.
  const costs = useTradingAllowance ? tradingAllowance : atLeastZero(expenses)
  const deducted = Math.min(turnover, costs)
  const profit = turnover - deducted

  const taxOnJob = calculateIncomeTax(job)
  const taxOnEverything = calculateIncomeTax(job + profit)
  const incomeTax = taxOnEverything.tax - taxOnJob.tax
  const class4 = calculateClass4NationalInsurance(profit)

  const loanForYear = calculateStudentLoanForYear({
    income: job + profit,
    plan,
    hasPostgraduateLoan,
  }).total
  const loanThroughJob = calculateStudentLoanRepayment({
    grossAnnual: job,
    plan,
    hasPostgraduateLoan,
  }).totalAnnual
  const studentLoan = Math.max(0, loanForYear - loanThroughJob)

  const totalBill = incomeTax + class4 + studentLoan
  // The trading allowance is not money spent, so with it take-home is income
  // less tax. With real expenses it is profit less tax.
  const takeHomeAnnual = (useTradingAllowance ? turnover : profit) - totalBill

  // How much of the allowance and basic rate band the job leaves for the profit.
  const personalAllowance = taxOnEverything.personalAllowanceUsed
  const allowanceUsedByJob = Math.min(job, personalAllowance)
  const basicRateBandLeft = Math.max(
    0,
    INCOME_TAX.basicRateLimit - Math.max(job, INCOME_TAX.personalAllowance),
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
