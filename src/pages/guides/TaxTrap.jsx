import { Link } from 'react-router-dom'
import GuidePage from '../../components/GuidePage'
import { CHILDCARE, INCOME_TAX, NATIONAL_INSURANCE } from '../../lib/rates/incomeTax'
import { SALARY_SACRIFICE_CHANGE } from '../../lib/rates/pensions'
import { STUDENT_LOAN } from '../../lib/rates/studentLoans'
import { TAX_YEAR } from '../../lib/rates/taxYear'
import { formatGBP as gbp, formatGBPPence, percent } from '../../lib/format'
import { calculatePayPackage, calculatePayRise } from '../../lib/payRise'
import Source from '../../components/Source'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-11'

export default function TaxTrap() {
  const { personalAllowance, taperStart, taperFullyGoneAt } = INCOME_TAX
  const { basicRate, higherRate, additionalRate } = INCOME_TAX
  const { upperRate } = NATIONAL_INSURANCE

  // Each extra £100 is taxed at the higher rate and also removes £50 of
  // allowance, which is then taxed at the higher rate too.
  const lostAllowancePer100 = 100 * INCOME_TAX.taperAllowanceLostPerPound
  const taxPer100 = 100 * higherRate
  const extraTaxPer100 = lostAllowancePer100 * higherRate
  const taperRate = (taxPer100 + extraTaxPer100) / 100
  const niPer100 = 100 * upperRate
  const keptPer100 = 100 - taxPer100 - extraTaxPer100 - niPer100
  const keptPer100WithLoan = keptPer100 - 100 * STUDENT_LOAN.plan2.rate

  // A £10,000 rise that starts at the taper, and the same rise below it.
  const riseAmount = 10000
  const inTrap = calculatePayRise({ currentSalary: taperStart, newSalary: taperStart + riseAmount })
  const belowTrap = calculatePayRise({ currentSalary: 80000, newSalary: 80000 + riseAmount })

  // The same salary with enough paid into a pension to get back to the limit.
  const salary = taperStart + riseAmount
  const noPension = calculatePayPackage({ salary })
  const withPension = calculatePayPackage({
    salary,
    pensionPercent: (riseAmount / salary) * 100,
    pensionType: 'salarySacrifice',
  })
  const takeHomeGivenUp = noPension.takeHomeAnnual - withPension.takeHomeAnnual

  // Gift Aid and relief at source pensions: HMRC counts what you paid plus the
  // basic rate tax added on top.
  const grossUp = 1 / (1 - basicRate)
  const donation = 800
  const donationGross = donation * grossUp
  const allowanceBack = donationGross / 2
  const savedThroughAllowance = allowanceBack * higherRate
  const higherRateRelief = donationGross * (higherRate - basicRate)
  const donationCost = donation - savedThroughAllowance - higherRateRelief

  return (
    <GuidePage
      path="/guides/100k-tax-trap"
      updated={LAST_UPDATED}
      calculators={['/pay-rise-calculator', '/salary-calculator', '/self-employed-tax-calculator']}
      intro={
        <>
          Earn between {gbp(taperStart)} and {gbp(taperFullyGoneAt)} and each extra pound is taxed
          at {percent(taperRate)}, not {percent(higherRate)}. This guide explains why, what it
          costs, and the two reliefs that reduce it.
        </>
      }
    >
      <p>
        The figures are for {TAX_YEAR} and for England, Wales and Northern Ireland. Scotland sets
        its own income tax bands, so the percentages there are different.
      </p>

      <h2>Where the {percent(taperRate)} comes from</h2>
      <p>
        Most people can earn {gbp(personalAllowance)} a year before they pay income tax. This is the
        personal allowance. Once your income goes over {gbp(taperStart)}, the allowance shrinks by
        £1 for every £2 above it. At {gbp(taperFullyGoneAt)} it has gone completely.
      </p>
      <p>
        Take an extra {gbp(100)} of pay in that range. It is taxed at {percent(higherRate)}, which
        is {gbp(taxPer100)}. It also removes {gbp(lostAllowancePer100)} of your allowance, so
        another {gbp(lostAllowancePer100)} that was tax-free is now taxed at {percent(higherRate)},
        which is {gbp(extraTaxPer100)}. That is {gbp(taxPer100 + extraTaxPer100)} of income tax on{' '}
        {gbp(100)}. National Insurance at {percent(upperRate)} takes another {gbp(niPer100)}, so you
        keep {gbp(keptPer100)}.
      </p>
      <p>
        Above {gbp(taperFullyGoneAt)} there is no allowance left to lose, and the rate on extra pay
        drops back to {percent(additionalRate)}. So this band is taxed more heavily than the pay
        above it, which is why it is called a trap. Student loan repayments come on top. With a Plan
        2 loan you keep {gbp(keptPer100WithLoan)} of each extra {gbp(100)}.
      </p>

      <h2>What it costs</h2>
      <h3>
        A rise from {gbp(taperStart)} to {gbp(taperStart + riseAmount)}
      </h3>
      <p>
        Income tax takes {gbp(inTrap.goesTo.incomeTax)} of the {gbp(riseAmount)} and National
        Insurance takes {gbp(inTrap.goesTo.nationalInsurance)}. You keep {gbp(inTrap.kept)}. The
        same rise from {gbp(80000)} to {gbp(80000 + riseAmount)} would leave you with{' '}
        {gbp(belowTrap.kept)}.
      </p>
      <h3>The whole band</h3>
      <p>
        By {gbp(taperFullyGoneAt)} the full {gbp(personalAllowance)} allowance has gone. Taxed at{' '}
        {percent(higherRate)}, that costs {gbp(personalAllowance * higherRate)} a year.
      </p>

      <h2>The figure HMRC uses: adjusted net income</h2>
      <p>
        The taper is not based on your salary. It is based on your adjusted net income, which is
        your total taxable income from every source, less certain tax reliefs. Two of those reliefs
        matter most here: pension contributions and Gift Aid donations. Bring your adjusted net
        income down to {gbp(taperStart)} and the whole allowance comes back.
      </p>

      <h2>How pension contributions reduce it</h2>
      <p>How the saving reaches you depends on how your pension is taken.</p>
      <ul>
        <li>
          Salary sacrifice, or a scheme where your employer takes the contribution before income
          tax: your pay is taxed on the lower figure, so the saving comes through your pay.
        </li>
        <li>
          Relief at source: your provider claims {percent(basicRate)} from HMRC and adds it to your
          pot. HMRC counts what you paid plus that top-up, so each £1 you pay takes{' '}
          {formatGBPPence(grossUp)} off your adjusted net income. You claim the rest of the relief
          yourself, on a Self Assessment return or through HMRC's online service.
        </li>
      </ul>
      <p>
        On a salary of {gbp(salary)}, paying {gbp(withPension.pensionIntoPot)} into a pension by
        salary sacrifice brings your adjusted net income down to{' '}
        {gbp(withPension.adjustedNetIncome)}. Your take-home pay falls by {gbp(takeHomeGivenUp)},
        because the other {gbp(withPension.pensionIntoPot - takeHomeGivenUp)} would have gone in tax
        and National Insurance.
      </p>
      <p>
        A salary sacrifice cannot take your pay below the minimum wage. From{' '}
        {SALARY_SACRIFICE_CHANGE.startDate.replace(/^\d+ /, '')}, National Insurance will be charged
        on pension salary sacrifice above {gbp(SALARY_SACRIFICE_CHANGE.niFreeLimit)} a year. Pension
        tax relief also has its own limits, which gov.uk explains.
      </p>

      <h2>How Gift Aid reduces it</h2>
      <p>
        Gift Aid donations work in the same way. Give {gbp(donation)} and your adjusted net income
        falls by {gbp(donationGross)}. In the taper band that restores {gbp(allowanceBack)} of
        allowance, which saves {gbp(savedThroughAllowance)}. As a higher rate taxpayer you can also
        claim back {percent(higherRate - basicRate)} of the {gbp(donationGross)}, which is another{' '}
        {gbp(higherRateRelief)}. The donation has cost you {gbp(donationCost)}. You claim on a Self
        Assessment return, or by asking HMRC to change your tax code.
      </p>

      <h2>The childcare limit at the same figure</h2>
      <p>
        {gbp(CHILDCARE.adjustedNetIncomeLimit)} matters for another reason. You cannot get Tax-Free
        Childcare, or free childcare for working parents, if you or your partner expect an adjusted
        net income over {gbp(CHILDCARE.adjustedNetIncomeLimit)} in the tax year. Tax-Free Childcare
        is worth up to {gbp(CHILDCARE.taxFreeChildcareMaxPerChild)} a year for each child. The taper
        takes the allowance away gradually. This limit does not: go over it and you are no longer
        eligible.
      </p>

      <h2>Common questions</h2>
      <h3>Do I pay {percent(taperRate)} on all my income?</h3>
      <p>
        No. Only on the part between {gbp(taperStart)} and {gbp(taperFullyGoneAt)}. Pay below{' '}
        {gbp(taperStart)} is taxed as before.
      </p>
      <h3>Do I have to send a tax return if I earn over {gbp(taperStart)}?</h3>
      <p>
        Not for that reason alone. It is not on gov.uk's list of reasons you must send one. You may
        need one for another reason, and it is one way to claim higher rate relief on pension
        contributions and Gift Aid.
      </p>
      <h3>Will my tax code change?</h3>
      <p>
        The number in a tax code is your tax-free amount for the year with the last digit removed. A
        smaller allowance means a smaller number. Our guide on{' '}
        <Link to="/guides/how-to-read-your-payslip">how to read your payslip</Link> explains tax
        codes.
      </p>

      <h2>Try it with your own figures</h2>
      <p>
        The <Link to="/pay-rise-calculator">pay rise calculator</Link> shows how much of a rise you
        keep after tax, National Insurance, student loan and pension, and tells you when a rise
        takes you over {gbp(taperStart)}.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        All from gov.uk:{' '}
        <Source href="https://www.gov.uk/income-tax-rates">income over {gbp(taperStart)}</Source>,{' '}
        <Source href="https://www.gov.uk/guidance/adjusted-net-income">adjusted net income</Source>,{' '}
        <Source href="https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief">
          tax relief on pension contributions
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/guidance/salary-sacrifice-and-the-effects-on-paye">
          salary sacrifice
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/government/publications/changes-to-salary-sacrifice-for-pensions-from-april-2029">
          change to salary sacrifice from April 2029
        </Source>
        , <Source href="https://www.gov.uk/donating-to-charity/gift-aid">Gift Aid</Source>,{' '}
        <Source href="https://www.gov.uk/tax-free-childcare/check-if-youre-eligible">
          Tax-Free Childcare
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/free-childcare-if-working/check-youre-eligible">
          free childcare for working parents
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/self-assessment-tax-returns/who-must-send-a-tax-return">
          who must send a tax return
        </Source>
        .
      </p>
    </GuidePage>
  )
}
