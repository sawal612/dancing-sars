import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function MapLegend({ onClose }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="bg-[#102131]/95 backdrop-blur-md border border-[#1e3b52] rounded-lg p-3 text-white text-xs shadow-2xl select-none min-w-[170px] pointer-events-auto">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#1e3b52]/60">
        <span className="font-semibold text-slate-200 tracking-wide text-xs">Legend</span>
        <button
          onClick={() => {
            setIsOpen(false);
            if (onClose) onClose();
          }}
          className="text-slate-400 hover:text-white transition-colors p-0.5 rounded"
          title="Close Legend"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Monitored Area */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0284C7] bg-[#0891B2]/10 rounded-sm flex-shrink-0" />
          <span className="text-slate-300 font-medium">Monitored Area</span>
        </div>

        {/* Flood Section */}
        <div className="pt-1">
          <div className="font-semibold text-slate-300 mb-1.5 text-[11px] tracking-wide">
            Flood Rapid Impact
          </div>
          <div className="flex items-center gap-2 pl-0.5">
            <div className="w-4 h-4 bg-[#1D70B8] border border-[#0B4F8A] rounded-sm flex-shrink-0 shadow-sm" />
            <span className="text-slate-200 font-medium">Flood Extent</span>
          </div>
        </div>
      </div>
    </div>
  );
}

