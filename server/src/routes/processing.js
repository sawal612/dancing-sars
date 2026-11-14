import { Router } from 'express';
import { executeRadarChangeDetection } from '../services/radarProcessor.js';
import { validateGeoJSONPolygon } from '../utils/geoValidation.js';

const router = Router();

/**
 * GET /api/processing/methods
 * Documented radar change detection algorithms
 */
router.get('/processing/methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'backscatter_log_ratio',
        name: 'SAR Backscatter Log-Ratio Differencing (Δσ°)',
        domain: 'Surface water, flooding, inundation detection',
        formula: 'Δσ°_dB = 10 * log10(σ°_target / σ°_baseline)',
        description: 'Measures changes in radar cross section. Standing water specularly scatters radar pulses away, causing distinct negative decibel drops.',
        applicableProducts: ['L2 GCOV', 'L1 RSLC', 'L2 GSLC'],
        sensorMode: 'L-SAR Dual-Pol (HH/HV)'
      },
      {
        id: 'interferometric_coherence',
        name: 'InSAR Coherence Loss Analysis (γ)',
        domain: 'Surface disturbance, vegetation loss, structure collapse',
        formula: 'γ = |⟨s1 * s2*⟩| / sqrt(⟨|s1|²⟩ * ⟨|s2|²⟩)',
        description: 'Quantifies phase correlation between repeat-pass radar observations. Flooding and physical changes destroy phase coherence.',
        applicableProducts: ['L1 RSLC', 'L2 GUNW'],
        sensorMode: 'L-SAR Repeat Pass (Track-matching)'
      }
    ]
  });
});

/**
 * POST /api/processing/compare
 * Execute radar change detection between two verified NISAR observations
 */
router.post('/processing/compare', async (req, res) => {
  const { firstObservation, secondObservation, geometry, settings } = req.body;

  // 1. Validate inputs
  if (!firstObservation || !secondObservation) {
    return res.status(400).json({
      success: false,
      error: 'Both firstObservation and secondObservation metadata objects are required.'
    });
  }

  if (!firstObservation.productIdentifier || !secondObservation.productIdentifier) {
    return res.status(400).json({
      success: false,
      error: 'Both observations must have valid product identifiers.'
    });
  }

  if (!geometry) {
    return res.status(400).json({
      success: false,
      error: 'A valid GeoJSON boundary geometry is required.'
    });
  }

  const geoCheck = validateGeoJSONPolygon(geometry);
  if (!geoCheck.valid) {
    return res.status(422).json({
      success: false,
      error: 'Invalid geographical boundary.',
      details: geoCheck.errors
    });
  }

  // 2. Execute Radar Processing
  try {
    const result = await executeRadarChangeDetection({
      firstObservation,
      secondObservation,
      geometry,
      settings: settings || { thresholdDb: -3.2 }
    });

    if (!result.success) {
      return res.status(422).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('[Radar Processing Endpoint Error]:', err);
    res.status(500).json({
      success: false,
      error: 'Radar change detection pipeline failed.',
      message: err.message
    });
  }
});

export default router;
