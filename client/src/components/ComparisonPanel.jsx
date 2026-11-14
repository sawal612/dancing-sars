import React, { useState, useEffect, useRef } from 'react';
import {
  Square,
  Pentagon,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  ArrowRight,
  Send,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Droplets,
  Satellite,
  Compass,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  validateGeometryAPI,
  submitComparisonRequestAPI,
  pairNisarObservationsAPI,
  fetchNisarSamples,
  executeRadarComparisonAPI
} from '../services/api';
import ObservationDetails from './ObservationDetails';

const DEFAULT_SAMPLES = [
  {
    id: 'north_america_calval',
    name: 'North American Calibration Swath (Mississippi Basin)',
    description: 'Hydrological validation corridor with continuous dual-pol backscatter acquisitions.',
    bbox: [-92.0, 31.0, -87.0, 35.0],
    suggestedDates: { first: '2025-10-29', second: '2025-11-09' },
    verifiedProducts: 'L2 GCOV (DHDH)'
  },
  {
    id: 'alaska_glaciers',
    name: 'Yukon-Kuskokwim Delta & Alaska Glaciers',
    description: 'Active NASA ASF validation swath area with multi-temporal L-band RSLC & GCOV observations.',
    bbox: [-166.0, 59.0, -158.0, 64.0],
    suggestedDates: { first: '2026-11-03', second: '2026-11-05' },
    verifiedProducts: 'L1 RSLC & L2 GCOV Dual-Pol'
  },
  {
    id: 'greenland_cryosphere',
    name: 'Greenland Ice Sheet Velocity Corridor',
    description: 'High-latitude L-SAR validation tracking ice flow velocity and melt events.',
    bbox: [-50.0, 68.0, -42.0, 72.0],
    suggestedDates: { first: '2026-11-03', second: '2026-11-05' },
    verifiedProducts: 'L1 RSLC & L2 GCOV'
  }
];

