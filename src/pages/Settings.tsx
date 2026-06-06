import { useLocalStorage } from '../hooks/useLocalStorage'

export function SettingsPage() {
  const [location, setLocation] = useLocalStorage<string>('sr_location', 'Zurich')

  return (
    <section className="card-glass panel settings-panel">
      <h2>Settings</h2>
      <label className="field">
        Preferred location
        <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Zurich" />
      </label>
      <p className="hint">
        Location influences procedural fallback seeding whenever live hydro APIs are unavailable.
      </p>
    </section>
  )
}
