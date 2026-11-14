/**
 * NASA Earthdata Authentication & Access Service
 */

/**
 * Get configured Earthdata credentials from environment
 */
export function getEarthdataCredentials() {
  return {
    username: process.env.EARTHDATA_USERNAME || null,
    password: process.env.EARTHDATA_PASSWORD ? '******' : null,
    token: process.env.EARTHDATA_TOKEN || null,
    isConfigured: Boolean(process.env.EARTHDATA_TOKEN || (process.env.EARTHDATA_USERNAME && process.env.EARTHDATA_PASSWORD))
  };
}

/**
 * Validate Earthdata authentication against NASA URS API
 */
export async function testEarthdataAuth() {
  const token = process.env.EARTHDATA_TOKEN;
  const username = process.env.EARTHDATA_USERNAME;
  const password = process.env.EARTHDATA_PASSWORD;

  if (!token && (!username || !password)) {
    return {
      authenticated: false,
      configured: false,
      message: 'NASA Earthdata credentials not configured in environment. Catalog search uses public DAAC endpoints; full HDF5 downloads require EARTHDATA_USERNAME and EARTHDATA_PASSWORD (or EARTHDATA_TOKEN) in server/.env.'
    };
  }

  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const basic = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${basic}`;
    }

    const res = await fetch('https://urs.earthdata.nasa.gov/api/users/current', {
      headers
    });

    if (res.ok) {
      const userData = await res.json();
      return {
        authenticated: true,
        configured: true,
        user: userData.uid || username,
        message: 'Successfully authenticated with NASA Earthdata Login.'
      };
    } else {
      return {
        authenticated: false,
        configured: true,
        status: res.status,
        message: `Earthdata Login returned HTTP ${res.status}: ${res.statusText}. Please verify credentials.`
      };
    }
  } catch (err) {
    return {
      authenticated: false,
      configured: true,
      error: err.message,
      message: 'Network error connecting to NASA Earthdata Login endpoint.'
    };
  }
}
