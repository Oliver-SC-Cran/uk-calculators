import { Link } from 'react-router-dom'
import TextPage from '../components/TextPage'
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from '../routes'

// Change this by hand whenever the terms change.
const LAST_UPDATED = '10 October 2026'
const LAST_UPDATED_ISO = '2026-10-10'

const SITE_DOMAIN = SITE_URL.replace('https://', '')

export default function Terms() {
  return (
    <TextPage>
      <h1>Terms of use</h1>
      <p className="prose__updated">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>

      <h2>About these terms</h2>
      <p>
        These terms apply to {SITE_DOMAIN}, which is run by {SITE_NAME}. By using the site you agree
        to them. If you do not agree, please do not use the site.
      </p>

      <h2>Using the site</h2>
      <p>
        The site is free to use. You can use the calculators and read the guides for your own
        purposes, and you can link to any page. Please do not:
      </p>
      <ul>
        <li>copy the site, or large parts of it, and publish it somewhere else</li>
        <li>
          use automated tools to copy the site, or load it so heavily that it stops working for
          other people
        </li>
        <li>try to break the site or get around its security</li>
      </ul>

      <h2>Estimates, not advice</h2>
      <p>
        The calculators give estimates. They work from the numbers you enter and the published rates
        for the tax year or date shown on each page. Each calculator lists what it assumes, and none
        of them can take account of everything about your situation.
      </p>
      <p>
        Nothing on this site is financial, tax, legal or employment advice, and nothing on it is a
        recommendation to do anything. For a decision that involves real money or your legal rights,
        the official source linked on each calculator, or a qualified adviser, can tell you where
        you stand.
      </p>

      <h2>Accuracy</h2>
      <p>
        We check the figures against gov.uk and the other official sources linked in each guide, and
        update them when rates change. We cannot promise that every figure is correct, complete or
        up to date at the moment you use it. Rates and rules change, sometimes at short notice. If a
        figure here is different from the official source, the official source is the one to rely
        on.
      </p>
      <p>
        If you spot a mistake, please tell us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Links to gov.uk and other sites</h2>
      <p>
        The guides link to gov.uk, nidirect, MoneyHelper and other sites so that you can check where
        a figure comes from. We do not run those sites and are not responsible for what is on them.
      </p>
      <p>
        This site is independent. It is not part of the UK government or HMRC, and it is not
        endorsed by them or by any other organisation it links to.
      </p>

      <h2>Advertising</h2>
      <p>
        The site shows adverts through Google AdSense. We do not pick the individual adverts, and an
        advert appearing here does not mean we recommend what it is selling. The{' '}
        <Link to="/privacy">privacy policy</Link> and <Link to="/cookies">cookie policy</Link>{' '}
        explain how advertising uses your data.
      </p>

      <h2>Our liability</h2>
      <p>
        You use the site at your own risk. We are not liable for any loss that comes from a decision
        you make, or do not make, using the calculators or guides, including where a result turns
        out to be wrong.
      </p>
      <p>
        The site is provided free of charge and as it is. As far as the law allows, we give no
        guarantees about it and are not liable for loss or damage that comes from using it or from
        not being able to use it.
      </p>
      <p>
        Nothing in these terms limits or excludes liability that cannot be limited or excluded by
        law, such as liability for death or personal injury caused by negligence, or for fraud.
        Nothing in these terms takes away rights you have by law as a consumer.
      </p>

      <h2>Copyright</h2>
      <p>
        The wording, design and code of this site belong to {SITE_NAME}. The official rates and
        thresholds come from the sources linked in each guide.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. If we do, the date at the top of this page will change. The terms
        that apply are the ones on this page when you use the site.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and the courts of England and
        Wales deal with any dispute about them. If you live in Scotland or Northern Ireland, you can
        also bring a claim in the courts there.
      </p>

      <h2>Contact</h2>
      <p>
        You can contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </TextPage>
  )
}
