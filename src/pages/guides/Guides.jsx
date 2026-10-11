import { Link } from 'react-router-dom'
import TextPage from '../../components/TextPage'
import { guides } from '../../routes'

export default function Guides() {
  return (
    <TextPage>
      <h1>Guides</h1>
      <p className="lede">
        Longer explanations of the rules behind the calculators, with worked examples and links to
        the official sources.
      </p>
      <ul className="tiles">
        {guides.map(({ path, guide, summary }) => (
          <li key={path}>
            <Link to={path} className="tile">
              <span className="tile__name">{guide}</span>
              <span className="tile__desc">{summary}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="back-link">
        <Link to="/#calculators">See all calculators</Link>
      </p>
    </TextPage>
  )
}
