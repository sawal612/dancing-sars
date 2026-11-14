import React, { useState, useRef, useCallback } from 'react';
import Header from './components/Header';
import InteractiveMap from './components/InteractiveMap';
import LocationSearch from './components/LocationSearch';
import LayerControls from './components/LayerControls';
import ComparisonPanel from './components/ComparisonPanel';
import ComparisonToolbar from './components/ComparisonToolbar';
import ProcessingResultsPanel from './components/ProcessingResultsPanel';
import DataStatus from './components/DataStatus';
import Footer from './components/Footer';

export default function App() {
  const [currentCenter, setCurrentCenter] = useState({ lat: 20, lng: 0 });
  const [currentZoom, setCurrentZoom] = useState(2);
  const [basemap, setBasemap] = useState('positron');
  const [showGraticule, setShowGraticule] = useState(false);
  const [layers, setLayers] = useState({
    nisarSwaths: true,
  });

  // Location & Geometry Selection State
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geometry, setGeometry] = useState(null);
  const [drawMode, setDrawMode] = useState('none'); // 'none' | 'rectangle' | 'polygon'
  const [isEditing, setIsEditing] = useState(false);
  const [submittedComparison, setSubmittedComparison] = useState(null);
  const [retrievedSwaths, setRetrievedSwaths] = useState([]);

  // Phase 4: Radar Processing & Visualization State
  const [radarResults, setRadarResults] = useState(null);
  const [comparisonMode, setComparisonMode] = useState('swipe'); // 'before' | 'after' | 'swipe'
  const [swipePosition, setSwipePosition] = useState(50);
  const [showChangeMask, setShowChangeMask] = useState(true);

  const mapInstanceRef = useRef(null);

  const handleMapMove = useCallback((center, zoom) => {
    setCurrentCenter(center);
    setCurrentZoom(zoom);
  }, []);

  const handleSelectLocation = useCallback((loc) => {
    setSelectedLocation(loc);
    if (!mapInstanceRef.current) return;

    if (loc.bbox) {
      // bbox: [minLon, minLat, maxLon, maxLat]
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
        center: [0, 20],
        zoom: 2,
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
  const handleLoadSampleRegion = useCallback((sample) => {
    setSelectedLocation({ name: sample.name });
    const [minLon, minLat, maxLon, maxLat] = sample.bbox;
    const sampleCoords = [
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat]
    ];
    setGeometry({
      type: 'Polygon',
      coordinates: [sampleCoords]
    });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [[minLon, minLat], [maxLon, maxLat]],
        { padding: 60, duration: 1800 }
      );
    }
  }, []);

  // Handle Radar Change Detection Completion
  const handleProcessingComplete = useCallback((results) => {
    setRadarResults(results);
    setComparisonMode('swipe');
    setShowChangeMask(true);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none font-sans">
      {/* Header */}
      <Header currentCenter={currentCenter} currentZoom={currentZoom} />

      {/* Main Map Container with Minimal Floating Overlays */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full-bleed Interactive Map with Drawing, Swaths, Change Mask & Swipe */}
        <InteractiveMap
          basemap={basemap}
          layers={layers}
          showGraticule={showGraticule}
          onMapMove={handleMapMove}
          mapInstanceRef={mapInstanceRef}
          drawMode={drawMode}
          onDrawModeChange={setDrawMode}
          geometry={geometry}
          onGeometryChange={(newGeom) => {
            setGeometry(newGeom);
            setRadarResults(null);
          }}
          isEditing={isEditing}
          retrievedSwaths={retrievedSwaths}
          changeMaskGeoJSON={radarResults?.changeMask}
          showChangeMask={showChangeMask}
          comparisonMode={comparisonMode}
          swipePosition={swipePosition}
          onChangeSwipePosition={setSwipePosition}
          firstObservation={radarResults?.observations?.baseline}
          secondObservation={radarResults?.observations?.target}
        />

        {/* Floating Controls Sidebar / Stack (Top-Left) */}
        <div className="absolute top-4 left-4 z-10 w-72 sm:w-80 flex flex-col gap-2 pointer-events-auto max-h-[calc(100vh-6.5rem)] overflow-y-auto pr-1">
          {/* Location Search Bar */}
          <LocationSearch
            onSelectLocation={handleSelectLocation}
            selectedLocationName={selectedLocation?.name}
          />

          {/* Observation Selection & NISAR Discovery Panel */}
          <ComparisonPanel
            geometry={geometry}
            onGeometryChange={(newGeom) => {
              setGeometry(newGeom);
              setRadarResults(null);
            }}
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

        {/* Comparison Viewer Toolbar (Top-Center) when Processing Results are Available */}
        {radarResults && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <ComparisonToolbar
              comparisonMode={comparisonMode}
              onChangeComparisonMode={setComparisonMode}
              showChangeMask={showChangeMask}
              onToggleChangeMask={() => setShowChangeMask(!showChangeMask)}
              swipePosition={swipePosition}
              onChangeSwipePosition={setSwipePosition}
              firstDate={radarResults?.statistics?.firstObservationDate}
              secondDate={radarResults?.statistics?.secondObservationDate}
            />
          </div>
        )}

        {/* Radar Processing Results Panel (Top-Right) */}
        {radarResults && (
          <div className="absolute top-4 right-4 z-20 pointer-events-auto">
            <ProcessingResultsPanel
              results={radarResults}
              onClose={() => setRadarResults(null)}
              showChangeMask={showChangeMask}
              onToggleChangeMask={() => setShowChangeMask(!showChangeMask)}
              comparisonMode={comparisonMode}
              onChangeComparisonMode={setComparisonMode}
            />
          </div>
        )}

        {/* Small Satellite Data Status Indicator (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-10 max-w-xs pointer-events-auto">
          <DataStatus />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
