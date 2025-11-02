import React, { useState, useRef } from 'react';
import { getMapData, createEventMap, createPoi, createPath } from '../../lib/api';
import ImageUploader from '../../components/ImageUploader';
import FloorplanCanvas from '../../components/FloorplanCanvas';
import POIForm from '../../components/POIForm';
import { uploadFloorplan } from '../../lib/supabaseClient';

export default function MapEditor() {
  const [eventId, setEventId] = useState('1');
  const [mapData, setMapData] = useState(null);
  const [mode, setMode] = useState('view'); // view | add_poi | add_path
  const [selectedStartPoi, setSelectedStartPoi] = useState(null);
  const imgRef = useRef(null);

  async function loadMap() {
    try {
      const data = await getMapData(eventId);
      setMapData(data);
    } catch (err) {
      alert('Failed to load map: ' + err.message);
    }
  }

  async function createMap() {
    // keep the old flow for backwards compatibility — this function is now called by ImageUploader on success
    // (kept for callers that may still call createMap directly)
    const storageUrl = prompt('Map image URL (hosted)');
    if (!storageUrl) return;
    try {
      const res = await createEventMap({ event_id: eventId, storage_url: storageUrl });
      const mapRecord = res.record || res;
      setMapData({ map_url: storageUrl, pois: [], paths: [], id: mapRecord.id });
    } catch (err) {
      alert('Failed to create map: ' + err.message);
    }
  }

  // Called when ImageUploader has a hosted URL and dimensions
  async function handleImageUploaded(publicUrl, dims) {
    try {
      const res = await createEventMap({ event_id: eventId, storage_url: publicUrl, image_width: dims.width, image_height: dims.height });
      const mapRecord = res.record || res;
      setMapData({ map_url: publicUrl, pois: [], paths: [], id: mapRecord.id });
    } catch (err) {
      alert('Failed to create map from uploaded image: ' + err.message);
    }
  }

  // Pending POI state for the modal flow
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [pendingPoiPoint, setPendingPoiPoint] = useState(null);
  const [poiSubmitting, setPoiSubmitting] = useState(false);

  function imageClick(e) {
    // legacy handler when using direct <img> click (kept for compatibility)
    if (!mapData) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const x_pct = naturalW ? (x / naturalW) * 100 : null;
    const y_pct = naturalH ? (y / naturalH) * 100 : null;

    if (mode === 'add_poi') {
      setPendingPoiPoint({ x, y, x_pct, y_pct, image_width: naturalW, image_height: naturalH });
      setShowPoiModal(true);
    }
  }

  // Handle submission from the POI modal
  async function handlePoiSubmit({ name, type }) {
    if (!pendingPoiPoint || !mapData) return;
    setPoiSubmitting(true);
    try {
      const pt = pendingPoiPoint;
      const res = await createPoi({ map_id: mapData.id || null, name, type, x: pt.x, y: pt.y, x_pct: pt.x_pct, y_pct: pt.y_pct, image_width: pt.image_width, image_height: pt.image_height });
      const rec = res.record || res;
      const norm = (rec.metadata && rec.metadata.x_pct != null) ? { x_pct: rec.metadata.x_pct, y_pct: rec.metadata.y_pct } : { x_pct: pt.x_pct, y_pct: pt.y_pct };
      const merged = { ...rec, ...norm };
      setMapData((m) => ({ ...m, pois: [...(m.pois || []), merged] }));
    } catch (err) {
      alert('Failed to save POI: ' + err.message);
    } finally {
      setPoiSubmitting(false);
      setShowPoiModal(false);
      setPendingPoiPoint(null);
    }
  }

  function onPoiClick(poi) {
    if (mode === 'add_path') {
      if (!selectedStartPoi) {
        setSelectedStartPoi(poi);
        return;
      }
      if (selectedStartPoi.id === poi.id) {
        setSelectedStartPoi(null);
        return;
      }
      // compute euclidean distance
      const dx = poi.x - selectedStartPoi.x;
      const dy = poi.y - selectedStartPoi.y;
      const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
      createPath({ map_id: mapData.id || null, poi_id_start: selectedStartPoi.id, poi_id_end: poi.id, distance }).then((r) => {
        const rec = r.record || r;
        setMapData((m) => ({ ...m, paths: [...(m.paths || []), rec] }));
        setSelectedStartPoi(null);
      }).catch(err => alert('Failed to save path: ' + err.message));
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Map Editor</h2>

      <div style={{ marginBottom: 12 }}>
        <label>Event ID: <input value={eventId} onChange={e => setEventId(e.target.value)} style={{ width: 120 }} /></label>
        <button onClick={loadMap} style={{ marginLeft: 8 }}>Load Map</button>
        <button onClick={createMap} style={{ marginLeft: 8 }}>Create Map (URL)</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode('view')} disabled={mode==='view'}>View</button>
        <button onClick={() => setMode('add_poi')} disabled={mode==='add_poi'} style={{ marginLeft: 8 }}>Add POI</button>
        <button onClick={() => { setMode('add_path'); setSelectedStartPoi(null); }} disabled={mode==='add_path'} style={{ marginLeft: 8 }}>Add Path</button>
      </div>

      {!mapData && <div>No map loaded. Load or create a map to begin.</div>}

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 360 }}>
          <h4>Upload floorplan</h4>
          <ImageUploader uploadFn={uploadFloorplan} onUploadSuccess={handleImageUploaded} onMessage={(m,t) => console.log('uploader:', t, m)} />
        </div>

        {mapData && (
          <>
            <FloorplanCanvas src={mapData.map_url} pois={mapData.pois || []} paths={mapData.paths || []} onImageClick={(pt) => {
              // open the POI modal when in add_poi mode
              if (mode === 'add_poi') {
                setPendingPoiPoint(pt);
                setShowPoiModal(true);
              }
            }} />

            {showPoiModal && (
              <POIForm initialName="" initialType="booth" onCancel={() => { setShowPoiModal(false); setPendingPoiPoint(null); }} onSubmit={handlePoiSubmit} />
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>POIs</h3>
        <ul>
          {(mapData && mapData.pois || []).map(p => (
            <li key={p.id}>
              {p.name} ({p.type}) — x:{p.x} y:{p.y}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
