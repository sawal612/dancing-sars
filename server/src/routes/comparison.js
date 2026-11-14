import { Router } from 'express';
import { validateGeoJSONPolygon, isValidCoordinate } from '../utils/geoValidation.js';

const router = Router();

// In-memory store for comparison requests
const comparisonRequests = new Map();

// Supported Change Categories
export const CHANGE_CATEGORIES = [
  {
    id: 'flood_surface_water',
    name: 'Flood and surface water changes',
    description: 'High-sensitivity SAR backscatter detection of standing water, surface inundation, and hydrological displacement.',
    sensorMode: 'NISAR Dual-Pol (HH/HV) & Single-Pol (VV)',
    suitableBands: ['L-band', 'S-band']
  }
];

/**
 * GET /api/comparison/categories
 */
router.get('/comparison/categories', (req, res) => {
  res.json({
    categories: CHANGE_CATEGORIES
  });
});

/**
 * POST /api/geometry/validate
 * Validates GeoJSON geometry, coordinates, ring closure, and area
 */
router.post('/geometry/validate', (req, res) => {
  const { geometry } = req.body;

  if (!geometry) {
    return res.status(400).json({
      valid: false,
      errors: ['Missing required geometry in request body.']
    });
  }

  const result = validateGeoJSONPolygon(geometry);
  if (!result.valid) {
    return res.status(422).json({
      valid: false,
      errors: result.errors
    });
  }

  res.json({
    valid: true,
    message: 'Geometry is valid for satellite observation comparison.',
    metrics: result.metrics
  });
});

/**
 * Helper to validate observation dates
 */
function validateObservationDates(firstDateStr, secondDateStr) {
  const errors = [];

  if (!firstDateStr) {
    errors.push('First observation date is required.');
  }
  if (!secondDateStr) {
    errors.push('Second observation date is required.');
  }

  if (firstDateStr && secondDateStr) {
    const d1 = new Date(firstDateStr);
    const d2 = new Date(secondDateStr);

    if (isNaN(d1.getTime())) {
      errors.push('First observation date is not a valid date format.');
    }
    if (isNaN(d2.getTime())) {
      errors.push('Second observation date is not a valid date format.');
    }

    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const day1 = d1.toISOString().split('T')[0];
      const day2 = d2.toISOString().split('T')[0];

      if (day1 === day2) {
        errors.push('First and second observation dates cannot be identical. A temporal gap is required to detect surface water changes.');
      } else if (d2.getTime() <= d1.getTime()) {
        errors.push('Second observation date must be chronologically later than the first observation date.');
      }
    }
  }

  return errors;
}

/**
 * POST /api/comparison/validate
 * Validates entire comparison parameters (location, geometry, dates, category)
 */
router.post('/comparison/validate', (req, res) => {
  const { geometry, firstDate, secondDate, changeCategory, locationName } = req.body;

  const errors = [];

  // 1. Validate geometry
  if (!geometry) {
    errors.push('Geographical boundary (geometry) is required.');
  } else {
    const geoValidation = validateGeoJSONPolygon(geometry);
    if (!geoValidation.valid) {
      errors.push(...geoValidation.errors);
    }
  }

  // 2. Validate dates
  const dateErrors = validateObservationDates(firstDate, secondDate);
  if (dateErrors.length > 0) {
    errors.push(...dateErrors);
  }

  // 3. Validate change category
  if (!changeCategory) {
    errors.push('Change category is required.');
  } else {
    const validCategory = CHANGE_CATEGORIES.some(c => c.id === changeCategory);
    if (!validCategory) {
      errors.push(`Invalid change category: "${changeCategory}". Supported: ${CHANGE_CATEGORIES.map(c => c.id).join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({
      valid: false,
      errors
    });
  }

  const geoValidation = validateGeoJSONPolygon(geometry);

  res.json({
    valid: true,
    message: 'Comparison parameters are valid.',
    summary: {
      locationName: locationName || 'Custom Region of Interest',
      changeCategory,
      firstDate,
      secondDate,
      daysDifference: Math.round(
        (new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
      metrics: geoValidation.metrics
    }
  });
});

/**
 * POST /api/comparison/request
 * Submits and prepares a structured comparison request ready for Phase 3 ingestion
 */
router.post('/comparison/request', (req, res) => {
  const { geometry, firstDate, secondDate, changeCategory, locationName } = req.body;

  // Run validation
  const errors = [];
  if (!geometry) errors.push('Geographical boundary (geometry) is required.');
  const dateErrors = validateObservationDates(firstDate, secondDate);
  if (dateErrors.length > 0) errors.push(...dateErrors);

  const selectedCategory = CHANGE_CATEGORIES.find(c => c.id === changeCategory);
  if (!selectedCategory) {
    errors.push('A valid change category is required.');
  }

  let geoValidation = null;
  if (geometry) {
    geoValidation = validateGeoJSONPolygon(geometry);
    if (!geoValidation.valid) {
      errors.push(...geoValidation.errors);
    }
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      errors
    });
  }

  // Create unique request ID
  const requestId = `EW-SAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const requestPayload = {
    id: requestId,
    location: locationName || 'Custom AOI',
    changeCategory: {
      id: selectedCategory.id,
      name: selectedCategory.name,
      sensorMode: selectedCategory.sensorMode
    },
    observations: {
      first: {
        date: firstDate,
        role: 'baseline'
      },
      second: {
        date: secondDate,
        role: 'target'
      },
      deltaDays: Math.round((new Date(secondDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24))
    },
    geometry: {
      type: 'Polygon',
      coordinates: geometry.coordinates || geometry.geometry?.coordinates,
      metrics: geoValidation.metrics
    },
    status: 'prepared',
    pipelineStage: 'ready_for_acquisition',
    createdAt: new Date().toISOString()
  };

  comparisonRequests.set(requestId, requestPayload);

  res.status(201).json({
    success: true,
    message: 'Satellite observation comparison request successfully registered and prepared.',
    requestId,
    data: requestPayload
  });
});

/**
 * GET /api/comparison/requests
 */
router.get('/comparison/requests', (req, res) => {
  res.json({
    count: comparisonRequests.size,
    requests: Array.from(comparisonRequests.values()).slice(-10).reverse()
  });
});

export default router;

