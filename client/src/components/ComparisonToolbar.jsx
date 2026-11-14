import React from 'react';
import { Eye, EyeOff, Sliders, SplitSquareVertical, ArrowLeftRight, Layers } from 'lucide-react';

export default function ComparisonToolbar({
  comparisonMode, // 'before' | 'after' | 'swipe'
  onChangeComparisonMode,
  showChangeMask,
  onToggleChangeMask,
  swipePosition = 50,
  onChangeSwipePosition,
  firstDate,
  secondDate
}) {
  return (
    <div className="bg-surface/95 backdrop-blur-sm border border-borderCol rounded-md px-3 py-1.5 shadow-md flex items-center gap-3 text-xs font-sans pointer-events-auto select-none">
      {/* Mode Selector Tabs */}
      <div className="flex items-center p-0.5 rounded bg-slate-100 border border-slate-200">
        <button
          onClick={() => onChangeComparisonMode('before')}
          className={`px-2 py-1 rounded text-[11px] font-medium transition ${
            comparisonMode === 'before'
              ? 'bg-white text-primaryText shadow-xs'
              : 'text-secondaryText hover:text-primaryText'
          }`}
          title="View Baseline T1 Observation"
        >
          Before ({firstDate ? firstDate.slice(5) : 'T₁'})
        </button>

        <button
          onClick={() => onChangeComparisonMode('after')}
          className={`px-2 py-1 rounded text-[11px] font-medium transition ${
            comparisonMode === 'after'
              ? 'bg-white text-primaryText shadow-xs'
              : 'text-secondaryText hover:text-primaryText'
          }`}
          title="View Target T2 Observation"
        >
          After ({secondDate ? secondDate.slice(5) : 'T₂'})
        </button>

        <button
          onClick={() => onChangeComparisonMode('swipe')}
          className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
            comparisonMode === 'swipe'
              ? 'bg-white text-accent shadow-xs'
              : 'text-secondaryText hover:text-primaryText'
          }`}
          title="Interactive Before/After Swipe Slider"
        >
          <SplitSquareVertical className="w-3 h-3" />
          <span>Swipe</span>
        </button>
      </div>

      {/* Swipe slider when in swipe mode */}
      {comparisonMode === 'swipe' && (
        <div className="flex items-center gap-2 pl-1 border-l border-borderCol">
          <span className="text-[10px] text-secondaryText font-mono">T₁</span>
          <input
            type="range"
            min="0"
            max="100"
            value={swipePosition}
            onChange={(e) => onChangeSwipePosition(parseInt(e.target.value, 10))}
            className="w-24 accent-accent cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
          />
          <span className="text-[10px] text-secondaryText font-mono">T₂</span>
        </div>
      )}

      <div className="h-4 w-px bg-borderCol" />

      {/* Change Mask Toggle */}
      <button
        onClick={onToggleChangeMask}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition ${
          showChangeMask
            ? 'bg-cyan-50 border-cyan-300 text-accent font-medium shadow-xs'
            : 'border-borderCol hover:bg-slate-50 text-slate-500'
        }`}
        title="Toggle Detected Cyan Change Mask"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-accent/80 border border-cyan-600" />
        <span>Change Mask</span>
        {showChangeMask ? <Eye className="w-3 h-3 text-accent" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
      </button>
    </div>
  );
}

