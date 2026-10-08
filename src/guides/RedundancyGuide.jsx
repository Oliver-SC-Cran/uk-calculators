import { calculateRedundancyPay, REDUNDANCY, TAX_YEAR, TAX_YEAR_START } from '../lib/calculations'
import { gbp } from './format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

export default function RedundancyGuide() {
  const { weeklyPayCapGB, weeklyPayCapNI, maxYearsCounted, minYearsToQualify } = REDUNDANCY
  const { taxFreeThreshold, claimWithinMonths } = REDUNDANCY

  const longService = { age: 64, yearsOfService: maxYearsCounted, weeklyPay: weeklyPayCapNI }
  const maxGB = calculateRedundancyPay(longService)
  const maxNI = calculateRedundancyPay({ ...longService, region: 'NI' })

  const example1 = calculateRedundancyPay({ age: 30, yearsOfService: 5, weeklyPay: 500 })
  const example2 = calculateRedundancyPay({ age: 45, yearsOfService: 10, weeklyPay: 600 })
  const example3 = calculateRedundancyPay({ age: 58, yearsOfService: 25, weeklyPay: 900 })

  return (
    <article className="guide">
      <h2>How statutory redundancy pay works in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        Statutory redundancy pay is the legal minimum your employer must pay when your job is made
        redundant. Your contract or a company scheme may give you more. It cannot give you less.
      </p>

      <h3>Who qualifies</h3>
      <p>
        You normally qualify if you are an employee and have worked for your current employer for{' '}
        {minYearsToQualify} years or more. Self-employed people, and workers who are not
        employees, do not qualify. You can lose the right if your employer offers you suitable
        alternative work and you turn it down without good reason. Members of the armed forces,
        police officers and crown servants are not covered, and being dismissed for misconduct
        does not count as redundancy.
      </p>

      <h3>How the age bands work</h3>
      <p>You get a number of weeks' pay for each full year you worked for your employer:</p>
      <ul>
        <li>half a week's pay for each full year you were under 22</li>
        <li>one week's pay for each full year you were 22 or older, but under 41</li>
        <li>one and a half weeks' pay for each full year you were 41 or older</li>
      </ul>
      <p>
        Only full years count, and only the most recent {maxYearsCounted}. A year counts at the
        higher rate only if you were that age for the whole of it. The year in which you turned 41
        counts as one week, not one and a half.
      </p>

      <h3>The weekly pay cap</h3>
      <p>
        Your weekly pay is the average you earned over the 12 weeks before you were given notice.
        For redundancies on or after {TAX_YEAR_START} it is capped at {gbp(weeklyPayCapGB)} a week
        in England, Scotland and Wales, and {gbp(weeklyPayCapNI)} in Northern Ireland. If you earn
        more, the cap is used. The most anyone can get is {gbp(maxGB.pay)}, or {gbp(maxNI.pay)} in
        Northern Ireland.
      </p>

      <h3>Tax, notice pay and holiday pay</h3>
      <p>
        The first {gbp(taxFreeThreshold)} of redundancy pay is usually tax-free. That limit covers
        statutory redundancy pay and any extra redundancy payment from your employer added
        together.
      </p>
      <p>
        Notice pay, holiday pay and unpaid wages are separate from redundancy pay. You are owed
        them on top, and they are taxed like normal earnings, with National Insurance. That
        includes payment in lieu of notice. The minimum notice is one week if you have worked
        there between one month and 2 years, one week for each year between 2 and 12 years, and 12
        weeks after 12 years or more.
      </p>

      <h2>Worked examples</h2>
      <p>
        These use the cap for England, Scotland and Wales. Results are rounded down to the whole
        pound, as on the official calculator.
      </p>

      <h3>Age 30, 5 years' service, {gbp(500)} a week</h3>
      <p>
        All five years fall in the 22 to 40 band, so you get {example1.totalWeeks} weeks' pay.
        That is {gbp(example1.pay)}.
      </p>

      <h3>Age 45, 10 years' service, {gbp(600)} a week</h3>
      <p>
        The four years that started at 41 or older count as one and a half weeks each, which is 6
        weeks. The other six years count as one week each. That makes {example2.totalWeeks} weeks'
        pay, or {gbp(example2.pay)}.
      </p>

      <h3>Age 58, 25 years' service, {gbp(900)} a week</h3>
      <p>
        Only the last {maxYearsCounted} years count. Seventeen of them started at 41 or older and
        three did not, which gives {example3.totalWeeks} weeks. Pay is capped at{' '}
        {gbp(example3.weeklyPayUsed)} a week, so the payment is {gbp(example3.pay)}.
      </p>

      <h2>Common questions</h2>

      <h3>Do I pay tax on redundancy pay?</h3>
      <p>
        Not on the first {gbp(taxFreeThreshold)}. You pay income tax on anything above that. Notice
        pay and holiday pay paid at the same time are taxed in full.
      </p>

      <h3>How long do I have to claim?</h3>
      <p>
        You have {claimWithinMonths} months from the date your job ends to apply for statutory
        redundancy pay.
      </p>

      <h3>What if my employer cannot pay?</h3>
      <p>
        If your employer is insolvent, you can apply to the government's Insolvency Service for
        the redundancy pay you are owed.
      </p>

      <h3>Is redundancy pay different in Northern Ireland?</h3>
      <p>
        The rules are the same, but the weekly pay cap is {gbp(weeklyPayCapNI)} and not{' '}
        {gbp(weeklyPayCapGB)}. Choose Northern Ireland in the calculator to use it.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a href="https://www.gov.uk/redundancy-your-rights" target="_blank" rel="noreferrer">
          your rights in redundancy
        </a>
        , the{' '}
        <a
          href="https://www.gov.uk/calculate-your-redundancy-pay"
          target="_blank"
          rel="noreferrer"
        >
          official redundancy pay calculator
        </a>{' '}
        and{' '}
        <a
          href="https://www.gov.uk/termination-payments-and-tax-when-you-leave-a-job"
          target="_blank"
          rel="noreferrer"
        >
          tax on termination payments
        </a>
        . Northern Ireland figures are from{' '}
        <a href="https://www.nidirect.gov.uk/articles/redundancy-pay" target="_blank" rel="noreferrer">
          nidirect
        </a>
        .
      </p>
    </article>
  )
}
