# flow-sense-swiss — Product Specification

**Status:** Live (localhost:8080) | **Date:** 2026-06-06  
**Built with:** Vite 5 · React 18 · TypeScript 5 · shadcn/ui · Tailwind CSS 3

---

## 1. Overview

A real-time Swiss river monitoring dashboard that displays water levels and temperatures for Switzerland's major rivers. Data is sourced from the Swiss Federal Office for the Environment (FOEN) hydrology APIs, with a procedural simulation fallback when APIs are unreachable.

---

## 2. Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `Index` | Dashboard — grid of river cards, temperature overview |
| `/river/:id` | `RiverDetail` | Full detail view for a single river with station selector |
| `/settings` | `Settings` | User location preference |
| `*` | `NotFound` | 404 fallback |

---

## 3. Features

### 3.1 Dashboard (`/`)
- Displays a configurable grid of `RiverCard` components (default: Rhine, Aare, Rhône)
- **Add/Remove rivers** via a Dialog with a dropdown (`ALL_RIVERS` list)
- **Temperature Overview** strip shown when ≥1 river is on the dashboard
- River selection persisted to `localStorage` key `sr_dashboard`
- Location label sourced from `localStorage` key `sr_location` (default: `Zurich`)

### 3.2 River Card
- Shows river name, `LevelGauge`, water temperature (if available), last-measurement timestamp
- Links to `/river/:id` detail page
- Remove button (`×`) removes river from dashboard

### 3.3 River Detail (`/river/:id`)
- Full-page `LevelGauge` + `TemperatureGauge`
- Absolute elevation (m a.s.l.) displayed when available from API
- Measurement timestamp shown when available
- **Station Selector:** two-level picker (Canton → Station) backed by `useHydroStations`
- Station and canton selections persisted to `localStorage` per-river (`sr_canton_:id`, `sr_station_:id`)

### 3.4 Settings (`/settings`)
- Location text input, persisted to `localStorage` key `sr_location`
- Location influences the procedural fallback level calculation seed

---

## 4. Data Layer

### 4.1 River Definitions (`src/data/rivers.ts`)
Six rivers are statically defined:

| ID | Name | Origin | Level Range (m) | Record (m) |
|---|---|---|---|---|
| `rhine` | Rhine | Lake Toma, Graubünden | 1.1 – 6.4 | 8.2 |
| `aare` | Aare | Bernese Alps | 0.9 – 5.1 | 6.8 |
| `rhone` | Rhône | Rhone Glacier, Valais | 1.0 – 5.6 | 7.4 |
| `reuss` | Reuss | Gotthard region | 0.7 – 4.2 | 5.5 |
| `limmat` | Limmat | Outflow of Lake Zurich | 0.6 – 3.6 | 4.7 |
| `ticino` | Ticino | Alps near Nufenen Pass | 0.8 – 4.8 | 6.1 |

Each river has `stationHints` (preferred station location strings for API matching).

### 4.2 `useRiverLevel` Hook
Fetches live level + temperature via TanStack Query. Source priority:

1. **FOEN station-specific** — `https://hydroapi.bafu.admin.ch/api/stations/:id/timeseries/latest` (when `stationId` provided)
2. **FOEN all stations** — `https://hydroapi.bafu.admin.ch/api/stations` + river name matching
3. **hydrodaten.admin.ch** — same pattern, alternate domain
4. **SwissHydroAPI** — `https://swisshydroapi.bouni.de/api/v1/stations`
5. **Procedural fallback** — sine-wave oscillation seeded from river id + location string

Returns: `{ value, unit, timestamp, temperatureC, absoluteMasl, absoluteUnit, source }`.

### 4.3 `useHydroStations` Hook
Fetches all measuring stations, filtered to the selected river. Source priority:

1. FOEN API endpoints
2. SwissHydroAPI
3. **Static fallback** (`src/data/hydroStationsFallback.ts`) — 6 hardcoded stations (one per river)

Derives a `cantons` list for the canton dropdown.

---

## 5. Components

