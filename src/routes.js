// The single source for every page on the site. The router, the prerender
// script (scripts/prerender.js) and the sitemap are all built from this list.
// To add a page: add it here, then map its path to a component in App.jsx.
//
// sharedLinks: true marks the calculators whose page passes sharedLinks to
// useCalculatorState (see "Share links" in CLAUDE.md). The privacy policy
// lists them from here, and routes.test.js checks the two agree.

import { INCOME_TAX, NEXT_YEAR_SAVINGS_TAX } from './lib/rates/incomeTax.js'
import { BUDGET_2026 } from './lib/rates/budget.js'
import { CASH_ISA_CUT_SCRAPPED, ISA, LIFETIME_ISA_REFORM } from './lib/rates/isa.js'
import { MILEAGE_RATES } from './lib/rates/mileage.js'
import { MINIMUM_WAGE } from './lib/rates/minimumWage.js'
import { PARENTAL_PAY } from './lib/rates/parentalPay.js'
import { REDUNDANCY } from './lib/rates/redundancy.js'
import { TRADING_ALLOWANCE_RISE } from './lib/rates/selfEmployed.js'
import { STAMP_DUTY } from './lib/rates/stampDuty.js'
import { NEXT_TAX_YEAR, NEXT_TAX_YEAR_START, TAX_YEAR } from './lib/rates/taxYear.js'
import { taxCodeFor } from './lib/taxCode.js'

export const SITE_URL = 'https://ukmoneycalculators.co.uk'
export const SITE_NAME = 'UK Money Calculators'
// The person who runs the site. Named on the About page, in the privacy policy
// and in the terms.
export const OWNER_NAME = 'Oliver Cran'
export const CONTACT_EMAIL = 'hello@ukmoneycalculators.co.uk'

const pounds = (value) => `£${value.toLocaleString('en-GB')}`

// Extra pay in the personal allowance taper is taxed at the higher rate, and
// each £2 of it removes £1 of allowance, which is then taxed at that rate too.
const { higherRate, taperAllowanceLostPerPound, personalAllowance } = INCOME_TAX
const taperRate = `${Math.round(higherRate * (1 + taperAllowanceLostPerPound) * 100)}%`
const standardTaxCode = taxCodeFor(personalAllowance)
const { basic, higher, additional } = NEXT_YEAR_SAVINGS_TAX.rates
const savingsRates = `${Math.round(basic * 100)}%, ${Math.round(higher * 100)}% and ${Math.round(additional * 100)}%`
const nextCarMileage = MILEAGE_RATES[NEXT_TAX_YEAR].carOrVan
const firstTimeBuyerIsa = LIFETIME_ISA_REFORM.firstTimeBuyerIsa

