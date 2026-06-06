import { useQuery } from '@tanstack/react-query'
import { getRiverById } from '../data/rivers'
import type { RiverDefinition, RiverId, RiverReading } from '../types/hydro'

const SWISS_HYDRO_DATA_ENDPOINT = '/api/swisshydro/stations/data'

let swissHydroDataCache: Record<string, unknown>[] | null = null

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

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function pickFirstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asString(record[key])
    if (value) {
      return value
    }
  }
  return undefined
}

function recordsFromPayload(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
  }
  if (!payload || typeof payload !== 'object') {
    return []
  }

  const maybeObject = payload as Record<string, unknown>
  for (const key of ['data', 'stations', 'results', 'items']) {
    const value = maybeObject[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    }
  }

  return [maybeObject]
}

function toName(record: Record<string, unknown>): string {
  const name = pickFirstString(record, ['name', 'label', 'stationName', 'river', 'waterBody'])
  return (name ?? '').toLowerCase()
}

function recordsFromSwissHydroDataPayload(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return recordsFromPayload(payload)
  }

  const objectPayload = payload as Record<string, unknown>
  const entries: Record<string, unknown>[] = []

  for (const [id, value] of Object.entries(objectPayload)) {
    if (!value || typeof value !== 'object') {
      continue
    }
    entries.push({ id, ...(value as Record<string, unknown>) })
  }

  return entries
}

function toSwissHydroReading(record: Record<string, unknown>, river: RiverDefinition): RiverReading | undefined {
  const parameters = (record.parameters as Record<string, unknown> | undefined) ?? {}
  const level = (parameters.level as Record<string, unknown> | undefined) ?? {}
  const temperature = (parameters.temperature as Record<string, unknown> | undefined) ?? {}

  const rawLevel = asNumber(level.value)
  if (rawLevel === undefined) {
    return undefined
  }

  const min24h = asNumber(level['min-24h'])
  const max24h = asNumber(level['max-24h'])
  let displayLevel = rawLevel
  let absoluteMasl: number | undefined

  // SwissHydro level is often absolute elevation. Map 24h range into river gauge band for display.
  if (rawLevel > 20) {
    absoluteMasl = rawLevel
    if (min24h !== undefined && max24h !== undefined && max24h > min24h) {
      const normalized = Math.max(0, Math.min(1, (rawLevel - min24h) / (max24h - min24h)))
      displayLevel = river.minLevel + normalized * (river.maxLevel - river.minLevel)
    }
  }

  return {
    value: Number(displayLevel.toFixed(2)),
    unit: 'm',
    timestamp:
      pickFirstString(level, ['datetime']) ||
      pickFirstString(temperature, ['datetime']) ||
      new Date().toISOString(),
    temperatureC: asNumber(temperature.value),
    absoluteMasl,
    absoluteUnit: absoluteMasl !== undefined ? 'm a.s.l.' : undefined,
    source: 'swisshydroapi',
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed request ${response.status} for ${url}`)
  }
  return response.json()
}

async function fetchSwissHydroDataRecords() {
  if (swissHydroDataCache) {
    return swissHydroDataCache
  }

  const payload = await fetchJson(SWISS_HYDRO_DATA_ENDPOINT)
  swissHydroDataCache = recordsFromSwissHydroDataPayload(payload)
  return swissHydroDataCache
}

async function fetchSwissHydroMatch(river: RiverDefinition) {
  const records = await fetchSwissHydroDataRecords()
  const matched = records.find((record) => {
    const text = `${toName(record)} ${(record['water-body-name'] as string | undefined)?.toLowerCase() ?? ''}`
    return river.stationHints.some((hint) => text.includes(hint)) || text.includes(river.name.toLowerCase())
  })
  if (!matched) {
    return undefined
  }
  return toSwissHydroReading(matched, river)
}

async function fetchSwissHydroStationSpecific(stationId: string, river: RiverDefinition) {
  const records = await fetchSwissHydroDataRecords()
  const matched = records.find((record) => String(record.id ?? '').trim() === String(stationId).trim())
  if (!matched) {
    return undefined
  }
  return toSwissHydroReading(matched, river)
}

function hashSeed(input: string) {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1000000
  }
  return hash / 1000000
}

function proceduralReading(river: RiverDefinition, location: string): RiverReading {
  const seed = hashSeed(`${river.id}:${location}`)
  const nowHours = Date.now() / 3_600_000
  const wave = Math.sin(nowHours * 0.9 + seed * Math.PI * 2)
  const normalized = (wave + 1) / 2
  const value = river.minLevel + normalized * (river.maxLevel - river.minLevel)

  // Generate seasonal temperature (Swiss rivers typically 4-20°C)
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const seasonalPhase = (dayOfYear / 365) * Math.PI * 2
  const seasonalTemp = Math.sin(seasonalPhase - Math.PI / 2) // Peak in summer (day ~172)
  const baseTemp = 12 // Annual average
  const amplitude = 8 // Variation range
  const dailyVariation = Math.sin((nowHours / 24) * Math.PI * 2) * 1.5
  const riverOffset = seed * 3 - 1.5 // River-specific variation
  const temperatureC = baseTemp + seasonalTemp * amplitude + dailyVariation + riverOffset

  return {
    value: Number(value.toFixed(2)),
    unit: 'm',
    timestamp: new Date().toISOString(),
    temperatureC: Number(Math.max(4, Math.min(22, temperatureC)).toFixed(1)),
    source: 'procedural',
  }
}

export function useRiverLevel(riverId: RiverId, location: string, stationId?: string) {
  return useQuery({
    queryKey: ['river-level', riverId, location, stationId],
    queryFn: async () => {
      const river = getRiverById(riverId)
      if (!river) {
        throw new Error(`Unknown river: ${riverId}`)
      }

      if (stationId) {
        try {
          const reading = await fetchSwissHydroStationSpecific(stationId, river)
          if (reading) {
            return reading
          }
        } catch {
          // Try next source.
        }
      }

      try {
        const reading = await fetchSwissHydroMatch(river)
        if (reading) {
          return reading
        }
      } catch {
        // Continue to procedural fallback.
      }

      return proceduralReading(river, location)
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}
