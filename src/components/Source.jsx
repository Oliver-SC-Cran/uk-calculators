/** A link to a source, such as a gov.uk page, opened in a new tab. */
export default function Source({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}
