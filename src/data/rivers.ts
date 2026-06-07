import type { RiverDefinition } from '../types/hydro'

export const ALL_RIVERS: RiverDefinition[] = [
  {
    id: 'rhine',
    name: 'Rhine',
    origin: 'Lake Toma, Graubuenden',
    minLevel: 1.1,
    maxLevel: 6.4,
    recordLevel: 8.2,
    stationHints: ['rhein', 'rhine', 'basel', 'rheinfelden'],
    defaultStationId: '2143', // Rekingen
  },
  {
    id: 'aare',
    name: 'Aare',
    origin: 'Bernese Alps',
    minLevel: 0.9,
    maxLevel: 5.1,
    recordLevel: 6.8,
    stationHints: ['aare', 'bern', 'brugg'],
    defaultStationId: '2135', // Bern, Schönau
  },
  {
    id: 'rhone',
    name: 'Rhone',
    origin: 'Rhone Glacier, Valais',
    minLevel: 1,
    maxLevel: 5.6,
    recordLevel: 7.4,
    stationHints: ['rhone', 'rhoene', 'geneve', 'sion'],
  },
  {
    id: 'reuss',
    name: 'Reuss',
    origin: 'Gotthard region',
    minLevel: 0.7,
    maxLevel: 4.2,
    recordLevel: 5.5,
    stationHints: ['reuss', 'luzern', 'uri'],
    defaultStationId: '2152', // Luzern, Geissmattbrücke
  },
  {
    id: 'limmat',
    name: 'Limmat',
    origin: 'Outflow of Lake Zurich',
    minLevel: 0.6,
    maxLevel: 3.6,
    recordLevel: 4.7,
    stationHints: ['limmat', 'zuerich', 'zurich', 'baden'],
    defaultStationId: '2243', // Baden, Limmatpromenade
  },
  {
    id: 'ticino',
    name: 'Ticino',
    origin: 'Alps near Nufenen Pass',
    minLevel: 0.8,
    maxLevel: 4.8,
    recordLevel: 6.1,
    stationHints: ['ticino', 'bellinzona', 'locarno'],
    defaultStationId: '2020', // Bellinzona
  },
]

export const DEFAULT_DASHBOARD_RIVERS = ['rhine', 'aare', 'rhone'] as const

export function getRiverById(id: string) {
  return ALL_RIVERS.find((river) => river.id === id)
}
