# EarthWatch

**EarthWatch** is a modern geospatial interface for Earth observation and satellite radar (SAR) monitoring, engineered with a clean, minimal scientific light theme inspired by mission control dashboards.

---

## Mission & Architecture Overview

EarthWatch provides an interactive geospatial canvas focusing on the **NASA-ISRO Synthetic Aperture Radar (NISAR)** mission context. The application pairs a responsive, high-performance **MapLibre GL JS** frontend with an **Express.js** backend foundation.

```
cu-sars/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── public/
│   │   └── favicon.svg         # Scientific Radar/Earth SVG Icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx          # EarthWatch logo, NISAR label, real-time coordinates
│   │   │   ├── InteractiveMap.jsx  # MapLibre GL map, rectangle/polygon drawing & vertex editing
│   │   │   ├── LocationSearch.jsx  # Geocoding search & scientific AOI presets
│   │   │   ├── ComparisonPanel.jsx # AOI geometry tools, date selectors & comparison request
│   │   │   ├── LayerControls.jsx   # Basemap switcher (Positron, Voyager, OSM) & overlays
│   │   │   ├── DataStatus.jsx      # Live backend health & SAR telemetry status indicator
│   │   │   └── Footer.jsx          # Mission attribution & data sources
│   │   ├── services/
│   │   │   └── api.js              # Backend comparison & geometry validation service
│   │   ├── App.jsx                 # Application layout & state management
│   │   ├── index.css               # MapLibre styling & scientific UI theme
│   │   └── main.jsx
│   ├── .env                        # Client configuration
│   ├── vite.config.js
│   └── package.json
├── server/                     # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── health.js           # /api/health endpoint
│   │   │   └── comparison.js       # /api/comparison/* and /api/geometry/validate endpoints
│   │   ├── utils/
│   │   │   └── geoValidation.js    # Spherical geodesics, bbox calculation & polygon verification
│   │   └── index.js                # Express app configuration & middleware
│   ├── .env                        # Server configuration (PORT, origins, etc.)
│   └── package.json
├── package.json                # Monorepo root scripts
└── README.md
```

---

## Design System

Designed strictly following light scientific interface principles:

| Token | Value | Purpose |
| :--- | :--- | :--- |
| **Background** | `#F8FAFC` | Light grey foundational canvas |
| **Surface** | `#FFFFFF` | Floating controls and header panels |
| **Accent** | `#0891B2` | Cyan-600 radar and active indicator states |
| **Text** | `#0F172A` | Slate-900 high contrast primary text |
| **Secondary Text** | `#64748B` | Slate-500 scientific metadata & labels |
| **Border** | `#E2E8F0` | Clean structural separation lines |

---

## Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24+ supported)
- **npm**: v9.0.0 or higher

### 1. Installation
Install dependencies for both frontend and backend from the root directory:

```bash
npm run install:all
```

### 2. Environment Variables

Both client and server come pre-configured:

- **Backend** (`server/.env`):
  ```env
  PORT=5000
  NODE_ENV=development
  CLIENT_ORIGIN=http://localhost:5173
  MISSION_NAME="NASA-ISRO SAR (NISAR)"
  ```

- **Frontend** (`client/.env`):
  ```env
  VITE_API_BASE_URL=http://localhost:5000/api
  VITE_MISSION_LABEL=NISAR Mission
  VITE_MAP_DEFAULT_CENTER_LON=0
  VITE_MAP_DEFAULT_CENTER_LAT=20
  VITE_MAP_DEFAULT_ZOOM=2
  ```

### 3. Running the Application

You can start both server and client in separate terminals:

**Terminal 1 (Backend):**
```bash
npm run dev:server
# Server listens at http://localhost:5000
# Health endpoint: http://localhost:5000/api/health
```

**Terminal 2 (Frontend):**
```bash
npm run dev:client
# Vite dev server starts at http://localhost:5173
```

---

## API Endpoints

### System
- `GET /api/health` — System health check, uptime, mission metadata.
- `GET /` — API root catalog.

### Phase 2: Location & Observation Comparison
- `GET /api/comparison/categories` — List available change categories (`flood_surface_water`: Flood and surface water changes).
- `POST /api/geometry/validate` — Validate GeoJSON polygon coordinates, ring closure, bounding box, and spherical surface area ($km^2$).
- `POST /api/comparison/validate` — Validate entire comparison parameters (geometry, temporal baseline, dates chronological order).
- `POST /api/comparison/request` — Submits and prepares a structured comparison request ready for Phase 3 ingestion.
- `GET /api/comparison/requests` — View registered comparison requests.

---

## Features Implemented

### Phase 1: Foundation and UI
- Interactive Global Map using MapLibre GL JS with CARTO Positron light vector tiles.
- Search interface with Nominatim geocoding and scientific AOI presets.
- Basemap switcher (Positron, Voyager, OpenStreetMap).
- Real-time coordinates in Header and satellite data status indicator in footer.

### Phase 2: Location & Observation Selection
1. **Interactive Geometry Drawing**:
   - **Draw Rectangle**: Two-corner box drawing with live dashed bounding preview.
   - **Draw Custom Polygon**: Multi-vertex point placement with dynamic rubber-band trail and double-click or vertex-proximity closure.
   - **Vertex Drag Editing**: Interactive circular vertex handles displayed on the map allowing real-time geometric repositioning.
   - **Clear Geometry**: Instant reset of AOI layers.
2. **Designated Change Category**:
   - "Flood and surface water changes" calibrated for NISAR dual-pol L/S-band radar backscatter.
3. **Observation Date Selection**:
   - First observation date ($T_1$ baseline) and Second observation date ($T_2$ target).
   - Strict validation preventing identical dates.
   - Chronological validation enforcing $T_2 > T_1$.
   - Quick preset shortcuts (12-day orbital repeat pass, 30-day hydrological cycle).
4. **Comparison Request Preparation**:
   - Backend validation of spherical surface area in $km^2$ using Earth radius geodesics.
   - Structured comparison registration ready for Phase 3 satellite data retrieval.
