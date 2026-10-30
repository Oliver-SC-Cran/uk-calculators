import { Link } from 'react-router-dom'
import { LIFETIME_ISA_REFORM } from '../lib/rates/isa'
import { STAMP_DUTY } from '../lib/rates/stampDuty'
import {
  calculateSharedOwnershipStampDuty,
  calculateStampDuty,
  largestUntaxedRent,
  staircasingStampDuty,
} from '../lib/stampDuty'
import { formatGBP as gbp, formatGBPPence, percent } from '../lib/format'
import CalculatorGuide from '../components/CalculatorGuide'
import Source from '../components/Source'

// Change this by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '2026-10-30'

const MANUAL = 'https://www.gov.uk/hmrc-internal-manuals/stamp-duty-land-tax-manual/'

// The shared ownership example: gov.uk's £400,000 home, with a 40% share and
// £550 a month rent, on a new lease.
const EXAMPLE_VALUE = 400000
const EXAMPLE_SHARE = 0.4
const EXAMPLE_RENT = 550

export default function StampDutyGuide() {
  const { bands, firstTimeBuyer, ratesFrom } = STAMP_DUTY
  const { additionalPropertySurcharge, nonResidentSurcharge, surchargeMinimumPrice } = STAMP_DUTY
  const { returnDeadlineDays, replaceMainHomeMonths, refundClaimMonths, nonResidentDays } =
    STAMP_DUTY

  const [nilBand, secondBand, thirdBand, fourthBand, topBand] = bands
  const [reliefNilBand, reliefSecondBand] = firstTimeBuyer.bands
  const replaceYears = replaceMainHomeMonths / 12

  const firstTime = calculateStampDuty({ price: 350000, buyerType: 'firstTimeBuyer' })
  const firstTimeWithoutRelief = calculateStampDuty({ price: 350000 })
  const mover = calculateStampDuty({ price: 295000 })
  const buyToLet = calculateStampDuty({ price: 300000, buyerType: 'additional' })
  const buyToLetAsMover = calculateStampDuty({ price: 300000 })

  const justOver = calculateStampDuty({
    price: firstTimeBuyer.maxPrice + 1,
    buyerType: 'firstTimeBuyer',
  })
  const atLimit = calculateStampDuty({
    price: firstTimeBuyer.maxPrice,
    buyerType: 'firstTimeBuyer',
  })

  const { sharedOwnership: so } = STAMP_DUTY
  const example = {
    marketValue: EXAMPLE_VALUE,
    sharePercent: EXAMPLE_SHARE * 100,
    monthlyRent: EXAMPLE_RENT,
    leaseYears: so.newModelLeaseYears,
  }
  const flatRent = calculateSharedOwnershipStampDuty({ ...example, rentRisePercent: 0 })
  const risingRent = calculateSharedOwnershipStampDuty({
    ...example,
    rentRisePercent: so.typicalRentRise * 100,
  })
  const firstTimeShared = calculateSharedOwnershipStampDuty({
    ...example,
    buyerType: 'firstTimeBuyer',
  })
  const untaxedRent = largestUntaxedRent({ years: so.newModelLeaseYears })

  // Buying the rest later, at the same value and rates: in one go, or to 80% and then the rest.
  const firstPaid = flatRent.sharePrice
  const restInOneGo = staircasingStampDuty({
    paidBefore: firstPaid,
    sharePrice: EXAMPLE_VALUE - firstPaid,
    shareAfterPercent: 100,
  })
  const toLimitPrice = Math.round(EXAMPLE_VALUE * so.staircasingTaxedOver) - firstPaid
  const toLimit = staircasingStampDuty({
    paidBefore: firstPaid,
    sharePrice: toLimitPrice,
    shareAfterPercent: so.staircasingTaxedOver * 100,
  })
  const lastShare = staircasingStampDuty({
    paidBefore: firstPaid + toLimitPrice,
    sharePrice: EXAMPLE_VALUE - firstPaid - toLimitPrice,
    shareAfterPercent: 100,
  })
  const over = percent(so.staircasingTaxedOver)
  const years = so.rentYearsKnown

  return (
    <CalculatorGuide
      heading={<>How stamp duty works in England and Northern Ireland</>}
      updated={LAST_UPDATED}
    >
      <p>
        Stamp Duty Land Tax (SDLT) is a tax on buying property or land. It is charged in slices, so
        each rate only applies to the part of the price inside that band. These rates have applied
        since {ratesFrom}.
      </p>

      <h3>Standard rates</h3>
      <p>You pay these if the home will be the only residential property you own.</p>
      <ul>
        <li>
          Up to {gbp(nilBand.upTo)}: {percent(nilBand.rate)}
        </li>
        <li>
          {gbp(nilBand.upTo)} to {gbp(secondBand.upTo)}: {percent(secondBand.rate)}
        </li>
        <li>
          {gbp(secondBand.upTo)} to {gbp(thirdBand.upTo)}: {percent(thirdBand.rate)}
        </li>
        <li>
          {gbp(thirdBand.upTo)} to {gbp(fourthBand.upTo)}: {percent(fourthBand.rate)}
        </li>
        <li>
          Above {gbp(fourthBand.upTo)}: {percent(topBand.rate)}
        </li>
      </ul>

      <h3>First-time buyers</h3>
      <p>
        You are a first-time buyer if you have never owned a home anywhere in the world, including
        one you inherited. Everyone buying with you must be a first-time buyer too, and you must
        intend to live in the property as your main home. If so, you can claim a relief. You pay
        nothing up to {gbp(reliefNilBand.upTo)} and {percent(reliefSecondBand.rate)} on the part
        from {gbp(reliefNilBand.upTo)} to {gbp(reliefSecondBand.upTo)}.
      </p>
      <p>
        The relief stops completely if the price is over {gbp(firstTimeBuyer.maxPrice)}. A home at{' '}
        {gbp(firstTimeBuyer.maxPrice)} costs {gbp(atLimit.tax)} in stamp duty. At £1 more it costs{' '}
        {gbp(justOver.tax)}, because the standard rates then apply to the whole price.
      </p>
      <p>
        If you are saving for a deposit, our guide{' '}
        <Link to="/guides/first-time-buyer-isa-vs-lifetime-isa">
          First Time Buyer ISA vs Lifetime ISA
        </Link>{' '}
        explains the two accounts that add a government bonus, and what changes from{' '}
        {LIFETIME_ISA_REFORM.firstTimeBuyerIsa.from}.
      </p>

      <h3>Additional properties</h3>
      <p>
        If buying means you will own more than one residential property, such as a second home or a
        buy-to-let, you usually pay {percent(additionalPropertySurcharge)} on top of the standard
        rate in every band, including the first. This applies to purchases of{' '}
        {gbp(surchargeMinimumPrice)} or more.
      </p>
      <p>
        You do not pay the extra if the new property replaces your main home and you have already
        sold the old one. If you have not sold it by the day you complete, you pay the higher rates
        and may be able to claim a refund later.
      </p>

      <h3>Buyers who are not UK resident</h3>
      <p>
        If you were in the UK for fewer than {nonResidentDays} days in the 12 months before the
        purchase, you usually pay a further {percent(nonResidentSurcharge)} in every band. It is
        added on top of any other rates that apply to you, including first-time buyer relief and the
        higher rates for additional properties.
      </p>

      <h2>Shared ownership</h2>
      <p>
        With shared ownership you buy a share of a home and pay rent on the rest to the landlord,
        such as a housing association or council. On a new lease your first share is from{' '}
        {percent(so.minimumShare)} to {percent(so.maximumShare)}. You can pay stamp duty on a new
        lease in one of two ways, and the calculator shows both.
      </p>

      <h3>Paying in stages</h3>
      <p>
        You pay stamp duty on the price of your share at the usual rates. You also pay{' '}
        {percent(so.rentRate)} of the amount by which the net present value of the rent goes over{' '}
        {gbp(so.rentNilBand)}. You must send a stamp duty return even when there is nothing to pay.
      </p>

      <h3>A market value election</h3>
      <p>
        You pay stamp duty on the full market value stated in the lease, all at once. The rent is
        not taxed, and nothing more is due when you buy more shares. You make the election in your
        stamp duty return, or by amending the return within {so.electionAmendMonths} months of the
        filing date. It cannot be undone.
      </p>
      <p>
        If the freehold is not available to you under the lease, the lease states an open market
        premium and a minimum rent instead of a market value, and the election is charged on those.
      </p>

      <h3>First-time buyers and shared ownership</h3>
      <p>
        First-time buyer relief works with both if the full market value is{' '}
        {gbp(firstTimeBuyer.maxPrice)} or less. Paying in stages, the first-time buyer rates apply
        to the price of your share and the rent is not taxed. With the election, they apply to the
        full market value. The relief does not apply to shares you buy later, and it is not taken
        back if what you pay in total goes over {gbp(firstTimeBuyer.maxPrice)}. If the lease means
        you can never own all of the home, HMRC's calculator compares the{' '}
        {gbp(firstTimeBuyer.maxPrice)} limit with the value of the largest share you can own.
      </p>

      <h3>The tax on the rent</h3>
      <p>
        The net present value of the rent is the rent for every year of the lease, with each year's
        rent discounted by {percent(so.rentDiscountRate)} a year, compounded, to give its value
        today. After year {years}, every year counts at the highest rent in the first {years} years.
        If the rent never went up, a {so.newModelLeaseYears}-year lease would have no tax on its
        rent up to about {gbp(untaxedRent)} a year ({formatGBPPence(untaxedRent / 12)} a month).
      </p>
      <p>
        Shared ownership rent usually goes up each year by RPI plus 0.5% or CPI plus 1%. HMRC only
        leaves out rises that follow RPI exactly, so the rent for the first {years} years has to be
        estimated. The calculator starts with {percent(so.typicalRentRise)} a year, a typical rise
        (CPI + 1%), which is an estimate, and you can change it. Where the rent is not known yet,
        the tax on it is worked out again at the end of year {years}, using the rent actually
        charged.
      </p>

      <h3>Buying more shares</h3>
      <p>
        Buying more shares is called staircasing. If you paid in stages, there is no stamp duty and
        no return while your share stays at {over} or less. For a share that takes you over {over},
        and any after it, work out the stamp duty on everything you have paid so far, at the rates
        on the day. Then multiply it by the price of this share divided by the total you have paid.
        If you made a market value election, nothing more is due.
      </p>
      <p>
        If you paid in stages, you may also have to pay more on earlier shares if they become linked
        to later ones. Shares only become linked once you own over {over} of the home.
      </p>

      <h3>Buying a resale</h3>
      <p>
        If you buy a share from someone who already owns it, you take over their lease. Stamp duty
        is then worked out as for any other purchase, on the price you pay.
      </p>

      <h2>Worked examples</h2>

      <h3>A first-time buyer paying {gbp(firstTime.price)}</h3>
      <p>
        Nothing is due on the first {gbp(reliefNilBand.upTo)}. The other{' '}
        {gbp(firstTime.breakdown[1].amountInBand)} is charged at{' '}
        {percent(firstTime.breakdown[1].rate)}, so the bill is {gbp(firstTime.tax)}. Without the
        relief it would be {gbp(firstTimeWithoutRelief.tax)}.
      </p>

      <h3>A home mover paying {gbp(mover.price)}</h3>
      <p>
        Nothing is due on the first {gbp(nilBand.upTo)}. The next{' '}
        {gbp(mover.breakdown[1].amountInBand)} at {percent(mover.breakdown[1].rate)} is{' '}
        {gbp(mover.breakdown[1].tax)}. The last {gbp(mover.breakdown[2].amountInBand)} at{' '}
        {percent(mover.breakdown[2].rate)} is {gbp(mover.breakdown[2].tax)}. The bill is{' '}
        {gbp(mover.tax)}.
      </p>

      <h3>A buy-to-let costing {gbp(buyToLet.price)}</h3>
      <p>
        The first {gbp(nilBand.upTo)} is charged at {percent(buyToLet.breakdown[0].rate)}, which is{' '}
        {gbp(buyToLet.breakdown[0].tax)}. The next {gbp(buyToLet.breakdown[1].amountInBand)} at{' '}
        {percent(buyToLet.breakdown[1].rate)} is {gbp(buyToLet.breakdown[1].tax)}. The last{' '}
        {gbp(buyToLet.breakdown[2].amountInBand)} at {percent(buyToLet.breakdown[2].rate)} is{' '}
        {gbp(buyToLet.breakdown[2].tax)}. The bill is {gbp(buyToLet.tax)}, compared with{' '}
        {gbp(buyToLetAsMover.tax)} for someone buying it as their only home.
      </p>

      <h3>
        A {percent(EXAMPLE_SHARE)} shared ownership share of a {gbp(EXAMPLE_VALUE)} home
      </h3>
      <p>
        The share costs {gbp(flatRent.sharePrice)} and the rent is {gbp(flatRent.monthlyRent)} a
        month, or {gbp(flatRent.yearlyRent)} a year, on a {flatRent.leaseYears}-year lease. Paying
        in stages, a home mover pays {gbp(flatRent.inStages.priceTax)} on the share. If the rent
        never went up, its net present value would be{' '}
        {gbp(Math.floor(flatRent.rent.netPresentValue))}. {percent(so.rentRate)} of the{' '}
        {gbp(flatRent.rent.taxable)} over {gbp(so.rentNilBand)} is{' '}
        {formatGBPPence(flatRent.rent.taxable * so.rentRate)}, which rounds down to{' '}
        {gbp(flatRent.inStages.rentTax)}, so the bill is {gbp(flatRent.inStages.tax)}. With a{' '}
        {percent(so.typicalRentRise)} rise for the first {years} years, the rent is worth{' '}
        {gbp(Math.floor(risingRent.rent.netPresentValue))}, the tax on it is{' '}
        {gbp(risingRent.inStages.rentTax)} and the bill is {gbp(risingRent.inStages.tax)}.
      </p>
      <p>
        With a market value election the bill is {gbp(flatRent.election.tax)}, on the full{' '}
        {gbp(EXAMPLE_VALUE)}. A first-time buyer pays {gbp(firstTimeShared.inStages.tax)} in stages
        and {gbp(firstTimeShared.election.tax)} with the election.
      </p>

      <h3>Buying the rest of that home</h3>
      <p>
        Say you paid in stages and later buy the other {percent(1 - EXAMPLE_SHARE)} in one go, for{' '}
        {gbp(EXAMPLE_VALUE - firstPaid)}, at the same value and rates. You have then paid{' '}
        {gbp(restInOneGo.totalPaid)} in all, and the stamp duty on that is{' '}
        {gbp(restInOneGo.taxOnTotal)}. This share is {percent(restInOneGo.fraction)} of what you
        have paid, so you pay {gbp(restInOneGo.tax)}.
      </p>
      <p>
        If you first buy {gbp(toLimitPrice)} more, taking you to {over}, that costs{' '}
        {gbp(toLimit.tax)}. The last {percent(1 - so.staircasingTaxedOver)}, for{' '}
        {gbp(EXAMPLE_VALUE - firstPaid - toLimitPrice)}, then costs {percent(lastShare.fraction)} of{' '}
        {gbp(lastShare.taxOnTotal)}, which is {gbp(lastShare.tax)}.
      </p>

      <h2>Common questions</h2>

      <h3>When do I have to pay stamp duty?</h3>
      <p>
        You must send a return to HMRC and pay within {returnDeadlineDays} days of completion. Your
        solicitor or conveyancer usually does both for you on completion day and adds the tax to
        their bill. You can be charged penalties and interest if it is late.
      </p>

      <h3>
        What if I buy my new home before selling my old one, then sell within {replaceYears} years?
      </h3>
      <p>
        You pay the higher rates when you buy, because you own two properties that day. If you sell
        your previous main home within {replaceYears} years of buying the new one, you can apply for
        a refund of the extra {percent(additionalPropertySurcharge)}. You must claim within{' '}
        {refundClaimMonths} months of the sale, or of the filing date of the return for the new home
        if that is later.
      </p>

      <h3>Do first-time buyers pay stamp duty over {gbp(firstTimeBuyer.maxPrice)}?</h3>
      <p>
        Yes. Above {gbp(firstTimeBuyer.maxPrice)} there is no relief, and a first-time buyer pays
        the same as anyone else buying their only home.
      </p>

      <h3>Which costs less for shared ownership, paying in stages or a market value election?</h3>
      <p>
        It depends on your share, your rent and whether you buy more shares later. Paying in stages
        means tax on your share and the rent now, then on any share that takes you over {over}. The
        election means tax on the full value now and nothing later. The calculator shows both for
        the figures you enter.
      </p>

      <h3>Do I pay stamp duty when I buy more shares?</h3>
      <p>
        Not if you made a market value election. If you paid in stages, nothing is due until your
        share goes over {over}. A share that takes you over {over}, and any after it, is taxed as
        set out above.
      </p>

      <h3>Is stamp duty the same in Scotland and Wales?</h3>
      <p>
        No. Scotland charges Land and Buildings Transaction Tax and Wales charges Land Transaction
        Tax. Both have their own bands and rates, and this calculator does not cover them.
      </p>

      <h2>Where these figures come from</h2>
      <p>
        See gov.uk for{' '}
        <a
          href="https://www.gov.uk/stamp-duty-land-tax/residential-property-rates"
          target="_blank"
          rel="noreferrer"
        >
          residential property rates
        </a>
        , the{' '}
        <a
          href="https://www.gov.uk/guidance/stamp-duty-land-tax-buying-an-additional-residential-property"
          target="_blank"
          rel="noreferrer"
        >
          higher rates for additional properties
        </a>{' '}
        and the{' '}
        <a
          href="https://www.gov.uk/guidance/rates-of-stamp-duty-land-tax-for-non-uk-residents"
          target="_blank"
          rel="noreferrer"
        >
          rates for non-UK residents
        </a>
        . For shared ownership, see gov.uk on{' '}
        <Source href="https://www.gov.uk/stamp-duty-land-tax/shared-ownership-property">
          stamp duty on shared ownership
        </Source>{' '}
        and{' '}
        <Source href="https://www.gov.uk/shared-ownership-scheme/paying-rent">
          shared ownership rent
        </Source>
        , and HMRC's Stamp Duty Land Tax Manual on{' '}
        <Source href={`${MANUAL}sdltm27060`}>paying in stages</Source>,{' '}
        <Source href={`${MANUAL}sdltm27030`}>the market value election</Source>,{' '}
        <Source href={`${MANUAL}sdltm27050`}>leases where the freehold is not available</Source>,
        first-time buyers making the <Source href={`${MANUAL}sdltm29880`}>election</Source>, paying{' '}
        <Source href={`${MANUAL}sdltm29885`}>in stages</Source> and{' '}
        <Source href={`${MANUAL}sdltm29890`}>buying more shares</Source>,{' '}
        <Source href={`${MANUAL}sdltm27065`}>linked shares</Source>,{' '}
        <Source href={`${MANUAL}sdltm13075`}>the net present value of rent</Source>,{' '}
        <Source href={`${MANUAL}sdltm13155`}>looking again at an estimated rent</Source> and{' '}
        <Source href={`${MANUAL}sdltm13190`}>rent that rises with RPI</Source>. HMRC also has an{' '}
        <a
          href="https://www.tax.service.gov.uk/calculate-stamp-duty-land-tax"
          target="_blank"
          rel="noreferrer"
        >
          official stamp duty calculator
        </a>
        .
      </p>
    </CalculatorGuide>
  )
}
