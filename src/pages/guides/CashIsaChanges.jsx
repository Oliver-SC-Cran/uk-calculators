import { Link } from 'react-router-dom'
import GuidePage from '../../components/GuidePage'
import { ISA } from '../../lib/rates/isa'
import { SELF_EMPLOYED } from '../../lib/rates/selfEmployed'
import { TAX_YEAR, TAX_YEAR_END } from '../../lib/rates/taxYear'
import { formatGBP as gbp, percent } from '../../lib/format'
import Source from '../../components/Source'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-11'

export default function CashIsaChanges() {
  const { overallAllowance, lisaLimit, cashLimitChangeDate } = ISA
  const cashLimit = ISA.cashLimitUnder65AfterChange
  const fullAge = ISA.cashLimitFullAllowanceAge
  const chargeRate = ISA.cashInterestChargeRateAfterChange
  const firstYear = SELF_EMPLOYED.nextTaxYear

  const monthlySaver = 500
  const earlySaver = 15000
  const interest = 100

  return (
    <GuidePage
      path="/guides/cash-isa-changes-april-2027"
      updated={LAST_UPDATED}
      calculators={['/isa-calculator', '/mortgage-overpayment-calculator', '/salary-calculator']}
      intro={
        <>
          From {cashLimitChangeDate}, people under {fullAge} will be able to pay no more than{' '}
          {gbp(cashLimit)} a year into cash ISAs. The overall {gbp(overallAllowance)} allowance is
          not changing. This guide sets out what the regulations and HMRC's notes say so far.
        </>
      }
    >
      <h2>What is changing</h2>
      <p>
        In {TAX_YEAR} you can pay up to {gbp(overallAllowance)} into ISAs and put all of it in cash
        if you want to. From {cashLimitChangeDate}:
      </p>
      <ul>
        <li>
          if you are under {fullAge}, no more than {gbp(cashLimit)} of your {gbp(overallAllowance)}{' '}
          can go into cash ISAs in a tax year
        </li>
        <li>
          if you are {fullAge} or over, you keep the full {gbp(overallAllowance)} for cash. This
          applies from the start of the tax year in which you turn {fullAge}
        </li>
      </ul>
      <p>
        The change was announced at the Autumn Budget in 2025. HMRC's note gives the aim as
        encouraging more people to invest and improving long-term returns for savers. It also says
        that in 2022 to 2023, 22% of cash ISA savers under {fullAge} paid in more than{' '}
        {gbp(cashLimit)}.
      </p>

      <h2>What stays the same</h2>
      <ul>
        <li>The overall limit of {gbp(overallAllowance)} a year across all your ISAs.</li>
        <li>
          The limits for stocks and shares ISAs, innovative finance ISAs and Lifetime ISAs. A
          Lifetime ISA still takes up to {gbp(lisaLimit)} a year, inside the {gbp(overallAllowance)}
          .
        </li>
        <li>
          The rules for {TAX_YEAR}. Until {TAX_YEAR_END} you can still pay the whole{' '}
          {gbp(overallAllowance)} into cash.
        </li>
        <li>Transfers from one cash ISA to another.</li>
        <li>ISA interest is still tax-free, and you still do not declare it to HMRC.</li>
      </ul>
      <p>
        The new figure is a limit on what you pay in during a tax year. It is not a limit on what
        you hold, so money already in cash ISAs does not count towards it.
      </p>

      <h2>The rules that stop people getting round it</h2>
      <p>
        The regulations add three rules, so that the lower limit cannot be avoided by using another
        type of ISA to hold cash.
      </p>
      <ul>
        <li>
          No transfers into cash. If you are under {fullAge}, you will not be able to transfer money
          from a stocks and shares ISA or an innovative finance ISA into a cash ISA. You can still
          transfer the other way, from cash into investments.
        </li>
        <li>
          A charge on interest. Interest paid on cash held inside a stocks and shares ISA or an
          innovative finance ISA will have a flat {percent(chargeRate)} charge. On {gbp(interest)}{' '}
          of interest that is {gbp(interest * chargeRate)}. Your ISA provider pays it to HMRC, and
          it applies whatever your age.
        </li>
        <li>
          A limit on money market funds. A stocks and shares ISA cannot be made up entirely of money
          market funds. Shares, funds, investment trusts and bonds, including gilts, are not treated
          as cash-like. This rule does not apply to Junior ISAs.
        </li>
      </ul>

      <h2>Worked examples for {firstYear}</h2>
      <h3>
        You are under {fullAge} and want {gbp(overallAllowance)} in cash
      </h3>
      <p>
        You can pay {gbp(cashLimit)} into cash ISAs. The other {gbp(overallAllowance - cashLimit)}{' '}
        of your allowance can only go into a stocks and shares ISA, an innovative finance ISA or, if
        you are eligible, a Lifetime ISA (up to {gbp(lisaLimit)}). Cash saved outside an ISA is not
        affected by any of this, but the interest on it can be taxed.
      </p>
      <h3>You save {gbp(monthlySaver)} a month into a cash ISA</h3>
      <p>
        That is {gbp(monthlySaver * 12)} a year, which is under {gbp(cashLimit)}. Nothing changes
        for you.
      </p>
      <h3>You turn {fullAge} in January 2028</h3>
      <p>
        Your birthday falls in the {firstYear} tax year, so you have the full{' '}
        {gbp(overallAllowance)} for cash from {cashLimitChangeDate}, the first day of that tax year.
      </p>
      <h3>
        You pay {gbp(earlySaver)} into a cash ISA in {TAX_YEAR}
      </h3>
      <p>
        That is allowed. The {gbp(cashLimit)} limit does not apply until {cashLimitChangeDate}.
      </p>

      <h2>Where things stand</h2>
      <ul>
        <li>November 2025: the change is announced at the Autumn Budget.</li>
        <li>23 June 2026: the government publishes the rules to stop the limit being avoided.</li>
        <li>25 June to 2 August 2026: the draft regulations are put out for consultation.</li>
        <li>
          14 September 2026: the Individual Savings Account (Amendment) (No. 2) Regulations 2026 are
          laid before Parliament. They come into force on {cashLimitChangeDate}.
        </li>
        <li>17 September 2026: HMRC publishes its note on who is affected.</li>
      </ul>
      <p>
        HMRC says it will publish updated guidance for ISA providers before {cashLimitChangeDate}.
        When this guide was last updated, gov.uk's main ISA pages still described the {TAX_YEAR}{' '}
        rules and did not mention the change.
      </p>

      <h2>Common questions</h2>
      <h3>Do I have to move money out of my cash ISAs?</h3>
      <p>No. The limit is on new money you pay in each tax year.</p>
      <h3>I am 64. When do I get the higher limit?</h3>
      <p>From the start of the tax year in which you turn {fullAge}, not from your birthday.</p>
      <h3>Is the Lifetime ISA limit changing?</h3>
      <p>No. It stays at {gbp(lisaLimit)} a year.</p>
      <h3>Will I have to pay the {percent(chargeRate)} charge myself?</h3>
      <p>No. Your ISA provider pays it to HMRC. You do not need to declare ISA interest.</p>

      <h2>Check your allowance</h2>
      <p>
        The <Link to="/isa-calculator">ISA allowance calculator</Link> shows how much of your{' '}
        {gbp(overallAllowance)} is left across cash, stocks and shares and Lifetime ISAs. It uses
        the {TAX_YEAR} rules.
      </p>

      <h2>Where this comes from</h2>
      <p>
        All from gov.uk: HMRC's{' '}
        <Source href="https://www.gov.uk/government/publications/reduction-in-the-cash-individual-savings-account-isa-limit">
          note on the reduction in the cash ISA limit
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/government/publications/fiscal-events-2026-factsheets/isa-reform-2027-anti-circumvention-rules-factsheet">
          factsheet on the rules for 2027
        </Source>
        ,{' '}
        <Source href="https://www.gov.uk/government/publications/tax-free-savings-newsletter-23/tax-free-savings-newsletter-23-september-2026">
          Tax-free savings newsletter 23
        </Source>
        , the{' '}
        <Source href="https://www.gov.uk/government/consultations/the-individual-savings-account-amendment-regulations-2026">
          consultation on the draft regulations
        </Source>{' '}
        and the pages on{' '}
        <Source href="https://www.gov.uk/individual-savings-accounts">
          Individual Savings Accounts
        </Source>
        .
      </p>
    </GuidePage>
  )
}
