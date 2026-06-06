import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="card-glass panel">
      <h2>404</h2>
      <p>The route you requested does not exist.</p>
      <Link to="/">Return to dashboard</Link>
    </section>
  )
}
