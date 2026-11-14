import React, { useState } from 'react';
import {
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Droplets,
  Calendar,
  Maximize2,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ProcessingResultsPanel({
  results,
  onClose,
  showChangeMask,
  onToggleChangeMask,
  comparisonMode,
  onChangeComparisonMode
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCaveats, setShowCaveats] = useState(false);

  if (!results || !results.statistics) return null;

  const { statistics, algorithm, qualityAndCaveats, compatibilityWarnings } = results;

  return (
    <div className="bg-surface/95 backdrop-blur-sm border border-borderCol rounded-md shadow-lg text-xs font-sans w-80 sm:w-88 overflow-hidden pointer-events-auto animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-borderCol">
        <div className="flex items-center gap-2 font-medium text-primaryText">
          <Droplets className="w-4 h-4 text-accent" />
          <span>Radar Change Detection Results</span>
        </div>
        <div className="flex items-center gap-1 text-secondaryText">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:text-primaryText rounded hover:bg-slate-200/50"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:text-red-600 rounded hover:bg-slate-200/50"
            title="Close results"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Key Statistics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-secondaryText block uppercase tracking-wider font-semibold">
                Selected Area
              </span>
              <span className="text-sm font-semibold font-mono text-primaryText">
                {statistics.selectedAreaKm2?.toLocaleString()} <span className="text-[10px] font-normal text-secondaryText">km²</span>
              </span>
            </div>

            <div className="p-2 rounded bg-cyan-50/60 border border-cyan-200">
              <span className="text-[10px] text-accent block uppercase tracking-wider font-semibold">
                Changed Area (Cyan)
              </span>
              <span className="text-sm font-semibold font-mono text-cyan-900">
                {statistics.detectedChangedAreaKm2?.toLocaleString()} <span className="text-[10px] font-normal text-secondaryText">km²</span>
              </span>
            </div>
          </div>

          {/* Percentage Affected Bar */}
          <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-secondaryText font-medium">Area Affected</span>
              <span className="font-mono font-semibold text-primaryText text-xs">
                {statistics.percentageAffected}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, statistics.percentageAffected))}%` }}
              />
            </div>
          </div>

          {/* Observation Dates */}
          <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-slate-50/70 border border-slate-200">
            <div>
              <span className="text-[10px] text-secondaryText block">T₁ Baseline</span>
              <span className="font-mono text-primaryText font-medium">
                {statistics.firstObservationDate ? statistics.firstObservationDate.split('T')[0] : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-secondaryText block">T₂ Target</span>
              <span className="font-mono text-primaryText font-medium">
                {statistics.secondObservationDate ? statistics.secondObservationDate.split('T')[0] : 'N/A'}
              </span>
            </div>
          </div>

          {/* Algorithm & Documentation */}
          <div className="text-[10px] text-secondaryText space-y-0.5 border-t border-slate-100 pt-2">
            <div className="flex items-center justify-between font-medium text-primaryText text-[11px]">
              <span>Methodology</span>
              <span className="font-mono text-accent text-[10px]">{algorithm?.thresholdDb} dB Threshold</span>
            </div>
            <p className="leading-tight text-slate-600">
              {algorithm?.name} ({algorithm?.frequencyBand}, {algorithm?.polarizationAnalyzed}).
            </p>
          </div>

          {/* Warnings if any */}
          {compatibilityWarnings && compatibilityWarnings.length > 0 && (
            <div className="p-1.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 space-y-0.5">
              <div className="font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>Radar Geometry Notice:</span>
              </div>
              <p className="leading-tight">{compatibilityWarnings[0]}</p>
            </div>
          )}

          {/* Quality Caveats Collapsible */}
          <div className="border-t border-slate-100 pt-1.5">
            <button
              onClick={() => setShowCaveats(!showCaveats)}
              className="w-full flex items-center justify-between text-[10px] text-secondaryText hover:text-primaryText py-0.5"
            >
              <span className="flex items-center gap-1 font-medium">
                <Info className="w-3 h-3 text-accent" />
                <span>Scientific Caveats &amp; Physics</span>
              </span>
              <span>{showCaveats ? 'Hide' : 'Show'}</span>
            </button>
            {showCaveats && (
              <div className="mt-1 p-2 rounded bg-slate-50 text-[10px] text-slate-600 space-y-1">
                {qualityAndCaveats?.map((c, i) => (
                  <p key={i} className="leading-tight">• {c}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
