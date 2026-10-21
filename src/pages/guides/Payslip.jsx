import GuidePage from '../../components/GuidePage'
import { calculateTakeHome } from '../../lib/incomeTax'
import { INCOME_TAX, NATIONAL_INSURANCE, TAX_CODE_TIMES } from '../../lib/rates/incomeTax'
import { AUTO_ENROLMENT } from '../../lib/rates/pensions'
import { STUDENT_LOAN } from '../../lib/rates/studentLoans'
import { TAX_YEAR } from '../../lib/rates/taxYear'
import { calculateStudentLoanRepayment, monthlyLoanThreshold } from '../../lib/studentLoans'
import { formatGBP as gbp, formatGBPPence as pence, percent } from '../../lib/format'
import Source from '../../components/Source'
import { taxCodeFor } from '../../lib/taxCode'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-20'

export default function Payslip() {
  const { personalAllowance, basicRate, higherRate, additionalRate } = INCOME_TAX
  const { basicRateLimit, higherRateLimit } = INCOME_TAX
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = NATIONAL_INSURANCE
  const plan2 = STUDENT_LOAN.plan2

  const standardCode = taxCodeFor(personalAllowance)
  // gov.uk's own example of a reduced code: medical insurance worth £1,570.
  const benefit = 1570
  const reducedCode = taxCodeFor(personalAllowance - benefit)

  // gov.uk gives the monthly NI thresholds as £1,048 and £4,189, which are the
  // yearly ones divided by 12 and rounded to the pound.
  const monthlyNiStart = Math.round(primaryThreshold / 12)
  const monthlyNiUpper = Math.round(upperEarningsLimit / 12)

  // The example payslip: the yearly figures from the take-home calculator,
  // divided by 12.
  const salary = 30000
  const year = calculateTakeHome(salary)
  const grossPay = salary / 12
  const incomeTax = year.incomeTax / 12
  const nationalInsurance = year.nationalInsurance / 12
  const studentLoan = calculateStudentLoanRepayment({
    grossAnnual: salary,
    plan: 'plan2',
  }).undergradMonthly
  const netPay = grossPay - incomeTax - nationalInsurance - studentLoan

  return (
    <GuidePage
      path="/guides/how-to-read-your-payslip"
      updated={LAST_UPDATED}
      calculators={['/salary-calculator', '/student-loan-calculator', '/pay-rise-calculator']}
      intro={
        <>
          A payslip shows what you earned, what was taken off and why. This guide goes through each
          line, explains what a tax code such as {standardCode} means, and lists the checks that
          catch most mistakes.
        </>
      }
    >
      <p>
        The figures are for {TAX_YEAR} and for England, Wales and Northern Ireland. Scottish
        taxpayers pay different rates of income tax.
      </p>

      <h2>What a payslip must show</h2>
      <p>
        Your employer must give you a payslip on or before payday, on paper or electronically. By
        law it must show:
      </p>
      <ul>
        <li>your pay before and after deductions (gross pay and net pay)</li>
        <li>
          deductions that change from one payday to the next, such as tax and National Insurance
        </li>
        <li>the hours you worked, if your pay varies with the time you work</li>
      </ul>
      <p>
        Fixed deductions, such as repaying a season ticket loan, must be explained too, on the
        payslip or in a separate statement. HMRC says a payslip should also show your tax code.
      </p>

      <h2>An example payslip</h2>
      <p>
        Someone on {gbp(salary)} a year, paid monthly, with a Plan 2 student loan and no pension.
        These are our take-home calculator's yearly figures divided by 12, so a real payslip can
        differ by a few pence.
      </p>
      <table className="result-table result-table--total">
        <tbody>
          <tr>
            <th scope="row">Gross pay</th>
            <td>{pence(grossPay)}</td>
          </tr>
          <tr>
            <th scope="row">Income tax (tax code {standardCode})</th>
            <td>{pence(-incomeTax)}</td>
          </tr>
          <tr>
            <th scope="row">National Insurance</th>
            <td>{pence(-nationalInsurance)}</td>
          </tr>
          <tr>
            <th scope="row">Student loan (Plan 2)</th>
            <td>{pence(-studentLoan)}</td>
          </tr>
          <tr>
            <th scope="row">Net pay</th>
            <td>{pence(netPay)}</td>
          </tr>
        </tbody>
      </table>

      <h2>The tax period or tax week number</h2>
      <p>
        A tax period such as Month 7 or Week 30 counts from the start of the tax year on 6 April,
        not from January. Tax months run from the 6th of one month to the 5th of the next, so month
        1 is 6 April to 5 May and month 12 is 6 March to 5 April. Tax weeks start on 6 April, so
        week 1 is 6 to 12 April, and the day or two left at the end of the year count as week 53.
      </p>
      <p>
        The number comes from the date you are paid: pay on 28 October is in month 7. Your employer
        reports it to HMRC and, with a normal tax code, uses it to work out tax on your pay for the
        year so far.
      </p>

      <h2>Your tax code</h2>
      <p>
        HMRC tells your employer which tax code to use, and the code sets how much income tax is
        taken.
      </p>
      <p>
        The number is your tax-free pay for the year with the last digit removed. The standard
        personal allowance is {gbp(personalAllowance)}, which gives {standardCode.replace('L', '')}.
        HMRC lowers the number for things like untaxed income or company benefits. In gov.uk's
        example, medical insurance worth {gbp(benefit)} leaves {gbp(personalAllowance - benefit)}{' '}
        tax-free and a code of {reducedCode}.
      </p>
      <p>The common letters are:</p>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">What it means</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">L</th>
              <td>You get the standard personal allowance</td>
            </tr>
            <tr>
              <th scope="row">M, N</th>
              <td>
                Marriage Allowance: M if you received part of your partner's allowance, N if you
                transferred part of yours
              </td>
            </tr>
            <tr>
              <th scope="row">T</th>
              <td>Your code includes other calculations</td>
            </tr>
            <tr>
              <th scope="row">0T</th>
              <td>Your allowance has been used up, or you have started a new job</td>
            </tr>
            <tr>
              <th scope="row">BR, D0, D1</th>
              <td>
                All your pay from this job is taxed at one rate: {percent(basicRate)} for BR,{' '}
                {percent(higherRate)} for D0 and {percent(additionalRate)} for D1
              </td>
            </tr>
            <tr>
              <th scope="row">K</th>
              <td>You have income that is not being taxed, and it is more than your allowance</td>
            </tr>
            <tr>
              <th scope="row">NT</th>
              <td>No tax is taken from this income</td>
            </tr>
            <tr>
              <th scope="row">S, C</th>
              <td>At the start of a code: taxed at the rates for Scotland (S) or Wales (C)</td>
            </tr>
            <tr>
              <th scope="row">W1, M1, X</th>
              <td>At the end of a code: an emergency tax code</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        With an emergency code, tax is worked out on that payday's pay alone, not on your pay for
        the year so far, so you can pay the wrong amount. It usually happens in a new job, and HMRC
        can take up to {TAX_CODE_TIMES.newJobDays} days to update it.
      </p>

      <h2>Income tax and National Insurance</h2>
      <p>
        Income tax is charged on pay above your tax-free amount: {percent(basicRate)} up to{' '}
        {gbp(basicRateLimit)} a year, {percent(higherRate)} up to {gbp(higherRateLimit)} and{' '}
        {percent(additionalRate)} above that.
      </p>
      <p>
        National Insurance is worked out on each payslip. In {TAX_YEAR} you pay {percent(mainRate)}{' '}
        on monthly pay between {gbp(monthlyNiStart)} and {gbp(monthlyNiUpper)}, and{' '}
        {percent(upperRate)} on anything above. Your payslip also shows a category letter. Most
        employees have A.
      </p>

      <h2>Student loan and pension</h2>
      <p>
        On Plan 2 you repay {percent(plan2.rate)} of monthly pay over{' '}
        {gbp(monthlyLoanThreshold(plan2))}, and your payslip shows the amount. Tell a new employer
        which plan you are on.
      </p>
      <p>
        Under automatic enrolment at least {percent(AUTO_ENROLMENT.totalMinimum)} of a band of your
        earnings goes into your pension: at least {percent(AUTO_ENROLMENT.employerMinimum)} from
        your employer and usually {percent(AUTO_ENROLMENT.employeeMinimum)} from you.
      </p>

      <h2>How to spot a mistake</h2>
      <ul>
        <li>
          Compare the tax code on your payslip with the one HMRC holds, in its Check your Income Tax
          service or the HMRC app. If they are different, speak to your employer.
        </li>
        <li>
          If they match but the code does not fit your circumstances, tell HMRC. It sends you and
          your employer the new code within {TAX_CODE_TIMES.newCodeWorkingDays} working days.
        </li>
        <li>
          Look for an emergency code that is still there more than {TAX_CODE_TIMES.newJobDays} days
          into a new job.
        </li>
        <li>Check the hours and rate if your pay varies.</li>
        <li>
          Question any deduction you do not recognise. Your employer can only take money the law
          requires or allows, that your contract allows, or that you have agreed to in writing.
        </li>
      </ul>
      <p>
        If something looks wrong, speak to your employer first. A tax refund normally comes through
        your pay. For a deduction that should not have been made, Acas can help, and you can go to
        an employment tribunal.
      </p>

      <h2>Common questions</h2>
      <h3>Does everyone have the right to a payslip?</h3>
      <p>Employees and workers do. Contractors and freelancers do not.</p>
      <h3>Who do I tell if my tax code is wrong?</h3>
      <p>HMRC. Your employer has to use the code HMRC gives it.</p>
      <h3>Whose job is it to check my tax?</h3>
      <p>Yours. gov.uk says it is your responsibility to make sure you pay the right amount.</p>

      <h2>Where this comes from</h2>
      <p>
        All from gov.uk: <Source href="https://www.gov.uk/payslips">payslips</Source>,{' '}
        <Source href="https://www.gov.uk/guidance/check-if-the-tax-on-your-payslip-is-correct">
          checking your payslip
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/government/publications/cwg2-further-guide-to-paye-and-national-insurance-contributions/2026-to-2027-employer-further-guide-to-paye-and-national-insurance-contributions">
          tax weeks and months
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/guidance/what-payroll-information-to-report-to-hmrc">
          what employers report
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-codes/what-your-tax-code-means">
          what your tax code means
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-codes/emergency-tax-codes">emergency tax codes</Source>
        ,{' '}
        <Source href="https://www.gov.uk/tax-codes/how-to-update-your-tax-code">
          updating your tax code
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/national-insurance/how-much-you-pay">
          National Insurance rates
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/national-insurance-rates-letters/category-letters">
          category letters
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/repaying-your-student-loan/how-you-repay">
          repaying a student loan
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay">
          workplace pension contributions
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/understanding-your-pay/deductions-from-your-pay">
          deductions from your pay
        </Source>
        .
      </p>
    </GuidePage>
  )
}
