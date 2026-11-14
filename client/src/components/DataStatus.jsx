import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Server } from 'lucide-react';
import { fetchBackendHealth } from '../services/api';

export default function DataStatus() {
  const [health, setHealth] = useState({
    connected: false,
    loading: true,
    data: null,
    error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    setIsRefreshing(true);
    const result = await fetchBackendHealth();
    setHealth({
      connected: result.connected,
      loading: false,
      data: result.data || null,
      error: result.error || null,
    });
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkHealth();
    // Periodic check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
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
              <span>SAR Pipeline:</span>
              <span className={health.connected ? 'text-accent font-semibold' : 'text-amber-600 font-semibold'}>
                {health.connected ? 'Operational' : 'Backend Standby'}
              </span>
            </span>
            <span className="text-[10px] text-secondaryText">
              {health.connected
                ? `Node Engine Online • Mission: ${health.data?.mission || 'NISAR'}`
                : 'Awaiting API connection at localhost:5000'}
            </span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={checkHealth}
          disabled={isRefreshing}
          title="Refresh Backend Health Status"
          className="p-1 text-secondaryText hover:text-primaryText hover:bg-slate-100 rounded transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent' : ''}`} />
        </button>
      </div>
    </div>
  );
}

