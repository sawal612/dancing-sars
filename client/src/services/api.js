const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch backend health status
 */
export async function fetchBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      connected: true,
      data,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Backend unreachable',
      timestamp: Date.now()
    };
  }
}

/**
 * Fetch available change categories
 */
export async function fetchChangeCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/comparison/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.categories || [];
  } catch (err) {
    console.warn('Could not fetch change categories from server, using fallback:', err);
    return [
      {
        id: 'flood_surface_water',
        name: 'Flood and surface water changes',
        description: 'High-sensitivity SAR backscatter detection of standing water, surface inundation, and hydrological displacement.',
        sensorMode: 'NISAR Dual-Pol (HH/HV) & Single-Pol (VV)',
        suitableBands: ['L-band', 'S-band']
      }
    ];
  }
}

/**
 * Validate GeoJSON Geometry with backend
 */
export async function validateGeometryAPI(geometry) {
  try {
    const res = await fetch(`${API_BASE_URL}/geometry/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geometry })
    });
    const data = await res.json();
    return {
      success: res.ok,
      ...data
    };
  } catch (err) {
    return {
      success: false,
      valid: false,
      errors: [err.message || 'Network error communicating with validation server']
    };
  }
}

/**
 * Validate Comparison parameters with backend
 */
export async function validateComparisonAPI(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/comparison/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return {
      success: res.ok,
      ...data
    };
  } catch (err) {
    return {
      success: false,
      valid: false,
      errors: [err.message || 'Network error communicating with comparison validator']
    };
  }
}

/**
 * Submit Comparison Request to backend
 */
export async function submitComparisonRequestAPI(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/comparison/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return {
      success: res.ok,
      ...data
    };
  } catch (err) {
    return {
      success: false,
      errors: [err.message || 'Failed to submit comparison request']
    };
  }
}

/**
 * Frontend self health check
 */
export function getFrontendHealth() {
  return {
    status: 'ok',
    client: 'EarthWatch Web Interface',
    version: '1.0.0',
    mode: import.meta.env.MODE,
    timestamp: new Date().toISOString()
  };
}
