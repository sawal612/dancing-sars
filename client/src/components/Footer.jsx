import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="h-8 bg-surface border-t border-borderCol px-4 md:px-6 flex items-center justify-between text-[11px] text-secondaryText select-none z-20">
      <div className="flex items-center gap-3 truncate">
        <span className="flex items-center gap-1 font-medium text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>EarthWatch v1.0</span>
        </span>
        <span className="hidden md:inline text-slate-300">|</span>
        <span className="hidden md:inline truncate">
          Phase 1: Foundation &amp; Geospatial Interface
        </span>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
        <span className="hidden sm:inline">
          Mission Partner: NASA JPL / ISRO
        </span>
        <span className="text-slate-300 hidden sm:inline">•</span>
        <span>
          Map &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" className="hover:text-primaryText underline decoration-slate-300">CARTO</a> &amp; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="hover:text-primaryText underline decoration-slate-300">OpenStreetMap</a>
        </span>
      </div>
    </footer>
  );
}

