/**
 * Geospatial Validation Utility for EarthWatch
 */

const EARTH_RADIUS_KM = 6371.0088;
const MIN_AREA_KM2 = 0.01; // Minimum 0.01 sq km (1 hectare)
const MAX_AREA_KM2 = 3000000; // Max 3,000,000 sq km for regional SAR swath analysis

/**
 * Validate individual [lon, lat] coordinate
 */
export function isValidCoordinate(coord) {
  if (!Array.isArray(coord) || coord.length < 2) return false;
  const [lon, lat] = coord;
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    lon >= -180 &&
    lon <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

/**
 * Extract coordinates array from either GeoJSON Feature or direct Geometry
 */
export function normalizePolygon(geometry) {
  if (!geometry || typeof geometry !== 'object') return null;

  if (geometry.type === 'Feature') {
    return normalizePolygon(geometry.geometry);
  }

  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates;
  }

  return null;
}

/**
 * Compute spherical polygon surface area in square kilometers
 */
export function calculatePolygonAreaKm2(ring) {
  if (!ring || ring.length < 4) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  let total = 0;
  const len = ring.length;

  for (let i = 0; i < len - 1; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];
    const lon1 = toRad(p1[0]);
    const lat1 = toRad(p1[1]);
    const lon2 = toRad(p2[0]);
    const lat2 = toRad(p2[1]);

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = Math.abs((total * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2.0);
  return Math.round(area * 100) / 100;
}

/**
 * Compute bounding box [minLon, minLat, maxLon, maxLat] and centroid
 */
export function calculateBboxAndCenter(ring) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLon = 0;
  let sumLat = 0;

  const count = ring.length - 1; // exclude duplicate closure
  for (let i = 0; i < count; i++) {
    const [lon, lat] = ring[i];
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    sumLon += lon;
    sumLat += lat;
  }

  return {
    bbox: [minLon, minLat, maxLon, maxLat],
    center: [sumLon / count, sumLat / count]
  };
}

/**
 * Comprehensive Polygon GeoJSON Validator
 */
export function validateGeoJSONPolygon(rawGeometry) {
  const errors = [];
  const coords = normalizePolygon(rawGeometry);

  if (!coords) {
    errors.push('Invalid GeoJSON: Expected Polygon or Feature with Polygon geometry.');
    return { valid: false, errors };
  }

  const outerRing = coords[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) {
    errors.push('Polygon outer ring must contain at least 4 coordinates (3 vertices + closure point).');
    return { valid: false, errors };
  }

  // Validate every vertex
  for (let i = 0; i < outerRing.length; i++) {
    const pt = outerRing[i];
    if (!isValidCoordinate(pt)) {
      errors.push(`Vertex ${i} has invalid coordinates: ${JSON.stringify(pt)}. Lon must be [-180, 180], Lat must be [-90, 90].`);
      return { valid: false, errors };
    }
  }

  // Check closure
  const first = outerRing[0];
  const last = outerRing[outerRing.length - 1];
  const diffLon = Math.abs(first[0] - last[0]);
  const diffLat = Math.abs(first[1] - last[1]);
  if (diffLon > 1e-5 || diffLat > 1e-5) {
    errors.push('Polygon is not closed: first and last coordinates must be identical.');
    return { valid: false, errors };
  }

  // Calculate metrics
  const areaKm2 = calculatePolygonAreaKm2(outerRing);
  const { bbox, center } = calculateBboxAndCenter(outerRing);

  if (areaKm2 < MIN_AREA_KM2) {
    errors.push(`Polygon area (${areaKm2} km²) is too small for satellite SAR analysis. Minimum area is ${MIN_AREA_KM2} km².`);
  }

  if (areaKm2 > MAX_AREA_KM2) {
    errors.push(`Polygon area (${areaKm2.toLocaleString()} km²) exceeds maximum allowable SAR processing swath size (${MAX_AREA_KM2.toLocaleString()} km²).`);
  }

  return {
    valid: errors.length === 0,
    errors,
    metrics: {
      areaKm2,
      bbox,
      center,
      vertexCount: outerRing.length - 1
    }
  };
}

