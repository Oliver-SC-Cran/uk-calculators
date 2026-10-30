import TextPage from '../components/TextPage'
import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, OWNER_NAME, routes } from '../routes'
import LastUpdated from '../components/LastUpdated'

// Change this by hand whenever the policy changes.
const LAST_UPDATED = '2026-10-30'

export default function Privacy() {
  return (
    <TextPage>
      <h1>Privacy policy</h1>
      <LastUpdated date={LAST_UPDATED} className="prose__updated" />

      <h2>Who runs this site</h2>
      <p>
        This site is run by {OWNER_NAME}. We decide how any personal data collected through the site
        is used, which makes us the data controller under UK data protection law. You can contact us
        at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What you type into the calculators</h2>
      <p>
        The calculators run entirely in your browser. The numbers you type in are not sent to us,
        stored by us or seen by us.
      </p>
      <p>These calculators have a "Copy link to these figures" button:</p>
      <ul>
        {routes
          .filter((route) => route.sharedLinks)
          .map((route) => (
            <li key={route.path}>
              <Link to={route.path}>{route.name}</Link>
            </li>
          ))}
      </ul>
      <p>
        The button makes a link with the figures you entered in it, after a # sign. Nothing is put
        in a link unless you press the button. Browsers do not send the part of a link after # to
        any server, so the figures do not reach us or Cloudflare. They are in the link itself,
        though, so anyone you send it to can see them, and so can anywhere you paste or save it.
        When a page is opened from one of these links, the figures are taken out of the address bar
        before any other script on the page starts, including Google's advertising script and
        Cloudflare's visitor statistics, and the calculator then fills them in. So the page address
        those scripts read, and send with their requests, does not have the figures in it.
      </p>

      <h2>Advertising</h2>
      <p>
        This site uses Google AdSense to show ads. Google and its advertising partners use cookies
        and similar identifiers to choose which ads to show, to limit how often you see an ad and to
        measure how ads perform.
      </p>
      <p>
        Ads are only personalised if you agree. When you first visit, Google's consent message asks
        for your choice. If you consent, Google and its partners can use cookies and information
        about your visits to this and other websites to show ads based on your interests. If you do
        not consent, you may still see ads, but they are not based on your interests. Google may
        still use a small number of cookies or local storage to detect fraud and invalid clicks.
      </p>
      <p>
        The <Link to="/cookies">cookie policy</Link> lists the cookies involved. Google explains{' '}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noreferrer"
        >
          how it uses data from sites that use its services
        </a>
        , and you can manage ad personalisation across Google in{' '}
        <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
          My Ad Centre
        </a>
        .
      </p>

      <h2>Visitor statistics</h2>
      <p>
        We use Cloudflare Web Analytics to count visits, so that we can see which calculators are
        used and how people find the site. It does not use cookies and does not store anything on
        your device. Cloudflare says it does not fingerprint visitors, and does not track them from
        one website to another.
      </p>
      <p>
        For each page you open, it records the time, the address of the page (without anything after
        a question mark or #), the page that linked you here, your country, the type of device,
        operating system and browser you are using, and how long the page took to load.
      </p>
      <p>
        What we see is totals, such as how many times a page was opened. We do not see your IP
        address or anything you type into the calculators. Cloudflare explains{' '}
        <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noreferrer">
          how Web Analytics works
        </a>
        .
      </p>

      <h2>Our lawful basis, and how to withdraw consent</h2>
      <p>
        Our lawful basis for advertising cookies and personalised ads is your consent. You can
        withdraw it at any time, as easily as you gave it, with the "Cookie settings" link at the
        bottom of every page. That reopens Google's consent message so you can change your choice.
      </p>
      <p>
        For visitor statistics and for the server logs described below, our lawful basis is our
        legitimate interest in understanding how the site is used and keeping it secure and working.
      </p>

      <h2>Hosting and server logs</h2>
      <p>
        The site is hosted by Cloudflare, Inc. When your browser loads a page, Cloudflare processes
        your IP address and basic details of the request, so that it can deliver the page and
        protect the site from abuse. We do not use this information to identify you.
      </p>

      <h2>Transfers outside the UK</h2>
      <p>
        Google and Cloudflare are based in the United States and may process data there and in other
        countries. Cloudflare states that it complies with the UK Extension to the EU-U.S. Data
        Privacy Framework, and that it relies on standard contractual clauses if that stops
        applying. Google describes the safeguards it relies on in its{' '}
        <a href="https://policies.google.com/privacy/frameworks" target="_blank" rel="noreferrer">
          data transfer frameworks
        </a>{' '}
        page.
      </p>

      <h2>How long data is kept</h2>
      <p>
        We do not keep any personal data from your visit ourselves. If you email us, we keep your
        message for as long as it takes to deal with your question. Advertising cookies last for the
        periods shown in the <Link to="/cookies">cookie policy</Link>, up to 13 months. Cloudflare
        keeps its records of requests for a limited time under its own{' '}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">
          privacy policy
        </a>
        . Visitor statistics can be viewed for six months. They contain nothing that identifies you.
      </p>

      <h2>Your rights</h2>
      <p>Under UK data protection law you have the right to:</p>
      <ul>
        <li>ask for a copy of the personal data held about you</li>
        <li>ask for it to be corrected or deleted</li>
        <li>ask for its use to be restricted, or object to its use</li>
        <li>ask for it to be passed to you or another organisation in a portable form</li>
        <li>withdraw consent at any time</li>
      </ul>
      <p>
        To use any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        We will reply within one month. Because we do not hold data that identifies you, we may need
        to point you to Google for data held in its advertising systems.
      </p>

      <h2>Complaints</h2>
      <p>
        If you are unhappy with how your data has been handled, please contact us first. You also
        have the right to{' '}
        <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noreferrer">
          complain to the Information Commissioner's Office
        </a>
        , the UK's data protection regulator.
      </p>

      <h2>Changes to this policy</h2>
      <p>If this policy changes, the date at the top of this page will change too.</p>
    </TextPage>
  )
}
