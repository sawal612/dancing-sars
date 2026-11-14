import React from 'react';
import {
  Satellite,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Calendar,
  Layers,
  Compass,
  Download,
  Info,
  Radio
} from 'lucide-react';

export default function ObservationDetails({ observation, label, role = 'baseline' }) {
  if (!observation) return null;

  const candidate = observation.primaryCandidate;
  const isAvailable = observation.available && candidate;

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  if (!isAvailable) {
    return (
      <div className="p-2.5 rounded-md bg-amber-50/70 border border-amber-200 text-xs font-sans space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{label}: No Observation Found</span>
        </div>
        <p className="text-[11px] text-amber-700 leading-tight">
          No official NISAR satellite acquisition matches {observation.requestedDate} (± window) for this geographical coverage.
        </p>
      </div>
    );
  }

  const dateObj = new Date(candidate.acquisitionDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <div className="p-2.5 rounded-md bg-white border border-borderCol shadow-sm text-xs font-sans space-y-2">
      {/* Title & Availability Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-semibold text-primaryText text-[11px]">
            {label} ({role.toUpperCase()})
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-[10px] font-medium text-accent">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Verified NISAR Product</span>
        </span>
      </div>

      {/* Product Identifier */}
      <div className="bg-slate-50 border border-slate-200/80 rounded p-1.5">
        <div className="flex items-center justify-between text-[10px] text-secondaryText mb-0.5">
          <span>Product Identifier</span>
          <button
            onClick={() => copyToClipboard(candidate.productIdentifier)}
            className="text-slate-400 hover:text-accent flex items-center gap-0.5"
            title="Copy Product ID"
          >
            <Copy className="w-2.5 h-2.5" />
            <span>Copy</span>
          </button>
        </div>
        <div className="font-mono text-[10px] text-primaryText break-all leading-tight font-medium select-all">
          {candidate.productIdentifier}
        </div>
      </div>

      {/* Acquisition Date & Sensor Info */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-[10px] text-secondaryText block">Acquisition Date</span>
          <span className="font-medium text-primaryText font-mono">
            {formattedDate} {formattedTime}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-secondaryText block">Sensor &amp; Band</span>
          <span className="font-medium text-primaryText font-sans">
            {candidate.sensor} ({candidate.frequencyBand.split(' ')[0]})
          </span>
        </div>
      </div>

      {/* Orbit & Polarization */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-[10px] text-secondaryText block">Orbit / Track</span>
          <span className="font-medium text-primaryText font-mono">
            Track {candidate.orbit.track || 'N/A'} • {candidate.orbit.flightDirection}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-secondaryText block">Polarization</span>
          <span className="font-medium text-primaryText">
            {candidate.polarization}
          </span>
        </div>
      </div>

      {/* Browse Preview Thumbnail if available */}
      {candidate.productReferences?.browseUrl && (
        <div className="pt-1">
          <span className="text-[10px] text-secondaryText block mb-1">
            Radar Browse Quicklook (NASA ASF CDN)
          </span>
          <div className="h-20 w-full rounded border border-slate-200 overflow-hidden bg-slate-900/5 flex items-center justify-center">
            <img
              src={candidate.productReferences.browseUrl}
              alt="NISAR SAR Browse Preview"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Data Source & Access Reference */}
      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
        <span className="text-secondaryText truncate max-w-[170px]" title={candidate.dataSource}>
          Source: {candidate.dataSource.split(' / ')[0]}
        </span>
        <div className="flex items-center gap-2">
          {candidate.productReferences?.catalogUrl && (
            <a
              href={candidate.productReferences.catalogUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline flex items-center gap-0.5"
            >
              <span>ASF Catalog</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {candidate.productReferences?.downloadUrl && (
            <a
              href={candidate.productReferences.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-accent flex items-center gap-0.5 font-medium"
              title="Direct HDF5 Download (requires Earthdata Login)"
            >
              <Download className="w-2.5 h-2.5" />
              <span>H5</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