| Component | Purpose |
|---|---|
| `Header` | Sticky nav bar — logo, Dashboard + Settings links |
| `FluidBackground` | Full-height wrapper; animates CSS gradient blobs via `--tiltX`/`--tiltY` CSS vars driven by `pointermove` (desktop) or `deviceorientation` (mobile) |
| `RiverCard` | Dashboard tile with level gauge + footer stats |
| `LevelGauge` | Vertical fill bar (min→max range), colour-coded by water temperature |
| `TemperatureGauge` | Slim vertical thermometer bar (–5 °C to 35 °C range), sizes `sm`/`lg` |
| `TemperatureOverview` | Horizontal strip listing each dashboard river's current temperature |

---

## 6. Design System

- **Theme:** Light/dark mode via CSS custom properties (`:root` / `.dark`)
- **Primary colour:** Deep blue `hsl(218 77% 26%)` (light), Cyan `hsl(199 94% 62%)` (dark)
- **Accent:** Cyan `hsl(192 91% 43%)`
- **Water tokens:** `--water-1/2/3` (light blue tints)
- **Temperature colour scale:**

  | Range | Token | Colour |
  |---|---|---|
  | ≤ 0 °C | `--temp-frozen` | Icy blue |
  | ≤ 5 °C | `--temp-cold` | Cold blue |
  | ≤ 12 °C | `--temp-cool` | Blue-teal |
  | ≤ 18 °C | `--temp-moderate` | Teal |
  | ≤ 22 °C | `--temp-warm` | Green-teal |
  | ≤ 28 °C | `--temp-hot` | Yellow-orange |
  | > 28 °C | `--temp-very-hot` | Orange-brown |

- **Fluid background:** CSS `radial-gradient` blobs shift with `--tiltX`/`--tiltY` (pointer or gyroscope)
- **Glass cards:** `.card-glass` utility — backdrop blur + semi-transparent background
- **Typography:** `font-display` class for headings; `tabular-nums` for measurement values
- **Animation:** `.animate-enter` (fade/slide in), `.hover-scale` (scale on hover), `.water-column` (fill transition)

---

## 7. State & Persistence

All user state lives in `localStorage` (via `useLocalStorage` hook):

| Key | Type | Default | Description |
|---|---|---|---|
| `sr_location` | `string` | `"Zurich"` | User's city (affects fallback seed) |
| `sr_dashboard` | `string[]` | `["rhine","aare","rhone"]` | River IDs shown on dashboard |
| `sr_canton_:id` | `string \| undefined` | `undefined` | Selected canton filter per river |
| `sr_station_:id` | `string \| undefined` | `undefined` | Selected station ID per river |

Server state (API data) is cached by TanStack Query.

---

## 8. Known Issues / Limitations

| Issue | Detail |
|---|---|
| **FOEN API unreachable** | Both `hydroapi.bafu.admin.ch` and `hydrodaten.admin.ch` return DNS errors in the current environment — all levels show procedural fallback values |
| **Procedural fallback is not real data** | The sine-wave fallback produces plausible-looking but synthetic level values |
| **Temperature display** | Temperature is only shown when the live API responds; no fallback temperature is simulated |
| **`TemperatureOverview` hook-in-loop workaround** | `TemperatureOverview` pushes `undefined` temperatures for all rivers and delegates actual fetch to child `RiverTemperatureItem` components — the `useMemo` data array is unused |
| **Static river list** | Rivers are hardcoded; no way to add new rivers not in `ALL_RIVERS` |
| **No historical chart** | Detail page shows only the current (latest) measurement — no time series / sparkline |
| **No alert thresholds** | Record levels are defined in data but no warning UI is shown when level approaches record |
| **React Router v7 flags** | Two console warnings about future v7 flags (`v7_startTransition`, `v7_relativeSplatPath`) not yet opted-in |
| **npm audit: 16 vulnerabilities** | 7 moderate, 9 high — from transitive dependencies |

---

## 9. Potential Improvements

- Resolve FOEN API access (CORS proxy or server-side fetch)
- Historical time-series chart on detail page (recharts is already installed)
- Flood alert banner when level exceeds a configurable threshold
- Map view showing all station locations (latitude/longitude available in station data)
- PWA / offline support with service worker
- Opt-in to React Router v7 future flags
- Add remaining Swiss rivers (Inn, Sarine, Thur, Emme, etc.)
- Unit toggle (m vs. cm vs. m³/s for discharge)
