import React from 'react';
import { Radio, Satellite, Compass } from 'lucide-react';

export default function Header({ currentCenter, currentZoom }) {
  const missionLabel = import.meta.env.VITE_MISSION_LABEL || 'NISAR Mission';

  return (
    <header className="h-14 bg-surface border-b border-borderCol px-4 md:px-6 flex items-center justify-between z-20 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Brand & Mission */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent-50 border border-accent-200 text-accent">
          <Satellite className="w-4 h-4 stroke-[2.2]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-primaryText font-sans">
            EarthWatch
          </span>
          <span className="hidden sm:inline-block text-xs text-secondaryText font-normal">
            Geospatial Observation
          </span>
        </div>

        <div className="h-4 w-px bg-borderCol mx-1 hidden sm:block" />

        {/* NISAR Mission Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>{missionLabel}</span>
        </div>
      </div>

      {/* Geospatial Real-time Coordinates & Map Info */}
      <div className="flex items-center gap-4 text-xs font-mono text-secondaryText">
        {currentCenter && (
          <div className="hidden md:flex items-center gap-3 px-2.5 py-1 rounded bg-slate-50 border border-borderCol text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">LAT:</span>
              <span className="text-primaryText font-medium">
                {currentCenter.lat > 0 ? `${currentCenter.lat.toFixed(4)}°N` : `${Math.abs(currentCenter.lat).toFixed(4)}°S`}
              </span>
            </div>
            <div className="w-px h-3 bg-borderCol" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400">LON:</span>
              <span className="text-primaryText font-medium">
                {currentCenter.lng > 0 ? `${currentCenter.lng.toFixed(4)}°E` : `${Math.abs(currentCenter.lng).toFixed(4)}°W`}
              </span>
            </div>
            <div className="w-px h-3 bg-borderCol" />
            <div className="flex items-center gap-1">
              <span className="text-slate-400">ZOOM:</span>
              <span className="text-primaryText font-medium">{currentZoom ? currentZoom.toFixed(1) : '2.0'}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Radio className="w-3.5 h-3.5 text-accent" />
          <span className="font-sans">L &amp; S Band Ready</span>
        </div>
      </div>
    </header>
  );
}

