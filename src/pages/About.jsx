import TextPage from '../components/TextPage'
import { CONTACT_EMAIL, OWNER_NAME, SITE_NAME } from '../routes'

// The wording on this page is the owner's own (11 October 2026). Do not
// rewrite it. Fix typos only.
export default function About() {
  return (
    <TextPage>
      <h1>About {SITE_NAME}</h1>
      <p>
        Hi, I'm {OWNER_NAME}. I built this site because I found managing money confusing, and the
        rules keep changing. Tax bands, student loans, pensions, ISA limits: every year something
        moves, and most of what I found was either too vague or full of jargon. I wanted somewhere
        that gives a straight answer and shows how it got there, so I made it, hopefully for anyone
        else who finds it as confusing as I did.
      </p>

      <h2>How the figures are checked</h2>
      <p>
        Every calculator that uses official rates uses the ones published on gov.uk. Every
        calculator that uses official rates is tested against the worked examples gov.uk publishes,
        and against the government's own calculators where they exist. When the rules change, the
        site is updated, and everything is checked again each April for the new tax year.
      </p>

      <h2>What this site isn't</h2>
      <p>
        It's not financial advice. The calculators give estimates for common situations. If yours is
        unusual, or a lot of money depends on it, check with HMRC or a qualified adviser.
      </p>

      <h2>Get in touch</h2>
      <p>
        Spotted a mistake, or want a calculator that isn't here? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </TextPage>
  )
}
