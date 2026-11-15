import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { BASEMAP_STYLES } from './LayerControls';

// Dynamic GeoJSON Graticule
function createGraticuleGeoJSON() {
  const features = [];
  for (let lat = -80; lat <= 80; lat += 20) {
    const coords = [];
    for (let lon = -180; lon <= 180; lon += 5) coords.push([lon, lat]);
    features.push({
      type: 'Feature',
      properties: { name: `${lat}°` },
      geometry: { type: 'LineString', coordinates: coords }
    });
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const coords = [];
    for (let lat = -85; lat <= 85; lat += 5) coords.push([lon, lat]);
    features.push({
      type: 'Feature',
      properties: { name: `${lon}°` },
      geometry: { type: 'LineString', coordinates: coords }
    });
  }
  return { type: 'FeatureCollection', features };
}

// Representative nominal NISAR Observation Zones
const NISAR_AOI_FOOTPRINTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { aoi: 'Himalayan Cryosphere', band: 'L-band / S-band' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[75.0, 28.0], [88.0, 28.0], [86.0, 35.0], [74.0, 35.0], [75.0, 28.0]]]
      }
    },
    {
      type: 'Feature',
      properties: { aoi: 'San Andreas Fault Zone', band: 'L-band' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-124.0, 32.5], [-115.0, 32.5], [-120.0, 40.0], [-126.0, 40.0], [-124.0, 32.5]]]
      }
    },
    {
      type: 'Feature',
      properties: { aoi: 'Amazon Basin Calibration', band: 'L-band' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-68.0, -8.0], [-55.0, -8.0], [-57.0, 2.0], [-67.0, 2.0], [-68.0, -8.0]]]
      }
    }
  ]
};

