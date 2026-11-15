import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Download,
  Calendar,
  Layers,
  Activity,
  Droplets,
  AlertTriangle,
  Building,
  TrendingDown,
  Info,
  Car,
  Train,
  Trees
} from 'lucide-react';

export default function FloodIntelligencePanel({
  results,
  onClose,
  activeTimestep = 8,
  onChangeTimestep
}) {
  const [activeMainTab, setActiveMainTab] = useState('Analysis'); // 'Overview' | 'Analysis'
  const [activeSubTab, setActiveSubTab] = useState('Flood Rapid Impact'); // 'Flood Insights' | 'Flood Rapid Impact'
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!results) return null;

  const eventInfo = results.eventInfo || {
    title: 'SOUTHEASTERN AUSTRALIA',
    status: 'Analysis done',
    duration: '29 Jun - 3 Jul (5 days)'
  };

  const deliveries = results.timelineDeliveries || [
    { id: 8, label: '3 Jul, 18:00 — 4 Jul, 18:00 UTC', timestamp: '4 Jul, 18:00 UTC', status: 'Delivered', areaKm2: 142.8 },
    { id: 7, label: '3 Jul, 12:00 — 4 Jul, 12:00 UTC', timestamp: '4 Jul, 12:00 UTC', status: 'Delivered', areaKm2: 138.5 },
    { id: 6, label: '3 Jul, 06:00 — 4 Jul, 06:00 UTC', timestamp: '4 Jul, 06:00 UTC', status: 'Delivered', areaKm2: 131.2 },
    { id: 5, label: '3 Jul, 00:00 — 4 Jul, 00:00 UTC', timestamp: '4 Jul, 00:00 UTC', status: 'Delivered', areaKm2: 122.4 },
    { id: 4, label: '2 Jul, 18:00 — 3 Jul, 18:00 UTC', timestamp: '3 Jul, 18:00 UTC', status: 'Delivered', areaKm2: 108.7 },
    { id: 3, label: '2 Jul, 12:00 — 3 Jul, 12:00 UTC', timestamp: '3 Jul, 12:00 UTC', status: 'Delivered', areaKm2: 94.3 },
    { id: 2, label: '2 Jul, 06:00 — 3 Jul, 06:00 UTC', timestamp: '3 Jul, 06:00 UTC', status: 'Delivered', areaKm2: 78.1 },
    { id: 1, label: '2 Jul, 00:00 — 3 Jul, 00:00 UTC', timestamp: '3 Jul, 00:00 UTC', status: 'Delivered', areaKm2: 56.4 }
  ];

  const impact = results.rapidImpactStats || {
    totalInundatedKm2: 142.8,
    percentageOfAOI: 14.5,
    criticalRoadsKm: 45.7,
    railwayKm: 18.6,
    agriculturalKm2: 82.8,
    estimatedPopulationExposed: 19200
  };

  // Download real GeoJSON and executive report
  const handleDownloadAnalysis = () => {
    const geojsonData = results.changeMask || { type: 'FeatureCollection', features: [] };
    const exportBundle = {
      eventTitle: eventInfo.title,
      analysisTimestamp: new Date().toISOString(),
      algorithm: results.algorithm,
      impactMetrics: impact,
      observations: results.observations,
      geoJSON: geojsonData
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventInfo.title.replace(/\s+/g, '_')}_Flood_Analysis.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="bg-[#102131]/95 backdrop-blur-md border border-[#1e3b52] rounded-xl text-white shadow-2xl w-[320px] sm:w-[360px] flex flex-col max-h-[calc(100vh-6.5rem)] overflow-hidden pointer-events-auto select-none">
      {/* 1. Header with Close Button */}
      <div className="px-5 pt-4 pb-3 border-b border-[#1e3b52]/80">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-base sm:text-lg font-extrabold tracking-wider text-slate-100 uppercase">
            {eventInfo.title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1b354b] transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Event Duration Badges */}
        <div className="flex items-center justify-between text-xs mt-2">
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-1">Status</div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-medium text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{eventInfo.status}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-medium mb-1">Event duration</div>
            <div className="text-slate-200 font-medium text-xs">
              {eventInfo.duration}
            </div>
          </div>
        </div>

        {/* 2. Download Analysis Button */}
        <div className="mt-3.5">
          <button
            onClick={handleDownloadAnalysis}
            className="w-full py-2.5 px-4 rounded-lg bg-[#2b5d77] hover:bg-[#387a9d] active:bg-[#20495f] text-slate-100 font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 border border-[#488ba8]/40"
          >
            <Download className="w-4 h-4" />
            <span>{downloadSuccess ? 'Downloaded GeoJSON ✓' : 'DOWNLOAD ANALYSIS'}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Tabs (Overview | Analysis) */}
      <div className="flex border-b border-[#1e3b52] bg-[#0c1a27]/60 px-5 pt-2 text-xs font-semibold">
        <button
          onClick={() => setActiveMainTab('Overview')}
          className={`pb-2.5 mr-6 border-b-2 transition-all ${
            activeMainTab === 'Overview'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveMainTab('Analysis')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeMainTab === 'Analysis'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Analysis
        </button>
      </div>

      {/* 4. Tab Body Content */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 custom-scrollbar">
        {activeMainTab === 'Analysis' ? (
          <>
            {/* Subtabs: Flood Insights | Flood Rapid Impact */}
            <div className="flex items-center bg-[#0d1a26] p-1 rounded-lg border border-[#1e3b52]">
              <button
                onClick={() => setActiveSubTab('Flood Insights')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === 'Flood Insights'
                    ? 'bg-[#214361] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flood Insights
              </button>
              <button
                onClick={() => setActiveSubTab('Flood Rapid Impact')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeSubTab === 'Flood Rapid Impact'
                    ? 'bg-[#214361] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flood Rapid Impact
              </button>
            </div>

            {/* Subtab Content: Flood Insights */}
            {activeSubTab === 'Flood Insights' && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Flood Extent</div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">{impact.totalInundatedKm2} km²</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{impact.percentageOfAOI}% of selected AOI</div>
                  </div>
                  <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Backscatter Drop</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">-4.2 dB</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Specular Reflection Loss</div>
                  </div>
                </div>

                <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Sensor & Polarimetry:</span>
                    <span className="font-mono text-cyan-300">NISAR L-SAR (HH/HV)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Sub-Canopy Penetration:</span>
                    <span className="text-emerald-400 font-semibold">Enabled (L-band 24cm)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Spatial Resolution:</span>
                    <span className="font-mono text-slate-200">10m GCOV</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab Content: Flood Rapid Impact */}
            {activeSubTab === 'Flood Rapid Impact' && (
              <div className="space-y-2">
                <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Critical Roads Inundated</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">{impact.criticalRoadsKm} km</span>
                </div>

                <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-300">Rail Network Submerged</span>
                  </div>
                  <span className="font-mono font-bold text-orange-300">{impact.railwayKm} km</span>
                </div>

                <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Trees className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">Agricultural Floodplain</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-300">{impact.agriculturalKm2} km²</span>
                </div>

                <div className="bg-[#0e1d2c] border border-[#1e3b52] p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">Population in Swath</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-300">~{impact.estimatedPopulationExposed.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Delivery Timeline Passes List */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Observation Passes & Deliveries
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {deliveries.map((deliv) => {
                  const isSelected = deliv.id === activeTimestep;

                  return (
                    <button
                      key={deliv.id}
                      onClick={() => onChangeTimestep(deliv.id)}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-[#1b3b54] border-cyan-400/80 shadow-md ring-1 ring-cyan-400/30'
                          : 'bg-[#0e1c2b] border-[#1e3b52]/70 hover:bg-[#14283b] hover:border-[#2e5677]'
                      }`}
                    >
                      {/* Checkmark icon */}
                      <div className="mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                            {deliv.status}
                          </span>
                          {deliv.areaKm2 && (
                            <span className="text-[10px] font-mono text-cyan-300">
                              {deliv.areaKm2} km²
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-medium text-slate-200 mt-1 truncate">
                          {deliv.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Overview Tab */
          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-[#0e1d2c] border border-[#1e3b52] p-3 rounded-lg space-y-2">
              <div className="font-semibold text-white">Hydrological Event Synopsis</div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Persistent low-pressure trough over Eastern New South Wales delivered extreme rainfall across the Shoalhaven, Kangaroo Valley, and Illawarra catchments.
              </p>
            </div>

            <div className="bg-[#0e1d2c] border border-[#1e3b52] p-3 rounded-lg space-y-1.5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold">Mission Verification</div>
              <div className="text-white font-medium">NASA-ISRO SAR (NISAR)</div>
              <div className="text-slate-400 text-[11px]">Primary Band: L-SAR (1.25 GHz / 24 cm)</div>
              <div className="text-slate-400 text-[11px]">Provisional Cal/Val Orbit 045, Frame 020</div>
            </div>

            <div className="bg-[#0e1d2c] border border-[#1e3b52] p-3 rounded-lg space-y-1.5">
              <div className="text-slate-400 text-[11px] uppercase font-semibold">Change Detection Method</div>
              <div className="text-cyan-300 font-mono text-[11px]">
                Δσ°_dB = 10 * log10(σ°_target / σ°_baseline)
              </div>
              <div className="text-slate-400 text-[10px]">
                Threshold: -3.2 dB (Enhanced Lee speckle filtered)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

