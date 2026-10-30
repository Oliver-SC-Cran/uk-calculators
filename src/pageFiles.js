// The component file for each path in src/routes.js, under src/pages/. Each
// one is built to its own JavaScript file, so a page only loads its own code
// (see src/pageLoader.js). Every path in routes.js needs a file here, and so does
// the 404 page. src/routes.test.js checks both.

export const pageFiles = {
  '/': 'Home',
  '/salary-calculator': 'SalaryCalculator',
  '/pay-rise-calculator': 'PayRiseCalculator',
  '/self-employed-tax-calculator': 'SelfEmployedTaxCalculator',
  '/redundancy-calculator': 'RedundancyCalculator',
  '/isa-calculator': 'ISACalculator',
  '/lifetime-isa-calculator': 'LifetimeIsaCalculator',
  '/savings-interest-tax-calculator': 'SavingsTaxCalculator',
  '/mortgage-overpayment-calculator': 'MortgageOverpaymentCalculator',
  '/stamp-duty-calculator': 'StampDutyCalculator',
  '/maternity-pay-calculator': 'MaternityPayCalculator',
  '/minimum-wage-calculator': 'MinimumWageCalculator',
  '/student-loan-calculator': 'StudentLoanCalculator',
  '/guides': 'guides/Guides',
  '/guides/100k-tax-trap': 'guides/TaxTrap',
  '/guides/overpay-mortgage-or-save': 'guides/OverpayOrSave',
  '/guides/how-to-read-your-payslip': 'guides/Payslip',
  '/guides/cash-isa-changes-april-2027': 'guides/CashIsaChanges',
  '/guides/budget-2026': 'guides/Budget2026',
  '/about': 'About',
  '/privacy': 'Privacy',
  '/cookies': 'Cookies',
  '/terms': 'Terms',
  '/404': 'NotFound',
}
