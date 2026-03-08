/**
 * Affine Calibration Library
 * 
 * Provides accurate GPS-to-pixel coordinate transformation using 2-point calibration.
 * Calculates scale, rotation, and origin from user-selected reference points.
 * 
 * @module affineCalibration
 */

export interface GPSCoordinate {
    lat: number;
    lng: number;
}

export interface PixelCoordinate {
    x: number;
    y: number;
}

export interface CalibrationPoint {
    pixel: PixelCoordinate;
    gps: GPSCoordinate;
}

export interface CalibrationResult {
    // Human-readable values (stored in database)
    scale_meters_per_pixel: number;
    rotation_degrees: number;
    origin_gps_lat: number;
    origin_gps_lng: number;

    // Extrapolated 4-corner GPS bounds
    gps_top_left_lat: number;
    gps_top_left_lng: number;
    gps_top_right_lat: number;
    gps_top_right_lng: number;
    gps_bottom_left_lat: number;
    gps_bottom_left_lng: number;
    gps_bottom_right_lat: number;
    gps_bottom_right_lng: number;

    // Metadata
    reference_points: CalibrationPoint[];
    estimated_accuracy_meters: number;
    calibration_method: 'gps_2point';
    is_calibrated: true;
}

/**
 * Calculate distance between two GPS coordinates in meters using Haversine formula
 */
export function calculateGPSDistance(point1: GPSCoordinate, point2: GPSCoordinate): number {
    const R = 6371000; // Earth's radius in meters
    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Calculate bearing (angle) from point1 to point2 in degrees (0° = North, 90° = East)
 */
export function calculateGPSBearing(point1: GPSCoordinate, point2: GPSCoordinate): number {
    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearing = Math.atan2(y, x);
    const bearingDegrees = ((bearing * 180) / Math.PI + 360) % 360; // Normalize to 0-360

    return bearingDegrees;
}

/**
 * Calculate pixel distance between two pixel coordinates
 */
export function calculatePixelDistance(point1: PixelCoordinate, point2: PixelCoordinate): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle from point1 to point2 in pixel space (0° = right, 90° = down)
 */
export function calculatePixelAngle(point1: PixelCoordinate, point2: PixelCoordinate): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const angleRadians = Math.atan2(dy, dx);
    const angleDegrees = (angleRadians * 180) / Math.PI;
    return angleDegrees;
}

/**
 * Perform 2-point affine calibration
 * 
 * Given 2 reference points (pixel → GPS), calculates:
 * - Scale (meters per pixel)
 * - Rotation (degrees clockwise from north)
 * - Origin GPS coordinate (top-left corner of image)
 * - Extrapolated 4-corner GPS bounds
 * 
 * @param point1 First calibration point
 * @param point2 Second calibration point
 * @param imageWidth Width of floorplan image in pixels
 * @param imageHeight Height of floorplan image in pixels
 * @returns Calibration result with scale, rotation, and GPS bounds
 */
