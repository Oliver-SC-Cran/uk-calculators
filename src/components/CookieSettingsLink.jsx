const SETTINGS_URL = '/cookies#settings'

// How long to give Google's consent message to appear before falling back.
const MESSAGE_WAIT_MS = 1000

/**
 * True if something that looks like Google's consent message is on screen:
 * either an element with one of its class names, or any element outside the
 * app that is fixed in place and covers most of the window.
 */
function consentMessageIsShowing() {
  if (document.querySelector('.fc-consent-root, .fc-message-root, .fc-dialog-container')) {
    return true
  }
  const outsideApp = [...document.body.children].filter((element) => element.id !== 'root')
  return outsideApp
    .flatMap((element) => [element, ...element.querySelectorAll('*')])
    .some((element) => {
      const box = element.getBoundingClientRect()
      return (
        getComputedStyle(element).position === 'fixed' &&
        box.width >= window.innerWidth / 2 &&
        box.height >= window.innerHeight / 2
      )
    })
}

/**
 * Reopens Google's consent message so a visitor can change their choice.
 *
 * Google's script provides window.googlefc, but asking it to show the message
 * does nothing when the message is not active for the site (for example while
 * AdSense has not approved it yet). So if no message has appeared after about
 * a second, or Google's script is missing or blocked, the link goes to the
 * cookie policy instead, which explains the other ways to change the setting.
 */
export default function CookieSettingsLink() {
  const openConsentMessage = (event) => {
    const consent = window.googlefc
    if (typeof consent?.showRevocationMessage !== 'function') return

    event.preventDefault()
    try {
      consent.showRevocationMessage()
    } catch {
      window.location.assign(SETTINGS_URL)
      return
    }
    window.setTimeout(() => {
      if (!consentMessageIsShowing()) window.location.assign(SETTINGS_URL)
    }, MESSAGE_WAIT_MS)
  }

  return (
    <a href={SETTINGS_URL} onClick={openConsentMessage}>
      Cookie settings
    </a>
  )
}
