import React, { useState, useRef, useCallback, useEffect } from 'react';
import Header from './components/Header';
import InteractiveMap from './components/InteractiveMap';
import LocationSearch from './components/LocationSearch';
import LayerControls from './components/LayerControls';
import ComparisonPanel from './components/ComparisonPanel';
import ComparisonToolbar from './components/ComparisonToolbar';
import ProcessingResultsPanel from './components/ProcessingResultsPanel';
import FloodIntelligencePanel from './components/FloodIntelligencePanel';
import MapLegend from './components/MapLegend';
import TimelineScrubber from './components/TimelineScrubber';
import DataStatus from './components/DataStatus';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import defaultFloodData from './data/defaultFloodData.json';
import { executeRadarComparisonAPI } from './services/api';
import { Layers, Sliders } from 'lucide-react';

const DEFAULT_GEOM = {
  type: 'Polygon',
  coordinates: [[
    [150.25, -35.05],
    [150.95, -35.05],
    [150.95, -34.40],
    [150.25, -34.40],
    [150.25, -35.05]
  ]]
};

const DEFAULT_SWATHS = [
  {
    productIdentifier: 'NISAR_L2_PR_GCOV_001_020_A_045_20260629T180000',
    sensor: 'L-SAR',
    acquisitionDate: '2026-06-29T18:00:00Z',
    geographicalCoverage: { coordinates: [[[150.1, -35.2], [151.1, -35.2], [151.1, -34.3], [150.1, -34.3], [150.1, -35.2]]] }
  },
  {
    productIdentifier: 'NISAR_L2_PR_GCOV_001_020_A_045_20260703T180000',
    sensor: 'L-SAR',
    acquisitionDate: '2026-07-03T18:00:00Z',
    geographicalCoverage: { coordinates: [[[150.1, -35.2], [151.1, -35.2], [151.1, -34.3], [150.1, -34.3], [150.1, -35.2]]] }
  }
];

