import { Link, useParams } from 'react-router-dom'
import { getRiverById } from '../data/rivers'
import { useHydroStations } from '../hooks/useHydroStations'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useRiverLevel } from '../hooks/useRiverLevel'
import { FluidLevel } from '../components/FluidLevel'
import { RiverPath } from '../components/RiverPath'
import { TemperatureGauge } from '../components/TemperatureGauge'

export function RiverDetailPage() {
  const params = useParams<{ id: string }>()
  const river = params.id ? getRiverById(params.id) : undefined

  if (!river) {
    return (
      <section className="card-glass panel">
        <h2>River not found</h2>
        <Link to="/">Back to dashboard</Link>
      </section>
    )
  }

  const [location] = useLocalStorage<string>('sr_location', 'Zurich')
  const [selectedStation, setSelectedStation] = useLocalStorage<string | undefined>(
    `sr_station_${river.id}`,
    river.defaultStationId,
  )

  const stationsQuery = useHydroStations(river.id)
  const stations = stationsQuery.data ?? []

  const readingQuery = useRiverLevel(river.id, location, selectedStation ?? river.defaultStationId)
  const reading = readingQuery.data

  const activeStation = stations.find((s) => s.id === (selectedStation ?? river.defaultStationId))

  return (
    <section className="detail-layout card-glass animate-enter">
      <div className="detail-main">
        <p className="eyebrow">{river.origin}</p>
        <h2>{river.name}</h2>
        {reading ? (
          <>
            <RiverPath riverId={river.id} origin={river.origin} size="lg" />
            <FluidLevel
              value={reading.value}
              min={river.minLevel}
              max={river.maxLevel}
              record={river.recordLevel}
              temperatureC={reading.temperatureC}
              size="lg"
            />
            <div className="meta-row">
              <span>{new Date(reading.timestamp).toLocaleString()}</span>
              <span className="source-pill">{reading.source}</span>
            </div>
            {reading.absoluteMasl !== undefined ? (
              <p className="hint tabular-nums">
                Absolute elevation: {reading.absoluteMasl.toFixed(1)} {reading.absoluteUnit ?? 'm a.s.l.'}
              </p>
            ) : null}
          </>
        ) : (
          <p>Loading measurement...</p>
        )}
      </div>

      <aside className="detail-side">
        <TemperatureGauge temperatureC={reading?.temperatureC} size="lg" />

        <div className="selectors">
          <label>
            Station
            {activeStation && <span className="station-badge">{activeStation.name}</span>}
            <select
              value={selectedStation ?? river.defaultStationId ?? ''}
              onChange={(e) => setSelectedStation(e.target.value || river.defaultStationId)}
            >
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </aside>
    </section>
  )
}
