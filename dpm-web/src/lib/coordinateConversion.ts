import { GPSBounds } from '../lib/gpsNavigation';

export interface FloorplanDimensions {
    width: number;
    height: number;
}

/**
 * Convert GPS coordinates to floorplan pixel coordinates
 */
export function gpsToFloorplan(
    lat: number,
    lng: number,
    bounds: GPSBounds,
    floorplanSize: FloorplanDimensions
): { x: number; y: number } {
    const latRange = bounds.ne.lat - bounds.sw.lat;
    const lngRange = bounds.ne.lng - bounds.sw.lng;

    // Normalize to 0-1 range, then scale to floorplan size
    const x = ((lng - bounds.sw.lng) / lngRange) * floorplanSize.width;
    const y = ((bounds.ne.lat - lat) / latRange) * floorplanSize.height; // Flip Y axis

    return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Convert floorplan pixel coordinates to GPS coordinates
 */
export function floorplanToGPS(
    x: number,
    y: number,
    bounds: GPSBounds,
    floorplanSize: FloorplanDimensions
): { lat: number; lng: number } {
    const latRange = bounds.ne.lat - bounds.sw.lat;
    const lngRange = bounds.ne.lng - bounds.sw.lng;

    // Normalize to 0-1 range, then scale to GPS bounds
    const lng = bounds.sw.lng + (x / floorplanSize.width) * lngRange;
    const lat = bounds.ne.lat - (y / floorplanSize.height) * latRange; // Flip Y axis

    return { lat, lng };
}

/**
 * Calculate distance between two GPS points in meters
 */
export function calculateGPSDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}
