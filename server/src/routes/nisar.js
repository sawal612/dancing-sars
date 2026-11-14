import { Router } from 'express';
import {
  searchNISARGranules,
  pairNISARObservations,
  getVerifiedNISARSampleAOIs
} from '../services/nisarCatalog.js';
import { testEarthdataAuth, getEarthdataCredentials } from '../services/earthdataAuth.js';
import { calculateBboxAndCenter, normalizePolygon } from '../utils/geoValidation.js';

const router = Router();

/**
 * Helper to get bbox from either raw bbox array or GeoJSON geometry
 */
function extractBbox(reqBody) {
  if (Array.isArray(reqBody.bbox) && reqBody.bbox.length === 4) {
    return reqBody.bbox;
  }
  if (reqBody.geometry) {
    const coords = normalizePolygon(reqBody.geometry);
    if (coords && coords[0]) {
      const { bbox } = calculateBboxAndCenter(coords[0]);
      return bbox;
    }
  }
  return null;
}

/**
 * GET /api/nisar/status
 * Check official data source catalog connectivity & Earthdata credentials
 */
router.get('/nisar/status', async (req, res) => {
  const credentials = getEarthdataCredentials();
  const authStatus = await testEarthdataAuth();

  res.json({
    status: 'connected',
    catalogs: [
      {
        name: 'NASA Alaska Satellite Facility (ASF DAAC)',
        endpoint: 'https://api.daac.asf.alaska.edu/services/search/param',
        status: 'available',
        publicAccess: true
      },
      {
        name: 'NASA Common Metadata Repository (CMR)',
        endpoint: 'https://cmr.earthdata.nasa.gov/search/granules.json',
        status: 'available',
        publicAccess: true
      },
      {
        name: 'ISRO Bhoonidhi Geoportal',
        endpoint: 'https://bhoonidhi.nrsc.gov.in/',
        status: 'referenced',
        publicAccess: true
      }
    ],
    earthdataAuth: {
      isConfigured: credentials.isConfigured,
      username: credentials.username,
      authenticated: authStatus.authenticated,
      message: authStatus.message
    }
  });
});

/**
 * GET /api/nisar/samples
 * Verified test regions with confirmed NISAR observations in the NASA ASF archive
 */
router.get('/nisar/samples', (req, res) => {
  res.json({
    samples: getVerifiedNISARSampleAOIs()
  });
});

/**
 * POST /api/nisar/search
 * Search official NASA ASF NISAR observations for a single date and AOI
 */
router.post('/nisar/search', async (req, res) => {
  const { date, toleranceDays, maxResults } = req.body;
  const bbox = extractBbox(req.body);

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Observation date (date) is required.'
    });
  }

  const results = await searchNISARGranules({
    bbox,
    dateStr: date,
    toleranceDays: toleranceDays ? parseInt(toleranceDays, 10) : 4,
    maxResults: maxResults ? parseInt(maxResults, 10) : 10
  });

  res.json(results);
});

/**
 * POST /api/nisar/pair
 * Discover and pair official NISAR observations for Baseline (T1) and Target (T2)
 */
router.post('/nisar/pair', async (req, res) => {
  const { firstDate, secondDate, toleranceDays } = req.body;
  const bbox = extractBbox(req.body);

  if (!firstDate || !secondDate) {
    return res.status(400).json({
      success: false,
      error: 'Both firstDate and secondDate are required.'
    });
  }

  const result = await pairNISARObservations({
    bbox,
    firstDate,
    secondDate,
    toleranceDays: toleranceDays ? parseInt(toleranceDays, 10) : 5
  });

  res.json(result);
});

/**
 * POST /api/nisar/prepare-download
 * Prepare data file access reference and verify Earthdata access prerequisites
 */
router.post('/nisar/prepare-download', async (req, res) => {
  const { productIdentifier, downloadUrl, s3Uri } = req.body;

  if (!productIdentifier || !downloadUrl) {
    return res.status(400).json({
      success: false,
      error: 'productIdentifier and downloadUrl are required.'
    });
  }

  const credentials = getEarthdataCredentials();
  const authStatus = await testEarthdataAuth();

  res.json({
    success: true,
    productIdentifier,
    downloadUrl,
    s3Uri: s3Uri || null,
    accessMode: authStatus.authenticated ? 'authenticated_direct' : 'requires_earthdata_login',
    authNotice: authStatus.authenticated
      ? 'Authenticated Earthdata session active. Direct HDF5 stream accessible.'
      : 'NASA Earthdata Login required for binary HDF5 payload download. Public metadata and browse imagery remain accessible.',
    instructions: {
      webDownload: downloadUrl,
      cloudAccess: s3Uri,
      earthdataLoginUrl: 'https://urs.earthdata.nasa.gov/'
    }
  });
});

export default router;

