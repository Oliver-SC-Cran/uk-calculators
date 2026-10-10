/** The layout for pages that are mostly text: about, the policies, terms and the 404 page. */
export default function TextPage({ children }) {
  return <div className="wrap wrap--text page prose">{children}</div>
}
