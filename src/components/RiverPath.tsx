import { useRiverStations } from '../hooks/useRiverStations'
import type { RiverId } from '../types/hydro'

interface RiverPathProps {
  riverId: RiverId
  origin: string
  size?: 'sm' | 'lg'
}

const RIVER_DESTINATIONS: Record<RiverId, string> = {
  rhine: 'North Sea (Netherlands)',
  aare: 'Rhine (Koblenz)',
  rhone: 'Mediterranean Sea',
  reuss: 'Aare (Brugg)',
  limmat: 'Aare (Brugg)',
  ticino: 'Po River (Italy)',
}

export function RiverPath({ riverId, origin, size = 'sm' }: RiverPathProps) {
  const destination = RIVER_DESTINATIONS[riverId]
  const height = size === 'sm' ? 50 : 70
  const { data: stations = [] } = useRiverStations(riverId)

  return (
    <div className={`river-path ${size}`}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 300 ${height}`}
        preserveAspectRatio="none"
        className="river-path-svg"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id={`riverGrad-${riverId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(195 75% 52%)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(195 75% 48%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(195 75% 52%)" stopOpacity="0.15" />
          </linearGradient>
          
          {/* Animated flow gradient */}
          <linearGradient id={`flow-${riverId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(195 75% 55%)" stopOpacity="0">
              <animate
                attributeName="stop-opacity"
                values="0;0.6;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="hsl(185 70% 52%)" stopOpacity="0.4">
              <animate
                attributeName="stop-opacity"
                values="0.4;0.8;0.4"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="hsl(195 75% 55%)" stopOpacity="0">
              <animate
                attributeName="stop-opacity"
                values="0;0.6;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 0"
              to="1 0"
              dur="4s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>

        {/* Path background */}
        <path
          d={`M 10 ${height / 2} Q 75 ${height * 0.3}, 150 ${height / 2} T 290 ${height / 2}`}
          fill="none"
          stroke={`url(#riverGrad-${riverId})`}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Animated flow path */}
        <path
          d={`M 10 ${height / 2} Q 75 ${height * 0.3}, 150 ${height / 2} T 290 ${height / 2}`}
          fill="none"
          stroke={`url(#flow-${riverId})`}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Main river path */}
        <path
          d={`M 10 ${height / 2} Q 75 ${height * 0.3}, 150 ${height / 2} T 290 ${height / 2}`}
          fill="none"
          stroke="hsl(195 75% 48%)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Source marker */}
        <circle cx="10" cy={height / 2} r="4" fill="hsl(195 75% 45%)" />
        <circle cx="10" cy={height / 2} r="6" fill="none" stroke="hsl(195 75% 45%)" strokeWidth="1" opacity="0.5" />

        {/* Destination marker */}
        <circle cx="290" cy={height / 2} r="4" fill="hsl(185 70% 48%)" />
        <circle cx="290" cy={height / 2} r="6" fill="none" stroke="hsl(185 70% 48%)" strokeWidth="1" opacity="0.5" />

        {/* Station markers along the path */}
        {stations.map((station) => {
          const x = 10 + station.position * 280
          return (
            <g key={station.id} className="station-marker">
              <circle cx={x} cy={height / 2} r="3" fill="hsl(195 75% 55%)" opacity="0.8" />
              <title>{station.name}</title>
            </g>
          )
        })}
      </svg>

      <div className="river-path-labels">
        <span className="path-label source">{origin}</span>
        <span className="path-label destination">{destination}</span>
      </div>
    </div>
  )
}
