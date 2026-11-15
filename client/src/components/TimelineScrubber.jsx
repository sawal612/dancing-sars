import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TimelineScrubber({
  deliveries = [],
  activeTimestep = 8,
  onChangeTimestep,
  timelineMode = 'accumulated', // 'accumulated' | 'snapshot'
  onChangeTimelineMode
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Fallback deliveries if empty
  const defaultDeliveries = [
    { id: 1, label: '2 Jul, 00:00 — 3 Jul, 00:00 UTC', timestamp: '3 Jul, 00:00 UTC' },
    { id: 2, label: '2 Jul, 06:00 — 3 Jul, 06:00 UTC', timestamp: '3 Jul, 06:00 UTC' },
    { id: 3, label: '2 Jul, 12:00 — 3 Jul, 12:00 UTC', timestamp: '3 Jul, 12:00 UTC' },
    { id: 4, label: '2 Jul, 18:00 — 3 Jul, 18:00 UTC', timestamp: '3 Jul, 18:00 UTC' },
    { id: 5, label: '3 Jul, 00:00 — 4 Jul, 00:00 UTC', timestamp: '4 Jul, 00:00 UTC' },
    { id: 6, label: '3 Jul, 06:00 — 4 Jul, 06:00 UTC', timestamp: '4 Jul, 06:00 UTC' },
    { id: 7, label: '3 Jul, 12:00 — 4 Jul, 12:00 UTC', timestamp: '4 Jul, 12:00 UTC' },
    { id: 8, label: '3 Jul, 18:00 — 4 Jul, 18:00 UTC', timestamp: '4 Jul, 18:00 UTC' }
  ];

  const items = deliveries.length > 0
    ? [...deliveries].sort((a, b) => a.id - b.id)
    : defaultDeliveries;

  const currentItem = items.find((d) => d.id === activeTimestep) || items[items.length - 1];

  // Auto-play animation through passes
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        onChangeTimestep((prev) => {
          if (prev >= items.length) return 1;
          return prev + 1;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, items.length, onChangeTimestep]);

  const minId = items[0]?.id || 1;
  const maxId = items[items.length - 1]?.id || 8;

  return (
    <div className="bg-[#102131]/95 backdrop-blur-md border border-[#1e3b52] rounded-xl px-5 py-3 text-white shadow-2xl select-none w-[340px] sm:w-[420px] pointer-events-auto">
      {/* Header Row: Timestamp + Mode Switcher */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-full bg-[#1b354b] hover:bg-[#254966] text-amber-300 transition-colors"
            title={isPlaying ? 'Pause animation' : 'Play timeline progression'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <span className="font-bold text-sm sm:text-base text-slate-100 tracking-wide font-mono">
            {currentItem?.timestamp || '4 Jul, 18:00 UTC'}
          </span>
        </div>

        {/* Accumulated vs Snapshot Toggle */}
        <div className="flex items-center bg-[#0d1926] p-0.5 rounded-lg border border-[#1e3b52]">
          <button
            onClick={() => onChangeTimelineMode('accumulated')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              timelineMode === 'accumulated'
                ? 'bg-[#214361] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Accumulated
          </button>
          <button
            onClick={() => onChangeTimelineMode('snapshot')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              timelineMode === 'snapshot'
                ? 'bg-[#214361] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Snapshot
          </button>
        </div>
      </div>

      {/* Scrubber Track & Dots */}
      <div className="relative flex items-center pt-2 pb-1">
        {/* Golden track line */}
        <div className="absolute left-2 right-2 h-1.5 bg-[#C59B27]/40 rounded-full" />

        {/* Progress highlight */}
        <div
          className="absolute left-2 h-1.5 bg-[#F59E0B] rounded-full transition-all duration-300"
          style={{
            width: `${((activeTimestep - minId) / Math.max(1, maxId - minId)) * 100}%`
          }}
        />

        {/* Dots for each delivery pass */}
        <div className="relative w-full flex justify-between items-center px-1">
          {items.map((deliv) => {
            const isActive = deliv.id === activeTimestep;
            const isPassed = deliv.id <= activeTimestep;

            return (
              <button
                key={deliv.id}
                onClick={() => {
                  setIsPlaying(false);
                  onChangeTimestep(deliv.id);
                }}
                title={`${deliv.timestamp} (${deliv.label})`}
                className="group relative flex items-center justify-center p-1 focus:outline-none"
              >
                {/* Dot */}
                <div
                  className={`rounded-full transition-all duration-200 ${
                    isActive
                      ? 'w-4 h-4 bg-white border-2 border-[#102131] shadow-lg scale-125 z-10'
                      : isPassed
                      ? 'w-2.5 h-2.5 bg-[#F59E0B] group-hover:scale-125'
                      : 'w-2 h-2 bg-[#78611D] group-hover:bg-[#C59B27]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

