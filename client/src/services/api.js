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
      headers: { 'Accept': 'application/json' }
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
    console.warn('Could not fetch change categories from server:', err);
    return [];
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
 * Phase 3: Fetch official NISAR catalog status & Earthdata authentication state
 */
export async function fetchNisarCatalogStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/nisar/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      error: err.message
    };
  }
}

/**
 * Phase 3: Fetch verified NISAR sample areas
 */
export async function fetchNisarSamples() {
  try {
    const res = await fetch(`${API_BASE_URL}/nisar/samples`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.samples || [];
  } catch (err) {
    console.warn('Failed to fetch NISAR samples:', err);
    return [];
  }
}

/**
 * Phase 3: Search and Pair Official NISAR Observations for Baseline & Target
 */
export async function pairNisarObservationsAPI(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/nisar/pair`, {
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
      completePairAvailable: false,
      message: err.message || 'Failed to connect to NISAR data catalog service'
    };
  }
}

/**
 * Phase 3: Prepare data download / access references
 */
export async function prepareNisarDownloadAPI(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/nisar/prepare-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Phase 4: Execute Radar Change Detection on verified observation pair
 */
export async function executeRadarComparisonAPI(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/processing/compare`, {
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
      error: err.message || 'Failed to execute radar change detection'
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
