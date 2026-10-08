/**
 * Reopens Google's consent message so a visitor can change their choice.
 * Google's script provides window.googlefc. If it has not loaded (an ad
 * blocker, or a page without the AdSense tag), the link goes to the cookie
 * policy instead, which explains the other ways to change the setting.
 */
export default function CookieSettingsLink() {
  const openConsentMessage = (event) => {
    const consent = window.googlefc
    if (typeof consent?.showRevocationMessage !== 'function') return
    event.preventDefault()
    consent.showRevocationMessage()
  }

  return (
    <a href="/cookies#settings" onClick={openConsentMessage}>
      Privacy and cookie settings
    </a>
  )
}
