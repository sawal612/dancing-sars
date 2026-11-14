import React, { useState, useRef, useCallback } from 'react';
import Header from './components/Header';
import InteractiveMap from './components/InteractiveMap';
import LocationSearch from './components/LocationSearch';
import LayerControls from './components/LayerControls';
import ComparisonPanel from './components/ComparisonPanel';
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

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden select-none">
      {/* Header */}
      <Header currentCenter={currentCenter} currentZoom={currentZoom} />

      {/* Main Map Container with Minimal Floating Overlays */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Full-bleed Interactive Map with Drawing & Swath Footprints */}
        <InteractiveMap
          basemap={basemap}
          layers={layers}
          showGraticule={showGraticule}
          onMapMove={handleMapMove}
          mapInstanceRef={mapInstanceRef}
          drawMode={drawMode}
          onDrawModeChange={setDrawMode}
          geometry={geometry}
          onGeometryChange={setGeometry}
          isEditing={isEditing}
          retrievedSwaths={retrievedSwaths}
        />

        {/* Floating Controls Sidebar / Stack (Top-Left) */}
        <div className="absolute top-4 left-4 z-10 w-72 sm:w-80 flex flex-col gap-2 pointer-events-auto max-h-[calc(100vh-6.5rem)] overflow-y-auto pr-1">
          {/* Location Search Bar */}
          <LocationSearch
            onSelectLocation={handleSelectLocation}
            selectedLocationName={selectedLocation?.name}
          />

          {/* Observation & Comparison Panel */}
          <ComparisonPanel
            geometry={geometry}
            onGeometryChange={setGeometry}
            drawMode={drawMode}
            onDrawModeChange={setDrawMode}
            isEditing={isEditing}
            onToggleEditing={() => setIsEditing(!isEditing)}
            selectedLocation={selectedLocation}
            onComparisonSubmitted={setSubmittedComparison}
            onObservationsDiscovered={handleObservationsDiscovered}
            onLoadSampleRegion={handleLoadSampleRegion}
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
