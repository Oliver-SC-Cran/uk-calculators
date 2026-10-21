import { Link } from 'react-router-dom'
import { ISA, LIFETIME_ISA_REFORM } from '../lib/rates/isa'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatGBP as gbp, percent } from '../lib/format'
import { projectLifetimeIsa, withdrawalFor } from '../lib/lifetimeIsa'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '20 October 2026'
const LAST_UPDATED_ISO = '2026-10-20'

export default function LifetimeIsaGuide() {
  const { overallAllowance, lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA
  const { lisaMaxContributionAge, lisaAccessAge, lisaWithdrawalChargeRate } = ISA
  const { lisaPropertyCap, lisaMonthsBeforePurchase, lisaTerminalIllnessMonths } = ISA
  const maxBonus = lisaLimit * lisaBonusRate

  // gov.uk's example of the withdrawal charge, with no growth.
  const govExample = projectLifetimeIsa({
    age: 30,
    contribution: 800,
    frequency: 'yearly',
    goal: 'home',
    purchaseAge: 31,
  })
  const cashNeeded = 120
  const toWithdraw = withdrawalFor(cashNeeded)

  // £200 a month from 30, buying at 35.
  const home = { age: 30, contribution: 200, goal: 'home', purchaseAge: 35 }
  const homeGrowth = 4
  const homeGrown = projectLifetimeIsa({ ...home, growthPercent: homeGrowth })
  const homeCash = projectLifetimeIsa({ ...home, growthPercent: 0 })

  // £4,000 a year from 25, kept until 60.
  const later = { age: 25, contribution: lisaLimit, frequency: 'yearly', goal: 'retirement' }
  const laterGrowth = 4
  const laterGrown = projectLifetimeIsa({ ...later, growthPercent: laterGrowth })
  const laterCash = projectLifetimeIsa({ ...later, growthPercent: 0 })

  return (
    <article className="guide">
      <h2>How a Lifetime ISA works in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        A Lifetime ISA is a savings account for buying your first home or for later life. The
        government adds a {percent(lisaBonusRate)} bonus to what you pay in. In return, you pay a{' '}
        {percent(lisaWithdrawalChargeRate)} charge if you take money out for any other reason.
      </p>

      <h3>The rules</h3>
      <ul>
        <li>
          You must be {lisaMinOpenAge} or over but under {lisaMaxOpenAge} to open one, and make your
          first payment before you are {lisaMaxOpenAge}.
        </li>
        <li>
          You can pay in up to {gbp(lisaLimit)} a year until you are {lisaMaxContributionAge}.
        </li>
        <li>
          The government adds a {percent(lisaBonusRate)} bonus, up to {gbp(maxBonus)} a year.
        </li>
        <li>
          The {gbp(lisaLimit)} counts towards your {gbp(overallAllowance)} ISA allowance for{' '}
          {TAX_YEAR}. It is not on top.
        </li>
        <li>You can hold cash, stocks and shares, or both.</li>
        <li>
          From {lisaMaxContributionAge} you cannot pay in or get the bonus, but the account stays
          open and your savings can still grow.
        </li>
      </ul>
      <p>
        To open one and keep paying in, you must live in the UK, or be a member of the armed forces
        or a Crown servant (or their spouse or civil partner) living abroad.
      </p>

      <h3>Using it for your first home</h3>
      <p>You can use your savings and the bonus towards your first home if:</p>
      <ul>
        <li>the home costs {gbp(lisaPropertyCap)} or less</li>
        <li>you buy it at least {lisaMonthsBeforePurchase} months after your first payment in</li>
        <li>
          you buy with a mortgage, and a conveyancer or solicitor acts for you. Your provider pays
          the money straight to them
        </li>
      </ul>
      <p>
        The mortgage cannot be a private one from a relative or from your spouse or civil partner.
        If you buy with someone who also has a Lifetime ISA, you can both use your savings and
        bonus, as long as you are both first-time buyers. If you also have a Help to Buy ISA, you
        can only use the bonus from one of them.
      </p>

      <h3>Using it for later life</h3>
      <p>
        From {lisaAccessAge} you can take your savings out without a charge, for any reason. If you
        die, the account ends on that date and there is no charge on what is in it.
      </p>

      <h3>Taking money out for any other reason</h3>
      <p>
        You pay a {percent(lisaWithdrawalChargeRate)} charge on whatever you take out. It is{' '}
        {percent(lisaWithdrawalChargeRate)} of the whole amount, bonus included, so it takes back
        more than the bonus added. In gov.uk's example, with no growth, {gbp(govExample.paidIn)}{' '}
        earns a bonus of {gbp(govExample.bonus)}, making {gbp(govExample.value)}. Taking it all out
        costs {gbp(govExample.withdrawal.charge)} and leaves{' '}
        {gbp(govExample.withdrawal.afterCharge)}, which is {gbp(govExample.withdrawal.shortfall)}{' '}
        less than was paid in.
      </p>
      <p>
        To end up with a set amount of cash, you have to take out more to cover the charge. To be
        left with {gbp(cashNeeded)}, you take out {gbp(toWithdraw)} and pay{' '}
        {gbp(toWithdraw - cashNeeded)}. There is no charge if you are terminally ill with less than{' '}
        {lisaTerminalIllnessMonths} months to live.
      </p>

      <h3>A planned change to Lifetime ISAs</h3>
      <p>
        Checked on {LIFETIME_ISA_REFORM.checkedOn}. At Budget 2025 the government announced a new,
        simpler ISA to help first-time buyers save for a home, now called the First Time Buyer ISA.
        Once it is available, it will be offered in place of the Lifetime ISA. HM Treasury consulted
        on it from {LIFETIME_ISA_REFORM.consultationOpened} to{' '}
        {LIFETIME_ISA_REFORM.consultationClosed}, and says it wants the new account available as
        soon as practically possible. Its limits, bonus and property price cap will be announced
        later.
      </p>
      <p>
        Until then you can still open a Lifetime ISA, and anyone who has one can keep paying in
        under the current rules indefinitely. The Budget also said the {gbp(lisaLimit)} Lifetime ISA
        limit will stay the same until {LIFETIME_ISA_REFORM.lisaLimitFixedUntil}. The figures in
        this guide and in the calculator use today's rules.
      </p>

      <h2>Worked examples</h2>
      <p>
        These come from the calculator above. Growth is a yearly rate after fees. It is not
        guaranteed: investments can go down as well as up, so you could get back less than you put
        in.
      </p>

      <h3>
        {gbp(home.contribution)} a month from {home.age}, buying a home at {home.purchaseAge}
      </h3>
      <p>
        Over {homeGrown.payingYears} years you pay in {gbp(homeGrown.paidIn)} and the bonus adds{' '}
        {gbp(homeGrown.bonus)}. With {homeGrowth}% growth a year the account is worth about{' '}
        {gbp(homeGrown.value)} when you buy. With no growth, as for cash earning no interest, it is{' '}
        {gbp(homeCash.value)}. If you took that {gbp(homeCash.value)} out for something else, the
        charge would be {gbp(homeCash.withdrawal.charge)} and you would get{' '}
        {gbp(homeCash.withdrawal.afterCharge)}, which is {gbp(homeCash.withdrawal.shortfall)} less
        than you paid in.
      </p>

      <h3>
        {gbp(later.contribution)} a year from {later.age}, kept until {lisaAccessAge}
      </h3>
      <p>
        You can pay in for {laterGrown.payingYears} years, until you are {lisaMaxContributionAge}:{' '}
        {gbp(laterGrown.paidIn)} in all, with {gbp(laterGrown.bonus)} of bonus. Payments stop then,
        but growth carries on. At {laterGrowth}% a year the account would be worth about{' '}
        {gbp(laterGrown.value)} at {lisaAccessAge}, of which {gbp(laterGrown.growth)} is growth.
        With no growth it would be {gbp(laterCash.value)}.
      </p>

      <h2>Common questions</h2>

      <h3>Can I have a Lifetime ISA and other ISAs?</h3>
      <p>
        Yes. What you pay into a Lifetime ISA counts towards your {gbp(overallAllowance)} allowance
        for {TAX_YEAR}, so with {gbp(lisaLimit)} in it you can put up to{' '}
        {gbp(overallAllowance - lisaLimit)} in other ISAs. The{' '}
        <Link to="/isa-calculator">ISA allowance calculator</Link> works out what you have left.
      </p>

      <h3>What happens when I turn {lisaMaxContributionAge}?</h3>
      <p>
        You cannot pay in any more and no more bonus is added. The account stays open, your savings
        can still earn interest or investment returns, and you can take them out without a charge
        from {lisaAccessAge}.
      </p>

      <h3>What if the home costs more than {gbp(lisaPropertyCap)}?</h3>
      <p>
        You cannot use your Lifetime ISA for it. Taking the money out would count as a withdrawal
        for another reason, so the {percent(lisaWithdrawalChargeRate)} charge would apply.
      </p>

      <h3>Can I use it if I am buying with someone else?</h3>
      <p>
        Yes. If they have a Lifetime ISA too, you can both use your savings and bonus, as long as
        you are both first-time buyers and the purchase meets the other rules.
      </p>

      <h3>What happens to my Lifetime ISA if the rules change?</h3>
      <p>
        From what the government has said so far, you can keep your Lifetime ISA and keep paying
        into it under the current rules indefinitely, including after the new First Time Buyer ISA
        is available. You can also still open one until then. The details of the new account are
        still to be announced, so check gov.uk for updates.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        The rules are from{' '}
        <a href="https://www.gov.uk/lifetime-isa" target="_blank" rel="noreferrer">
          Lifetime ISA
        </a>{' '}
        on gov.uk, including the example of the withdrawal charge. The planned change is from HM
        Treasury's{' '}
        <a
          href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation"
          target="_blank"
          rel="noreferrer"
        >
          First Time Buyer ISA consultation
        </a>{' '}
        and the{' '}
        <a
          href="https://www.gov.uk/government/publications/budget-2025-document/budget-2025-html"
          target="_blank"
          rel="noreferrer"
        >
          Budget 2025 document
        </a>
        . The other figures come from the calculator on this page.
      </p>
    </article>
  )
}
