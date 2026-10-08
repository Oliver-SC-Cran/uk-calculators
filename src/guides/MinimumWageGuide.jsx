import { checkMinimumWage, MINIMUM_WAGE } from '../lib/calculations'
import { formatGBP as gbp, formatGBPPence as gbpPence } from '../lib/format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

export default function MinimumWageGuide() {
  const { effectiveFrom, nationalLivingWage, age18to20, under18, apprentice, minAge } = MINIMUM_WAGE
  const year = effectiveFrom.slice(-4)

  // Example 1: paid below the rate.
  const ex1 = checkMinimumWage({ age: 22, hourlyRate: 11.5, isApprentice: false })
  const ex1Hours = 37.5

  // Example 2: a deduction for uniform takes pay below the rate.
  const ex2Rate = 13
  const ex2Hours = 40
  const ex2Uniform = 15
  const ex2Pay = ex2Rate * ex2Hours
  const ex2Counted = ex2Pay - ex2Uniform
  const ex2Hourly = ex2Counted / ex2Hours

  // Example 3: unpaid extra hours spread the same pay over more time.
  const ex3PaidHours = 37.5
  const ex3WorkedHours = 40
  const ex3Pay = ex2Rate * ex3PaidHours
  const ex3Hourly = ex3Pay / ex3WorkedHours

  return (
    <article className="guide">
      <h2>How the minimum wage works from April {year}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        Almost every worker in the UK must be paid at least a minimum hourly rate. The rate depends
        on your age and whether you are an apprentice. It applies however you are paid, including by
        salary or by the piece, and however small your employer is. The rates change on 1 April each
        year.
      </p>

      <h3>Rates from {effectiveFrom}</h3>
      <ul>
        <li>Aged 21 and over (the National Living Wage): {gbpPence(nationalLivingWage)} an hour</li>
        <li>Aged 18 to 20: {gbpPence(age18to20)} an hour</li>
        <li>Under 18: {gbpPence(under18)} an hour</li>
        <li>Apprentices: {gbpPence(apprentice)} an hour</li>
      </ul>
      <p>
        The apprentice rate applies if you are under 19, or if you are 19 or over and in the first
        year of your apprenticeship. After that you get the rate for your age. An apprentice aged 21
        who has finished their first year is entitled to {gbpPence(nationalLivingWage)}.
      </p>

      <h3>Who is not covered</h3>
      <p>
        You must be at least school leaving age, which is usually {minAge}. Self-employed people
        running their own business, company directors, volunteers and members of the armed forces
        are not entitled to the minimum wage. Nor are family members who live in the employer's
        home.
      </p>

      <h3>What counts towards your pay</h3>
      <p>
        The minimum wage is measured on your pay before income tax and National Insurance. Some
        things are left out when checking it:
      </p>
      <ul>
        <li>tips, service charges and cover charges</li>
        <li>extra pay for working unsocial hours on a shift</li>
        <li>
          anything you had to buy for the job and were not refunded for, such as tools, uniform or
          safety equipment
        </li>
      </ul>
      <p>
        So if your employer charges you for a uniform, that money comes off your pay before it is
        compared with the minimum. A rate that looks legal on paper can fall below it.
      </p>

      <h3>What counts as working time</h3>
      <p>
        Time you are required to be at work counts, as does training and travel between jobs during
        the day. Rest breaks and travel between home and work do not. If you regularly work extra
        hours without pay, the same pay is spread over more hours, which can also take you below the
        minimum.
      </p>

      <h2>Worked examples</h2>

      <h3>Aged 22 and paid {gbpPence(11.5)} an hour</h3>
      <p>
        The minimum at 22 is {gbpPence(ex1.applicableRate)}, so you are {gbpPence(ex1.shortfall)} an
        hour short. Over {ex1Hours} hours that is {gbpPence(ex1.shortfall * ex1Hours)} a week you
        are owed.
      </p>

      <h3>A uniform charge</h3>
      <p>
        You are 27, work {ex2Hours} hours a week at {gbpPence(ex2Rate)} an hour and pay{' '}
        {gbp(ex2Uniform)} a week for a uniform. Your pay is {gbp(ex2Pay)}, but only{' '}
        {gbp(ex2Counted)} counts. Divided by {ex2Hours} hours, that is {gbpPence(ex2Hourly)} an
        hour, which is under {gbpPence(nationalLivingWage)}.
      </p>

      <h3>Unpaid extra hours</h3>
      <p>
        You are paid {gbpPence(ex2Rate)} an hour for {ex3PaidHours} hours, which is{' '}
        {gbpPence(ex3Pay)} a week, but you work {ex3WorkedHours} hours. Spread over {ex3WorkedHours}{' '}
        hours your pay is {gbpPence(ex3Hourly)} an hour, which is under{' '}
        {gbpPence(nationalLivingWage)}.
      </p>

      <h2>Common questions</h2>

      <h3>How do I report being paid less than the minimum wage?</h3>
      <p>
        Talk to your employer first. If that does not fix it, you can ask in writing to see your pay
        records. You can call the Acas helpline for confidential advice, or make a complaint to HMRC
        using the online form on gov.uk. You can also complain on someone else's behalf.
      </p>

      <h3>What happens after a complaint?</h3>
      <p>
        If HMRC finds you were underpaid, it sends your employer a notice to pay the arrears, plus a
        fine. If the employer still refuses, HMRC can take them to court on your behalf. You can
        also go to an employment tribunal yourself.
      </p>

      <h3>I am paid a salary. Does the minimum wage still apply?</h3>
      <p>
        Yes. Work out your pay for the period and divide it by the hours you worked to get an hourly
        rate.
      </p>

      <h3>Is the National Living Wage the same as the real Living Wage?</h3>
      <p>
        No. The National Living Wage is the legal minimum for people aged 21 and over. The real
        Living Wage is a higher, voluntary rate set by the Living Wage Foundation, which employers
        choose to pay.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for the{' '}
        <a href="https://www.gov.uk/national-minimum-wage-rates" target="_blank" rel="noreferrer">
          minimum wage rates
        </a>
        ,{' '}
        <a href="https://www.gov.uk/national-minimum-wage" target="_blank" rel="noreferrer">
          who gets the minimum wage and what counts towards it
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk/minimum-wage-different-types-work"
          target="_blank"
          rel="noreferrer"
        >
          what counts as working time
        </a>{' '}
        and how to{' '}
        <a
          href="https://www.gov.uk/government/publications/pay-and-work-rights-complaints"
          target="_blank"
          rel="noreferrer"
        >
          complain about pay and work rights
        </a>
        .
      </p>
    </article>
  )
}
