// The hint under the tax code field on the take-home pay and pay rise
// calculators. It says why the answer with no code differs a little from the
// answer with the standard code typed in: with no code the Personal Allowance
// itself is used, and payroll's tax tables give a code a little more
// (payrollCodeAllowance in lib/incomeTax.js).

import { formatGBP, formatGBPPence } from '../lib/format'
import { payrollCodeAllowance } from '../lib/incomeTax'
import { INCOME_TAX } from '../lib/rates/incomeTax'
import { taxCodeFor } from '../lib/taxCode'

const { personalAllowance, basicRate } = INCOME_TAX
const standardCode = taxCodeFor(personalAllowance)
const fromPayroll = payrollCodeAllowance(parseInt(standardCode, 10)).year

export const TAX_CODE_HINT = `On your payslip. Leave it blank to use the standard Personal Allowance of ${formatGBP(personalAllowance)}. Payroll rounds code ${standardCode} up to ${formatGBPPence(fromPayroll)} of tax-free pay, so entering it takes about ${formatGBPPence((fromPayroll - personalAllowance) * basicRate)} a year less tax.`
