import { Link } from 'react-router-dom'
import LastUpdated from '../components/LastUpdated'
import Source from '../components/Source'
import TextPage from '../components/TextPage'
import { CONTACT_EMAIL } from '../routes'

// Change this by hand whenever the page changes. Everything on it describes how
// the site is built and tested (CLAUDE.md, package.json, src/lib/rates/ and the
// tests in src/lib/), so check it again when that changes. "If any of them
// fails, the build stops" is true because npm run build runs npm test first. On 30 October 2026 there
// were 359 tests, 85 of them labelled [gov.uk] and 1 [gov.scot].
const LAST_UPDATED = '2026-10-30'

// The About page links to this heading as /how-we-check#how-we-worked-this-out.
const WORKING_SECTION_ID = 'how-we-worked-this-out'

export default function HowWeCheck() {
  return (
    <TextPage>
      <h1>How we check our figures</h1>
      <p className="lede">
        The rates the calculators use come from official sources such as gov.uk and HMRC, and the
        sums are tested against official examples where there are any. Here is how, and what happens
        when something changes or is wrong.
      </p>
      <LastUpdated date={LAST_UPDATED} className="prose__updated" />

      <h2>Where the figures come from</h2>
      <p>
        Every rate, threshold and allowance the calculators use is kept in one place in the
        site&apos;s code, organised by tax year. The calculations and the text on each page both
        read from there, so the figure a guide quotes cannot differ from the one the calculator
        uses.
      </p>
      <p>The figures come from:</p>
      <ul>
        <li>
          gov.uk, for tax rates, thresholds and allowances, the minimum wage, statutory pay and
          student loans
        </li>
        <li>
          <Source href="https://www.gov.uk/government/collections/hmrc-manuals">
            HMRC&apos;s internal manuals
          </Source>
          , for detail gov.uk&apos;s guides leave out, such as how mileage relief and shared
          ownership are worked out
        </li>
        <li>
          HMRC&apos;s technical specification for payroll software, for how a tax code becomes
          tax-free pay on each pay day
        </li>
        <li>the Scottish Government, for Scottish income tax</li>
        <li>nidirect, for the redundancy pay limits in Northern Ireland</li>
        <li>
          Budget documents and HM Treasury, for changes that have been announced but have not
          started yet
        </li>
        <li>
          the FCA and the Bank of England, for the compound interest calculator&apos;s quick picks
        </li>
      </ul>
      <p>
        The <Link to="/mortgage-overpayment-calculator">mortgage overpayment calculator</Link> uses
        no official rates. It works from the figures you enter, and what it says about overpayments
        and offset accounts comes from MoneyHelper.
      </p>
      <p>Each calculator and guide links to the pages its figures come from.</p>

      <h2>Checked against official examples</h2>
      <p>
        gov.uk and HMRC publish worked examples for many rules, such as how much student loan comes
        off a monthly payslip, or how mileage relief is worked out. Those examples are built into
        the site&apos;s tests: the calculator is given the same figures and has to reach the same
        answer.
      </p>
      <p>
        Where gov.uk or HMRC has a calculator of its own, the same figures go into both. The{' '}
        <Link to="/redundancy-calculator">redundancy pay calculator</Link> is checked against{' '}
        <Source href="https://www.gov.uk/calculate-your-redundancy-pay">
          gov.uk&apos;s redundancy pay calculator
        </Source>
        , the <Link to="/maternity-pay-calculator">maternity and paternity pay calculator</Link>{' '}
        against{' '}
        <Source href="https://www.gov.uk/maternity-paternity-calculator">
          gov.uk&apos;s calculator for employers
        </Source>
        , and the shared ownership results of the{' '}
        <Link to="/stamp-duty-calculator">stamp duty calculator</Link> against{' '}
        <Source href="https://www.tax.service.gov.uk/calculate-stamp-duty-land-tax">
          HMRC&apos;s Stamp Duty Land Tax calculator
        </Source>
        .
      </p>
      <p>
        Each calculation test records where its expected answer came from: an example or a
        calculator result from gov.uk or HMRC, a figure the Scottish Government publishes, or a sum
        worked out by hand. The hand-worked tests cover the places where mistakes tend to hide: each
        threshold, zero, blank or negative entries, and very large amounts.
      </p>
      <p>
        Some calculators have no official example to compare with. gov.uk has no mortgage
        calculator, so every mortgage result is also worked out a second way, from the standard loan
        formulas, and the two have to agree. The savings interest tax calculator is checked against
        a separate calculation of the whole tax bill, and the pay rise calculator has to match the
        take-home pay calculator for every salary it is tested with. The{' '}
        <Link to="/compound-interest-calculator">compound interest calculator</Link> is checked the
        same way, against the standard formulas.
      </p>

      <h2>Tested before anything goes live</h2>
      <p>
        There are more than 350 automated tests, and more than 80 of them check against something
        gov.uk or HMRC publishes. Every time the site is built, all the tests run first. If any of
        them fails, the build stops and the change cannot go live. Each change is also checked on a
        preview copy of the site first.
      </p>

      <h2 id={WORKING_SECTION_ID} tabIndex={-1}>
        How we worked this out
      </h2>
      <p>
        Every calculator shows its working under the result. The first table adds up to the figure
        in the result. The tables after it show where each line came from, such as a rate and the
        amount it was applied to. A test checks that every calculator&apos;s working adds up to the
        answer it shows, so you can follow each step and check it by hand.
      </p>
      <p>
        The results are estimates for common situations. Payroll software rounds some figures in
        ways the calculators do not, so a payslip can differ by a few pence.
      </p>

      <h2>When the figures are checked again</h2>
      <ul>
        <li>
          At the start of each tax year on 6 April, when most rates and allowances change. The
          minimum wage changes on 1 April, and Scotland sets its income tax rates on its own
          timetable.
        </li>
        <li>
          After each Budget. Changes that have been announced but have not started yet are shown
          with the date they start.
        </li>
        <li>When the detailed rules for an announced change are published.</li>
      </ul>
      <p>Each calculator and guide shows the date it was last updated.</p>

      <h2>If something is wrong</h2>
      <p>
        If you spot a mistake, or a figure that looks out of date, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or see the{' '}
        <Link to="/contact">contact page</Link>. It is checked against the official source and fixed
        as soon as reasonably possible, with a test so the same mistake would be caught if it came
        back, and the date on the page is updated.
      </p>
    </TextPage>
  )
}
