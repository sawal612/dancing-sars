import React, { useState } from 'react';
import { Layers, Globe, Eye, EyeOff, RotateCcw, Grid3X3, SlidersHorizontal, ChevronDown, ChevronUp, Key } from 'lucide-react';

const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY || import.meta.env.VITE_MAPTILER_KEY || '';

export const BASEMAP_STYLES = {
  // 1. Esri World Light Gray Canvas - 100% Free, NO API Key Required, Scientific Standard
  positron: {
    id: 'positron',
    name: 'Scientific Light Canvas (No Key Required)',
    url: {
      version: 8,
      sources: {
        'esri-light-gray': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
        },
        'esri-light-gray-ref': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'esri-light-gray-layer',
          type: 'raster',
          source: 'esri-light-gray',
          minzoom: 0,
          maxzoom: 18
        },
        {
          id: 'esri-light-gray-ref-layer',
          type: 'raster',
          source: 'esri-light-gray-ref',
          minzoom: 0,
          maxzoom: 18
        }
      ]
    }
  },

  // 2. Carto Positron (Minimal Light)
  carto_positron: {
    id: 'carto_positron',
    name: 'Carto Positron Light',
    url: {
      version: 8,
      sources: {
        'carto-positron-tiles': {
          type: 'raster',
          tiles: [
            MAP_API_KEY
              ? `https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?api_key=${MAP_API_KEY}`
              : 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            MAP_API_KEY
              ? `https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png?api_key=${MAP_API_KEY}`
              : 'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }
      },
      layers: [
        {
          id: 'carto-positron-layer',
          type: 'raster',
          source: 'carto-positron-tiles',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    }
  },

  // 3. OpenStreetMap Standard Light
  osm: {
    id: 'osm',
    name: 'OpenStreetMap Standard Light',
    url: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },

  // 4. MapTiler Light (Active when key is provided)
  ...(MAP_API_KEY ? {
    maptiler: {
      id: 'maptiler',
      name: 'MapTiler Dataviz Light (Using API Key)',
      url: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAP_API_KEY}`
    }
  } : {})
};

export default function LayerControls({
  currentBasemap,
  onBasemapChange,
  layers,
  onToggleLayer,
  onResetView,
  onToggleGraticule,
  showGraticule
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface border border-borderCol rounded-md shadow-sm text-xs font-sans">
      {/* Header bar of the control */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-primaryText hover:bg-slate-50 transition rounded-md"
      >
        <div className="flex items-center gap-2 font-medium">
          <Layers className="w-4 h-4 text-accent" />
          <span>Map &amp; Layer Controls</span>
        </div>
        <div className="flex items-center gap-2 text-secondaryText">
          <span className="text-[10px] text-slate-400 capitalize">
            {BASEMAP_STYLES[currentBasemap]?.name?.split(' ')[0] || currentBasemap}
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="px-3 pt-1 pb-3 space-y-3 border-t border-slate-100">
          {/* Basemap selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-secondaryText">
                Basemap Style
              </label>
              {MAP_API_KEY ? (
                <span className="text-[9px] text-emerald-600 font-mono flex items-center gap-0.5">
                  <Key className="w-2.5 h-2.5" />
                  <span>Key Loaded</span>
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 font-mono">
                  No Key Needed
                </span>
              )}
            </div>

            <div className="space-y-1">
              {Object.entries(BASEMAP_STYLES).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => onBasemapChange(key)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition ${
                    currentBasemap === key
                      ? 'bg-accent-50 text-accent font-medium border border-accent-200'
                      : 'text-primaryText hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  {currentBasemap === key && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Overlays / Scientific Grids */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Overlays &amp; Grids
            </label>
            <div className="space-y-1">
              {/* Graticule / Lat-Lon Grid */}
              <button
                onClick={onToggleGraticule}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between border transition ${
                  showGraticule
                    ? 'bg-slate-50 text-primaryText border-slate-300'
                    : 'text-secondaryText hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-3.5 h-3.5 text-secondaryText" />
                  <span>Geographic Graticule (Grid)</span>
                </div>
                {showGraticule ? (
                  <Eye className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* NISAR SAR Footprints Reference Overlay */}
              <button
                onClick={() => onToggleLayer('nisarSwaths')}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between border transition ${
                  layers.nisarSwaths
                    ? 'bg-accent-50 text-accent font-medium border-accent-200'
                    : 'text-secondaryText hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm border border-cyan-500 bg-cyan-100/50 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-accent rounded-[1px]" />
                  </span>
                  <span>SAR AOI Footprints</span>
                </div>
                {layers.nisarSwaths ? (
                  <Eye className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onResetView}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-600 hover:text-primaryText hover:bg-slate-100 rounded border border-borderCol transition"
            >
              <RotateCcw className="w-3 h-3 text-secondaryText" />
              <span>Reset Global View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
