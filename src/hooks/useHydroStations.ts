import { useQuery } from '@tanstack/react-query'
import { FALLBACK_STATIONS } from '../data/hydroStationsFallback'
import type { HydroStation, RiverId } from '../types/hydro'

const STATION_ENDPOINTS = ['/api/swisshydro/stations']

function normalizeText(value: string) {
  return value.toLowerCase()
}

function extractArray(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }
  if (!input || typeof input !== 'object') {
    return []
  }

  const maybeObject = input as Record<string, unknown>
  for (const key of ['stations', 'data', 'results', 'items']) {
    const value = maybeObject[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    }
  }

  return []
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return undefined
}

function inferRiverId(stationLike: string): RiverId | undefined {
  const text = normalizeText(stationLike)
  if (text.includes('rhein') || text.includes('rhine')) return 'rhine'
  if (text.includes('aare')) return 'aare'
  if (text.includes('rhone') || text.includes('rhoene')) return 'rhone'
  if (text.includes('reuss')) return 'reuss'
  if (text.includes('limmat')) return 'limmat'
  if (text.includes('ticino')) return 'ticino'
  return undefined
}

function toStation(raw: Record<string, unknown>): HydroStation | undefined {
  const name =
    (raw.name as string | undefined) ||
    (raw.label as string | undefined) ||
    (raw.stationName as string | undefined)
  const id =
    (raw.id as string | undefined) ||
    (raw.stationId as string | undefined) ||
    (raw.shortName as string | undefined)

  if (!id || !name) {
    return undefined
  }

  const riverField =
    (raw['water-body-name'] as string | undefined) ||
    (raw.river as string | undefined) ||
    (raw.riverName as string | undefined) ||
    (raw.waterBody as string | undefined) ||
    ''

  const riverId = inferRiverId(`${name} ${riverField}`)
  if (!riverId) {
    return undefined
  }

  const canton =
    (raw.canton as string | undefined) ||
    (raw.cantonCode as string | undefined) ||
    (raw.region as string | undefined) ||
    'N/A'

  return {
    id,
    name,
    riverId,
    canton,
    latitude: asNumber(raw.latitude ?? raw.lat),
    longitude: asNumber(raw.longitude ?? raw.lon),
  }
}

async function fetchStationsFromEndpoint(url: string): Promise<HydroStation[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Station endpoint failed: ${url}`)
  }
  const payload = (await response.json()) as unknown
  const records = extractArray(payload)
  return records
    .map(toStation)
    .filter((station): station is HydroStation => !!station)
}

export function useHydroStations(riverId: RiverId) {
  return useQuery({
    queryKey: ['hydro-stations', riverId],
    queryFn: async () => {
      for (const endpoint of STATION_ENDPOINTS) {
        try {
          const stations = await fetchStationsFromEndpoint(endpoint)
          const filtered = stations.filter((station) => station.riverId === riverId)
          if (filtered.length > 0) {
            return filtered
          }
        } catch {
          // Try next source.
        }
      }

      return FALLBACK_STATIONS.filter((station) => station.riverId === riverId)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function getCantons(stations: HydroStation[]) {
  return Array.from(new Set(stations.map((station) => station.canton))).sort((a, b) => a.localeCompare(b))
}
