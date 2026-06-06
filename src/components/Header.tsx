import { NavLink } from 'react-router-dom'

export function Header() {
  return (
    <header className="app-header card-glass">
      <div>
        <p className="eyebrow">flow-sense-swiss</p>
        <h1 className="brand">Swiss River Monitor</h1>
      </div>
      <nav className="header-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Dashboard
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Settings
        </NavLink>
      </nav>
    </header>
  )
}
