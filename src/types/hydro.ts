export type RiverId =
  | 'rhine'
  | 'aare'
  | 'rhone'
  | 'reuss'
  | 'limmat'
  | 'ticino'

export interface RiverDefinition {
  id: RiverId
  name: string
  origin: string
  minLevel: number
  maxLevel: number
  recordLevel: number
  stationHints: string[]
  defaultStationId?: string
}

export interface HydroStation {
  id: string
  name: string
  riverId: RiverId
  canton: string
  latitude?: number
  longitude?: number
}

export type LevelSource =
  | 'foen-station'
  | 'foen-list'
  | 'hydrodaten'
  | 'swisshydroapi'
  | 'procedural'

export interface RiverReading {
  value: number
  unit: string
  timestamp: string
  temperatureC?: number
  absoluteMasl?: number
  absoluteUnit?: string
  source: LevelSource
}
