# EarthWatch

**EarthWatch** is a modern geospatial interface for Earth observation and satellite radar (SAR) monitoring, engineered with a clean, minimal scientific light theme inspired by mission control dashboards.

---

## Mission & Architecture Overview

EarthWatch provides an interactive geospatial canvas focusing on the **NASA-ISRO Synthetic Aperture Radar (NISAR)** mission context. The application pairs a responsive, high-performance **MapLibre GL JS** frontend with an **Express.js + Python** backend connected directly to official satellite data catalogs (**NASA Alaska Satellite Facility (ASF)**, **NASA Common Metadata Repository (CMR)**, and **ISRO Bhoonidhi**).

```
cu-sars/
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── public/
│   │   └── favicon.svg         # Scientific Radar/Earth SVG Icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx          # EarthWatch logo, NISAR label, real-time coordinates
│   │   │   ├── InteractiveMap.jsx  # MapLibre GL map, drawing tools, swipe divider & cyan change mask
│   │   │   ├── LocationSearch.jsx  # Geocoding search & scientific AOI presets
│   │   │   ├── ComparisonPanel.jsx # AOI tools, date pickers & NISAR catalog search integration
│   │   │   ├── ComparisonToolbar.jsx # Before/After/Swipe comparison mode selector & mask toggle
│   │   │   ├── ProcessingResultsPanel.jsx # Essential statistics, affected area & physics caveats
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
├── server/                     # Backend API (Node.js + Express + Python)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── health.js           # /api/health endpoint
│   │   │   ├── comparison.js       # /api/comparison/* and /api/geometry/validate
│   │   │   ├── nisar.js            # /api/nisar/search, /api/nisar/pair, /api/nisar/status
│   │   │   └── processing.js       # /api/processing/compare and /api/processing/methods
│   │   ├── processors/
│   │   │   └── radar_change_detector.py # NumPy/Shapely geodesic radar log-ratio change engine
│   │   ├── services/
│   │   │   ├── nisarCatalog.js     # NASA ASF & CMR DAAC live search & observation pairing
│   │   │   ├── earthdataAuth.js    # NASA Earthdata Login authentication & credential checks
│   │   │   └── radarProcessor.js   # Execution wrapper with pure JS fallback resilience
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
| **Change Mask** | `#0891B2` | Cyan detected surface water inundation layer |
| **Text** | `#0F172A` | Slate-900 high contrast primary text |
| **Secondary Text** | `#64748B` | Slate-500 scientific metadata & labels |
| **Border** | `#E2E8F0` | Clean structural separation lines |

---

## Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24+ supported)
- **Python**: v3.10+ (with `numpy` and `shapely`)
- **npm**: v9.0.0 or higher

### 1. Installation
Install dependencies for both frontend and backend:

```bash
npm run install:all
```

Install Python geospatial libraries:
```bash
python -m pip install numpy scipy shapely
```

### 2. Running the Application

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

## Radar Processing Methodology (Phase 4)

### 1. Radar Backscatter Log-Ratio Differencing ($\Delta \sigma^0$)
Synthetic Aperture Radar (SAR) systems measure surface backscatter cross-section $\sigma^0$. In the presence of surface water or flooding:
$$\Delta \sigma^0_{\text{dB}} = \sigma^0_{2,\text{dB}} - \sigma^0_{1,\text{dB}} = 10 \cdot \log_{10}\left(\frac{\sigma_2^0}{\sigma_1^0}\right)$$
Because smooth open water reflects radar beams away from the sensor via specular forward scattering, water emergence causes a pronounced backscatter loss ($\Delta \sigma^0_{\text{dB}} \le -3.2\text{ dB}$).

### 2. Geodesic Surface Area Calculation
Surface areas are computed using spherical excess geodesic trigonometry on WGS84:
$$\text{Area} = \frac{R^2}{2} \cdot \left| \sum_{i=0}^{n-1} (\lambda_{i+1} - \lambda_{i-1}) \cdot \sin(\phi_i) \right|$$
where $R \approx 6,371\text{ km}$. The detected change polygon features are clipped strictly to the user-selected AOI boundary.

### 3. Scientific Caveats & Quality Information
- **Cloud Independence**: L-band microwave radiation ($\lambda \approx 24\text{ cm}$) penetrates clouds, fog, and rain without signal loss; observed differences reflect ground surface conditions rather than atmospheric artifacts.
- **Attribution Notice**: Backscatter reductions indicate surface water expansion, soil moisture saturation, or smoothing; for strict flood attribution, results should be cross-referenced with local hydrological elevation models (HAND).

---

## Comparison Modes

- **Before ($T_1$)**: Visualizes baseline radar acquisition.
- **After ($T_2$)**: Visualizes target radar acquisition.
- **Swipe Comparison**: Interactive draggable split slider allowing real-time before/after comparison across the map.
- **Change Mask**: Toggles the semi-transparent cyan detected change polygons overlay.

---

## API Endpoints

### Processing & Analysis (Phase 4)
- `POST /api/processing/compare` — Executes radar change detection between two verified NISAR observations over a GeoJSON boundary.
- `GET /api/processing/methods` — Lists documented radar change detection algorithms and sensor modes.

### NISAR Catalog & Retrieval (Phase 3)
- `GET /api/nisar/status` — Catalog connectivity status (NASA ASF, CMR, Bhoonidhi) and Earthdata Login diagnostics.
- `GET /api/nisar/samples` — Verified sample regions with confirmed NISAR observations.
- `POST /api/nisar/pair` — Discover and pair official NISAR observations for Baseline ($T_1$) and Target ($T_2$).
- `POST /api/nisar/search` — Search official NISAR granules for a single date.
- `POST /api/nisar/prepare-download` — Prepares verified download URLs and checks Earthdata credentials.

### Foundation & Selection (Phase 1 & 2)
- `GET /api/health` — System uptime and mission status.
- `POST /api/geometry/validate` — Validates GeoJSON polygon bounds, closure, and spherical surface area ($km^2$).
- `POST /api/comparison/validate` — Validates comparison request parameters.
- `POST /api/comparison/request` — Submits and registers a structured observation comparison request.
