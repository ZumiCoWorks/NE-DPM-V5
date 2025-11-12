import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageUploader from './scaffold/ImageUploader';
import POIForm from './scaffold/POIForm';
import FloorplanCanvas from './FloorplanCanvas';
import { supabase } from '../lib/supabase';

// Adapted dev copy of the scaffold FloorplanEditor. This file lives inside `src/` so Vite can resolve it.
// It imports some scaffold components directly (ImageUploader/POIForm/FloorplanCanvas) from scaffold/ but
// calls the app's `src/lib/supabase` for DB calls. This is a dev-only bridge to preview the editor.

const MODES = ['poi', 'node', 'draw-path'];

const DevScaffoldFloorplanEditor = ({ initialFloorplan = null, initialEventId = null, initialNodes = [], initialSegments = [], initialPois = [], initialZones = [] }) => {
  const [floorplanUrl, setFloorplanUrl] = useState(initialFloorplan);
  const [nodes, setNodes] = useState(initialNodes);
  const [segments, setSegments] = useState(initialSegments);
  const [pois, setPois] = useState(initialPois);
  const [zones, setZones] = useState(initialZones);
  const [mode, setMode] = useState('poi');
  const [currentUser, setCurrentUser] = useState(null);
  const [floorplansList, setFloorplansList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [showPoiModal, setShowPoiModal] = useState(false);
  const [pendingPoiCoords, setPendingPoiCoords] = useState(null);

  // QR Code ID for nodes (Part 2: B2C Admin Function)
  const [currentQrId, setCurrentQrId] = useState('');
  const [currentEventId, setCurrentEventId] = useState(null);

  // Simple message banner
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (initialFloorplan) setFloorplanUrl(initialFloorplan);
  }, [initialFloorplan]);

  useEffect(() => {
    if (initialEventId) setCurrentEventId(initialEventId);
  }, [initialEventId]);

  // Show setup modal initially until a floorplan is chosen/uploaded
  useEffect(() => {
    setShowSetupModal(!floorplanUrl);
  }, [floorplanUrl]);

  useEffect(() => {
    // auth listener - use app supabase (may throw if not configured)
    if (!supabase || !supabase.auth) return;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) fetchFloorplans(user.id).catch(() => {});
    });
    return () => authListener?.subscription?.unsubscribe && authListener.subscription.unsubscribe();
  }, []);

  const fetchFloorplans = async (userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('floorplans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setFloorplansList(data || []);
    } catch (err) {
      console.warn('fetchFloorplans failed (supabase may not be configured):', err.message || err);
      setFloorplansList([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, ms = 3000) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), ms);
  };

  // ImageUploader success handler
  const handleUploadSuccess = async (url, dims) => {
    setFloorplanUrl(url);
    setShowSetupModal(false);
    showMessage('Floorplan uploaded');
    // Persist to Supabase floorplans table if available and user present
    if (supabase && currentUser) {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('floorplans').insert({ name: `Floorplan ${new Date().toLocaleString()}`, image_url: url, dimensions: dims, user_id: currentUser.id, scale_meters_per_pixel: 0 }).select().single();
        if (error) throw error;
        // refresh list
        await fetchFloorplans(currentUser.id);
        showMessage('Floorplan saved to DB', 2500);
      } catch (err) {
        console.warn('Failed to save floorplan to supabase:', err.message || err);
        showMessage('Floorplan uploaded (not saved to DB)', 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  // Upload helper that uses the app Supabase client to store the file in 'floorplans' bucket
  const uploadToSupabase = async (file) => {
    if (!supabase) throw new Error('Supabase client not configured');
    const fileExt = file.name.split('.').pop();
    const fileName = `floorplan_${Date.now()}_${Math.random().toString(36).slice(2,10)}.${fileExt}`;
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage.from('floorplans').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('floorplans').getPublicUrl(uploadData.path);
      if (publicUrlData?.publicUrl) return publicUrlData.publicUrl;
      throw new Error('Failed to get public URL for uploaded file');
    } catch (err) {
      console.warn('uploadToSupabase failed', err?.message || err);
      throw err;
    }
  };

  const handleSelectFloorplan = async (fp) => {
    if (!fp) return;
    setLoading(true);
    try {
      // fetch related nodes/segments/pois/zones if supabase available
      const { data: nodesData } = await supabase.from('nodes').select('*').eq('floorplan_id', fp.id);
      const { data: segData } = await supabase.from('segments').select('*').eq('floorplan_id', fp.id);
      const { data: poisData } = await supabase.from('pois').select('*').eq('floorplan_id', fp.id);
      const { data: zonesData } = await supabase.from('zones').select('*').eq('floorplan_id', fp.id);
      setNodes(nodesData || []);
      setSegments(segData || []);
      setPois(poisData || []);
      setZones(zonesData || []);
      setFloorplanUrl(fp.image_url);
      setShowSetupModal(false);
      showMessage(`Loaded floorplan: ${fp.name}`);
    } catch (err) {
      console.warn('selectFloorplan supabase fetch failed:', err.message || err);
      showMessage('Loaded floorplan image only');
      setFloorplanUrl(fp.image_url);
    } finally {
      setLoading(false);
    }
  };

  // Removed template creation, QR preview, and auth helpers for MVP simplification

  const handleNewNode = useCallback(async (n) => {
    const id = `n_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const node = { id, name: `Node ${nodes.length+1}`, qr_id: currentQrId || null, ...n };
    setNodes(prev => [...prev, node]);
    showMessage('Node added');
    
    // Save QR node to database if QR ID is provided and event is selected
    if (currentQrId && currentEventId && supabase) {
      try {
        const { error } = await supabase
          .from('map_qr_nodes')
          .insert({
            event_id: currentEventId,
            qr_id_text: currentQrId,
            x_coord: Math.round(n.x || 0),
            y_coord: Math.round(n.y || 0)
          });
        
        if (error) {
          console.warn('Failed to save QR node to database:', error);
          showMessage('Node added locally (DB save failed)', 3000);
        } else {
          showMessage('Node added and QR calibrated!', 2000);
          setCurrentQrId(''); // Clear QR ID after successful save
        }
      } catch (err) {
        console.warn('Error saving QR node:', err);
      }
    }
    
    return node;
  }, [nodes.length, currentQrId, currentEventId]);

  const handleNewSegment = useCallback((s) => {
    const id = `s_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const seg = { id, ...s };
    setSegments(prev => [...prev, seg]);
    showMessage('Segment added');
  }, []);

  const handleNewPoi = useCallback((p) => {
    // p may contain x,y coords
    const id = `poi_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const poi = { id, name: p.name || 'POI', type: p.type || 'general', x: p.x, y: p.y, x_pct: p.x_pct, y_pct: p.y_pct };
    setPois(prev => [...prev, poi]);
    showMessage('POI added');
  }, []);

  const handleCanvasClickForPoi = (coords) => {
    // Called by the canvas when in poi mode — open modal to collect name/type
    setPendingPoiCoords(coords);
    setShowPoiModal(true);
  };

  const handlePoiModalSave = (formData) => {
    if (!pendingPoiCoords) return;
    const p = { ...pendingPoiCoords, name: formData.name, type: formData.type };
    handleNewPoi(p);
    setShowPoiModal(false);
    setPendingPoiCoords(null);
  };

  const handlePoiModalCancel = () => {
    setShowPoiModal(false);
    setPendingPoiCoords(null);
  };

  // Simple save function - in a full editor this would call your backend / supabase table
  const handleSaveMap = async () => {
    if (!floorplanUrl) return showMessage('Upload a floorplan first');
    const payload = {
      event_id: 1,
      storage_url: floorplanUrl,
      image_width: 0,
      image_height: 0,
      pois: pois.map(p => ({ name: p.name, type: p.type, x: p.x, y: p.y, metadata: { localId: p.id } })),
      paths: segments.map(s => ({ start_index: nodes.findIndex(n => n.id === s.start_node_id), end_index: nodes.findIndex(n => n.id === s.end_node_id), distance: s.distance || null }))
    };

    try {
      const res = await fetch('http://localhost:3003/save_map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || 'save failed');
      showMessage('Map saved to backend');
    } catch (err) {
      console.warn('saveMap failed', err?.message || err);
      showMessage('Save failed: ' + (err?.message || String(err)));
    }
  };

  // Removed local save/export/import for MVP simplification

  // --- Pathfinding helpers (simple Dijkstra on the node graph) ---
  const buildAdjacency = () => {
    const adj = {};
    for (const n of nodes) adj[n.id] = [];
    for (const s of segments) {
      const a = nodes.find(n => n.id === s.start_node_id);
      const b = nodes.find(n => n.id === s.end_node_id);
      if (!a || !b) continue;
      const dx = a.x - b.x; const dy = a.y - b.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      adj[a.id].push({ id: b.id, w: d });
      adj[b.id].push({ id: a.id, w: d });
    }
    return adj;
  };

  const findShortestNodePath = (startId, endId) => {
    if (!startId || !endId) return [];
    const adj = buildAdjacency();
    const dist = {}; const prev = {};
    const pq = new Set(nodes.map(n=>n.id));
    for (const id of pq) { dist[id] = Infinity; prev[id] = null; }
    dist[startId] = 0;
    while (pq.size) {
      // get smallest
      let u = null; let best = Infinity;
      for (const id of pq) { if (dist[id] < best) { best = dist[id]; u = id; } }
      if (u === null) break;
      pq.delete(u);
      if (u === endId) break;
      for (const edge of (adj[u] || [])) {
        const alt = dist[u] + edge.w;
        if (alt < dist[edge.id]) {
          dist[edge.id] = alt;
          prev[edge.id] = u;
        }
      }
    }
    if (dist[endId] === Infinity) return [];
    const path = [];
    let cur = endId;
    while (cur) { path.unshift(cur); cur = prev[cur]; }
    return path;
  };

  const nearestNodeForPoi = (poi) => {
    if (!nodes || nodes.length === 0 || !poi) return null;
    let best = null; let bestD = Infinity;
    for (const n of nodes) {
      const dx = (n.x || 0) - (poi.x || 0);
      const dy = (n.y || 0) - (poi.y || 0);
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  };

  const nodePathToCoords = (nodePath) => {
    return nodePath.map(id => {
      const n = nodes.find(x => x.id === id);
      return n ? { x: n.x, y: n.y } : null;
    }).filter(Boolean);
  };

  // Removed attendee preview and bulk QR generation for MVP simplification

  return (
    <div style={{ padding: 12 }}>

      {/* Right column: editor */}
      <main>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {MODES.map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 10px', background: mode === m ? '#111827' : '#fff', color: mode === m ? '#fff' : '#111827', border: '1px solid #e5e7eb', borderRadius: 6 }}>{m}</button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowSetupModal(true)}>Change floorplan</button>
            <button onClick={handleSaveMap}>Save (server)</button>
          </div>
        </div>

        {/* Calibration panel */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12, borderTop: '1px dashed #e5e7eb', paddingTop: 12 }}>
          <div style={{ maxWidth: 360 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Event ID (for QR nodes)</label>
            <input
              type="text"
              placeholder="Event UUID"
              value={currentEventId || ''}
              onChange={e => setCurrentEventId(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4 }}
            />
          </div>
          {mode === 'node' && (
            <div style={{ maxWidth: 360 }}>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>QR Code ID</label>
              <input
                type="text"
                placeholder="e.g., junction-hall-a"
                value={currentQrId}
                onChange={e => setCurrentQrId(e.target.value)}
                style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4 }}
              />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Enter QR ID before adding node to calibrate location
              </p>
            </div>
          )}
          {/* Templates removed for MVP */}
        </div>

        {banner && <div style={{ marginBottom: 8, padding: 8, background: '#f0f9ff', border: '1px solid #bfdbfe' }}>{banner}</div>}

        <div>
          <FloorplanCanvas
            floorplanImageUrl={floorplanUrl}
            nodes={nodes}
            segments={segments}
            pois={pois}
            zones={zones}
            mode={mode}
            onNewNode={(n) => { if (mode === 'node' || mode === 'draw-path') return handleNewNode(n); }}
            onNewSegment={(s) => { if (mode === 'draw-path') handleNewSegment(s); }}
            onNewPoi={(p) => { if (mode === 'poi') handleCanvasClickForPoi(p); }}
          />
        </div>
      </main>

      {/* Setup modal: upload/select floorplan */}
      {showSetupModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 860, maxHeight: '80vh', overflow: 'auto', background: '#fff', padding: 16, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Setup Floorplan</h3>
              <button onClick={() => setShowSetupModal(false)} style={{ padding: '6px 10px' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                <h4 style={{ marginTop: 0 }}>Upload New Floorplan</h4>
                <ImageUploader onUploadSuccess={handleUploadSuccess} uploadFn={uploadToSupabase} />
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                <h4 style={{ marginTop: 0 }}>Saved Floorplans</h4>
                <div style={{ maxHeight: 360, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loading && <div>Loading...</div>}
                  {!loading && floorplansList.length === 0 && <div style={{ color: '#6b7280' }}>No saved floorplans yet</div>}
                  {floorplansList.map(fp => (
                    <div key={fp.id} style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{fp.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{fp.created_at ? new Date(fp.created_at).toLocaleString() : ''}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => handleSelectFloorplan(fp)} style={{ padding: '4px 8px' }}>Open</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPoiModal && (
        <POIForm
          onCancel={handlePoiModalCancel}
          onSave={(data) => handlePoiModalSave(data)}
          initialName=""
          initialType="general"
        />
      )}
    </div>
  );
};

export default DevScaffoldFloorplanEditor;
