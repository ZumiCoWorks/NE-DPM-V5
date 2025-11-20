import React, { useState, useEffect } from 'react';

const POIForm = ({ initialName = '', initialType = 'booth', onCancel, onSave, eventNavigationMode = 'hybrid' }) => {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [zoneType, setZoneType] = useState('outdoor');
  const [requiresQR, setRequiresQR] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const showGpsFields = eventNavigationMode === 'outdoor' || eventNavigationMode === 'hybrid';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    
    const poiData = { 
      name, 
      type,
      ...(showGpsFields && gpsLat && gpsLng ? {
        gps_lat: parseFloat(gpsLat),
        gps_lng: parseFloat(gpsLng),
        zone_type: zoneType,
        requires_qr_calibration: requiresQR
      } : {})
    };
    
    onSave(poiData);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(position.coords.latitude.toFixed(6));
        setGpsLng(position.coords.longitude.toFixed(6));
        setGettingLocation(false);
      },
      (error) => {
        alert('Unable to get location: ' + error.message);
        setGettingLocation(false);
      }
    );
  };

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 16, borderRadius: 8, width: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 6px 18px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginTop: 0 }}>Add POI</h3>
        
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #e5e7eb' }} />
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #e5e7eb' }}>
            <option value="localization">localization</option>
            <option value="booth">booth</option>
            <option value="utility">utility</option>
            <option value="entrance">entrance</option>
            <option value="exit">exit</option>
            <option value="other">other</option>
          </select>
        </div>

        {showGpsFields && (
          <>
            <div style={{ marginBottom: 12, padding: 12, background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#1e40af' }}>GPS Coordinates</h4>
              
              <button 
                type="button" 
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                style={{ 
                  marginBottom: 12, 
                  padding: '6px 12px', 
                  borderRadius: 4, 
                  border: '1px solid #3b82f6', 
                  background: '#3b82f6', 
                  color: 'white',
                  cursor: gettingLocation ? 'wait' : 'pointer',
                  fontSize: 13
                }}
              >
                {gettingLocation ? '📍 Getting location...' : '📍 Use My Current Location'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={gpsLat} 
                    onChange={e => setGpsLat(e.target.value)} 
                    placeholder="-25.7461"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={gpsLng} 
                    onChange={e => setGpsLng(e.target.value)} 
                    placeholder="28.1881"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Zone Type</label>
                <select value={zoneType} onChange={e => setZoneType(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13 }}>
                  <option value="outdoor">Outdoor (GPS only)</option>
                  <option value="indoor">Indoor (Requires QR)</option>
                  <option value="transition">Transition Point</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', fontSize: 13, gap: 6 }}>
                <input 
                  type="checkbox" 
                  checked={requiresQR} 
                  onChange={e => setRequiresQR(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Requires QR code calibration
              </label>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
          <button type="submit" style={{ padding: '8px 12px', borderRadius: 4, border: 'none', background: '#059669', color: 'white' }}>Save POI</button>
        </div>
      </form>
    </div>
  );
};

export default POIForm;
