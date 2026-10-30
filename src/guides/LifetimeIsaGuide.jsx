import { Link } from 'react-router-dom'
import { ISA, LIFETIME_ISA_REFORM } from '../lib/rates/isa'
import { TAX_YEAR } from '../lib/rates/taxYear'
import { formatAmount, formatGBP as gbp, percent } from '../lib/format'
import { homeOverCapWithdrawal, projectLifetimeIsa, withdrawalFor } from '../lib/lifetimeIsa'
import CalculatorGuide from '../components/CalculatorGuide'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

export default function LifetimeIsaGuide() {
  const { overallAllowance, lisaLimit, lisaBonusRate, lisaMinOpenAge, lisaMaxOpenAge } = ISA
  const { lisaMaxContributionAge, lisaAccessAge, lisaWithdrawalChargeRate } = ISA
  const { lisaPropertyCap, lisaMonthsBeforePurchase, lisaTerminalIllnessMonths } = ISA
  const { lisaOverCapChargeRate, lisaOverCapChargeFrom } = ISA
  const maxBonus = lisaLimit * lisaBonusRate
  const newAccount = LIFETIME_ISA_REFORM.firstTimeBuyerIsa
  const overCap = (result) =>
    homeOverCapWithdrawal({ value: result.value, putIn: result.withdrawal.putIn })

  // gov.uk's example of the withdrawal charge, with no growth.
  const govExample = projectLifetimeIsa({
    age: 30,
    contribution: 800,
    frequency: 'yearly',
    goal: 'home',
    purchaseAge: 31,
  })
  const govExampleOverCap = overCap(govExample)
  const cashNeeded = 120
  const toWithdraw = withdrawalFor(cashNeeded)

  // £200 a month from 30, buying at 35.
  const home = { age: 30, contribution: 200, goal: 'home', purchaseAge: 35 }
  const homeGrowth = 4
  const homeGrown = projectLifetimeIsa({ ...home, growthPercent: homeGrowth })
  const homeCash = projectLifetimeIsa({ ...home, growthPercent: 0 })
  const homeGrownOverCap = overCap(homeGrown)
  const homeCashOverCap = overCap(homeCash)

  // £4,000 a year from 25, kept until 60.
  const later = { age: 25, contribution: lisaLimit, frequency: 'yearly', goal: 'retirement' }
  const laterGrowth = 4
  const laterGrown = projectLifetimeIsa({ ...later, growthPercent: laterGrowth })
  const laterCash = projectLifetimeIsa({ ...later, growthPercent: 0 })

  return (
    <CalculatorGuide heading={<>How a Lifetime ISA works in {TAX_YEAR}</>} updated={LAST_UPDATED}>
      <p>
        A Lifetime ISA is a savings account for buying your first home or for later life. The
        government adds a {percent(lisaBonusRate)} bonus to what you pay in. In return, there is a
        charge if you take money out for anything else: {percent(lisaWithdrawalChargeRate)} in most
        cases, or {percent(lisaOverCapChargeRate)} towards a first home that costs more than{' '}
        {gbp(lisaPropertyCap)}.
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
      <p>
        From {lisaOverCapChargeFrom}, you can also take the money out for a first home that costs
        more than {gbp(lisaPropertyCap)}, as long as you meet the other rules. You do not keep the
        bonus: a {percent(lisaOverCapChargeRate)} charge applies, which the next section explains.
      </p>

      <h3>Using it for later life</h3>
      <p>
        From {lisaAccessAge} you can take your savings out without a charge, for any reason. If you
        die, the account ends on that date and there is no charge on what is in it.
      </p>

      <h3>The withdrawal charges</h3>
      <p>
        If you take money out for any other reason, you pay a {percent(lisaWithdrawalChargeRate)}{' '}
        charge on whatever you take out. It is {percent(lisaWithdrawalChargeRate)} of the whole
        amount, bonus included, so it takes back more than the bonus added. In gov.uk's example,
        with no growth, {gbp(govExample.paidIn)} earns a bonus of {gbp(govExample.bonus)}, making{' '}
        {gbp(govExample.value)}. Taking it all out costs {gbp(govExample.withdrawal.charge)} and
        leaves {gbp(govExample.withdrawal.afterCharge)}, which is{' '}
        {gbp(govExample.withdrawal.shortfall)} less than was paid in. That is{' '}
        {formatAmount(govExample.withdrawal.shortfall / govExample.paidIn, 'percent')} of what you
        paid in, whatever the amount.
      </p>
      <p>
        From {lisaOverCapChargeFrom}, the charge is {percent(lisaOverCapChargeRate)} if you take the
        money out for a first home that costs more than {gbp(lisaPropertyCap)}, as long as you meet
        the other rules. On the same {gbp(govExample.value)} that is {gbp(govExampleOverCap.charge)}
        , which is the bonus, so you get back the {gbp(govExampleOverCap.afterCharge)} you paid in.
        With growth, it takes back the bonus and the growth on the bonus, and leaves what you paid
        in and the growth on that. You lose no more than the bonus.
      </p>
      <p>
        To end up with a set amount of cash when the {percent(lisaWithdrawalChargeRate)} charge
        applies, you have to take out more to cover it. To be left with {gbp(cashNeeded)}, you take
        out {gbp(toWithdraw)} and pay {gbp(toWithdraw - cashNeeded)}. There is no charge if you are
        terminally ill with less than {lisaTerminalIllnessMonths} months to live.
      </p>

      <h3>The First Time Buyer ISA from {newAccount.from}</h3>
      <p>
        Checked on {LIFETIME_ISA_REFORM.checkedOn}. HM Treasury consulted on a new First Time Buyer
        ISA from {LIFETIME_ISA_REFORM.consultationOpened} to{' '}
        {LIFETIME_ISA_REFORM.consultationClosed}. Its response, published on{' '}
        {LIFETIME_ISA_REFORM.responsePublished}, confirms the new account from {newAccount.from}. It
        will be offered in place of the Lifetime ISA. A Lifetime ISA opened before then can carry on
        under its current rules, so you can still open one until then.
      </p>
      <p>The response sets out these features of the new account:</p>
      <ul>
        <li>
          you can pay in up to {gbp(newAccount.yearlyLimit)} a tax year, which counts towards your
          ISA allowance
        </li>
        <li>
          the government adds {percent(newAccount.bonusRate)} of the final balance when you use it
          to buy your first home, up to {gbp(newAccount.bonusCap)} in all
        </li>
        <li>
          the home must cost {gbp(newAccount.propertyCap)} or less, you must buy with a mortgage,
          and you must have held the account for {newAccount.monthsHeld} months
        </li>
        <li>you must be {newAccount.minAge} or over to open one, with no upper age limit</li>
        <li>you cannot move a Lifetime ISA into it, but you can use both towards the same home</li>
      </ul>
      <p>
        The figures in this guide and in the calculator use the Lifetime ISA rules. Our guide{' '}
        <Link to="/guides/first-time-buyer-isa-vs-lifetime-isa">
          First Time Buyer ISA vs Lifetime ISA
        </Link>{' '}
        compares the two accounts, with a worked example.
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
      <p>
        If the home cost more than {gbp(lisaPropertyCap)}, the {percent(lisaOverCapChargeRate)}{' '}
        charge on {gbp(homeCash.value)} would be {gbp(homeCashOverCap.charge)} and you would get{' '}
        {gbp(homeCashOverCap.afterCharge)}, exactly what you paid in. With {homeGrowth}% growth, the
        charge on {gbp(homeGrown.value)} would be {gbp(homeGrownOverCap.charge)} and you would get{' '}
        {gbp(homeGrownOverCap.afterCharge)}: what {gbp(home.contribution)} a month would have grown
        to at {homeGrowth}% without the bonus. The {percent(lisaWithdrawalChargeRate)} charge would
        leave {gbp(homeGrown.withdrawal.afterCharge)}, which is{' '}
        {formatAmount(
          1 - homeGrown.withdrawal.afterCharge / homeGrownOverCap.afterCharge,
          'percent',
        )}{' '}
        less than that.
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
        From {lisaOverCapChargeFrom} you can use your Lifetime ISA for it, as long as you meet the
        other rules for a first home, but a {percent(lisaOverCapChargeRate)} charge applies to what
        you take out. That takes back the bonus and leaves what you paid in. If the purchase does
        not meet the other rules, it counts as a withdrawal for another reason and the{' '}
        {percent(lisaWithdrawalChargeRate)} charge applies.
      </p>

      <h3>Can I use it if I am buying with someone else?</h3>
      <p>
        Yes. If they have a Lifetime ISA too, you can both use your savings and bonus, as long as
        you are both first-time buyers and the purchase meets the other rules.
      </p>

      <h3>What happens to my Lifetime ISA when the First Time Buyer ISA starts?</h3>
      <p>
        HM Treasury says a Lifetime ISA opened before {newAccount.from} can carry on under its
        current rules. You cannot transfer it into a First Time Buyer ISA, but you can use both
        towards the same home.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        The rules are from{' '}
        <a href="https://www.gov.uk/lifetime-isa" target="_blank" rel="noreferrer">
          Lifetime ISA
        </a>{' '}
        on gov.uk, including the example of the withdrawal charge and the{' '}
        {percent(lisaOverCapChargeRate)} charge for a home over {gbp(lisaPropertyCap)}. The First
        Time Buyer ISA is from HM Treasury's{' '}
        <a
          href="https://www.gov.uk/government/consultations/first-time-buyer-isa-consultation"
          target="_blank"
          rel="noreferrer"
        >
          response to the First Time Buyer ISA consultation
        </a>
        . The other figures come from the calculator on this page.
      </p>
    </CalculatorGuide>
  )
}
