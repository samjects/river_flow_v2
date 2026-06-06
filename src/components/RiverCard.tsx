import { Link } from 'react-router-dom'
import { X, ArrowRight } from 'lucide-react'
import type { RiverDefinition } from '../types/hydro'
import { useRiverLevel } from '../hooks/useRiverLevel'
import { FluidLevel } from './FluidLevel'

interface RiverCardProps {
  river: RiverDefinition
  location: string
  onRemove: (id: RiverDefinition['id']) => void
}

export function RiverCard({ river, location, onRemove }: RiverCardProps) {
  const { data, isLoading } = useRiverLevel(river.id, location)

  return (
    <article className="river-card card-glass hover-scale animate-enter">
      <header>
        <div>
          <p className="eyebrow">{river.origin}</p>
          <h2>{river.name}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={() => onRemove(river.id)}>
          <X size={16} />
        </button>
      </header>

      {isLoading || !data ? (
        <p>Loading latest measurement...</p>
      ) : (
        <>
          <FluidLevel
            value={data.value}
            min={river.minLevel}
            max={river.maxLevel}
            record={river.recordLevel}
            temperatureC={data.temperatureC}
            size="sm"
          />
          <footer className="card-footer">
            <span>{new Date(data.timestamp).toLocaleString()}</span>
            <span className="source-pill">{data.source}</span>
          </footer>
        </>
      )}

      <Link to={`/river/${river.id}`} className="detail-link">
        Open detail
        <ArrowRight size={16} />
      </Link>
    </article>
  )
}
