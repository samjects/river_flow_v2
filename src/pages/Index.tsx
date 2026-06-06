import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { ALL_RIVERS, DEFAULT_DASHBOARD_RIVERS } from '../data/rivers'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { RiverId } from '../types/hydro'
import { RiverCard } from '../components/RiverCard'
import { TemperatureOverview } from '../components/TemperatureOverview'

export function IndexPage() {
  const [location] = useLocalStorage<string>('sr_location', 'Zurich')
  const [dashboardRivers, setDashboardRivers] = useLocalStorage<RiverId[]>(
    'sr_dashboard',
    [...DEFAULT_DASHBOARD_RIVERS] as RiverId[],
  )
  const [selectedRiverId, setSelectedRiverId] = useState<RiverId>('reuss')

  const rivers = useMemo(
    () => ALL_RIVERS.filter((river) => dashboardRivers.includes(river.id)),
    [dashboardRivers],
  )

  const addRiver = () => {
    setDashboardRivers((current) => {
      if (current.includes(selectedRiverId)) {
        return current
      }
      return [...current, selectedRiverId]
    })
  }

  const removeRiver = (id: RiverId) => {
    setDashboardRivers((current) => current.filter((riverId) => riverId !== id))
  }

  return (
    <div className="page-stack">
      <section className="card-glass panel">
        <div>
          <p className="eyebrow">Location</p>
          <h2>{location}</h2>
        </div>
        <div className="row-actions">
          <label>
            Add river
            <select value={selectedRiverId} onChange={(event) => setSelectedRiverId(event.target.value as RiverId)}>
              {ALL_RIVERS.map((river) => (
                <option key={river.id} value={river.id}>
                  {river.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addRiver}>
            <Plus size={16} />
            Add
          </button>
        </div>
      </section>

      <TemperatureOverview riverIds={dashboardRivers} location={location} />

      <section className="river-grid">
        {rivers.map((river) => (
          <RiverCard key={river.id} river={river} location={location} onRemove={removeRiver} />
        ))}
      </section>
    </div>
  )
}
