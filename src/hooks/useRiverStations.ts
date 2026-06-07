import { useQuery } from '@tanstack/react-query'
import type { RiverId } from '../types/hydro'

interface RiverStation {
  id: string
  name: string
  position: number // 0-1, representing position along river from source to destination
}

const STATION_ENDPOINTS = ['/api/swisshydro/stations']

function normalizeText(value: string) {
  return value.toLowerCase().trim()
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

function getRiverName(riverId: RiverId): string {
  const names: Record<RiverId, string> = {
    rhine: 'Rhein',
    aare: 'Aare',
    rhone: 'Rhone',
    reuss: 'Reuss',
    limmat: 'Limmat',
    ticino: 'Ticino',
  }
  return names[riverId]
}

// Map of station names to their approximate positions along the river (0=source, 1=destination)
// Keys are riverId values (English names)
const STATION_POSITIONS: Record<RiverId, Record<string, number>> = {
  rhine: {
    'domat/ems': 0.1,
    'rheinfelden': 0.3,
    'rekingen': 0.4,
    'koblenz': 0.5,
    'neuhausen, flurlingerbrücke': 0.6,
    'oberriet, blatten': 0.65,
    'diepoldsau, rietbrücke': 0.7,
    'weil, palmrainbrücke': 0.8,
    'basel, rheinhalle': 0.9,
    'basel lhg': 0.95,
  },
  aare: {
    'interlaken': 0.05,
    'meiringen': 0.1,
    'bern, schönau': 0.35,
    'belp, mülimatt': 0.4,
    'brugg': 0.8,
    'bremgarten': 0.85,
  },
  reuss: {
    'andermatt': 0.1,
    'erstfeld': 0.2,
    'luzern': 0.6,
    'turgi': 0.9,
  },
  limmat: {
    'zurich': 0.3,
    'baden, limmatpromenade': 0.8,
  },
  ticino: {
    'bellinzona': 0.2,
    'locarno': 0.4,
  },
  rhone: {
    'sion': 0.15,
    'monthey': 0.35,
  },
}

async function fetchStationsFromEndpoint(url: string, riverId: RiverId): Promise<RiverStation[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Station endpoint failed: ${url}`)
  }
  const payload = (await response.json()) as unknown
  const records = extractArray(payload)
  const riverName = getRiverName(riverId)

  const stations: RiverStation[] = []

  for (const record of records) {
    const waterBody = normalizeText((record['water-body-name'] as string) || '')
    if (waterBody !== normalizeText(riverName)) {
      continue
    }

    const id = (record.id as string | undefined) || ''
    const name = (record.name as string | undefined) || ''

    if (!id || !name) {
      continue
    }

    const positionKey = normalizeText(name)
    const positions = STATION_POSITIONS[riverId]
    const position = positions ? positions[positionKey] : undefined

    // Only include stations with known positions (Swiss territory)
    if (position !== undefined) {
      stations.push({ id, name, position })
    }
  }

  return stations.sort((a, b) => a.position - b.position)
}

export function useRiverStations(riverId: RiverId) {
  return useQuery({
    queryKey: ['river-stations', riverId],
    queryFn: async () => {
      for (const endpoint of STATION_ENDPOINTS) {
        try {
          return await fetchStationsFromEndpoint(endpoint, riverId)
        } catch {
          // Try next source
        }
      }
      return []
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