export default function App() {
  const [currentCenter, setCurrentCenter] = useState({ lat: -34.72, lng: 150.60 });
  const [currentZoom, setCurrentZoom] = useState(10);
  const [basemap, setBasemap] = useState('positron');
  const [showGraticule, setShowGraticule] = useState(false);
  const [layers, setLayers] = useState({
    nisarSwaths: true,
  });

  // Location & Geometry Selection State - Preloaded with Southeastern Australia
  const [selectedLocation, setSelectedLocation] = useState({ name: 'Southeastern Australia (Wollongong & Shoalhaven River)' });
  const [geometry, setGeometry] = useState(DEFAULT_GEOM);
  const [drawMode, setDrawMode] = useState('none'); // 'none' | 'rectangle' | 'polygon'
  const [isEditing, setIsEditing] = useState(false);
  const [submittedComparison, setSubmittedComparison] = useState(null);
  const [retrievedSwaths, setRetrievedSwaths] = useState(DEFAULT_SWATHS);

  // Radar Processing & Visualization State - Preloaded with Reference Flood Data
  const [radarResults, setRadarResults] = useState(defaultFloodData);
  const [comparisonMode, setComparisonMode] = useState('none');
  const [swipePosition, setSwipePosition] = useState(50);
  const [showChangeMask, setShowChangeMask] = useState(true);

  // Reference-Matched Intelligence Panel & Timeline States
  const [showIntelligencePanel, setShowIntelligencePanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [activeTimestep, setActiveTimestep] = useState(8);
  const [timelineMode, setTimelineMode] = useState('accumulated'); // 'accumulated' | 'snapshot'

  const mapInstanceRef = useRef(null);

  const handleMapMove = useCallback((center, zoom) => {
    setCurrentCenter(center);
    setCurrentZoom(zoom);
  }, []);

  const handleSelectLocation = useCallback(async (loc) => {
    setSelectedLocation(loc);
    if (!mapInstanceRef.current) return;

    if (loc.bbox) {
      mapInstanceRef.current.fitBounds(
        [[loc.bbox[0], loc.bbox[1]], [loc.bbox[2], loc.bbox[3]]],
        { padding: 50, maxZoom: 11, duration: 1800 }
      );
    } else {
      mapInstanceRef.current.flyTo({
        center: [loc.lon, loc.lat],
        zoom: loc.zoom || 8,
        essential: true,
        duration: 1800,
      });
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [150.60, -34.72],
        zoom: 10,
        pitch: 0,
        bearing: 0,
        essential: true,
        duration: 1500,
      });
    }
  }, []);

  const handleToggleLayer = useCallback((layerKey) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  }, []);

  const handleToggleGraticule = useCallback(() => {
    setShowGraticule((prev) => !prev);
  }, []);

  // Handle Observations Discovered from NASA ASF
  const handleObservationsDiscovered = useCallback((res) => {
    const swaths = [];
    if (res?.firstObservation?.primaryCandidate) {
      swaths.push(res.firstObservation.primaryCandidate);
    }
    if (res?.secondObservation?.primaryCandidate) {
      swaths.push(res.secondObservation.primaryCandidate);
    }
    setRetrievedSwaths(swaths);
  }, []);

  // Handle Loading a Verified Sample Test Swath
  const handleLoadSampleRegion = useCallback(async (sample) => {
    setSelectedLocation({ name: sample.name });
    const [minLon, minLat, maxLon, maxLat] = sample.bbox;
    const sampleCoords = [
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat]
    ];
    const newGeom = {
      type: 'Polygon',
      coordinates: [sampleCoords]
    };
    setGeometry(newGeom);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [[minLon, minLat], [maxLon, maxLat]],
        { padding: 60, duration: 1800 }
      );
    }

    // Automatically compute flood detection for this sample area immediately
    try {
      const res = await executeRadarComparisonAPI({
        firstObservation: {
          productIdentifier: 'NISAR_SAMPLE_OBS_1',
          acquisitionDate: sample.suggestedDates?.first || '2026-06-29T18:00:00Z',
          polarization: 'Dual-Pol (HH/HV)'
        },
        secondObservation: {
          productIdentifier: 'NISAR_SAMPLE_OBS_2',
          acquisitionDate: sample.suggestedDates?.second || '2026-07-03T18:00:00Z',
          polarization: 'Dual-Pol (HH/HV)'
        },
        geometry: newGeom,
        settings: { thresholdDb: -3.2, changeCategory: 'flood_surface_water' }
      });
      if (res?.success) {
        setRadarResults(res);
        setShowChangeMask(true);
        setShowIntelligencePanel(true);
        setActiveTimestep(8);
      }
    } catch (err) {
      console.warn('Sample auto comparison error:', err);
    }
  }, []);

  // Handle Geometry Change (e.g., user drawn box/polygon or edit)
  const handleGeometryChange = useCallback(async (newGeom) => {
    setGeometry(newGeom);
    if (!newGeom || !newGeom.coordinates || newGeom.coordinates.length === 0) {
      return;
    }

    // Instantly compute and shade the flood inundation for the newly drawn area
    try {
      const res = await executeRadarComparisonAPI({
        firstObservation: {
          productIdentifier: 'NISAR_DRAWN_OBS_1',
          acquisitionDate: '2026-06-29T18:00:00Z',
          polarization: 'Dual-Pol (HH/HV)'
        },
        secondObservation: {
          productIdentifier: 'NISAR_DRAWN_OBS_2',
          acquisitionDate: '2026-07-03T18:00:00Z',
          polarization: 'Dual-Pol (HH/HV)'
        },
        geometry: newGeom,
        settings: { thresholdDb: -3.2, changeCategory: 'flood_surface_water' }
      });
      if (res?.success) {
        setRadarResults(res);
        setShowChangeMask(true);
        setShowIntelligencePanel(true);
      }
    } catch (err) {
      console.warn('Drawn area auto detection error:', err);
    }
  }, []);

  // Handle Radar Change Detection Completion
  const handleProcessingComplete = useCallback((results) => {
    setRadarResults(results);
    setComparisonMode('none');
    setShowChangeMask(true);
    setShowIntelligencePanel(true);
    setActiveTimestep(8);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none font-sans">
      {/* Header */}
      <Header currentCenter={currentCenter} currentZoom={currentZoom} />

      {/* Main Map Container */}
      <main className="relative flex-1 w-full min-h-0 overflow-hidden">
        {/* Full-bleed Interactive Map with Drawing, Swaths, Change Mask & Timestep Filtering */}
        <ErrorBoundary>
          <InteractiveMap
            basemap={basemap}
            layers={layers}
            showGraticule={showGraticule}
            onMapMove={handleMapMove}
            mapInstanceRef={mapInstanceRef}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            geometry={geometry}
            onGeometryChange={handleGeometryChange}
            isEditing={isEditing}
            retrievedSwaths={retrievedSwaths}
            changeMaskGeoJSON={radarResults?.changeMask}
            showChangeMask={showChangeMask}
            comparisonMode={comparisonMode}
            swipePosition={swipePosition}
            onChangeSwipePosition={setSwipePosition}
            firstObservation={radarResults?.observations?.baseline}
            secondObservation={radarResults?.observations?.target}
            activeTimestep={activeTimestep}
            timelineMode={timelineMode}
          />
        </ErrorBoundary>

        {/* 1. TOP-LEFT: Dark Flood Intelligence Panel (Reference-Matched) */}
        {radarResults && showIntelligencePanel ? (
          <div className="absolute top-4 left-4 z-20 pointer-events-auto">
            <FloodIntelligencePanel
              results={radarResults}
              onClose={() => setShowIntelligencePanel(false)}
              activeTimestep={activeTimestep}
              onChangeTimestep={setActiveTimestep}
            />
          </div>
        ) : (
          /* Controls Sidebar / Stack when Intelligence Panel is Closed */
          <div className="absolute top-4 left-4 z-10 w-72 sm:w-80 flex flex-col gap-2 pointer-events-auto max-h-[calc(100vh-6.5rem)] overflow-y-auto pr-1">
            {radarResults && (
              <button
                onClick={() => setShowIntelligencePanel(true)}
                className="w-full py-2 px-3 rounded-lg bg-[#102131] hover:bg-[#1b354b] border border-[#1e3b52] text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Show Flood Intelligence Panel</span>
              </button>
            )}

            {/* Location Search Bar */}
            <LocationSearch
              onSelectLocation={handleSelectLocation}
              selectedLocationName={selectedLocation?.name}
            />

            {/* Observation Selection & NISAR Discovery Panel */}
            <ComparisonPanel
              geometry={geometry}
              onGeometryChange={handleGeometryChange}
              drawMode={drawMode}
              onDrawModeChange={setDrawMode}
              isEditing={isEditing}
              onToggleEditing={() => setIsEditing(!isEditing)}
              selectedLocation={selectedLocation}
              onComparisonSubmitted={setSubmittedComparison}
              onObservationsDiscovered={handleObservationsDiscovered}
              onLoadSampleRegion={handleLoadSampleRegion}
              onProcessingComplete={handleProcessingComplete}
            />

            {/* Basemap & Layer Controls Panel */}
            <LayerControls
              currentBasemap={basemap}
              onBasemapChange={setBasemap}
              layers={layers}
              onToggleLayer={handleToggleLayer}
              onResetView={handleResetView}
              showGraticule={showGraticule}
              onToggleGraticule={handleToggleGraticule}
            />
          </div>
        )}

        {/* Small floating button to reopen settings/search if Intelligence Panel is open */}
        {radarResults && showIntelligencePanel && (
          <div className="absolute top-4 left-[340px] sm:left-[380px] z-10 pointer-events-auto">
            <button
              onClick={() => setShowIntelligencePanel(false)}
              className="bg-[#102131]/90 hover:bg-[#1b354b] border border-[#1e3b52] text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-md flex items-center gap-1.5 transition-all"
              title="Show Search & Layer Controls"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Layers</span>
            </button>
          </div>
        )}

        {/* 2. BOTTOM-LEFT: Map Legend (Reference-Matched) */}
        {showLegend && (
          <div className="absolute bottom-12 left-4 z-20 pointer-events-auto">
            <MapLegend onClose={() => setShowLegend(false)} />
          </div>
        )}

        {/* 3. BOTTOM-RIGHT: Timeline Scrubber (Reference-Matched) */}
        {radarResults && (
          <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
            <TimelineScrubber
              deliveries={radarResults?.timelineDeliveries}
              activeTimestep={activeTimestep}
              onChangeTimestep={setActiveTimestep}
              timelineMode={timelineMode}
              onChangeTimelineMode={setTimelineMode}
            />
          </div>
        )}

        {/* Small Satellite Data Status Indicator */}
        <div className="absolute bottom-2 left-4 z-10 max-w-xs pointer-events-auto opacity-75 hover:opacity-100 transition-opacity">
          <DataStatus />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
