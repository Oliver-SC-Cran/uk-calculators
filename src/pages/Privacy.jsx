import { Link } from 'react-router-dom'
import { CONTACT_EMAIL, SITE_NAME } from '../routes'

// Change this by hand whenever the policy changes.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

export default function Privacy() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p>
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>

      <h2>Who runs this site</h2>
      <p>
        This site is run by {SITE_NAME}. We decide how any personal data collected through the site
        is used, which makes us the data controller under UK data protection law. You can contact us
        at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What you type into the calculators</h2>
      <p>
        The calculators run entirely in your browser. The numbers you type in are not sent to us,
        stored by us or seen by us. They are gone when you close or reload the page.
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

      <h2>Our lawful basis, and how to withdraw consent</h2>
      <p>
        Our lawful basis for advertising cookies and personalised ads is your consent. You can
        withdraw it at any time, as easily as you gave it, with the "Privacy and cookie settings"
        link at the bottom of every page. That reopens Google's consent message so you can change
        your choice.
      </p>
      <p>
        For the server logs described below, our lawful basis is our legitimate interest in keeping
        the site secure and working.
      </p>

      <h2>Hosting and server logs</h2>
      <p>
        The site is hosted by Vercel Inc. When your browser loads a page, Vercel processes your IP
        address and basic details of the request in its server logs, so that it can deliver the page
        and protect the site from abuse. We do not use these logs to identify you.
      </p>

      <h2>Transfers outside the UK</h2>
      <p>
        Google and Vercel are based in the United States and may process data there and in other
        countries. Vercel states that it complies with the UK Extension to the EU-U.S. Data Privacy
        Framework and uses standard contractual clauses. Google describes the safeguards it relies
        on in its{' '}
        <a href="https://policies.google.com/privacy/frameworks" target="_blank" rel="noreferrer">
          data transfer frameworks
        </a>{' '}
        page.
      </p>

      <h2>How long data is kept</h2>
      <p>
        We do not keep any personal data from your visit ourselves. If you email us, we keep your
        message for as long as it takes to deal with your question. Advertising cookies last for the
        periods shown in the <Link to="/cookies">cookie policy</Link>, up to 13 months. Vercel keeps
        server logs for a limited time under its own{' '}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          privacy policy
        </a>
        .
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
    </>
  )
}
