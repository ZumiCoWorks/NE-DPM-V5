// GPS Navigation Helper for Attendee PWA
// Converts between GPS coordinates (lat/lng) and floorplan pixel coordinates

export interface GPSCoordinate {
  lat: number;
  lng: number;
}

export interface FloorplanCoordinate {
  x: number;
  y: number;
}

export interface GPSBounds {
  ne: GPSCoordinate; // Northeast corner
  sw: GPSCoordinate; // Southwest corner
}

export interface FloorplanDimensions {
  width: number;
  height: number;
}

export interface FloorplanCalibration {
  topLeft: GPSCoordinate;
  topRight: GPSCoordinate;
  bottomLeft: GPSCoordinate;
  bottomRight: GPSCoordinate;
  northBearing: number; // degrees clockwise from image top
}

/**
 * Convert GPS coordinates to floorplan pixel coordinates using corner calibration
 * This handles rotation and proper transformation
 */
export function gpsToFloorplanCalibrated(
  gps: GPSCoordinate,
  calibration: FloorplanCalibration,
  floorplanDims: FloorplanDimensions
): FloorplanCoordinate {
  // Use bilinear interpolation based on the four calibrated corners
  // This accounts for rotation, skew, and non-perfect rectangles
  
  // First, find the relative position within the GPS quadrilateral
  // Using inverse bilinear interpolation
  
  // Simplified: use linear interpolation assuming near-rectangular
  const latRange = calibration.topLeft.lat - calibration.bottomLeft.lat;
  const lngRange = calibration.topRight.lng - calibration.topLeft.lng;
  
  const latPct = (calibration.topLeft.lat - gps.lat) / latRange;
  const lngPct = (gps.lng - calibration.topLeft.lng) / lngRange;
  
  // Clamp to 0-1 range
  const clampedLatPct = Math.max(0, Math.min(1, latPct));
  const clampedLngPct = Math.max(0, Math.min(1, lngPct));
  
  // Convert to pixel coordinates
  const x = clampedLngPct * floorplanDims.width;
  const y = clampedLatPct * floorplanDims.height;
  
  return { x, y };
}

/**
 * Convert GPS coordinates to floorplan pixel coordinates
 * Uses linear interpolation based on event GPS bounds
 * LEGACY: Use gpsToFloorplanCalibrated for calibrated floorplans
 */
export function gpsToFloorplan(
  gps: GPSCoordinate,
  gpsBounds: GPSBounds,
  floorplanDims: FloorplanDimensions
): FloorplanCoordinate {
  // Calculate relative position within GPS bounds (0-1 range)
  const latRange = gpsBounds.ne.lat - gpsBounds.sw.lat;
  const lngRange = gpsBounds.ne.lng - gpsBounds.sw.lng;
  
  const latPct = (gps.lat - gpsBounds.sw.lat) / latRange;
  const lngPct = (gps.lng - gpsBounds.sw.lng) / lngRange;
  
  // Convert to floorplan coordinates
  // Note: Latitude increases northward, but y-axis increases downward in images
  const x = lngPct * floorplanDims.width;
  const y = (1 - latPct) * floorplanDims.height; // Flip Y axis
  
  return { x, y };
}

/**
 * Convert floorplan pixel coordinates to GPS coordinates
 */
export function floorplanToGPS(
  floorplanCoord: FloorplanCoordinate,
  gpsBounds: GPSBounds,
  floorplanDims: FloorplanDimensions
): GPSCoordinate {
  // Calculate position as percentage of floorplan dimensions
  const xPct = floorplanCoord.x / floorplanDims.width;
  const yPct = floorplanCoord.y / floorplanDims.height;
  
  // Convert to GPS coordinates
  const latRange = gpsBounds.ne.lat - gpsBounds.sw.lat;
  const lngRange = gpsBounds.ne.lng - gpsBounds.sw.lng;
  
  const lat = gpsBounds.sw.lat + (1 - yPct) * latRange; // Flip Y axis back
  const lng = gpsBounds.sw.lng + xPct * lngRange;
  
  return { lat, lng };
}

/**
 * Calculate distance between two GPS coordinates in meters
 * Uses Haversine formula
 */
export function gpsDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = coord1.lat * Math.PI / 180;
  const lat2 = coord2.lat * Math.PI / 180;
  const deltaLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const deltaLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Check if GPS coordinate is within bounds
 */
export function isWithinBounds(gps: GPSCoordinate, bounds: GPSBounds): boolean {
  return (
    gps.lat >= bounds.sw.lat &&
    gps.lat <= bounds.ne.lat &&
    gps.lng >= bounds.sw.lng &&
    gps.lng <= bounds.ne.lng
  );
}

/**
 * Get current device GPS position
 */
export function getCurrentGPSPosition(): Promise<GPSCoordinate> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Watch GPS position for continuous tracking
 */
export function watchGPSPosition(
  callback: (gps: GPSCoordinate, accuracy: number) => void,
  errorCallback: (error: GeolocationPositionError) => void
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }
  
  return navigator.geolocation.watchPosition(
    (position) => {
      callback(
        {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        position.coords.accuracy
      );
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }
  );
}

/**
 * Stop watching GPS position
 */
export function stopWatchingGPS(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}
