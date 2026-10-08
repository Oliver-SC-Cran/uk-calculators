import { Link } from 'react-router-dom'

// Change this by hand whenever the policy or the cookie list changes.
const LAST_UPDATED = '8 October 2026'
const LAST_UPDATED_ISO = '2026-10-08'

// Names, purposes and durations as Google publishes them at
// https://business.safety.google/adscookies/ and
// https://policies.google.com/technologies/cookies (checked 8 October 2026).
// Re-check both pages whenever this list is edited.
const advertisingCookies = [
  {
    name: '__gads',
    setOn: 'This site',
    purpose: 'Advertising and security. Lets sites show Google ads.',
    duration: '13 months',
  },
  {
    name: '__gpi',
    setOn: 'This site',
    purpose: 'Advertising and security.',
    duration: '13 months',
  },
  {
    name: '__gpi_optout',
    setOn: 'This site',
    purpose: 'Advertising. Used when ad personalisation is turned off.',
    duration: '13 months',
  },
  {
    name: '__eoi',
    setOn: 'This site',
    purpose: 'Security.',
    duration: '6 months',
  },
  {
    name: 'IDE',
    setOn: 'doubleclick.net',
    purpose:
      'Shows Google ads on non-Google sites, and personalises them if you have agreed to that.',
    duration: '13 months in the UK',
  },
  {
    name: 'id',
    setOn: 'doubleclick.net',
    purpose: 'Advertising and security. Also remembers if you have turned off personalised ads.',
    duration: '13 months in the UK. An opt-out lasts until 2030',
  },
  {
    name: 'DSID',
    setOn: 'doubleclick.net',
    purpose:
      'Identifies a signed-in Google user on other sites, so their ad personalisation setting is respected.',
    duration: '2 weeks',
  },
  {
    name: 'test_cookie',
    setOn: 'doubleclick.net',
    purpose: 'Functionality. Checks whether your browser accepts cookies.',
    duration: '15 minutes',
  },
  {
    name: 'TESTCOOKIESENABLED',
    setOn: 'doubleclick.net',
    purpose: 'Functionality. Checks whether your browser accepts cookies.',
    duration: '60 seconds',
  },
  {
    name: 'GED_PLAYLIST_ACTIVITY',
    setOn: 'This site',
    purpose: 'Advertising.',
    duration: 'Until you close your browser',
  },
  {
    name: 'ACLK_DATA',
    setOn: 'This site',
    purpose: 'Advertising.',
    duration: '5 minutes',
  },
]

const consentCookies = [
  {
    name: 'FCCDCF',
    setOn: 'This site',
    purpose: 'Functionality. Stores the choice you made in the consent message.',
    duration: '13 months',
  },
  {
    name: 'FCNEC',
    setOn: 'This site',
    purpose: 'Analytics for the consent message.',
    duration: '365 days',
  },
]

function CookieTable({ caption, cookies }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Cookie</th>
            <th scope="col">Set on</th>
            <th scope="col">What it is for</th>
            <th scope="col">How long it lasts</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map(({ name, setOn, purpose, duration }) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              <td>{setOn}</td>
              <td>{purpose}</td>
              <td>{duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Cookies() {
  return (
    <>
      <h1>Cookie policy</h1>
      <p>
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
      </p>
      <p>
        Cookies are small files a website saves in your browser. This page lists the ones that may
        be set when you use this site. The <Link to="/privacy">privacy policy</Link> explains how
        your data is handled more widely.
      </p>

      <h2>Cookies this site sets itself</h2>
      <p>
        None. The calculators do not save anything in your browser, and the site does not use
        analytics cookies. Every cookie below comes from Google AdSense, which shows the ads.
      </p>

      <h2>Advertising cookies from Google AdSense</h2>
      <p>
        Google and its advertising partners use these to show ads, limit how often you see the same
        ad, measure how ads perform and detect fraud. They are used to personalise ads only if you
        consent in Google's consent message. Not every cookie is set on every visit.
      </p>
      <CookieTable caption="Cookies Google AdSense may set" cookies={advertisingCookies} />

      <h2>Cookies from the consent message</h2>
      <p>
        Google's consent message needs to remember your answer, so that it does not ask again on
        every page.
      </p>
      <CookieTable caption="Cookies the consent message may set" cookies={consentCookies} />

      <h2 id="settings">Change your cookie settings</h2>
      <p>
        Use the "Privacy and cookie settings" link at the bottom of any page to reopen Google's
        consent message and change your choice. You can do this as often as you like.
      </p>
      <p>
        If nothing opens, your browser or an ad blocker is probably blocking Google's script. You
        can also:
      </p>
      <ul>
        <li>delete or block cookies in your browser's settings</li>
        <li>
          manage ad personalisation across Google in{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">
            My Ad Centre
          </a>
        </li>
      </ul>

      <h2>Where this list comes from</h2>
      <p>
        The names, purposes and durations are the ones Google publishes in its{' '}
        <a href="https://business.safety.google/adscookies/" target="_blank" rel="noreferrer">
          list of advertising cookies
        </a>{' '}
        and its page on{' '}
        <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noreferrer">
          how Google uses cookies
        </a>
        . Google can change them, so those pages are the most up to date.
      </p>
    </>
  )
}