export function calibrateFromTwoPoints(
    point1: CalibrationPoint,
    point2: CalibrationPoint,
    imageWidth: number,
    imageHeight: number
): CalibrationResult {
    // Validation
    if (!point1.gps || !point2.gps) {
        throw new Error('Both calibration points must have GPS coordinates');
    }

    const pixelDistance = calculatePixelDistance(point1.pixel, point2.pixel);
    if (pixelDistance < 50) {
        throw new Error('Calibration points are too close together (minimum 50 pixels). Please select points farther apart.');
    }

    const gpsDistance = calculateGPSDistance(point1.gps, point2.gps);
    if (gpsDistance < 10) {
        throw new Error('Calibration points are too close together (minimum 10 meters). Please select points farther apart.');
    }

    // Calculate scale (meters per pixel)
    const scale_meters_per_pixel = gpsDistance / pixelDistance;

    // Calculate rotation
    // GPS bearing: 0° = North, 90° = East (clockwise from north)
    // Pixel angle: 0° = Right, 90° = Down (standard screen coordinates)
    const gpsBearing = calculateGPSBearing(point1.gps, point2.gps);
    const pixelAngle = calculatePixelAngle(point1.pixel, point2.pixel);

    // Rotation = GPS bearing - pixel angle
    // This tells us how many degrees clockwise the image is rotated from true north
    // We need to adjust for the fact that pixel Y-axis points down, not up
    // Pixel angle 0° (right) should correspond to GPS bearing 90° (east)
    const rotation_degrees = ((gpsBearing - (pixelAngle + 90)) + 360) % 360;

    // Calculate origin GPS coordinate (top-left corner at pixel 0,0)
    // We'll use point1 as reference and work backwards
    const origin = calculateGPSFromPixel(
        { x: 0, y: 0 },
        point1.pixel,
        point1.gps,
        scale_meters_per_pixel,
        rotation_degrees
    );

    // Calculate 4-corner GPS bounds by transforming image corners
    const topLeft = origin;
    const topRight = calculateGPSFromPixel(
        { x: imageWidth, y: 0 },
        point1.pixel,
        point1.gps,
        scale_meters_per_pixel,
        rotation_degrees
    );
    const bottomLeft = calculateGPSFromPixel(
        { x: 0, y: imageHeight },
        point1.pixel,
        point1.gps,
        scale_meters_per_pixel,
        rotation_degrees
    );
    const bottomRight = calculateGPSFromPixel(
        { x: imageWidth, y: imageHeight },
        point1.pixel,
        point1.gps,
        scale_meters_per_pixel,
        rotation_degrees
    );

    // Estimate accuracy based on point separation
    // Better separation = better accuracy
    // Rule of thumb: accuracy ≈ 1% of calibration distance
    const estimated_accuracy_meters = Math.max(1, gpsDistance * 0.01);

    return {
        scale_meters_per_pixel,
        rotation_degrees,
        origin_gps_lat: origin.lat,
        origin_gps_lng: origin.lng,
        gps_top_left_lat: topLeft.lat,
        gps_top_left_lng: topLeft.lng,
        gps_top_right_lat: topRight.lat,
        gps_top_right_lng: topRight.lng,
        gps_bottom_left_lat: bottomLeft.lat,
        gps_bottom_left_lng: bottomLeft.lng,
        gps_bottom_right_lat: bottomRight.lat,
        gps_bottom_right_lng: bottomRight.lng,
        reference_points: [point1, point2],
        estimated_accuracy_meters,
        calibration_method: 'gps_2point',
        is_calibrated: true,
    };
}

/**
 * Convert pixel coordinates to GPS coordinates using calibration data
 * 
 * @param pixel Pixel coordinate to convert
 * @param referencePixel Known pixel coordinate (from calibration)
 * @param referenceGPS Known GPS coordinate (from calibration)
 * @param scale Scale in meters per pixel
 * @param rotation Rotation in degrees (clockwise from north)
 * @returns GPS coordinate
 */
function calculateGPSFromPixel(
    pixel: PixelCoordinate,
    referencePixel: PixelCoordinate,
    referenceGPS: GPSCoordinate,
    scale: number,
    rotation: number
): GPSCoordinate {
    // Calculate pixel offset from reference point
    const dx = pixel.x - referencePixel.x;
    const dy = pixel.y - referencePixel.y;

    // Convert pixel offset to meters
    const metersX = dx * scale;
    const metersY = dy * scale;

    // Apply rotation to get north/east offset.
    // Screen Y is POSITIVE DOWNWARD (south), geographic North is POSITIVE UPWARD.
    // For a floorplan rotated θ° clockwise from north:
    //   moving right (+metersX) = bearing (θ + 90°) from north
    //   moving down  (+metersY) = bearing (θ + 180°) from north (i.e. south)
    // Therefore:
    //   northOffset = metersX * (-sin θ) + metersY * (-cos θ)
    //   eastOffset  = metersX *   cos θ  + metersY * (-sin θ)
    const rotationRad = (rotation * Math.PI) / 180;
    const northOffset = -metersX * Math.sin(rotationRad) - metersY * Math.cos(rotationRad);
    const eastOffset = metersX * Math.cos(rotationRad) - metersY * Math.sin(rotationRad);

    // Convert meter offsets to GPS coordinate changes
    // 1 degree latitude  ≈ 111,320 meters
    // 1 degree longitude ≈ 111,320 * cos(latitude) meters
    const latOffset = northOffset / 111320;
    const lngOffset = eastOffset / (111320 * Math.cos((referenceGPS.lat * Math.PI) / 180));

    return {
        lat: referenceGPS.lat + latOffset,
        lng: referenceGPS.lng + lngOffset,
    };
}