export const routes = [
  {
    path: '/',
    title: `UK Money Calculators: tax, pay and savings ${TAX_YEAR}`,
    description: `Free calculators for take-home pay, redundancy pay, ISA allowance, mortgage overpayments, minimum wage and student loans. Updated for the ${TAX_YEAR} tax year.`,
  },
  {
    path: '/salary-calculator',
    name: 'Take-home pay calculator',
    sharedLinks: true,
    title: `Take-home pay calculator ${TAX_YEAR}: salary after tax and NI`,
    description: `Work out your take-home pay for ${TAX_YEAR} after income tax, National Insurance, pension and student loan, with your tax code and any bonus. Covers the whole UK.`,
  },
  {
    path: '/pay-rise-calculator',
    name: 'Pay rise calculator',
    sharedLinks: true,
    title: `Pay rise calculator ${TAX_YEAR}: how much of a rise you keep`,
    description: `See how much of a pay rise you keep after tax, National Insurance, student loan and pension in ${TAX_YEAR}. Includes Scottish income tax rates.`,
  },
  {
    path: '/self-employed-tax-calculator',
    name: 'Self-employed tax calculator',
    sharedLinks: true,
    title: `Self-employed tax calculator ${TAX_YEAR}: tax, NI and what to save`,
    description: `Work out income tax, Class 4 National Insurance and student loan on your self-employed profit for ${TAX_YEAR}. Includes Scottish income tax rates.`,
  },
  {
    path: '/mileage-allowance-calculator',
    name: 'Mileage allowance calculator',
    sharedLinks: true,
    title: `Mileage allowance calculator ${TAX_YEAR}: tax relief on your miles`,
    description: `Work out the tax relief on business miles in your own car, van, motorcycle or bike for ${TAX_YEAR} and ${NEXT_TAX_YEAR}, when the rate above ${nextCarMileage.firstMiles.toLocaleString('en-GB')} miles rises to ${Math.round(nextCarMileage.laterMilesRate * 100)}p.`,
  },
  {
    path: '/redundancy-calculator',
    name: 'Statutory redundancy pay calculator',
    sharedLinks: true,
    title: `Statutory redundancy pay calculator ${TAX_YEAR}`,
    description: `Work out your statutory redundancy pay from your age, years of service and weekly pay. Uses the ${TAX_YEAR} weekly pay cap of ${pounds(REDUNDANCY.weeklyPayCapGB)} (${pounds(REDUNDANCY.weeklyPayCapNI)} in Northern Ireland).`,
  },
  {
    path: '/maternity-pay-calculator',
    name: 'Maternity and paternity pay calculator',
    sharedLinks: true,
    title: `Maternity pay calculator ${TAX_YEAR}: SMP, SPP and employer reclaim`,
    description: `Work out Statutory Maternity Pay (SMP) or Paternity Pay at £${PARENTAL_PAY.weeklyRate.toFixed(2)} a week from ${PARENTAL_PAY.ratesFrom}, check who qualifies, and see what an employer can reclaim from HMRC.`,
  },
  {
    path: '/isa-calculator',
    name: 'ISA and Lifetime ISA allowance calculator',
    sharedLinks: true,
    title: `ISA allowance calculator ${TAX_YEAR}: ${pounds(ISA.overallAllowance)} limit and LISA bonus`,
    description: `Check how much of your ${pounds(ISA.overallAllowance)} ISA allowance is left for ${TAX_YEAR} across Cash, Stocks and Shares and Lifetime ISAs, and see your ${ISA.lisaBonusRate * 100}% Lifetime ISA bonus.`,
  },
  {
    path: '/lifetime-isa-calculator',
    name: 'Lifetime ISA calculator',
    sharedLinks: true,
    title: 'Lifetime ISA calculator: bonus, savings and withdrawal charge',
    description: `Project your Lifetime ISA for ${TAX_YEAR} with the ${ISA.lisaBonusRate * 100}% government bonus, for a first home or age ${ISA.lisaAccessAge}, and see what you would get back after the ${ISA.lisaWithdrawalChargeRate * 100}% withdrawal charge.`,
  },
  {
    path: '/savings-interest-tax-calculator',
    name: 'Savings interest tax calculator',
    sharedLinks: true,
    title: `Savings interest tax calculator ${TAX_YEAR} and ${NEXT_TAX_YEAR}`,
    description: `Work out the tax on your savings interest for ${TAX_YEAR} and from ${NEXT_TAX_YEAR_START}, when the savings rates rise to ${savingsRates}. Covers the whole UK.`,
  },
  {
    path: '/mortgage-overpayment-calculator',
    name: 'Mortgage overpayment calculator',
    sharedLinks: true,
    title: 'Mortgage overpayment calculator: your mortgage-free date',
    description:
      'Pay off your mortgage early: see your mortgage-free date and the interest saved by overpaying or offsetting savings, or what to overpay to clear it by a set year.',
  },
  {
    path: '/stamp-duty-calculator',
    name: 'Stamp duty calculator',
    sharedLinks: true,
    title: `Stamp duty calculator ${TAX_YEAR}: England, NI and shared ownership`,
    description: `Work out stamp duty on a home in England or Northern Ireland, for first-time buyers (relief up to ${pounds(STAMP_DUTY.firstTimeBuyer.maxPrice)}), home movers, second homes and shared ownership.`,
  },
  {
    path: '/minimum-wage-calculator',
    name: 'Minimum wage checker',
    sharedLinks: true,
    title: `Minimum wage checker ${MINIMUM_WAGE.effectiveFrom.slice(-4)}: are you paid the legal minimum?`,
    description: `Check your hourly pay against the National Living Wage (£${MINIMUM_WAGE.nationalLivingWage.toFixed(2)}) and National Minimum Wage rates from ${MINIMUM_WAGE.effectiveFrom}, by age and for apprentices.`,
  },
  {
    path: '/student-loan-calculator',
    name: 'Student loan repayment calculator',
    sharedLinks: true,
    title: `Student loan repayment calculator ${TAX_YEAR}: Plans 1, 2, 4 and 5`,
    description: `Work out your monthly student loan repayment from your salary for ${TAX_YEAR}. Covers Plan 1, Plan 2, Plan 4, Plan 5 and Postgraduate Loans.`,
  },
  // Guides. `guide` is the heading and link text, and `summary` is the line
  // shown under it in lists of guides.
  {
    path: '/guides',
    title: 'Guides to UK tax, pay and savings | UK Money Calculators',
    description: `Plain guides to the rules behind the calculators: the ${pounds(INCOME_TAX.taperStart)} tax trap, how to read your payslip, and the scrapped cut to the cash ISA limit.`,
  },
  {
    path: '/guides/100k-tax-trap',
    guide: `The ${pounds(INCOME_TAX.taperStart)} tax trap`,
    summary: `Why pay between ${pounds(INCOME_TAX.taperStart)} and ${pounds(INCOME_TAX.taperFullyGoneAt)} is taxed at ${taperRate}, and what reduces it.`,
    title: `The ${pounds(INCOME_TAX.taperStart)} tax trap: why you pay ${taperRate} (${TAX_YEAR})`,
    description: `Why income between ${pounds(INCOME_TAX.taperStart)} and ${pounds(INCOME_TAX.taperFullyGoneAt)} is taxed at ${taperRate} in ${TAX_YEAR}, what it costs, and how pension contributions and Gift Aid reduce it.`,
  },
  {
    path: '/guides/overpay-mortgage-or-save',
    guide: 'Should I overpay my mortgage or save?',
    summary:
      'How the interest saved by overpaying compares with savings interest after tax, with worked examples.',
    title: `Should I overpay my mortgage or save? ${TAX_YEAR} tax rules`,
    description: `Compare overpaying your mortgage with saving: interest saved against savings interest after tax and the Personal Savings Allowance, with ${TAX_YEAR} examples.`,
  },
  {
    path: '/guides/how-to-read-your-payslip',
    guide: 'How to read your payslip',
    summary: `What each line means, what tax code ${standardTaxCode} tells you, and how to spot a mistake.`,
    title: `How to read your payslip: tax codes and deductions ${TAX_YEAR}`,
    description: `What each line on a UK payslip means: gross pay, tax code ${standardTaxCode}, income tax, National Insurance, student loan and pension, and how to spot a mistake.`,
  },
  {
    path: '/guides/cash-isa-changes-april-2027',
    guide: 'Cash ISA limit cut scrapped: what happens in April 2027',
    summary: `The planned ${pounds(CASH_ISA_CUT_SCRAPPED.plannedCashLimit)} cash limit was dropped at Budget 2026, so you can still put all ${pounds(ISA.overallAllowance)} in cash. What had been planned, and what is still to be confirmed.`,
    title: 'Cash ISA limit cut scrapped: what happens in April 2027',
    description: `Budget 2026 scrapped the planned ${pounds(CASH_ISA_CUT_SCRAPPED.plannedCashLimit)} cash ISA limit. From April 2027 the limit stays ${pounds(ISA.overallAllowance)} and you can still save it all in cash.`,
  },
  {
    path: '/guides/budget-2026',
    guide: 'Budget 2026: what it means for your money',
    summary: `What Budget 2026 on ${BUDGET_2026.date} changes for savings, ISAs, work, pensions and Child Benefit, and when each change starts.`,
    title: 'Budget 2026: what it means for your money',
    description: `What Budget 2026 changes and when: savings tax rising to ${savingsRates}, the cash ISA limit kept at ${pounds(ISA.overallAllowance)}, a ${pounds(TRADING_ALLOWANCE_RISE.tradingAllowance)} trading allowance and more.`,
  },
  {
    path: '/guides/first-time-buyer-isa-vs-lifetime-isa',
    guide: `First Time Buyer ISA vs Lifetime ISA: what changes in ${firstTimeBuyerIsa.from.slice(-4)}`,
    summary: `The new account from ${firstTimeBuyerIsa.from}, what happens to Lifetime ISAs, and the two side by side.`,
    title: `First Time Buyer ISA vs Lifetime ISA: what changes in ${firstTimeBuyerIsa.from.slice(-4)}`,
    description: `From ${firstTimeBuyerIsa.from} the First Time Buyer ISA replaces the Lifetime ISA for new savers: a ${firstTimeBuyerIsa.bonusRate * 100}% bonus on the balance, up to ${pounds(firstTimeBuyerIsa.bonusCap)}, for homes up to ${pounds(firstTimeBuyerIsa.propertyCap)}.`,
  },
  {
    path: '/about',
    title: 'About UK Money Calculators',
    description:
      'Who runs UK Money Calculators, where the figures come from and how often they are updated.',
  },
  {
    path: '/privacy',
    title: 'Privacy policy | UK Money Calculators',
    description:
      'How UK Money Calculators handles your data. Numbers you type into the calculators stay in your browser and are not sent to us.',
  },
  {
    path: '/cookies',
    title: 'Cookie policy | UK Money Calculators',
    description:
      'The cookies Google AdSense may set on UK Money Calculators, what each one is for, how long it lasts and how to change your choice.',
  },
  {
    path: '/terms',
    title: 'Terms of use | UK Money Calculators',
    description:
      'The terms for using UK Money Calculators. The calculators give estimates for general information, not financial, tax or legal advice.',
  },
]

// Shown for any URL not in the list above. Never indexed, so no canonical URL.
export const notFoundRoute = {
  path: '/404',
  title: 'Page not found | UK Money Calculators',
  description: 'That page does not exist. Go back to the homepage to find a calculator.',
}

/** The standalone guides, in the order they are listed. */
export const guides = routes.filter((route) => route.guide)

export const canonicalUrl = (route) => SITE_URL + route.path

export function findRoute(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return routes.find((route) => route.path === path) ?? notFoundRoute
}
