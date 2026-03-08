import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    calibrateFromTwoPoints,
    validateCalibration,
    CalibrationPoint,
    CalibrationResult,
} from '../lib/affineCalibration';

// Fix leaflet default icon paths broken by Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PIN_COLORS = { point1: '#22c55e', point2: '#3b82f6' };

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

// ── Module-level sub-components (NEVER defined inside a render function) ──────
// Defining components inside a parent's render causes full unmount/remount on
// every parent re-render, which breaks input focus.

function MapClickPicker({
    onPick, pickedLatLng, color,
}: {
    onPick: (lat: number, lng: number) => void;
    pickedLatLng: { lat: number; lng: number } | null;
    color: string;
}) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
    if (!pickedLatLng) return null;
    const icon = L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
        iconAnchor: [12, 12],
    });
    return <Marker position={[pickedLatLng.lat, pickedLatLng.lng]} icon={icon} />;
}

function MapCentre({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => { map.flyTo(center, map.getZoom()); }, [center]);
    return null;
}

interface FloorplanPanelProps {
    floorplanUrl: string;
    imageSize: { width: number; height: number };
    point1Pixel: { x: number; y: number };
    point2Pixel: { x: number; y: number };
    point1GPSSet: boolean;
    activePoint: 1 | 2;
    onImageClick: (e: React.MouseEvent<HTMLImageElement>) => void;
    onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

function FloorplanPanel({
    floorplanUrl, imageSize, point1Pixel, point2Pixel,
    point1GPSSet, activePoint, onImageClick, onImageLoad,
}: FloorplanPanelProps) {
    return (
        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100" style={{ maxHeight: '52vh' }}>
            <img
                src={floorplanUrl}
                alt="Floorplan"
                className="w-full object-contain cursor-crosshair block"
                style={{ maxHeight: '52vh' }}
                onClick={onImageClick}
                onLoad={onImageLoad}
            />
            {point1Pixel.x > 0 && (
                <div className="absolute w-5 h-5 rounded-full pointer-events-none"
                    style={{ background: PIN_COLORS.point1, left: `${(point1Pixel.x / imageSize.width) * 100}%`, top: `${(point1Pixel.y / imageSize.height) * 100}%`, transform: 'translate(-50%,-50%)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', border: '3px solid white' }}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
                        P1{point1GPSSet ? ' ✓' : ''}
                    </span>
                </div>
            )}
            {point2Pixel.x > 0 && (
                <div className="absolute w-5 h-5 rounded-full pointer-events-none"
                    style={{ background: PIN_COLORS.point2, left: `${(point2Pixel.x / imageSize.width) * 100}%`, top: `${(point2Pixel.y / imageSize.height) * 100}%`, transform: 'translate(-50%,-50%)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', border: '3px solid white' }}>
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">P2</span>
                </div>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
                Click to place Point {activePoint}
            </div>
        </div>
    );
}

interface MapPanelProps {
    mapCenter: [number, number];
    onPick: (lat: number, lng: number) => void;
    pickedLatLng: { lat: number; lng: number } | null;
    color: string;
    onConfirm: () => void;
    confirmLabel: string;
    searchQuery: string;
    onSearchChange: (v: string) => void;
    onSearch: () => void;
    searching: boolean;
}

function MapPanel({
    mapCenter, onPick, pickedLatLng, color, onConfirm, confirmLabel,
    searchQuery, onSearchChange, onSearch, searching,
}: MapPanelProps) {
    return (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
            {/* Address search */}
            <div className="flex gap-1">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSearch()}
                    placeholder="Search venue / address…"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                    onClick={onSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg disabled:opacity-40"
                >
                    {searching ? '…' : '🔍'}
                </button>
            </div>

            {/* Satellite map */}
            <div className="rounded-lg overflow-hidden border border-gray-300 flex-1 min-h-0" style={{ minHeight: 260 }}>
                <MapContainer center={mapCenter} zoom={17} style={{ height: '100%', width: '100%' }} zoomControl keyboard={false}>
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="Tiles &copy; Esri"
                        maxZoom={20}
                    />
                    <MapCentre center={mapCenter} />
                    <MapClickPicker onPick={onPick} pickedLatLng={pickedLatLng} color={color} />
                </MapContainer>
            </div>

            {pickedLatLng ? (
                <div className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 text-center">
                    {pickedLatLng.lat.toFixed(6)}, {pickedLatLng.lng.toFixed(6)}
                </div>
            ) : (
                <p className="text-xs text-center text-gray-500">
                    Click the map at the <strong>exact same real-world location</strong> as the pin on the floorplan
                </p>
            )}

            <button
                onClick={onConfirm}
                disabled={!pickedLatLng}
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {confirmLabel}
            </button>
        </div>
    );
}

// Thumbnail used on the map step to remind the user which point they placed
function FloorplanThumb({
    floorplanUrl, imageSize, point1Pixel, point2Pixel,
}: { floorplanUrl: string; imageSize: { width: number; height: number }; point1Pixel: { x: number; y: number }; point2Pixel: { x: number; y: number } }) {
    return (
        <div className="relative w-32 shrink-0 border rounded overflow-hidden bg-gray-100">
            <img src={floorplanUrl} alt="ref" className="w-full h-full object-contain" />
            {point1Pixel.x > 0 && (
                <div className="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full pointer-events-none"
                    style={{ left: `${(point1Pixel.x / imageSize.width) * 100}%`, top: `${(point1Pixel.y / imageSize.height) * 100}%`, transform: 'translate(-50%,-50%)' }} />
            )}
            {point2Pixel.x > 0 && (
                <div className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full pointer-events-none"
                    style={{ left: `${(point2Pixel.x / imageSize.width) * 100}%`, top: `${(point2Pixel.y / imageSize.height) * 100}%`, transform: 'translate(-50%,-50%)' }} />
            )}
            <p className="absolute bottom-1 left-0 right-0 text-center text-white text-[10px] bg-black/50">Your pin</p>
        </div>
    );
}

// ── Main wizard component ─────────────────────────────────────────────────────
export function GPSCalibrationWizard({
    floorplanUrl, imageWidth: propImageWidth, imageHeight: propImageHeight,
    onComplete, onCancel,
}: Props) {
    type Step = 'intro' | 'point1_floorplan' | 'point1_map' | 'point2_floorplan' | 'point2_map' | 'confirm';
    const [step, setStep] = useState<Step>('intro');
    const [imageSize, setImageSize] = useState({ width: propImageWidth || 0, height: propImageHeight || 0 });
    const [point1, setPoint1] = useState<CalibrationPoint>({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
    const [point2, setPoint2] = useState<CalibrationPoint>({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
    const [mapGPS1, setMapGPS1] = useState<{ lat: number; lng: number } | null>(null);
    const [mapGPS2, setMapGPS2] = useState<{ lat: number; lng: number } | null>(null);
    const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

    // Map navigation state
    const [mapCenter, setMapCenter] = useState<[number, number]>([-26.185, 28.020]);
    const geolocated = useRef(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    // Auto-center on user's physical location when map step opens
    useEffect(() => {
        if ((step === 'point1_map' || step === 'point2_map') && !geolocated.current) {
            navigator.geolocation?.getCurrentPosition(
                pos => { setMapCenter([pos.coords.latitude, pos.coords.longitude]); geolocated.current = true; },
                () => { }
            );
        }
    }, [step]);

    const handlePlaceSearch = useCallback(async () => {
        const q = searchQuery.trim();
        if (!q) return;

        // 1. Detect pasted GPS coordinates (e.g. "-26.1851, 28.0204" from Google Maps)
        const coordMatch = q.match(/^\s*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)\s*$/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                setMapCenter([lat, lng]);
                return;
            }
        }

        // 2. Nominatim geocoding with South Africa country bias
        setSearching(true);
        try {
            const tryQ = async (query: string) => {
                const r = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=za&q=${encodeURIComponent(query)}`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                return r.json();
            };
            let data = await tryQ(q);
            if (!data.length) {
                // Retry stripping postal code
                const stripped = q.split(',').filter(p => !/^\s*\d{4}\s*$/.test(p)).join(',').trim();
                if (stripped && stripped !== q) data = await tryQ(stripped);
            }
            if (data.length > 0) {
                setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            } else {
                alert('Address not found.\n\nTip: paste GPS coordinates instead.\nIn Google Maps: right-click the location → click the coordinates at the top of the menu → paste here.');
            }
        } catch {
            alert('Search failed. Check your internet connection.');
        } finally {
            setSearching(false);
        }
    }, [searchQuery]);

    const handleFloorplanClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (imageSize.width / rect.width);
        const py = (e.clientY - rect.top) * (imageSize.height / rect.height);
        if (step === 'point1_floorplan') setPoint1(p => ({ ...p, pixel: { x: px, y: py } }));
        else if (step === 'point2_floorplan') setPoint2(p => ({ ...p, pixel: { x: px, y: py } }));
    }, [step, imageSize]);

    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!propImageWidth || !propImageHeight) {
            const img = e.currentTarget;
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        }
    }, [propImageWidth, propImageHeight]);

    const confirmMapGPS1 = () => {
        if (!mapGPS1) return;
        setPoint1(p => ({ ...p, gps: mapGPS1 }));
        setStep('point2_floorplan');
    };

    const confirmMapGPS2 = () => {
        if (!mapGPS2) return;
        const p2: CalibrationPoint = { ...point2, gps: mapGPS2 };
        setPoint2(p2);
        try {
            const result = calibrateFromTwoPoints(point1, p2, imageSize.width, imageSize.height);
            const validation = validateCalibration(result);
            setValidationWarnings(validation.warnings);
            if (!validation.isValid) { alert(`Calibration error:\n${validation.errors.join('\n')}`); return; }
            setCalibrationResult(result);
            setStep('confirm');
        } catch (err: any) { alert(`Calibration failed: ${err.message}`); }
    };

    const handleConfirm = () => {
        if (!calibrationResult) return;
        const vals = [calibrationResult.gps_top_left_lat, calibrationResult.gps_top_right_lat,
        calibrationResult.gps_bottom_left_lat, calibrationResult.gps_bottom_right_lat];
        const lngs = [calibrationResult.gps_top_left_lng, calibrationResult.gps_top_right_lng,
        calibrationResult.gps_bottom_left_lng, calibrationResult.gps_bottom_right_lng];
        onComplete({ ...calibrationResult, gpsBounds: { ne: { lat: Math.max(...vals), lng: Math.max(...lngs) }, sw: { lat: Math.min(...vals), lng: Math.min(...lngs) } } });
    };

    const startOver = () => {
        setStep('point1_floorplan');
        setPoint1({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
        setPoint2({ pixel: { x: 0, y: 0 }, gps: { lat: 0, lng: 0 } });
        setMapGPS1(null); setMapGPS2(null);
        setCalibrationResult(null); setValidationWarnings([]);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-primary text-white px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <h2 className="text-xl font-bold">GPS Calibration Wizard</h2>
                    </div>
                    <button onClick={onCancel} className="text-white/80 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

                    {/* INTRO */}
                    {step === 'intro' && (
                        <div className="space-y-4 max-w-lg mx-auto">
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                    <li>Click a <strong>recognisable corner</strong> on your floorplan (e.g. main entrance)</li>
                                    <li>Click the <strong>same spot on the satellite map</strong> — coordinates captured automatically</li>
                                    <li>Repeat for a <strong>second point far away</strong> (opposite corner)</li>
                                </ol>
                            </div>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <h3 className="font-semibold text-green-900 mb-1">💡 Accuracy tip</h3>
                                <p className="text-sm text-green-800">Place points at <strong>opposite corners</strong> of the building — points less than 50 m apart give poor accuracy.</p>
                            </div>
                            <button onClick={() => setStep('point1_floorplan')}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg">
                                Start Calibration →
                            </button>
                        </div>
                    )}

                    {/* POINT 1 — FLOORPLAN */}
                    {step === 'point1_floorplan' && (
                        <>
                            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded shrink-0">
                                <p className="text-sm text-green-900 font-medium">Step 1a — Click <strong>Point 1</strong> on your floorplan (e.g. main entrance, bottom-left corner)</p>
                            </div>
                            <FloorplanPanel
                                floorplanUrl={floorplanUrl} imageSize={imageSize}
                                point1Pixel={point1.pixel} point2Pixel={point2.pixel}
                                point1GPSSet={point1.gps.lat !== 0} activePoint={1}
                                onImageClick={handleFloorplanClick} onImageLoad={handleImageLoad}
                            />
                            <button onClick={() => setStep('point1_map')} disabled={point1.pixel.x === 0}
                                className="shrink-0 w-full bg-primary text-white font-semibold py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                                Next: Pick location on map →
                            </button>
                        </>
                    )}

                    {/* POINT 1 — MAP */}
                    {step === 'point1_map' && (
                        <>
                            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded shrink-0">
                                <p className="text-sm text-green-900 font-medium">Step 1b — Find the <strong>same real-world location</strong> on the satellite map and click it</p>
                            </div>
                            <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: 320 }}>
                                <FloorplanThumb floorplanUrl={floorplanUrl} imageSize={imageSize}
                                    point1Pixel={point1.pixel} point2Pixel={point2.pixel} />
                                <MapPanel
                                    mapCenter={mapCenter} onPick={(lat, lng) => setMapGPS1({ lat, lng })} pickedLatLng={mapGPS1}
                                    color={PIN_COLORS.point1} onConfirm={confirmMapGPS1}
                                    confirmLabel="Confirm Point 1 → Next"
                                    searchQuery={searchQuery} onSearchChange={setSearchQuery}
                                    onSearch={handlePlaceSearch} searching={searching}
                                />
                            </div>
                        </>
                    )}

                    {/* POINT 2 — FLOORPLAN */}
                    {step === 'point2_floorplan' && (
                        <>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded shrink-0">
                                <p className="text-sm text-blue-900 font-medium">Step 2a — Click <strong>Point 2</strong> on your floorplan (e.g. top-right corner of Block F, far from Point 1)</p>
                            </div>
                            <FloorplanPanel
                                floorplanUrl={floorplanUrl} imageSize={imageSize}
                                point1Pixel={point1.pixel} point2Pixel={point2.pixel}
                                point1GPSSet={point1.gps.lat !== 0} activePoint={2}
                                onImageClick={handleFloorplanClick} onImageLoad={handleImageLoad}
                            />
                            <button onClick={() => setStep('point2_map')} disabled={point2.pixel.x === 0}
                                className="shrink-0 w-full bg-primary text-white font-semibold py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">
                                Next: Pick location on map →
                            </button>
                        </>
                    )}

                    {/* POINT 2 — MAP */}
                    {step === 'point2_map' && (
                        <>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded shrink-0">
                                <p className="text-sm text-blue-900 font-medium">Step 2b — Find the <strong>same second real-world location</strong> on the satellite map and click it</p>
                            </div>
                            <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: 320 }}>
                                <FloorplanThumb floorplanUrl={floorplanUrl} imageSize={imageSize}
                                    point1Pixel={point1.pixel} point2Pixel={point2.pixel} />
                                <MapPanel
                                    mapCenter={mapCenter} onPick={(lat, lng) => setMapGPS2({ lat, lng })} pickedLatLng={mapGPS2}
                                    color={PIN_COLORS.point2} onConfirm={confirmMapGPS2}
                                    confirmLabel="Confirm Point 2 → Calculate"
                                    searchQuery={searchQuery} onSearchChange={setSearchQuery}
                                    onSearch={handlePlaceSearch} searching={searching}
                                />
                            </div>
                        </>
                    )}

                    {/* CONFIRM */}
                    {step === 'confirm' && calibrationResult && (
                        <div className="space-y-4 max-w-2xl mx-auto w-full">
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                <h3 className="font-semibold text-green-900">✅ Calibration Complete</h3>
                                <p className="text-sm text-green-800 mt-1">Review the values — scale should be ~0.3–0.5 m/px for a typical campus. If it looks wrong, start over with points further apart.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Scale', value: `${calibrationResult.scale_meters_per_pixel.toFixed(3)} m/px`, ok: calibrationResult.scale_meters_per_pixel >= 0.05 },
                                    { label: 'Rotation', value: `${calibrationResult.rotation_degrees.toFixed(1)}°`, ok: true },
                                    { label: 'Estimated Accuracy', value: `±${calibrationResult.estimated_accuracy_meters.toFixed(1)} m`, ok: calibrationResult.estimated_accuracy_meters <= 5 },
                                    { label: 'Method', value: '2-Point GPS', ok: true },
                                ].map(({ label, value, ok }) => (
                                    <div key={label} className={`p-3 rounded border ${ok ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'}`}>
                                        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                        <p className={`text-lg font-semibold ${ok ? 'text-gray-900' : 'text-red-700'}`}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            {validationWarnings.length > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                    <h4 className="font-semibold text-yellow-900 mb-1">⚠️ Warnings</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                        {validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                            )}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Calculated GPS Corners</p>
                                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    {([
                                        ['Top-Left', calibrationResult.gps_top_left_lat, calibrationResult.gps_top_left_lng],
                                        ['Top-Right', calibrationResult.gps_top_right_lat, calibrationResult.gps_top_right_lng],
                                        ['Bottom-Left', calibrationResult.gps_bottom_left_lat, calibrationResult.gps_bottom_left_lng],
                                        ['Bottom-Right', calibrationResult.gps_bottom_right_lat, calibrationResult.gps_bottom_right_lng],
                                    ] as [string, number, number][]).map(([label, lat, lng]) => (
                                        <div key={label} className="bg-white rounded p-2 border border-gray-200">
                                            <p className="text-gray-500 text-[10px] mb-0.5">{label}</p>
                                            <p>{lat.toFixed(6)}, {lng.toFixed(6)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={startOver} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg">Start Over</button>
                                <button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg">Save Calibration</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