/**
 * Convert GPS coordinates to pixel coordinates using calibration data
 * 
 * @param gps GPS coordinate to convert
 * @param scale Scale in meters per pixel
 * @param rotation Rotation in degrees (clockwise from north)
 * @param originGPS GPS coordinate of image origin (top-left corner)
 * @returns Pixel coordinate
 */
export function gpsToPixel(
    gps: GPSCoordinate,
    scale: number,
    rotation: number,
    originGPS: GPSCoordinate
): PixelCoordinate {
    // Calculate GPS offset from origin
    const latOffset = gps.lat - originGPS.lat;
    const lngOffset = gps.lng - originGPS.lng;

    // Convert GPS offset to meters
    const northOffset = latOffset * 111320;
    const eastOffset = lngOffset * (111320 * Math.cos((originGPS.lat * Math.PI) / 180));

    // Apply inverse rotation to get pixel-space offset.
    // This is the transpose (= inverse for orthogonal matrix) of the forward rotation:
    //   metersX =  eastOffset * cos θ - northOffset * sin θ
    //   metersY = -northOffset * cos θ - eastOffset * sin θ
    const rotationRad = (rotation * Math.PI) / 180;
    const metersX = eastOffset * Math.cos(rotationRad) - northOffset * Math.sin(rotationRad);
    const metersY = -northOffset * Math.cos(rotationRad) - eastOffset * Math.sin(rotationRad);

    // Convert meters to pixels
    const x = metersX / scale;
    const y = metersY / scale;

    return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Convert pixel coordinates to GPS coordinates using calibration data
 * (Public API version)
 * 
 * @param pixel Pixel coordinate to convert
 * @param scale Scale in meters per pixel
 * @param rotation Rotation in degrees (clockwise from north)
 * @param originGPS GPS coordinate of image origin (top-left corner)
 * @returns GPS coordinate
 */
export function pixelToGPS(
    pixel: PixelCoordinate,
    scale: number,
    rotation: number,
    originGPS: GPSCoordinate
): GPSCoordinate {
    return calculateGPSFromPixel(pixel, { x: 0, y: 0 }, originGPS, scale, rotation);
}

/**
 * Validate calibration quality
 * 
 * @param calibration Calibration result to validate
 * @returns Validation result with warnings/errors
 */
export function validateCalibration(calibration: CalibrationResult): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
} {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check scale reasonableness (typical venue floorplans: 0.1 - 5.0 m/px)
    if (calibration.scale_meters_per_pixel < 0.05) {
        warnings.push(`Scale is very small (${calibration.scale_meters_per_pixel.toFixed(3)} m/px). This might indicate calibration points are too close together.`);
    }
    if (calibration.scale_meters_per_pixel > 10) {
        warnings.push(`Scale is very large (${calibration.scale_meters_per_pixel.toFixed(3)} m/px). This might indicate calibration points are too close together.`);
    }

    // Check accuracy estimate
    if (calibration.estimated_accuracy_meters > 5) {
        warnings.push(`Estimated accuracy is low (±${calibration.estimated_accuracy_meters.toFixed(1)}m). Consider selecting calibration points farther apart.`);
    }

    // Check GPS bounds are reasonable (not inverted).
    // Note: in the southern hemisphere, latitudes are negative.
    // "top" (north) should have a LESS-NEGATIVE (higher) lat value than "bottom" (south).
    if (calibration.gps_top_left_lat < calibration.gps_bottom_left_lat) {
        errors.push(`GPS bounds appear inverted (top-left lat ${calibration.gps_top_left_lat.toFixed(6)} < bottom-left lat ${calibration.gps_bottom_left_lat.toFixed(6)}). ` +
            'The top-left of your floorplan should map to a more northerly coordinate. ' +
            'Try selecting your calibration points so that Point 1 is the top-left corner and Point 2 is the bottom-right corner.');
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
    };
}
