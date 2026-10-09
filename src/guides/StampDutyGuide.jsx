import { calculateStampDuty, STAMP_DUTY } from '../lib/calculations'
import { formatGBP as gbp, percent } from '../lib/format'

// Change these by hand whenever the wording or the figures in this guide change.
const LAST_UPDATED = '9 October 2026'
const LAST_UPDATED_ISO = '2026-10-09'

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

  return (
    <article className="guide">
      <h2>How stamp duty works in England and Northern Ireland</h2>
      <p className="guide__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
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
        . HMRC also has an{' '}
        <a
          href="https://www.tax.service.gov.uk/calculate-stamp-duty-land-tax"
          target="_blank"
          rel="noreferrer"
        >
          official stamp duty calculator
        </a>
        .
      </p>
    </article>
  )
}
