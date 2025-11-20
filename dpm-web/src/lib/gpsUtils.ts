/**
 * GPS utility functions for distance, bearing, and navigation calculations
 */

export interface GPSPoint {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(point1: GPSPoint, point2: GPSPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing (direction) from point1 to point2
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function calculateBearing(point1: GPSPoint, point2: GPSPoint): number {
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Convert bearing to cardinal direction
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Convert bearing to arrow emoji
 */
export function bearingToArrow(bearing: number): string {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(bearing / 45) % 8;
  return arrows[index];
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get device heading (compass direction)
 * Requires device orientation permission
 * Includes smoothing to reduce jitter
 */
export function watchHeading(
  onHeading: (heading: number) => void,
  onError?: (error: string) => void
): () => void {
  let handler: ((event: DeviceOrientationEvent) => void) | null = null;
  let previousHeading: number | null = null;
  const smoothingFactor = 0.3; // Lower = more smoothing (0-1)

  if ('DeviceOrientationEvent' in window) {
    // Request permission on iOS 13+
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            startWatching();
          } else {
            onError?.('Compass permission denied');
          }
        })
        .catch((err: Error) => {
          onError?.('Compass not available: ' + err.message);
        });
    } else {
      // Non-iOS devices
      startWatching();
    }
  } else {
    onError?.('Device orientation not supported');
  }

  function startWatching() {
    handler = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // alpha is compass heading (0-360)
        // webkitCompassHeading is more accurate on iOS
        let rawHeading =
          (event as any).webkitCompassHeading ?? 360 - event.alpha;
        
        // Apply exponential smoothing to reduce jitter
        if (previousHeading !== null) {
          // Handle wraparound at 0/360 degrees
          let diff = rawHeading - previousHeading;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          
          const smoothedHeading = previousHeading + diff * smoothingFactor;
          rawHeading = (smoothedHeading + 360) % 360;
        }
        
        previousHeading = rawHeading;
        onHeading(rawHeading);
      }
    };
    window.addEventListener('deviceorientation', handler);
  }

  // Cleanup function
  return () => {
    if (handler) {
      window.removeEventListener('deviceorientation', handler);
    }
  };
}

/**
 * Trigger haptic feedback (if supported)
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'medium') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 50,
    };
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Calculate relative bearing (direction to turn to face destination)
 * @param deviceHeading Current compass heading of device (0-360)
 * @param bearingToTarget Bearing to target location (0-360)
 * @returns Relative bearing (-180 to 180, where 0 is straight ahead)
 */
export function calculateRelativeBearing(
  deviceHeading: number,
  bearingToTarget: number
): number {
  let relative = bearingToTarget - deviceHeading;
  
  // Normalize to -180 to 180
  if (relative > 180) relative -= 360;
  if (relative < -180) relative += 360;
  
  return relative;
}
