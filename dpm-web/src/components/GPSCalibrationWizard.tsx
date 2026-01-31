import React, { useState } from 'react';
import {
    calibrateFromTwoPoints,
    validateCalibration,
    CalibrationPoint,
    CalibrationResult,
} from '../lib/affineCalibration';

interface GPSBounds {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
}

interface Props {
    floorplanUrl: string;
    floorplanId?: string;
    imageWidth?: number;
    imageHeight?: number;
    onComplete: (calibrationData: CalibrationResult & { gpsBounds: GPSBounds }) => void;
    onCancel: () => void;
}

export function GPSCalibrationWizard({
    floorplanUrl,
    floorplanId,
    imageWidth: propImageWidth,
    imageHeight: propImageHeight,
    onComplete,
    onCancel
}: Props) {
    const [step, setStep] = useState<'intro' | 'point1' | 'point2' | 'confirm'>('intro');
    const [point1, setPoint1] = useState<CalibrationPoint>({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
    const [point2, setPoint2] = useState<CalibrationPoint>({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
    const [gpsInput, setGpsInput] = useState('');
    const [imageSize, setImageSize] = useState({ width: propImageWidth || 0, height: propImageHeight || 0 });
    const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Scale click coordinates to actual image dimensions
        const scaleX = imageSize.width / rect.width;
        const scaleY = imageSize.height / rect.height;
        const actualX = x * scaleX;
        const actualY = y * scaleY;

        if (step === 'point1') {
            setPoint1({ ...point1, pixel: { x: actualX, y: actualY } });
        } else if (step === 'point2') {
            setPoint2({ ...point2, pixel: { x: actualX, y: actualY } });
        }
    };

    const parseGPSInput = (input: string): { lat: number; lng: number } | null => {
        // Parse formats: "-25.864843, 28.135325" or "-25.864843,28.135325"
        const cleaned = input.replace(/\s/g, '');
        const parts = cleaned.split(',');

        if (parts.length !== 2) return null;

        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng };
    };

    const handleGPSSubmit = () => {
        const gps = parseGPSInput(gpsInput);
        if (!gps) {
            alert('Invalid GPS format. Please use: latitude, longitude (e.g., -25.864843, 28.135325)');
            return;
        }

        if (step === 'point1') {
            setPoint1({ ...point1, gps });
            setGpsInput('');
            setStep('point2');
        } else if (step === 'point2') {
            setPoint2({ ...point2, gps });
            setGpsInput('');

            // Calculate calibration immediately
            try {
                const result = calibrateFromTwoPoints(
                    { ...point1, gps: point1.gps },
                    { pixel: point2.pixel, gps },
                    imageSize.width,
                    imageSize.height
                );

                const validation = validateCalibration(result);
                setValidationWarnings(validation.warnings);

                if (!validation.isValid) {
                    alert(`Calibration error:\n${validation.errors.join('\n')}`);
                    return;
                }

                setCalibrationResult(result);
                setStep('confirm');
            } catch (error: any) {
                alert(`Calibration failed: ${error.message}`);
            }
        }
    };

    const handleConfirm = () => {
        if (!calibrationResult) return;

        // Calculate GPS bounds for backward compatibility
        const gpsBounds: GPSBounds = {
            ne: {
                lat: Math.max(
                    calibrationResult.gps_top_left_lat,
                    calibrationResult.gps_top_right_lat,
                    calibrationResult.gps_bottom_left_lat,
                    calibrationResult.gps_bottom_right_lat
                ),
                lng: Math.max(
                    calibrationResult.gps_top_left_lng,
                    calibrationResult.gps_top_right_lng,
                    calibrationResult.gps_bottom_left_lng,
                    calibrationResult.gps_bottom_right_lng
                ),
            },
            sw: {
                lat: Math.min(
                    calibrationResult.gps_top_left_lat,
                    calibrationResult.gps_top_right_lat,
                    calibrationResult.gps_bottom_left_lat,
                    calibrationResult.gps_bottom_right_lat
                ),
                lng: Math.min(
                    calibrationResult.gps_top_left_lng,
                    calibrationResult.gps_top_right_lng,
                    calibrationResult.gps_bottom_left_lng,
                    calibrationResult.gps_bottom_right_lng
                ),
            },
        };

        onComplete({ ...calibrationResult, gpsBounds });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-primary text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <h2 className="text-xl font-bold">GPS Calibration Wizard</h2>
                    </div>
                    <button onClick={onCancel} className="text-white hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'intro' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">How This Works</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                    <li>Click <strong>2 recognizable points</strong> on your floorplan (e.g., building corners)</li>
                                    <li>For each point, enter GPS coordinates from Google Maps</li>
                                    <li>System automatically calculates scale, rotation, and GPS bounds</li>
                                </ol>
                            </div>

                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                                <h3 className="font-semibold text-yellow-900 mb-2">📍 Getting GPS Coordinates</h3>
                                <p className="text-sm text-yellow-800 mb-2">
                                    <strong>In Google Maps:</strong>
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                                    <li>Find your venue</li>
                                    <li>Right-click on a corner of your building</li>
                                    <li>Click the coordinates to copy (e.g., "-25.864843, 28.135325")</li>
                                    <li>Paste here when prompted</li>
                                </ol>
                            </div>

                            <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                <h3 className="font-semibold text-green-900 mb-2">💡 Pro Tips</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                                    <li>Select points <strong>far apart</strong> (opposite corners) for better accuracy</li>
                                    <li>Choose <strong>recognizable landmarks</strong> (building corners, entrances)</li>
                                    <li>Ensure points are visible on both the floorplan and satellite imagery</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => setStep('point1')}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Start Calibration
                            </button>
                        </div>
                    )}

                    {(step === 'point1' || step === 'point2') && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                <h3 className="font-semibold text-blue-900">
                                    Step {step === 'point1' ? '1' : '2'} of 2: {step === 'point1' ? 'First' : 'Second'} Calibration Point
                                </h3>
                                <p className="text-sm text-blue-800 mt-1">
                                    Click on a <strong>recognizable corner</strong> of your building (e.g., {step === 'point1' ? 'top-left' : 'bottom-right'})
                                </p>
                            </div>

                            {/* Floorplan */}
                            <div className="border-2 border-gray-300 rounded-lg overflow-hidden relative bg-gray-100">
                                <img
                                    src={floorplanUrl}
                                    alt="Floorplan"
                                    className="w-full cursor-crosshair"
                                    onClick={handleImageClick}
                                    onLoad={(e) => {
                                        const img = e.currentTarget;
                                        if (!propImageWidth || !propImageHeight) {
                                            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                                        }
                                    }}
                                />

                                {/* Show Point 1 marker */}
                                {point1.pixel.x > 0 && (
                                    <div
                                        className="absolute w-4 h-4 bg-green-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{
                                            left: `${(point1.pixel.x / imageSize.width) * 100}%`,
                                            top: `${(point1.pixel.y / imageSize.height) * 100}%`
                                        }}
                                    >
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Point 1 {point1.gps.lat !== 0 && '✓'}
                                        </div>
                                    </div>
                                )}

                                {/* Show Point 2 marker */}
                                {step === 'point2' && point2.pixel.x > 0 && (
                                    <div
                                        className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{
                                            left: `${(point2.pixel.x / imageSize.width) * 100}%`,
                                            top: `${(point2.pixel.y / imageSize.height) * 100}%`
                                        }}
                                    >
                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            Point 2
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* GPS Input */}
                            {((step === 'point1' && point1.pixel.x > 0) || (step === 'point2' && point2.pixel.x > 0)) && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Enter GPS coordinates for this point:
                                    </label>
                                    <input
                                        type="text"
                                        value={gpsInput}
                                        onChange={(e) => setGpsInput(e.target.value)}
                                        placeholder="-25.864843, 28.135325"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                        onKeyPress={(e) => e.key === 'Enter' && handleGPSSubmit()}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Paste coordinates from Google Maps (right-click → click coordinates)
                                    </p>
                                    <button
                                        onClick={handleGPSSubmit}
                                        disabled={!gpsInput}
                                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'confirm' && calibrationResult && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                <h3 className="font-semibold text-green-900 mb-2">✅ Calibration Complete!</h3>
                                <p className="text-sm text-green-800">
                                    Your floorplan has been calibrated. Review the calculated values below.
                                </p>
                            </div>

                            {/* Calibration Metrics */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                <h4 className="font-semibold text-gray-900">Calibration Metrics:</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Scale</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {calibrationResult.scale_meters_per_pixel.toFixed(3)} m/px
                                        </p>
                                    </div>

                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Rotation</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {calibrationResult.rotation_degrees.toFixed(1)}°
                                        </p>
                                    </div>

                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Estimated Accuracy</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            ±{calibrationResult.estimated_accuracy_meters.toFixed(1)} m
                                        </p>
                                    </div>

                                    <div className="bg-white p-3 rounded border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-1">Method</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            2-Point GPS
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {validationWarnings.length > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Warnings:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                        {validationWarnings.map((warning, i) => (
                                            <li key={i}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* GPS Bounds */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold text-gray-900">Calculated GPS Bounds:</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Top-Left</p>
                                        <p className="font-mono text-xs">
                                            {calibrationResult.gps_top_left_lat.toFixed(6)}, {calibrationResult.gps_top_left_lng.toFixed(6)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Top-Right</p>
                                        <p className="font-mono text-xs">
                                            {calibrationResult.gps_top_right_lat.toFixed(6)}, {calibrationResult.gps_top_right_lng.toFixed(6)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Bottom-Left</p>
                                        <p className="font-mono text-xs">
                                            {calibrationResult.gps_bottom_left_lat.toFixed(6)}, {calibrationResult.gps_bottom_left_lng.toFixed(6)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Bottom-Right</p>
                                        <p className="font-mono text-xs">
                                            {calibrationResult.gps_bottom_right_lat.toFixed(6)}, {calibrationResult.gps_bottom_right_lng.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setStep('point1');
                                        setPoint1({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
                                        setPoint2({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
                                        setCalibrationResult(null);
                                        setValidationWarnings([]);
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    Start Over
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    Save Calibration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
