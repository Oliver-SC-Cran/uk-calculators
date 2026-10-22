// The single source for every page on the site. The router, the prerender
// script (scripts/prerender.js) and the sitemap are all built from this list.
// To add a page: add it here, then map its path to a component in App.jsx.
//
// sharedLinks: true marks the calculators whose page passes sharedLinks to
// useCalculatorState (see "Share links" in CLAUDE.md). The privacy policy
// lists them from here, and routes.test.js checks the two agree.

import { INCOME_TAX } from './lib/rates/incomeTax.js'
import { ISA } from './lib/rates/isa.js'
import { MINIMUM_WAGE } from './lib/rates/minimumWage.js'
import { PARENTAL_PAY } from './lib/rates/parentalPay.js'
import { REDUNDANCY } from './lib/rates/redundancy.js'
import { STAMP_DUTY } from './lib/rates/stampDuty.js'
import { TAX_YEAR } from './lib/rates/taxYear.js'
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
    path: '/redundancy-calculator',
    name: 'Statutory redundancy pay calculator',
    title: `Statutory redundancy pay calculator ${TAX_YEAR}`,
    description: `Work out your statutory redundancy pay from your age, years of service and weekly pay. Uses the ${TAX_YEAR} weekly pay cap of ${pounds(REDUNDANCY.weeklyPayCapGB)} (${pounds(REDUNDANCY.weeklyPayCapNI)} in Northern Ireland).`,
  },
  {
    path: '/maternity-pay-calculator',
    name: 'Maternity and paternity pay calculator',
    title: 'Maternity and paternity pay calculator: SMP and SPP 2026/27',
    description: `Work out Statutory Maternity Pay or Paternity Pay at the ${PARENTAL_PAY.ratesFrom} rate of £${PARENTAL_PAY.weeklyRate.toFixed(2)} a week, check if you qualify, and see your qualifying week.`,
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
    title: `Lifetime ISA calculator ${TAX_YEAR}: bonus, growth and charges`,
    description: `Project your Lifetime ISA with the ${ISA.lisaBonusRate * 100}% government bonus, for a first home or for age ${ISA.lisaAccessAge}, and see what the ${ISA.lisaWithdrawalChargeRate * 100}% withdrawal charge would cost.`,
  },
  {
    path: '/mortgage-overpayment-calculator',
    name: 'Mortgage overpayment calculator',
    sharedLinks: true,
    title: 'Mortgage overpayment calculator: pay off your mortgage early',
    description:
      'See how soon you could pay off your mortgage early by overpaying each month or with a lump sum, the interest saved, and how much you can overpay each year.',
  },
  {
    path: '/stamp-duty-calculator',
    name: 'Stamp duty calculator',
    sharedLinks: true,
    title: 'Stamp duty calculator: SDLT in England and Northern Ireland',
    description: `Work out stamp duty on a home in England or Northern Ireland, for home movers, first-time buyers (relief up to ${pounds(STAMP_DUTY.firstTimeBuyer.maxPrice)}) and additional properties.`,
  },
  {
    path: '/minimum-wage-calculator',
    name: 'Minimum wage checker',
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
    description: `Plain guides to the rules behind the calculators: the ${pounds(INCOME_TAX.taperStart)} tax trap, how to read your payslip, and the Cash ISA changes from April 2027.`,
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
    guide: 'Cash ISA changes from April 2027',
    summary: `The new ${pounds(ISA.cashLimitUnder65AfterChange)} cash limit for under-${ISA.cashLimitFullAllowanceAge}s, what stays the same, and where the rules stand.`,
    title: `Cash ISA changes from April 2027: the ${pounds(ISA.cashLimitUnder65AfterChange)} limit`,
    description: `From ${ISA.cashLimitChangeDate}, under-${ISA.cashLimitFullAllowanceAge}s can pay no more than ${pounds(ISA.cashLimitUnder65AfterChange)} a year into cash ISAs. What changes, what stays the same and where the rules stand.`,
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
