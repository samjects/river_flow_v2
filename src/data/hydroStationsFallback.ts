import type { HydroStation } from '../types/hydro'

export const FALLBACK_STATIONS: HydroStation[] = [
  {
    id: 'rhine-basel',
    name: 'Basel - Rheinhalle',
    riverId: 'rhine',
    canton: 'BS',
    latitude: 47.5596,
    longitude: 7.5886,
  },
  {
    id: 'aare-bern',
    name: 'Bern - Schoenausteg',
    riverId: 'aare',
    canton: 'BE',
    latitude: 46.95,
    longitude: 7.4474,
  },
  {
    id: 'rhone-sion',
    name: 'Sion - Pont du Rhone',
    riverId: 'rhone',
    canton: 'VS',
    latitude: 46.2331,
    longitude: 7.3606,
  },
  {
    id: 'reuss-luzern',
    name: 'Luzern - Seebruecke',
    riverId: 'reuss',
    canton: 'LU',
    latitude: 47.0502,
    longitude: 8.3093,
  },
  {
    id: 'limmat-zurich',
    name: 'Zurich - Platzspitz',
    riverId: 'limmat',
    canton: 'ZH',
    latitude: 47.3798,
    longitude: 8.539,
  },
  {
    id: 'ticino-bellinzona',
    name: 'Bellinzona - Ticino',
    riverId: 'ticino',
    canton: 'TI',
    latitude: 46.1946,
    longitude: 9.0244,
  },
]