export default function ComparisonPanel({
  geometry,
  onGeometryChange,
  drawMode,
  onDrawModeChange,
  isEditing,
  onToggleEditing,
  selectedLocation,
  onComparisonSubmitted,
  onObservationsDiscovered,
  onLoadSampleRegion,
  onProcessingComplete,
  isProcessingRadar = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Change category
  const [changeCategory] = useState('flood_surface_water');

  // Dates
  const defaultFirst = '2025-10-29';
  const defaultSecond = '2025-11-09';

  const [firstDate, setFirstDate] = useState(defaultFirst);
  const [secondDate, setSecondDate] = useState(defaultSecond);

  // Validation & Discovery states
  const [geoValidation, setGeoValidation] = useState({ loading: false, valid: false, errors: [], metrics: null });
  const [dateError, setDateError] = useState(null);

  // NISAR Discovery state
  const [isSearchingNisar, setIsSearchingNisar] = useState(false);
  const [nisarPairResult, setNisarPairResult] = useState(null);
  const [toleranceDays, setToleranceDays] = useState(5);
  const [sampleRegions, setSampleRegions] = useState(DEFAULT_SAMPLES);
  const resultsRef = useRef(null);

  // Auto-scroll to results when NISAR observations are discovered
  useEffect(() => {
    if (nisarPairResult && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [nisarPairResult]);

  // Final submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Fetch verified sample regions on mount
  useEffect(() => {
    fetchNisarSamples().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setSampleRegions(res);
      }
    });
  }, []);

  // Validate geometry whenever it changes
  useEffect(() => {
    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
      setGeoValidation({ loading: false, valid: false, errors: [], metrics: null });
      setNisarPairResult(null);
      return;
    }

    let active = true;
    setGeoValidation((prev) => ({ ...prev, loading: true }));

    validateGeometryAPI(geometry).then((res) => {
      if (!active) return;
      if (res.valid) {
        setGeoValidation({
          loading: false,
          valid: true,
          errors: [],
          metrics: res.metrics
        });
      } else {
        setGeoValidation({
          loading: false,
          valid: false,
          errors: res.errors || ['Invalid boundary geometry'],
          metrics: null
        });
      }
    });

    return () => {
      active = false;
    };
  }, [geometry]);

  // Validate dates whenever they change
  useEffect(() => {
    if (!firstDate || !secondDate) {
      setDateError('Both observation dates are required.');
      return;
    }

    if (firstDate === secondDate) {
      setDateError('First and second dates cannot be identical. A temporal baseline is required.');
      return;
    }

    const d1 = new Date(firstDate).getTime();
    const d2 = new Date(secondDate).getTime();

    if (d2 <= d1) {
      setDateError('Second observation date must be chronologically later than the first.');
      return;
    }

    setDateError(null);
  }, [firstDate, secondDate]);

  // Quick preset helper for dates
  const handleSetQuickDates = (daysSpan) => {
    const end = new Date();
    const start = new Date(end.getTime() - daysSpan * 24 * 60 * 60 * 1000);
    setFirstDate(start.toISOString().split('T')[0]);
    setSecondDate(end.toISOString().split('T')[0]);
  };

  // Search Official NISAR Catalog via Backend
  const handleSearchNisar = async () => {
    // If no geometry is defined yet, automatically load the verified sample swath and search!
    if (!geometry) {
      const sample = sampleRegions[0] || DEFAULT_SAMPLES[0];
      if (sample) {
        if (onLoadSampleRegion) onLoadSampleRegion(sample);
        setFirstDate(sample.suggestedDates.first);
        setSecondDate(sample.suggestedDates.second);
        setIsSearchingNisar(true);
        setNisarPairResult(null);

        const res = await pairNisarObservationsAPI({
          bbox: sample.bbox,
          firstDate: sample.suggestedDates.first,
          secondDate: sample.suggestedDates.second,
          toleranceDays
        });
        setIsSearchingNisar(false);
        setNisarPairResult(res);
        if (onObservationsDiscovered) {
          onObservationsDiscovered(res);
        }

        // Automatically execute radar change detection as well!
        if (res?.completePairAvailable) {
          const [minLon, minLat, maxLon, maxLat] = sample.bbox;
          const sampleGeom = {
            type: 'Polygon',
            coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]]
          };
          setIsProcessing(true);
          const compRes = await executeRadarComparisonAPI({
            firstObservation: res.firstObservation.primaryCandidate,
            secondObservation: res.secondObservation.primaryCandidate,
            geometry: sampleGeom,
            settings: { thresholdDb: -3.2, changeCategory }
          });
          setIsProcessing(false);
          if (compRes?.success && onProcessingComplete) {
            onProcessingComplete(compRes);
          }
        }
        return;
      }
    }

    if (!geoValidation.valid || dateError) return;

    setIsSearchingNisar(true);
    setNisarPairResult(null);

    const payload = {
      geometry,
      firstDate,
      secondDate,
      toleranceDays
    };

    const res = await pairNisarObservationsAPI(payload);
    setIsSearchingNisar(false);
    setNisarPairResult(res);

    if (onObservationsDiscovered) {
      onObservationsDiscovered(res);
    }

    // Automatically compute change detection on discovery
    if (res?.completePairAvailable) {
      setIsProcessing(true);
      const compRes = await executeRadarComparisonAPI({
        firstObservation: res.firstObservation.primaryCandidate,
        secondObservation: res.secondObservation.primaryCandidate,
        geometry,
        settings: { thresholdDb: -3.2, changeCategory }
      });
      setIsProcessing(false);
      if (compRes?.success && onProcessingComplete) {
        onProcessingComplete(compRes);
      }
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);

  // Run Radar Change Detection Manually
  const handleRunChangeDetection = async () => {
    if (!nisarPairResult?.firstObservation?.primaryCandidate || !nisarPairResult?.secondObservation?.primaryCandidate) {
      return;
    }
    setIsProcessing(true);
    setProcessingError(null);

    let targetGeom = geometry;
    if (!targetGeom || !targetGeom.coordinates) {
      const sample = sampleRegions[0] || DEFAULT_SAMPLES[0];
      const [minLon, minLat, maxLon, maxLat] = sample.bbox;
      targetGeom = {
        type: 'Polygon',
        coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]]
      };
      if (onGeometryChange) onGeometryChange(targetGeom);
    }

    const payload = {
      firstObservation: nisarPairResult.firstObservation.primaryCandidate,
      secondObservation: nisarPairResult.secondObservation.primaryCandidate,
      geometry: targetGeom,
      settings: { thresholdDb: -3.2, changeCategory }
    };

    const res = await executeRadarComparisonAPI(payload);
    setIsProcessing(false);

    if (res.success) {
      if (onProcessingComplete) {
        onProcessingComplete(res);
      }
    } else {
      setProcessingError(res.error || 'Radar processing failed');
    }
  };

  // Submit Final Comparison Request
  const handleSubmit = async () => {
    if (!geometry || !geoValidation.valid || dateError) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    const payload = {
      locationName: selectedLocation?.name || 'Custom Observation Area',
      geometry,
      firstDate,
      secondDate,
      changeCategory,
      nisarObservations: nisarPairResult?.completePairAvailable ? {
        first: nisarPairResult.firstObservation?.primaryCandidate?.productIdentifier,
        second: nisarPairResult.secondObservation?.primaryCandidate?.productIdentifier,
        isCompatible: nisarPairResult.compatibility?.isCompatible
      } : null
    };

    const res = await submitComparisonRequestAPI(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSubmissionResult({
        success: true,
        data: res.data,
        requestId: res.requestId
      });
      if (onComparisonSubmitted) {
        onComparisonSubmitted(res.data);
      }
    } else {
      setSubmissionResult({
        success: false,
        errors: res.errors || ['Failed to register comparison request']
      });
    }
  };

  const isReadyToSearch = !dateError && (!geometry || (geoValidation.valid && !geoValidation.loading));

  return (
    <div className="bg-surface border border-borderCol rounded-md shadow-sm text-xs font-sans w-72 sm:w-80 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/70 border-b border-borderCol">
        <div className="flex items-center gap-2 font-medium text-primaryText">
          <Satellite className="w-4 h-4 text-accent" />
          <span>NISAR Observation &amp; Selection</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-secondaryText hover:text-primaryText rounded"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3.5">
          {/* Section 1: Geographical Area Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-secondaryText">
                1. Geographical Boundary (AOI)
              </label>
              {geometry && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onToggleEditing}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition flex items-center gap-1 ${
                      isEditing
                        ? 'bg-accent text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Toggle vertex dragging"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? 'Done' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => {
                      onGeometryChange(null);
                      setNisarPairResult(null);
                      if (onDrawModeChange) onDrawModeChange('none');
                    }}
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Clear selected geometry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Drawing Tools */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onDrawModeChange(drawMode === 'rectangle' ? 'none' : 'rectangle')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border text-xs transition ${
                  drawMode === 'rectangle'
                    ? 'bg-accent-50 border-accent text-accent font-medium shadow-sm'
                    : 'border-borderCol hover:bg-slate-50 text-primaryText'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>Draw Rectangle</span>
              </button>

              <button
                onClick={() => onDrawModeChange(drawMode === 'polygon' ? 'none' : 'polygon')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border text-xs transition ${
                  drawMode === 'polygon'
                    ? 'bg-accent-50 border-accent text-accent font-medium shadow-sm'
                    : 'border-borderCol hover:bg-slate-50 text-primaryText'
                }`}
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>Draw Polygon</span>
              </button>
            </div>

            {/* Geometry Info / Validation Status */}
            {geoValidation.loading ? (
              <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-200 flex items-center gap-2 text-secondaryText text-[11px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Validating spherical boundary...</span>
              </div>
            ) : geoValidation.valid && geoValidation.metrics ? (
              <div className="mt-2 p-2 rounded bg-cyan-50/50 border border-cyan-200/80 text-[11px] text-slate-700 space-y-1">
                <div className="flex items-center justify-between text-accent-700 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-accent" />
                    <span>Boundary Verified</span>
                  </span>
                  <span className="font-mono text-primaryText">
                    {geoValidation.metrics.areaKm2.toLocaleString()} km²
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-secondaryText font-mono">
                  <span>Vertices: {geoValidation.metrics.vertexCount}</span>
                  <span>Center: {geoValidation.metrics.center[1].toFixed(2)}°N, {geoValidation.metrics.center[0].toFixed(2)}°E</span>
                </div>
              </div>
            ) : geoValidation.errors.length > 0 ? (
              <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <span>{geoValidation.errors[0]}</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[10px] text-secondaryText">
                Define an area with the drawing tools or select a preset location.
              </div>
            )}
          </div>

          {/* Section 2: Change Category */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-secondaryText mb-1">
              2. Target Radar Change Category
            </label>
            <div className="p-2 rounded bg-slate-50 border border-borderCol">
              <div className="flex items-center justify-between">
                <span className="font-medium text-primaryText text-xs">
                  Flood and surface water changes
                </span>
                <span className="px-1.5 py-0.5 rounded bg-accent-50 border border-accent-200 text-[9px] font-semibold text-accent uppercase">
                  L &amp; S Band
                </span>
              </div>
              <p className="text-[10px] text-secondaryText mt-0.5">
                Calibrated backscatter analysis for open water inundation and wetland hydrology.
              </p>
            </div>
          </div>

          {/* Section 3: Observation Dates */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-secondaryText">
                3. Observation Dates
              </label>
              <div className="flex gap-1 text-[9px]">
                <button
                  onClick={() => handleSetQuickDates(12)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  12d Orbit
                </button>
                <button
                  onClick={() => handleSetQuickDates(30)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  30d Cycle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] text-secondaryText mb-0.5">
                  T₁ Baseline Date
                </span>
                <input
                  type="date"
                  value={firstDate}
                  onChange={(e) => setFirstDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-surface border border-borderCol rounded text-xs text-primaryText focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <span className="block text-[10px] text-secondaryText mb-0.5">
                  T₂ Target Date
                </span>
                <input
                  type="date"
                  value={secondDate}
                  onChange={(e) => setSecondDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-surface border border-borderCol rounded text-xs text-primaryText focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>

            {dateError && (
              <div className="mt-1.5 p-1.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}
          </div>

          {/* Section 4: Discover Real NISAR Observations */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondaryText">
                4. Satellite Catalog Discovery
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Tol: ±{toleranceDays}d
              </span>
            </div>

            {!geometry && (
              <div className="mb-2 p-1.5 rounded bg-cyan-50/80 border border-cyan-200/80 text-[10px] text-cyan-900 flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Tip: Pick a sample swath below or draw on the map:</span>
                </span>
              </div>
            )}

            <button
              onClick={handleSearchNisar}
              disabled={!isReadyToSearch || isSearchingNisar}
              className={`w-full py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition shadow-sm ${
                isReadyToSearch && !isSearchingNisar
                  ? 'bg-accent hover:bg-accent-dark text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {isSearchingNisar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching NASA ASF &amp; CMR...</span>
                </>
              ) : (
                <>
                  <Satellite className="w-3.5 h-3.5" />
                  <span>{geometry ? 'Search Official NISAR Data' : 'Auto-Load Swath & Search NISAR'}</span>
                </>
              )}
            </button>

            {/* Quick Sample Swaths button for verified testing */}
            {sampleRegions.length > 0 && (!nisarPairResult || !nisarPairResult.completePairAvailable) && (
              <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-[10px] text-secondaryText font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>Verified NISAR Validation Swaths:</span>
                  </span>
                  <span className="text-[9px] text-accent font-semibold">1-Click</span>
                </div>
                <div className="space-y-1 pt-0.5">
                  {sampleRegions.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={async () => {
                        if (onLoadSampleRegion) onLoadSampleRegion(sample);
                        setFirstDate(sample.suggestedDates.first);
                        setSecondDate(sample.suggestedDates.second);
                        setIsSearchingNisar(true);
                        setNisarPairResult(null);

                        const res = await pairNisarObservationsAPI({
                          bbox: sample.bbox,
                          firstDate: sample.suggestedDates.first,
                          secondDate: sample.suggestedDates.second,
                          toleranceDays
                        });
                        setIsSearchingNisar(false);
                        setNisarPairResult(res);
                        if (onObservationsDiscovered) {
                          onObservationsDiscovered(res);
                        }

                        if (res?.completePairAvailable) {
                          const [minLon, minLat, maxLon, maxLat] = sample.bbox;
                          const sampleGeom = {
                            type: 'Polygon',
                            coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]]
                          };
                          setIsProcessing(true);
                          const compRes = await executeRadarComparisonAPI({
                            firstObservation: res.firstObservation.primaryCandidate,
                            secondObservation: res.secondObservation.primaryCandidate,
                            geometry: sampleGeom,
                            settings: { thresholdDb: -3.2, changeCategory }
                          });
                          setIsProcessing(false);
                          if (compRes?.success && onProcessingComplete) {
                            onProcessingComplete(compRes);
                          }
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 bg-white hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 rounded text-[10px] flex items-center justify-between transition group cursor-pointer"
                    >
                      <div className="flex flex-col truncate pr-1">
                        <span className="font-medium text-slate-700 group-hover:text-accent truncate">{sample.name}</span>
                        <span className="text-[9px] text-secondaryText">{sample.verifiedProducts}</span>
                      </div>
                      <span className="font-mono text-[9px] text-slate-400 group-hover:text-accent shrink-0">
                        {sample.suggestedDates.first.slice(5)} → {sample.suggestedDates.second.slice(5)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Retrieved NISAR Observations Display */}
          {nisarPairResult && (
            <div ref={resultsRef} className="pt-2 border-t border-slate-100 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-secondaryText">
                  5. Catalog Results
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  nisarPairResult.completePairAvailable
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {nisarPairResult.completePairAvailable ? 'Pair Verified' : 'Incomplete Coverage'}
                </span>
              </div>

              {/* Baseline T1 Card */}
              <ObservationDetails
                observation={nisarPairResult.firstObservation}
                label="Baseline T₁"
                role="baseline"
              />

              {/* Target T2 Card */}
              <ObservationDetails
                observation={nisarPairResult.secondObservation}
                label="Target T₂"
                role="target"
              />

              {/* Radar Compatibility Assessment */}
              {nisarPairResult.compatibility && (
                <div className="p-2 rounded bg-slate-50 border border-borderCol text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-secondaryText text-[10px]">Radar Geometry Check</span>
                    <span className={nisarPairResult.compatibility.isCompatible ? 'text-accent' : 'text-amber-600'}>
                      {nisarPairResult.compatibility.isCompatible ? 'Coherent Geometry' : 'Look Geometry Warning'}
                    </span>
                  </div>
                  {nisarPairResult.compatibility.reasons?.map((reason, idx) => (
                    <p key={idx} className="text-[10px] text-secondaryText leading-tight">
                      • {reason}
                    </p>
                  ))}
                </div>
              )}

              {/* Execute Radar Change Detection */}
              {nisarPairResult.completePairAvailable ? (
                <button
                  onClick={handleRunChangeDetection}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-3 rounded-md text-xs font-semibold bg-accent hover:bg-accent-dark text-white flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Computing Log-Ratio Difference...</span>
                    </>
                  ) : (
                    <>
                      <Droplets className="w-4 h-4" />
                      <span>Run Radar Change Detection</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-2.5 rounded bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] space-y-1.5">
                  <p className="leading-tight text-amber-800">
                    Official NISAR data is archived by NASA ASF for verified calibration corridors and planned acquisition cycles.
                  </p>
                  <button
                    onClick={() => {
                      const sample = sampleRegions[0] || DEFAULT_SAMPLES[0];
                      if (onLoadSampleRegion) onLoadSampleRegion(sample);
                      setFirstDate(sample.suggestedDates.first);
                      setSecondDate(sample.suggestedDates.second);
                    }}
                    className="w-full py-1.5 px-2 bg-accent text-white rounded font-medium text-[10px] hover:bg-accent-dark transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Load North American Calibration Swath</span>
                  </button>
                </div>
              )}

              {processingError && (
                <div className="p-2 rounded bg-red-50 border border-red-200 text-[10px] text-red-700">
                  {processingError}
                </div>
              )}

              {/* Prepare Data Package */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-2 px-3 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing Data Package...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Prepare Data Package for Processing</span>
                  </>
                )}
              </button>

              {/* Final Confirmation Banner */}
              {submissionResult && submissionResult.success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900 space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Package Ready for Processing</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-800">
                    ID: <span className="font-semibold">{submissionResult.requestId}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700/90 leading-tight">
                    Satellite observation metadata verified from NASA ASF DAAC. Data package prepared for processing phase.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
