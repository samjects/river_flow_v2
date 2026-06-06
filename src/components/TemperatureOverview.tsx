import { getRiverById } from '../data/rivers'
import { useRiverLevel } from '../hooks/useRiverLevel'
import type { RiverId } from '../types/hydro'

interface TemperatureOverviewProps {
  riverIds: RiverId[]
  location: string
}

function RiverTemperatureItem({ riverId, location }: { riverId: RiverId; location: string }) {
  const river = getRiverById(riverId)
  const { data } = useRiverLevel(riverId, location)

  if (!river) {
    return null
  }

  return (
    <li>
      <span>{river.name}</span>
      <strong className="tabular-nums">
        {data?.temperatureC === undefined ? '--' : `${data.temperatureC.toFixed(1)} C`}
      </strong>
    </li>
  )
}

export function TemperatureOverview({ riverIds, location }: TemperatureOverviewProps) {
  if (riverIds.length === 0) {
    return null
  }

  return (
    <section className="temperature-overview card-glass animate-enter">
      <h3>Temperature overview</h3>
      <ul>
        {riverIds.map((riverId) => (
          <RiverTemperatureItem key={riverId} riverId={riverId} location={location} />
        ))}
      </ul>
    </section>
  )
}
