import { Link } from 'react-router-dom'
import Source from '../components/Source'
import TextPage from '../components/TextPage'
import { CONTACT_EMAIL } from '../routes'

// Email only. There is no form, so nothing on this page sends anything.
export default function Contact() {
  return (
    <TextPage>
      <h1>Contact</h1>
      <p className="lede">
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. I&apos;ll reply as soon as
        reasonably possible.
      </p>

      <h2>What to get in touch about</h2>
      <ul>
        <li>A mistake in a calculator or a guide</li>
        <li>A figure that looks out of date, such as a rate that has changed</li>
        <li>
          A suggestion, such as a calculator you would like to see or something that could be
          clearer
        </li>
      </ul>
      <p>
        If a calculator gives an answer that looks wrong, the figures you entered help me find the
        problem. &quot;Copy link to these figures&quot;, under each result, makes a link with them
        in it that you can paste into your email.
      </p>

      <h2>Financial advice</h2>
      <p>
        I can&apos;t give personal financial advice or say what&apos;s right for your situation. For
        free, impartial help, try{' '}
        <Source href="https://www.moneyhelper.org.uk/en">MoneyHelper</Source>, or speak to a
        regulated financial adviser.
      </p>

      <p>
        The <Link to="/privacy">privacy policy</Link> explains what happens to your email, and{' '}
        <Link to="/how-we-check">how we check our figures</Link> explains how mistakes are put
        right.
      </p>
    </TextPage>
  )
}
