import { Link } from 'react-router-dom'
import TextPage from '../components/TextPage'
import { CONTACT_EMAIL, OWNER_NAME, SITE_NAME } from '../routes'

// The wording on this page is the owner's own (30 October 2026). Do not
// rewrite it. Fix typos only. The two short sentences that link to "How we
// check our figures" and "Contact" were added to place those links.
export default function About() {
  return (
    <TextPage>
      <h1>About {SITE_NAME}</h1>
      <p>
        I'm {OWNER_NAME}, a computer science with cyber security student based near Greater
        Manchester, and I built this site.
      </p>
      <p>
        I've always been interested in how money works in the UK, and I like working out how to make
        every penny go further. A lot of the calculators I found were out of date, vague about how
        they got their answer, or buried under sign-up forms. I wanted something I'd trust myself,
        so I built it, and I'm sharing it in case it helps you too.
      </p>
      <p>
        I'm not a financial adviser or an accountant. The calculators show you the figures and
        exactly how they're worked out, but they can't tell you what's right for your situation. For
        that, MoneyHelper is free and impartial, or you can speak to a regulated adviser.
      </p>

      <h2>How the figures are checked</h2>
      <ul>
        <li>
          Every rate, threshold and allowance comes from gov.uk or HMRC, and each page lists its
          sources.
        </li>
        <li>
          Where gov.uk or HMRC publish worked examples, or have a calculator of their own, I check
          mine gives the same answer.
        </li>
        <li>
          Every calculator shows its working under &quot;
          <Link to="/how-we-check#how-we-worked-this-out">How we worked this out</Link>&quot;, so
          you can follow each step yourself.
        </li>
        <li>Figures are rechecked after every Budget and at the start of each tax year.</li>
      </ul>
      <p>
        <Link to="/how-we-check">How we check our figures</Link> has the full detail.
      </p>

      <h2>Spotted a mistake?</h2>
      <p>
        Email me at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. I'll look into it and
        fix it as soon as reasonably possible, and update the date on the page.
      </p>
      <p>
        The <Link to="/contact">Contact</Link> page has more on what to get in touch about.
      </p>

      <h2>How the site is paid for</h2>
      <p>
        The site is free and paid for by adverts. There are no affiliate links, and nobody pays to
        be featured. Everything you type stays in your browser: nothing is sent to me or anyone
        else.
      </p>
    </TextPage>
  )
}
