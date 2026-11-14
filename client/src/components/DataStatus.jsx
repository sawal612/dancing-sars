import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Server, Satellite } from 'lucide-react';
import { fetchBackendHealth, fetchNisarCatalogStatus } from '../services/api';

export default function DataStatus() {
  const [health, setHealth] = useState({
    connected: false,
    loading: true,
    data: null,
    error: null,
  });
  const [catalogStatus, setCatalogStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    setIsRefreshing(true);
    const [healthRes, catalogRes] = await Promise.all([
      fetchBackendHealth(),
      fetchNisarCatalogStatus()
    ]);

    setHealth({
      connected: healthRes.connected,
      loading: false,
      data: healthRes.data || null,
      error: healthRes.error || null,
    });
    setCatalogStatus(catalogRes);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface/95 backdrop-blur-sm border border-borderCol rounded-md px-3 py-2 shadow-sm text-xs font-sans">
      <div className="flex items-center justify-between gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {health.connected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            )}
          </span>

          <div className="flex flex-col">
            <span className="font-medium text-[11px] text-primaryText flex items-center gap-1.5">
              <span>NASA ASF / NISAR Catalog:</span>
              <span className={health.connected ? 'text-accent font-semibold' : 'text-amber-600 font-semibold'}>
                {health.connected ? 'Connected' : 'Standby'}
              </span>
            </span>
            <span className="text-[10px] text-secondaryText truncate max-w-[210px]">
              {health.connected
                ? 'NASA DAAC & CMR Gateway Live'
                : 'Awaiting backend connection'}
            </span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={checkStatus}
          disabled={isRefreshing}
          title="Refresh Data Source & Backend Health"
          className="p-1 text-secondaryText hover:text-primaryText hover:bg-slate-100 rounded transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
        </button>
      </div>
    </div>
  );
}
