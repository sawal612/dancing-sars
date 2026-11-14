# EarthWatch

**EarthWatch** is a modern geospatial interface for Earth observation and satellite radar (SAR) monitoring, engineered with a clean, minimal scientific light theme inspired by mission control dashboards.

---

## Mission & Architecture Overview

EarthWatch provides an interactive geospatial canvas focusing on the **NASA-ISRO Synthetic Aperture Radar (NISAR)** mission context. The application pairs a responsive, high-performance **MapLibre GL JS** frontend with an **Express.js** backend connected directly to official satellite data catalogs (**NASA Alaska Satellite Facility (ASF)**, **NASA Common Metadata Repository (CMR)**, and **ISRO Bhoonidhi**).

```
cu-sars/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── public/
│   │   └── favicon.svg         # Scientific Radar/Earth SVG Icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx          # EarthWatch logo, NISAR label, real-time coordinates
│   │   │   ├── InteractiveMap.jsx  # MapLibre GL map, drawing tools & candidate swath footprints
│   │   │   ├── LocationSearch.jsx  # Geocoding search & scientific AOI presets
│   │   │   ├── ComparisonPanel.jsx # AOI tools, date pickers & NISAR catalog search integration
│   │   │   ├── ObservationDetails.jsx # Detailed verified NISAR metadata cards & browse imagery
│   │   │   ├── LayerControls.jsx   # Basemap switcher (Positron, Voyager, OSM) & overlays
│   │   │   ├── DataStatus.jsx      # Live backend & NASA catalog gateway status
│   │   │   └── Footer.jsx          # Mission attribution & data sources
│   │   ├── services/
│   │   │   └── api.js              # Full backend API & NISAR search client
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
│   │   │   ├── comparison.js       # /api/comparison/* and /api/geometry/validate
│   │   │   └── nisar.js            # /api/nisar/search, /api/nisar/pair, /api/nisar/status
│   │   ├── services/
│   │   │   ├── nisarCatalog.js     # NASA ASF & CMR DAAC live search & observation pairing
│   │   │   └── earthdataAuth.js    # NASA Earthdata Login authentication & credential checks
│   │   ├── utils/
│   │   │   └── geoValidation.js    # Spherical geodesics, bbox calculation & polygon verification
│   │   └── index.js                # Express app configuration & middleware
│   ├── .env                        # Server configuration (PORT, Earthdata credentials)
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

- **Backend** (`server/.env`):
  ```env
  PORT=5000
  NODE_ENV=development
  CLIENT_ORIGIN=http://localhost:5173
  MISSION_NAME="NASA-ISRO SAR (NISAR)"
  # NASA Earthdata Login (Optional for catalog discovery; required for raw binary downloads)
  EARTHDATA_USERNAME=
  EARTHDATA_PASSWORD=
  EARTHDATA_TOKEN=
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

In separate terminals:

**Terminal 1 (Backend):**
```bash
npm run dev:server
# Server listens at http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
npm run dev:client
# Vite dev server starts at http://localhost:5173
```

---

## Official Satellite Data Sources & Endpoints

| Catalog | Source URL | Capabilities Integrated |
| :--- | :--- | :--- |
| **NASA Alaska Satellite Facility (ASF DAAC)** | `https://search.asf.alaska.edu/` | Parametric search API for NISAR L1 RSLC & L2 GCOV/GSLC products, orbit tracking, polarization, and browse imagery |
| **NASA Earthdata Common Metadata Repository (CMR)** | `https://cmr.earthdata.nasa.gov/` | Global spatio-temporal granule catalog across all NASA DAACs |
| **ISRO Bhoonidhi** | `https://bhoonidhi.nrsc.gov.in/` | National Remote Sensing Centre (NRSC) data catalog reference |

### API Endpoints

- `GET /api/nisar/status` — Reports connectivity to NASA ASF and NASA CMR, plus Earthdata Login status.
- `GET /api/nisar/samples` — Returns verified validation areas with known NISAR acquisitions.
- `POST /api/nisar/search` — Search official NISAR granules for a single date and bounding box.
- `POST /api/nisar/pair` — Discover and pair official NISAR observations for Baseline ($T_1$) and Target ($T_2$), checking radar compatibility (Track / Flight Direction).
- `POST /api/nisar/prepare-download` — Prepares verified download URLs and checks Earthdata authentication credentials.
- `POST /api/geometry/validate` — Validates GeoJSON polygon coordinates, closure, and spherical surface area ($km^2$).
- `POST /api/comparison/request` — Submits and prepares a structured comparison request.

---

## Features Implemented Across Phases

### Phase 1: Foundation and UI
- Full-bleed MapLibre GL map with CARTO Positron light vector cartography.
- Nominatim geocoding place search & coordinates jumping.
- Real-time coordinates in Header and satellite data status indicator in footer.

### Phase 2: Location & Observation Selection
- Interactive Rectangle & Custom Polygon drawing tools with live preview.
- Vertex Drag Editing mode for fine-tuning boundary geometries.
- Surface water change detection category (`flood_surface_water`).
- Dual date selection with chronological validation enforcing $T_2 > T_1$.

### Phase 3: NISAR Data Integration
- **Live Catalog Discovery**: Connects directly to NASA ASF DAAC (`api.daac.asf.alaska.edu`) and NASA CMR (`cmr.earthdata.nasa.gov`).
- **Real Satellite Metadata**:
  - Exact product identifiers (e.g. `NISAR_L2_PR_GCOV_...` / `NISAR_L2_PR_GUNW_...`)
  - Sensor mode: `L-SAR` / `L-band (1.25 GHz)`
  - Exact UTC acquisition timestamp
  - Polarizations: Dual-Pol (`HH/HV`), Single-Pol (`HH`, `VV`)
  - Orbit metrics: Track / relative orbit, frame number, flight direction (Ascending / Descending)
  - Data sources: NASA Alaska Satellite Facility (ASF DAAC) / NASA Earthdata
  - Direct download links (`.h5`), S3 URIs, and official browse imagery previews.
- **Truthful Availability Handling**:
  - Displays verified observation cards when products exist.
  - Clearly and accurately informs the user when no satellite observation was acquired for an area/date pair (zero fabricated data).
  - Quick-load buttons for **Verified NISAR Test Swaths** (Alaska Delta, Mississippi Valley, Greenland Ice Sheet).
- **Radar Compatibility Verification**:
  - Checks flight direction (Ascending vs Descending) and track consistency to evaluate InSAR/backscatter coherence.
- **Swath Footprint Visualization**:
  - Renders the exact geographical satellite footprint polygon on the map alongside the user's selected AOI.
