import { calculateISAAllowance, ISA, TAX_YEAR } from '../lib/calculations'
import { formatGBP as gbp, percent } from '../lib/format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

export default function ISAGuide() {
  const { overallAllowance, minAge, lisaLimit, lisaBonusRate } = ISA
  const { lisaMinOpenAge, lisaMaxOpenAge, lisaMaxContributionAge, lisaAccessAge } = ISA
  const { lisaWithdrawalChargeRate, lisaPropertyCap, lisaMonthsBeforePurchase } = ISA
  const { cashLimitChangeDate, cashLimitUnder65AfterChange, cashLimitFullAllowanceAge } = ISA

  const maxBonus = lisaLimit * lisaBonusRate

  // gov.uk's withdrawal charge example: save £800, withdraw the whole pot.
  const saved = 800
  const pot = saved + saved * lisaBonusRate
  const charge = pot * lisaWithdrawalChargeRate
  const left = pot - charge

  const full = calculateISAAllowance({ cashISA: 10000, stocksISA: 6000, lisa: 4000, age: 30 })
  const part = calculateISAAllowance({ cashISA: 5000, stocksISA: 5000, lisa: 4000, age: 28 })
  const overLisa = calculateISAAllowance({ cashISA: 0, stocksISA: 0, lisa: 6000, age: 25 })

  return (
    <article className="guide">
      <h2>How the ISA allowance works in {TAX_YEAR}</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        An ISA is a savings or investment account where you pay no tax on the interest, income or
        gains. In {TAX_YEAR} you can pay in up to {gbp(overallAllowance)} across all your ISAs. You
        must be {minAge} or over and resident in the UK to open one.
      </p>

      <h3>How the {gbp(overallAllowance)} splits</h3>
      <p>
        There are four types: cash ISAs, stocks and shares ISAs, innovative finance ISAs and
        Lifetime ISAs. You can put the whole {gbp(overallAllowance)} in one account or split it
        across several, including more than one of the same type. The one exception is the Lifetime
        ISA: you can only pay into one in a tax year, and no more than {gbp(lisaLimit)}.
      </p>
      <p>
        The allowance runs from 6 April to 5 April. You can take money out of an ISA at any time
        without losing the tax benefits, though your provider may have its own rules or charges.
      </p>

      <h3>Lifetime ISA rules</h3>
      <ul>
        <li>
          You must be {lisaMinOpenAge} or over but under {lisaMaxOpenAge} to open one.
        </li>
        <li>
          You can pay in up to {gbp(lisaLimit)} a year until you are {lisaMaxContributionAge}.
        </li>
        <li>
          The government adds a {percent(lisaBonusRate)} bonus, up to {gbp(maxBonus)} a year.
        </li>
        <li>
          The {gbp(lisaLimit)} counts towards your {gbp(overallAllowance)}. It is not on top.
        </li>
      </ul>
      <p>
        You can take the money out without a charge to buy your first home, once you are{' '}
        {lisaAccessAge} or over, or if you are terminally ill. For a first home, the property must
        cost {gbp(lisaPropertyCap)} or less, you must buy with a mortgage, and you must buy at least{' '}
        {lisaMonthsBeforePurchase} months after your first payment into the account.
      </p>
      <p>
        Any other withdrawal has a {percent(lisaWithdrawalChargeRate)} charge on the amount taken
        out. That is more than the bonus. Save {gbp(saved)} and the bonus makes it {gbp(pot)}.
        Withdraw it all and the charge is {gbp(charge)}, leaving {gbp(left)}. You get back{' '}
        {gbp(saved - left)} less than you put in.
      </p>

      <h3>The Cash ISA change from April 2027</h3>
      <p>
        From {cashLimitChangeDate}, people under {cashLimitFullAllowanceAge} will only be able to
        pay {gbp(cashLimitUnder65AfterChange)} a year into cash ISAs. The overall allowance stays at{' '}
        {gbp(overallAllowance)}, so the rest can still go into a stocks and shares, innovative
        finance or Lifetime ISA. People aged {cashLimitFullAllowanceAge} and over keep the full{' '}
        {gbp(overallAllowance)} for cash.
      </p>
      <p>
        The regulations were laid before Parliament on 14 September 2026 and come into force on{' '}
        {cashLimitChangeDate}. They include rules to stop people getting round the lower cash limit.
        Nothing changes for {TAX_YEAR}, which is the year this calculator covers.
      </p>

      <h2>Worked examples</h2>

      <h3>Using the whole allowance</h3>
      <p>
        You pay {gbp(10000)} into a cash ISA, {gbp(6000)} into a stocks and shares ISA and{' '}
        {gbp(4000)} into a Lifetime ISA. That is {gbp(full.totalContributions)}, so you have{' '}
        {gbp(full.remainingAllowance)} left. The Lifetime ISA earns a {gbp(full.lisaBonus)} bonus.
      </p>

      <h3>Using part of it</h3>
      <p>
        You pay in {gbp(5000)} to cash, {gbp(5000)} to stocks and shares and {gbp(4000)} to a
        Lifetime ISA. That is {gbp(part.totalContributions)}, leaving {gbp(part.remainingAllowance)}{' '}
        you can still pay in before 5 April.
      </p>

      <h3>Trying to put {gbp(6000)} in a Lifetime ISA</h3>
      <p>
        Only {gbp(overLisa.lisaCapped)} is allowed, which earns the full {gbp(overLisa.lisaBonus)}{' '}
        bonus. The other {gbp(6000 - overLisa.lisaCapped)} would have to go into a different type of
        ISA. You would have {gbp(overLisa.remainingAllowance)} of allowance left for that.
      </p>

      <h2>Common questions</h2>

      <h3>Can I have more than one ISA?</h3>
      <p>
        Yes. You can hold and pay into several, as long as the total paid in during the tax year
        stays within {gbp(overallAllowance)}.
      </p>

      <h3>Is the Lifetime ISA limit on top of the {gbp(overallAllowance)}?</h3>
      <p>
        No. Pay {gbp(lisaLimit)} into a Lifetime ISA and you have{' '}
        {gbp(overallAllowance - lisaLimit)} left for other ISAs.
      </p>

      <h3>What happens to a Lifetime ISA when I turn {lisaMaxContributionAge}?</h3>
      <p>
        You can no longer pay in or earn the bonus. The account stays open and your savings still
        earn interest or investment returns.
      </p>

      <h3>Do I need to put ISA interest on my tax return?</h3>
      <p>No. You do not declare ISA interest, income or gains.</p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a href="https://www.gov.uk/individual-savings-accounts" target="_blank" rel="noreferrer">
          Individual Savings Accounts
        </a>
        ,{' '}
        <a href="https://www.gov.uk/lifetime-isa" target="_blank" rel="noreferrer">
          Lifetime ISAs
        </a>{' '}
        and the{' '}
        <a
          href="https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit"
          target="_blank"
          rel="noreferrer"
        >
          reduction in the cash ISA limit
        </a>
        .
      </p>
    </article>
  )
}
