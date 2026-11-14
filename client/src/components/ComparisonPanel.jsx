import React, { useState, useEffect } from 'react';
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
  Droplets
} from 'lucide-react';
import { validateGeometryAPI, validateComparisonAPI, submitComparisonRequestAPI } from '../services/api';

export default function ComparisonPanel({
  geometry,
  onGeometryChange,
  drawMode,
  onDrawModeChange,
  isEditing,
  onToggleEditing,
  selectedLocation,
  onComparisonSubmitted
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Change category
  const [changeCategory] = useState('flood_surface_water');

  // Dates (Default to nominal recent NISAR cycle: 12 days gap)
  const today = new Date().toISOString().split('T')[0];
  const defaultFirst = new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultSecond = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [firstDate, setFirstDate] = useState(defaultFirst);
  const [secondDate, setSecondDate] = useState(defaultSecond);

  // Validation states
  const [geoValidation, setGeoValidation] = useState({ loading: false, valid: false, errors: [], metrics: null });
  const [dateError, setDateError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Validate geometry whenever it changes
  useEffect(() => {
    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
      setGeoValidation({ loading: false, valid: false, errors: [], metrics: null });
      return;
    }

    let active = true;
    setGeoValidation(prev => ({ ...prev, loading: true }));

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

    return () => { active = false; };
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

  // Submit Comparison Request
  const handleSubmit = async () => {
    if (!geometry || !geoValidation.valid || dateError) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    const payload = {
      locationName: selectedLocation?.name || 'Custom Observation Area',
      geometry,
      firstDate,
      secondDate,
      changeCategory
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

  const isReadyToSubmit = geoValidation.valid && !dateError && !geoValidation.loading;

  return (
    <div className="bg-surface border border-borderCol rounded-md shadow-sm text-xs font-sans w-72 sm:w-80 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/70 border-b border-borderCol">
        <div className="flex items-center gap-2 font-medium text-primaryText">
          <Droplets className="w-4 h-4 text-accent" />
          <span>Observation &amp; Comparison</span>
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
                Select a draw tool above to define your area on the map.
              </div>
            )}
          </div>

          {/* Section 2: Change Category */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-secondaryText mb-1">
              2. Change Category
            </label>
            <div className="p-2 rounded bg-slate-50 border border-borderCol">
              <div className="flex items-center justify-between">
                <span className="font-medium text-primaryText text-xs">
                  Flood and surface water changes
                </span>
                <span className="px-1.5 py-0.5 rounded bg-accent-50 border border-accent-200 text-[9px] font-semibold text-accent uppercase">
                  SAR Active
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
                  title="12-day NISAR orbital repeat pass"
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
                <div className="relative">
                  <input
                    type="date"
                    max={secondDate || today}
                    value={firstDate}
                    onChange={(e) => setFirstDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface border border-borderCol rounded text-xs text-primaryText focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-secondaryText mb-0.5">
                  T₂ Target Date
                </span>
                <div className="relative">
                  <input
                    type="date"
                    min={firstDate}
                    max={today}
                    value={secondDate}
                    onChange={(e) => setSecondDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-surface border border-borderCol rounded text-xs text-primaryText focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Date Validation Error */}
            {dateError && (
              <div className="mt-1.5 p-1.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}
          </div>

          {/* Section 4: Action & Request Submission */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleSubmit}
              disabled={!isReadyToSubmit || isSubmitting}
              className={`w-full py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition shadow-sm ${
                isReadyToSubmit && !isSubmitting
                  ? 'bg-accent hover:bg-accent-dark text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating &amp; Registering...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Prepare Comparison Request</span>
                </>
              )}
            </button>

            {/* Submission confirmation modal / inline banner */}
            {submissionResult && submissionResult.success && (
              <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900 space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Request Prepared &amp; Registered</span>
                </div>
                <div className="font-mono text-[10px] text-emerald-800">
                  ID: <span className="font-semibold">{submissionResult.requestId}</span>
                </div>
                <p className="text-[10px] text-emerald-700/90 leading-tight">
                  Area: {submissionResult.data.geometry.metrics.areaKm2.toLocaleString()} km² • {submissionResult.data.observations.deltaDays} days baseline gap. Ready for Phase 3 satellite data retrieval.
                </p>
              </div>
            )}

            {submissionResult && !submissionResult.success && (
              <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-md text-[10px] text-red-700 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                <span>{submissionResult.errors[0]}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
