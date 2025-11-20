import React, { useState } from 'react';
import { Compass, MapPin, Navigation, CheckCircle, Info } from 'lucide-react';

interface CalibrationWizardProps {
  floorplanImageUrl: string;
  onComplete: (calibrationData: CalibrationData) => void;
  onCancel: () => void;
}

interface CalibrationData {
  method: 'manual' | 'gps_corners' | 'auto';
  rotation_degrees: number;
  north_bearing_degrees: number;
  gps_top_left_lat?: number;
  gps_top_left_lng?: number;
  gps_top_right_lat?: number;
  gps_top_right_lng?: number;
  gps_bottom_left_lat?: number;
  gps_bottom_left_lng?: number;
  gps_bottom_right_lat?: number;
  gps_bottom_right_lng?: number;
}

const CalibrationWizard: React.FC<CalibrationWizardProps> = ({ floorplanImageUrl, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'manual' | 'gps_corners' | 'auto'>('auto');
  const [northBearing, setNorthBearing] = useState(0);
  const [corners, setCorners] = useState({
    topLeft: { lat: '', lng: '' },
    topRight: { lat: '', lng: '' },
    bottomLeft: { lat: '', lng: '' },
    bottomRight: { lat: '', lng: '' }
  });
  const [gettingLocation, setGettingLocation] = useState<string | null>(null);

  const getCurrentLocation = (corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    setGettingLocation(corner);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCorners(prev => ({
          ...prev,
          [corner]: {
            lat: position.coords.latitude.toFixed(8),
            lng: position.coords.longitude.toFixed(8)
          }
        }));
        setGettingLocation(null);
      },
      (error) => {
        alert('Unable to get location: ' + error.message);
        setGettingLocation(null);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleComplete = () => {
    const calibrationData: CalibrationData = {
      method,
      rotation_degrees: 0,
      north_bearing_degrees: northBearing,
      ...(method !== 'auto' && {
        gps_top_left_lat: parseFloat(corners.topLeft.lat),
        gps_top_left_lng: parseFloat(corners.topLeft.lng),
        gps_top_right_lat: parseFloat(corners.topRight.lat),
        gps_top_right_lng: parseFloat(corners.topRight.lng),
        gps_bottom_left_lat: parseFloat(corners.bottomLeft.lat),
        gps_bottom_left_lng: parseFloat(corners.bottomLeft.lng),
        gps_bottom_right_lat: parseFloat(corners.bottomRight.lat),
        gps_bottom_right_lng: parseFloat(corners.bottomRight.lng)
      })
    };
    onComplete(calibrationData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Compass className="w-6 h-6 mr-2 text-blue-600" />
            Floorplan GPS Calibration
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Step {step} of 3: Align your floorplan with real-world GPS coordinates
          </p>
        </div>

        <div className="p-6">
          {/* Step 1: Choose Method */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Why calibration is important:</p>
                    <p>GPS coordinates need to match the exact orientation and position of your floorplan image so attendees see their location accurately.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900">Choose Calibration Method</h3>

              <div className="space-y-3">
                {/* Auto Method */}
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${method === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="method"
                      value="auto"
                      checked={method === 'auto'}
                      onChange={(e) => setMethod(e.target.value as 'auto')}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">🚀 Auto (Recommended)</div>
                      <p className="text-sm text-gray-600">Uses event GPS bounds. Best for outdoor events where floorplan covers entire venue.</p>
                    </div>
                  </div>
                </label>

                {/* Walk Corners Method */}
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${method === 'gps_corners' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="method"
                      value="gps_corners"
                      checked={method === 'gps_corners'}
                      onChange={(e) => setMethod(e.target.value as 'gps_corners')}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">🚶 Walk Corners (Most Accurate)</div>
                      <p className="text-sm text-gray-600">Physically walk to each corner of your venue and capture GPS coordinates. Best accuracy.</p>
                    </div>
                  </div>
                </label>

                {/* Manual Method */}
                <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${method === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="method"
                      value="manual"
                      checked={method === 'manual'}
                      onChange={(e) => setMethod(e.target.value as 'manual')}
                      className="mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">✏️ Manual Entry</div>
                      <p className="text-sm text-gray-600">Type GPS coordinates manually. Use when you have coordinates from Google Maps.</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: North Direction */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                Which way is North on your floorplan?
              </h3>

              <div className="bg-gray-50 p-4 rounded-lg">
                <img src={floorplanImageUrl} alt="Floorplan" className="w-full h-64 object-contain mb-4 border border-gray-300 rounded" />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  North Bearing (degrees clockwise from top of image)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={northBearing}
                    onChange={(e) => setNorthBearing(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-bold text-blue-600">{northBearing}°</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-3">
                  <button onClick={() => setNorthBearing(0)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                    ⬆️ 0° (North up)
                  </button>
                  <button onClick={() => setNorthBearing(90)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                    ➡️ 90° (East up)
                  </button>
                  <button onClick={() => setNorthBearing(180)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                    ⬇️ 180° (South up)
                  </button>
                  <button onClick={() => setNorthBearing(270)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">
                    ⬅️ 270° (West up)
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Open Google Maps, find your venue, and note which direction is up. Match that on the slider above.
              </div>
            </div>
          )}

          {/* Step 3: GPS Corners (if not auto) */}
          {step === 3 && method !== 'auto' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Set GPS Coordinates for Each Corner</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Top Left */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">↖️ Top Left Corner</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      value={corners.topLeft.lat}
                      onChange={(e) => setCorners(prev => ({ ...prev, topLeft: { ...prev.topLeft, lat: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      value={corners.topLeft.lng}
                      onChange={(e) => setCorners(prev => ({ ...prev, topLeft: { ...prev.topLeft, lng: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    {method === 'gps_corners' && (
                      <button
                        onClick={() => getCurrentLocation('topLeft')}
                        disabled={gettingLocation === 'topLeft'}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {gettingLocation === 'topLeft' ? '📍 Getting...' : '📍 Use Current Location'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Top Right */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">↗️ Top Right Corner</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      value={corners.topRight.lat}
                      onChange={(e) => setCorners(prev => ({ ...prev, topRight: { ...prev.topRight, lat: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      value={corners.topRight.lng}
                      onChange={(e) => setCorners(prev => ({ ...prev, topRight: { ...prev.topRight, lng: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    {method === 'gps_corners' && (
                      <button
                        onClick={() => getCurrentLocation('topRight')}
                        disabled={gettingLocation === 'topRight'}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {gettingLocation === 'topRight' ? '📍 Getting...' : '📍 Use Current Location'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Left */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">↙️ Bottom Left Corner</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      value={corners.bottomLeft.lat}
                      onChange={(e) => setCorners(prev => ({ ...prev, bottomLeft: { ...prev.bottomLeft, lat: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      value={corners.bottomLeft.lng}
                      onChange={(e) => setCorners(prev => ({ ...prev, bottomLeft: { ...prev.bottomLeft, lng: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    {method === 'gps_corners' && (
                      <button
                        onClick={() => getCurrentLocation('bottomLeft')}
                        disabled={gettingLocation === 'bottomLeft'}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {gettingLocation === 'bottomLeft' ? '📍 Getting...' : '📍 Use Current Location'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Right */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">↘️ Bottom Right Corner</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude"
                      value={corners.bottomRight.lat}
                      onChange={(e) => setCorners(prev => ({ ...prev, bottomRight: { ...prev.bottomRight, lat: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude"
                      value={corners.bottomRight.lng}
                      onChange={(e) => setCorners(prev => ({ ...prev, bottomRight: { ...prev.bottomRight, lng: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    {method === 'gps_corners' && (
                      <button
                        onClick={() => getCurrentLocation('bottomRight')}
                        disabled={gettingLocation === 'bottomRight'}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {gettingLocation === 'bottomRight' ? '📍 Getting...' : '📍 Use Current Location'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Auto method (just confirm) */}
          {step === 3 && method === 'auto' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Calibration Ready</h3>
                <p className="text-sm text-gray-600">
                  The floorplan will be automatically aligned using your event's GPS bounds.
                  This works best when the floorplan image represents your entire venue.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t bg-gray-50 flex justify-between">
          <button
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button
            onClick={step === 3 ? handleComplete : () => setStep(step + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {step === 3 ? 'Complete Calibration' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalibrationWizard;