export default function InteractiveMap({
  basemap,
  layers,
  showGraticule,
  onMapMove,
  mapInstanceRef,
  drawMode = 'none', // 'none' | 'rectangle' | 'polygon'
  onDrawModeChange,
  geometry,
  onGeometryChange,
  isEditing = false,
  retrievedSwaths = [],
  changeMaskGeoJSON = null,
  showChangeMask = true,
  comparisonMode = 'before', // 'before' | 'after' | 'swipe'
  swipePosition = 50,
  onChangeSwipePosition,
  firstObservation = null,
  secondObservation = null,
  activeTimestep = 8,
  timelineMode = 'accumulated'
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // Drawing state refs
  const drawingStateRef = useRef({
    startPoint: null,
    points: [],
    isDrawing: false,
  });

  const vertexMarkersRef = useRef([]);

  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;

  const changeMaskRef = useRef(changeMaskGeoJSON);
  changeMaskRef.current = changeMaskGeoJSON;

  const activeTimestepRef = useRef(activeTimestep);
  activeTimestepRef.current = activeTimestep;

  const timelineModeRef = useRef(timelineMode);
  timelineModeRef.current = timelineMode;

  const retrievedSwathsRef = useRef(retrievedSwaths);
  retrievedSwathsRef.current = retrievedSwaths;

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    const initialLon = parseFloat(import.meta.env.VITE_MAP_DEFAULT_CENTER_LON || '150.60');
    const initialLat = parseFloat(import.meta.env.VITE_MAP_DEFAULT_CENTER_LAT || '-34.72');
    const initialZoom = parseFloat(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '10');

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLES[basemap]?.url || BASEMAP_STYLES.positron.url,
      center: [initialLon, initialLat],
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    // Navigation & Scale Controls
    const navControl = new maplibregl.NavigationControl({
      showCompass: true,
      visualizePitch: true,
    });
    map.addControl(navControl, 'top-right');

    const scaleControl = new maplibregl.ScaleControl({
      maxWidth: 120,
      unit: 'metric'
    });
    map.addControl(scaleControl, 'bottom-right');

    map.on('move', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      if (onMapMove) {
        onMapMove({ lat: center.lat, lng: center.lng }, zoom);
      }
    });

    const setupLayers = () => {
      try {
        if (!map.isStyleLoaded()) return;

        // 1. Graticule
        if (!map.getSource('graticule-source')) {
          map.addSource('graticule-source', {
            type: 'geojson',
            data: createGraticuleGeoJSON()
          });
          map.addLayer({
            id: 'graticule-lines',
            type: 'line',
            source: 'graticule-source',
            layout: { visibility: showGraticule ? 'visible' : 'none' },
            paint: {
              'line-color': '#94A3B8',
              'line-width': 0.75,
              'line-dasharray': [2, 3],
              'line-opacity': 0.6
            }
          });
        }

        // 2. Reference NISAR Swaths
        if (!map.getSource('nisar-aoi-source')) {
          map.addSource('nisar-aoi-source', {
            type: 'geojson',
            data: NISAR_AOI_FOOTPRINTS
          });
          map.addLayer({
            id: 'nisar-aoi-fill',
            type: 'fill',
            source: 'nisar-aoi-source',
            layout: { visibility: layers?.nisarSwaths ? 'visible' : 'none' },
            paint: { 'fill-color': '#0891B2', 'fill-opacity': 0.05 }
          });
          map.addLayer({
            id: 'nisar-aoi-stroke',
            type: 'line',
            source: 'nisar-aoi-source',
            layout: { visibility: layers?.nisarSwaths ? 'visible' : 'none' },
            paint: {
              'line-color': '#0891B2',
              'line-width': 1.25,
              'line-dasharray': [4, 2],
              'line-opacity': 0.7
            }
          });
        }

        // 3. User Selected AOI Layers
        if (!map.getSource('user-aoi-source')) {
          map.addSource('user-aoi-source', {
            type: 'geojson',
            data: geometryRef.current?.coordinates?.length > 0 ? {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                properties: { aoi: 'Monitored Observation Area' },
                geometry: geometryRef.current
              }]
            } : {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.addLayer({
            id: 'user-aoi-fill',
            type: 'fill',
            source: 'user-aoi-source',
            paint: {
              'fill-color': '#0891B2',
              'fill-opacity': 0.18
            }
          });

          map.addLayer({
            id: 'user-aoi-stroke',
            type: 'line',
            source: 'user-aoi-source',
            paint: {
              'line-color': '#0284C7',
              'line-width': 2.5,
              'line-dasharray': [4, 2]
            }
          });
        }

        // 4. In-progress Drawing Preview Layer
        if (!map.getSource('user-aoi-preview-source')) {
          map.addSource('user-aoi-preview-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.addLayer({
            id: 'user-aoi-preview-fill',
            type: 'fill',
            source: 'user-aoi-preview-source',
            paint: {
              'fill-color': '#F59E0B',
              'fill-opacity': 0.25
            }
          });

          map.addLayer({
            id: 'user-aoi-preview-stroke',
            type: 'line',
            source: 'user-aoi-preview-source',
            paint: {
              'line-color': '#F59E0B',
              'line-width': 2.5,
              'line-dasharray': [3, 2]
            }
          });
        }

        // 5. Retrieved NISAR Observation Swaths Layer
        if (!map.getSource('nisar-retrieved-swaths-source')) {
          map.addSource('nisar-retrieved-swaths-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.addLayer({
            id: 'nisar-retrieved-swaths-fill',
            type: 'fill',
            source: 'nisar-retrieved-swaths-source',
            paint: {
              'fill-color': '#0891B2',
              'fill-opacity': 0.09
            }
          });

          map.addLayer({
            id: 'nisar-retrieved-swaths-stroke',
            type: 'line',
            source: 'nisar-retrieved-swaths-source',
            paint: {
              'line-color': '#0E7490',
              'line-width': 1.8,
              'line-dasharray': [3, 2]
            }
          });
        }

        // 6. Radar Detected Change Mask Layer (Flood Inundation)
        if (!map.getSource('radar-change-mask-source')) {
          let initialMaskFeatures = changeMaskRef.current?.features || [];
          if (activeTimestepRef.current != null && initialMaskFeatures.length > 0) {
            initialMaskFeatures = initialMaskFeatures.filter((f) => {
              const t = f.properties?.timestep;
              if (t == null) return true;
              return timelineModeRef.current === 'snapshot'
                ? t === activeTimestepRef.current
                : t <= activeTimestepRef.current;
            });
          }

          map.addSource('radar-change-mask-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: initialMaskFeatures
            }
          });

          map.addLayer({
            id: 'radar-change-mask-fill',
            type: 'fill',
            source: 'radar-change-mask-source',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'fill-color': '#1D70B8',
              'fill-opacity': 0.85
            }
          });

          map.addLayer({
            id: 'radar-change-mask-stroke',
            type: 'line',
            source: 'radar-change-mask-source',
            layout: {
              visibility: 'visible'
            },
            paint: {
              'line-color': '#0B4F8A',
              'line-width': 2.0
            }
          });
        }

        // Immediately push existing data to newly setup sources
        const aoiSrc = map.getSource('user-aoi-source');
        if (aoiSrc && geometryRef.current?.coordinates?.length > 0) {
          aoiSrc.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { aoi: 'Selected Observation AOI' },
              geometry: geometryRef.current
            }]
          });
        }

        const maskSrc = map.getSource('radar-change-mask-source');
        if (maskSrc && changeMaskRef.current?.features?.length > 0) {
          maskSrc.setData(changeMaskRef.current);
        }

        const swathsSrc = map.getSource('nisar-retrieved-swaths-source');
        if (swathsSrc && retrievedSwathsRef.current?.length > 0) {
          const feats = retrievedSwathsRef.current
            .filter(s => s?.geographicalCoverage?.coordinates)
            .map(s => ({
              type: 'Feature',
              properties: { title: s.productIdentifier, sensor: s.sensor, date: s.acquisitionDate },
              geometry: { type: 'Polygon', coordinates: s.geographicalCoverage.coordinates }
            }));
          swathsSrc.setData({ type: 'FeatureCollection', features: feats });
        }
      } catch (err) {
        console.warn('[MapLibre] setupLayers warning:', err);
      }
    };

    // Ensure layers are setup on both load and style.load, or immediately if already loaded
    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.on('load', setupLayers);
      map.on('style.load', setupLayers);
    }

    mapRef.current = map;
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }

    onMapMove({ lat: initialLat, lng: initialLon }, initialZoom);

    // Progressive resize triggers to ensure full viewport fill inside flexbox
    requestAnimationFrame(() => map.resize());
    const t1 = setTimeout(() => map.resize(), 150);
    const t2 = setTimeout(() => map.resize(), 600);

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    map.on('error', (e) => {
      console.warn('[MapLibre Map Warning]:', e.error?.message || e);
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync Geometry Data to Map Source
  const syncGeometryToMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const doSync = () => {
      try {
        const source = map.getSource('user-aoi-source');
        if (!source) return;

        if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
          source.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { aoi: 'Selected Observation AOI' },
                geometry: {
                  type: 'Polygon',
                  coordinates: geometry.coordinates
                }
              }
            ]
          });
          try {
            if (map.getLayer('user-aoi-fill')) map.moveLayer('user-aoi-fill');
            if (map.getLayer('radar-change-mask-fill')) map.moveLayer('radar-change-mask-fill');
            if (map.getLayer('radar-change-mask-stroke')) map.moveLayer('radar-change-mask-stroke');
            if (map.getLayer('user-aoi-stroke')) map.moveLayer('user-aoi-stroke');
          } catch {}
        } else {
          source.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      } catch (err) {
        console.warn('[MapLibre] syncGeometry error:', err.message);
      }
    };

    if (map.isStyleLoaded()) {
      doSync();
    } else {
      map.once('style.load', doSync);
    }
  }, [geometry]);

  useEffect(() => {
    syncGeometryToMap();
  }, [geometry, syncGeometryToMap]);

  // Sync Retrieved NISAR Swaths to Map Source
  const syncRetrievedSwaths = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const doSync = () => {
      try {
        const source = map.getSource('nisar-retrieved-swaths-source');
        if (!source) return;

        if (retrievedSwaths && retrievedSwaths.length > 0) {
          const features = retrievedSwaths
            .filter((s) => s?.geographicalCoverage?.coordinates)
            .map((s) => ({
              type: 'Feature',
              properties: {
                title: s.productIdentifier,
                sensor: s.sensor,
                date: s.acquisitionDate,
              },
              geometry: {
                type: 'Polygon',
                coordinates: s.geographicalCoverage.coordinates,
              },
            }));

          source.setData({
            type: 'FeatureCollection',
            features,
          });
        } else {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      } catch (err) {
        console.warn('[MapLibre] syncSwaths error:', err.message);
      }
    };

    if (map.isStyleLoaded()) {
      doSync();
    } else {
      map.once('style.load', doSync);
    }
  }, [retrievedSwaths]);

  useEffect(() => {
    syncRetrievedSwaths();
  }, [retrievedSwaths, syncRetrievedSwaths]);

  // Sync Change Mask to Map Source
  const syncChangeMask = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const doSync = () => {
      try {
        const source = map.getSource('radar-change-mask-source');
        if (!source) return;

        if (changeMaskGeoJSON && changeMaskGeoJSON.features && changeMaskGeoJSON.features.length > 0) {
          let filteredFeatures = changeMaskGeoJSON.features;
          if (activeTimestep != null) {
            filteredFeatures = filteredFeatures.filter((f) => {
              const t = f.properties?.timestep;
              if (t == null) return true;
              return timelineMode === 'snapshot' ? t === activeTimestep : t <= activeTimestep;
            });
          }

          source.setData({
            type: 'FeatureCollection',
            features: filteredFeatures
          });
          try {
            if (map.getLayer('radar-change-mask-fill')) map.moveLayer('radar-change-mask-fill');
            if (map.getLayer('radar-change-mask-stroke')) map.moveLayer('radar-change-mask-stroke');
            if (map.getLayer('user-aoi-stroke')) map.moveLayer('user-aoi-stroke');
          } catch {}
        } else {
          source.setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      } catch (err) {
        console.warn('[MapLibre] syncChangeMask error:', err.message);
      }
    };

    if (map.isStyleLoaded()) {
      doSync();
    } else {
      map.once('style.load', doSync);
    }
  }, [changeMaskGeoJSON, activeTimestep, timelineMode]);

  useEffect(() => {
    syncChangeMask();
  }, [changeMaskGeoJSON, activeTimestep, timelineMode, syncChangeMask]);

  // Update Change Mask visibility
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const visibility = showChangeMask ? 'visible' : 'none';
    try {
      if (mapRef.current.getLayer('radar-change-mask-fill')) {
        mapRef.current.setLayoutProperty('radar-change-mask-fill', 'visibility', visibility);
      }
      if (mapRef.current.getLayer('radar-change-mask-stroke')) {
        mapRef.current.setLayoutProperty('radar-change-mask-stroke', 'visibility', visibility);
      }
    } catch (err) {
      console.warn('[MapLibre] visibility update warning:', err.message);
    }
  }, [showChangeMask]);

  // Update Basemap Style dynamically (skip initial mount to prevent layer destruction)
  const basemapRef = useRef(basemap);
  useEffect(() => {
    if (basemapRef.current === basemap) return;
    basemapRef.current = basemap;
    if (!mapRef.current) return;
    const styleObj = BASEMAP_STYLES[basemap]?.url;
    if (styleObj) {
      mapRef.current.setStyle(styleObj);
    }
  }, [basemap]);

  // Update Graticule visibility
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const visibility = showGraticule ? 'visible' : 'none';
    if (mapRef.current.getLayer('graticule-lines')) {
      mapRef.current.setLayoutProperty('graticule-lines', 'visibility', visibility);
    }
  }, [showGraticule]);

  // Clear preview drawing source
  const clearPreview = () => {
    if (!mapRef.current) return;
    const previewSource = mapRef.current.getSource('user-aoi-preview-source');
    if (previewSource) {
      previewSource.setData({ type: 'FeatureCollection', features: [] });
    }
  };

  // Interactive Drawing Handlers (Rectangle & Polygon)
  const [polygonPointCount, setPolygonPointCount] = useState(0);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();

    if (drawMode === 'rectangle' || drawMode === 'polygon') {
      canvas.style.cursor = 'crosshair';
      map.doubleClickZoom.disable();
    } else {
      canvas.style.cursor = '';
      map.doubleClickZoom.enable();
      clearPreview();
      drawingStateRef.current = { startPoint: null, points: [], isDrawing: false };
      setPolygonPointCount(0);
      return;
    }

    const bringPreviewToTop = () => {
      try {
        if (map.getLayer('user-aoi-preview-fill')) map.moveLayer('user-aoi-preview-fill');
        if (map.getLayer('user-aoi-preview-stroke')) map.moveLayer('user-aoi-preview-stroke');
      } catch {}
    };

    // CLICK HANDLER
    const handleMapClick = (e) => {
      const clickCoord = [e.lngLat.lng, e.lngLat.lat];

      if (drawMode === 'rectangle') {
        if (!drawingStateRef.current.isDrawing) {
          // Corner 1
          drawingStateRef.current.startPoint = clickCoord;
          drawingStateRef.current.isDrawing = true;
          bringPreviewToTop();
        } else {
          // Corner 2 -> Finalize rectangle
          const start = drawingStateRef.current.startPoint;
          const end = clickCoord;
          const minLon = Math.min(start[0], end[0]);
          const maxLon = Math.max(start[0], end[0]);
          const minLat = Math.min(start[1], end[1]);
          const maxLat = Math.max(start[1], end[1]);

          // Prevent zero-size rectangle
          if (Math.abs(maxLon - minLon) > 0.0001 && Math.abs(maxLat - minLat) > 0.0001) {
            const rectCoords = [
              [minLon, minLat],
              [maxLon, minLat],
              [maxLon, maxLat],
              [minLon, maxLat],
              [minLon, minLat]
            ];

            clearPreview();
            drawingStateRef.current = { startPoint: null, points: [], isDrawing: false };

            if (onGeometryChange) {
              onGeometryChange({
                type: 'Polygon',
                coordinates: [rectCoords]
              });
            }
            if (onDrawModeChange) {
              onDrawModeChange('none');
            }
          }
        }
      } else if (drawMode === 'polygon') {
        const pts = drawingStateRef.current.points;

        // Check if clicked near start point to close (within 25px)
        if (pts.length >= 3) {
          const firstPt = pts[0];
          const screenFirst = map.project(firstPt);
          const screenClick = map.project(clickCoord);
          const dist = Math.hypot(screenFirst.x - screenClick.x, screenFirst.y - screenClick.y);

          if (dist < 25) {
            // Close polygon
            const closedCoords = [...pts, pts[0]];
            clearPreview();
            drawingStateRef.current = { startPoint: null, points: [], isDrawing: false };
            setPolygonPointCount(0);

            if (onGeometryChange) {
              onGeometryChange({
                type: 'Polygon',
                coordinates: [closedCoords]
              });
            }
            if (onDrawModeChange) {
              onDrawModeChange('none');
            }
            return;
          }
        }

        // Add vertex
        const updatedPts = [...pts, clickCoord];
        drawingStateRef.current.points = updatedPts;
        drawingStateRef.current.isDrawing = true;
        setPolygonPointCount(updatedPts.length);
        bringPreviewToTop();

        // Update preview line
        const previewSource = map.getSource('user-aoi-preview-source');
        if (previewSource && updatedPts.length > 1) {
          previewSource.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: updatedPts
                }
              }
            ]
          });
        }
      }
    };

    // MOUSE MOVE HANDLER (Dynamic rubber-band preview)
    const handleMouseMove = (e) => {
      if (!drawingStateRef.current.isDrawing) return;
      const currCoord = [e.lngLat.lng, e.lngLat.lat];
      const previewSource = map.getSource('user-aoi-preview-source');
      if (!previewSource) return;

      if (drawMode === 'rectangle' && drawingStateRef.current.startPoint) {
        const start = drawingStateRef.current.startPoint;
        const minLon = Math.min(start[0], currCoord[0]);
        const maxLon = Math.max(start[0], currCoord[0]);
        const minLat = Math.min(start[1], currCoord[1]);
        const maxLat = Math.max(start[1], currCoord[1]);

        previewSource.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [minLon, minLat],
                  [maxLon, minLat],
                  [maxLon, maxLat],
                  [minLon, maxLat],
                  [minLon, minLat]
                ]]
              }
            }
          ]
        });
      } else if (drawMode === 'polygon' && drawingStateRef.current.points.length > 0) {
        const pts = [...drawingStateRef.current.points, currCoord];
        previewSource.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: pts
              }
            }
          ]
        });
      }
    };

    // DOUBLE CLICK HANDLER (Close polygon)
    const handleDblClick = (e) => {
      e.preventDefault();
      if (drawMode === 'polygon' && drawingStateRef.current.points.length >= 3) {
        const pts = drawingStateRef.current.points;
        const closedCoords = [...pts, pts[0]];

        clearPreview();
        drawingStateRef.current = { startPoint: null, points: [], isDrawing: false };
        setPolygonPointCount(0);

        if (onGeometryChange) {
          onGeometryChange({
            type: 'Polygon',
            coordinates: [closedCoords]
          });
        }
        if (onDrawModeChange) {
          onDrawModeChange('none');
        }
      }
    };

    // ESCAPE KEY TO CANCEL
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        clearPreview();
        drawingStateRef.current = { startPoint: null, points: [], isDrawing: false };
        setPolygonPointCount(0);
        if (onDrawModeChange) {
          onDrawModeChange('none');
        }
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.on('dblclick', handleDblClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.off('dblclick', handleDblClick);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.style.cursor = '';
      map.doubleClickZoom.enable();
      clearPreview();
    };
  }, [drawMode, onGeometryChange, onDrawModeChange]);

  // Vertex Drag Editing Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    vertexMarkersRef.current.forEach(marker => marker.remove());
    vertexMarkersRef.current = [];

    if (!isEditing || !geometry || !geometry.coordinates || !geometry.coordinates[0]) {
      return;
    }

    const ring = geometry.coordinates[0];
    const uniqueVertexCount = ring.length - 1; // last equals first

    const markers = [];

    for (let i = 0; i < uniqueVertexCount; i++) {
      const coord = ring[i];
      const el = document.createElement('div');
      el.className = 'w-3.5 h-3.5 bg-white border-2 border-accent rounded-full shadow-md cursor-move hover:scale-125 transition-transform';
      el.title = `Vertex ${i + 1}: drag to adjust`;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat(coord)
        .addTo(map);

      marker.on('drag', () => {
        const newLngLat = marker.getLngLat();
        const updatedRing = [...geometry.coordinates[0]];
        updatedRing[i] = [newLngLat.lng, newLngLat.lat];
        if (i === 0) {
          // keep closed ring first = last
          updatedRing[updatedRing.length - 1] = [newLngLat.lng, newLngLat.lat];
        }

        // Live update source
        const source = map.getSource('user-aoi-source');
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [updatedRing] }
            }]
          });
        }
      });

      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        const updatedRing = [...geometry.coordinates[0]];
        updatedRing[i] = [newLngLat.lng, newLngLat.lat];
        if (i === 0) {
          updatedRing[updatedRing.length - 1] = [newLngLat.lng, newLngLat.lat];
        }

        if (onGeometryChange) {
          onGeometryChange({
            type: 'Polygon',
            coordinates: [updatedRing]
          });
        }
      });

      markers.push(marker);
    }

    vertexMarkersRef.current = markers;

    return () => {
      markers.forEach(m => m.remove());
      vertexMarkersRef.current = [];
    };
  }, [isEditing, geometry, onGeometryChange]);

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-[#F1F5F9]" />

      {/* Floating Drawing Helper Hint */}
      {drawMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-surface/95 backdrop-blur-sm border border-accent/40 rounded-full px-4 py-1.5 shadow-md flex items-center gap-2 text-xs text-primaryText font-sans animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span>
            {drawMode === 'rectangle'
              ? 'Click first corner, then click opposite corner to finish rectangle.'
              : 'Click vertices on map. Click near start point or double-click to close polygon.'}
          </span>
          <button
            onClick={() => onDrawModeChange && onDrawModeChange('none')}
            className="ml-2 text-[10px] font-semibold text-secondaryText hover:text-red-500 uppercase tracking-wider"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Swipe Comparison Vertical Divider Overlay (Only active when comparison results exist and swipe mode is chosen) */}
      {comparisonMode === 'swipe' && Boolean(changeMaskGeoJSON || firstObservation) && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-10"
          style={{ left: `${swipePosition}%` }}
        >
          {/* Vertical divider line */}
          <div className="w-0.5 h-full bg-accent shadow-[0_0_8px_rgba(8,145,178,0.6)]" />

          {/* Draggable-feel handle in the center */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-accent shadow-lg flex items-center justify-center text-accent pointer-events-auto cursor-ew-resize">
            <span className="text-[11px] font-bold">⇄</span>
          </div>

          {/* Before / After Floating Badges */}
          <div className="absolute top-16 -left-28 bg-white/90 backdrop-blur-sm border border-borderCol px-2 py-0.5 rounded shadow-sm text-[10px] font-semibold text-slate-700 pointer-events-none">
            ◀ T₁ Baseline
          </div>
          <div className="absolute top-16 left-3 bg-white/90 backdrop-blur-sm border border-borderCol px-2 py-0.5 rounded shadow-sm text-[10px] font-semibold text-slate-700 pointer-events-none">
            T₂ Target ▶
          </div>
        </div>
      )}
    </div>
  );
}
