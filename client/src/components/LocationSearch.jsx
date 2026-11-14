import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';

const PRESET_REGIONS = [
  { name: 'Himalayan Glaciers', coords: [78.9629, 30.7346], zoom: 7, desc: 'Glacial monitoring' },
  { name: 'San Andreas Fault', coords: [-120.5542, 35.8451], zoom: 7, desc: 'Tectonic deformation' },
  { name: 'Greenland Ice Sheet', coords: [-42.6043, 71.7069], zoom: 5, desc: 'Ice sheet velocity' },
  { name: 'Amazon Basin', coords: [-62.2159, -3.4653], zoom: 6, desc: 'Biomass & hydrology' },
  { name: 'Reykjanes Peninsula', coords: [-22.25, 63.85], zoom: 8, desc: 'Volcanic deformation' },
];

export default function LocationSearch({ onSelectLocation, selectedLocationName }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when location selected externally
  useEffect(() => {
    if (selectedLocationName && !query) {
      // Keep search clear or subtle placeholder
    }
  }, [selectedLocationName]);

  // Handle Geocoding Search with debounce
  useEffect(() => {
    const trimmed = query.trim();

    // Check if user input is coordinate format (lat, lon)
    const coordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*,\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        setResults([{
          id: 'manual-coord',
          name: `Coordinates: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
          lat,
          lon,
          type: 'coordinate'
        }]);
        setIsOpen(true);
        return;
      }
    }

    if (trimmed.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.map(item => ({
            id: item.place_id,
            name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            bbox: item.boundingbox ? [
              parseFloat(item.boundingbox[2]), // minLon
              parseFloat(item.boundingbox[0]), // minLat
              parseFloat(item.boundingbox[3]), // maxLon
              parseFloat(item.boundingbox[1]), // maxLat
            ] : null,
            type: 'place'
          })));
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Location search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item) => {
    if (onSelectLocation) {
      onSelectLocation({
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        zoom: item.zoom || (item.type === 'coordinate' ? 10 : 9),
        bbox: item.bbox || null
      });
    }
    setQuery(item.name.split(',')[0]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-secondaryText pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedLocationName ? `Selected: ${selectedLocationName}` : "Search location or coordinates (lat, lon)..."}
          className="w-full pl-9 pr-8 py-2 bg-surface border border-borderCol rounded-md text-xs text-primaryText placeholder-secondaryText focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition shadow-sm font-sans"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-2.5 p-0.5 text-secondaryText hover:text-primaryText rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Results & Presets */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-surface border border-borderCol rounded-md shadow-lg max-h-72 overflow-y-auto z-30 divide-y divide-slate-100 text-xs">
          {isLoading && (
            <div className="p-3 flex items-center justify-center gap-2 text-secondaryText">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Locating target...</span>
            </div>
          )}

          {/* Search query results */}
          {!isLoading && results.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                Search Results
              </div>
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition group"
                >
                  <MapPin className="w-3.5 h-3.5 text-secondaryText group-hover:text-accent mt-0.5 shrink-0" />
                  <div className="truncate">
                    <p className="text-primaryText truncate group-hover:text-accent font-medium">
                      {item.name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-secondaryText truncate">
                      {item.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Presets when query is empty or no results */}
          {!isLoading && results.length === 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400 flex items-center justify-between">
                <span>Scientific AOI Presets</span>
                <span className="text-[9px] lowercase text-slate-400">SAR focus</span>
              </div>
              {PRESET_REGIONS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelect({
                    name: preset.name,
                    lat: preset.coords[1],
                    lon: preset.coords[0],
                    zoom: preset.zoom,
                    desc: preset.desc
                  })}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3 h-3 text-secondaryText group-hover:text-accent" />
                    <div>
                      <span className="text-primaryText font-medium group-hover:text-accent block">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-secondaryText block">
                        {preset.desc}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    z{preset.zoom}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
