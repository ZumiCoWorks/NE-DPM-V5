import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageUploader from './scaffold/ImageUploader';
import POIForm from './scaffold/POIForm';
import FloorplanCanvas from './FloorplanCanvas';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Adapted dev copy of the scaffold FloorplanEditor. This file lives inside `src/` so Vite can resolve it.
// It imports some scaffold components directly (ImageUploader/POIForm/FloorplanCanvas) from scaffold/ but
// calls the app's `src/lib/supabase` for DB calls. This is a dev-only bridge to preview the editor.

const MODES = ['poi', 'node', 'draw-path'];

const DevScaffoldFloorplanEditor = ({ initialFloorplan = null, initialEventId = null, initialNodes = [], initialSegments = [], initialPois = [], initialZones = [] }) => {
  const demoMode = false // Disabled demo mode for production testing
  const [floorplanUrl, setFloorplanUrl] = useState(initialFloorplan);
  const [nodes, setNodes] = useState(initialNodes);
  const [segments, setSegments] = useState(initialSegments);
  const [pois, setPois] = useState(initialPois);
  const [zones, setZones] = useState(initialZones);
  const [mode, setMode] = useState('poi');
  const [currentUser, setCurrentUser] = useState(null);
  const [floorplansList, setFloorplansList] = useState([]);
  const [currentFloorplan, setCurrentFloorplan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [showPoiModal, setShowPoiModal] = useState(false);
  const [pendingPoiCoords, setPendingPoiCoords] = useState(null);

  // QR Code ID for nodes (Part 2: B2C Admin Function)
  const [currentQrId, setCurrentQrId] = useState('');
  const [currentEventId, setCurrentEventId] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [calibrations, setCalibrations] = useState([]);
  const [lastSavedMapUrl, setLastSavedMapUrl] = useState('');

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
      if (user) {
        fetchFloorplans(user.id).catch(() => {});
        fetchMyEvents(user.id).catch(() => {});
      }
    });
    return () => authListener?.subscription?.unsubscribe && authListener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    fetchCalibrations(currentEventId).catch(()=>{});
  }, [currentEventId]);

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

  const fetchMyEvents = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setMyEvents(data || [])
    } catch (err) {
      console.warn('fetchMyEvents failed:', err?.message || err)
      setMyEvents([])
    }
  }
  const fetchCalibrations = async (eventId) => {
    try {
      if (demoMode) { setCalibrations([]); return; }
      if (!eventId) { setCalibrations([]); return; }
      const { data: { session } } = await supabase.auth.getSession();
      const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';
      const res = await fetch(`${API_BASE_URL}/editor/qr-nodes?event_id=${encodeURIComponent(eventId)}`, {
        headers: { ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        credentials: 'include'
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'fetch failed');
      setCalibrations(json.data || []);
    } catch (err) {
      setCalibrations([]);
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
        if (demoMode) {
          showMessage('Demo mode: not saving to DB', 3000);
          setLoading(false);
          return;
        }
        if (!currentEventId) {
          showMessage('Floorplan uploaded (not saved to DB — enter Event ID to save)', 4000);
        } else {
          const { data, error } = await supabase
            .from('floorplans')
            .insert({ name: `Floorplan ${new Date().toLocaleString()}`, image_url: url, event_id: currentEventId, user_id: currentUser.id })
            .select('*')
            .single();
          if (error) throw error;
          setCurrentFloorplan(data);
          await fetchFloorplans(currentUser.id);
          await fetchCalibrations(currentEventId);
          showMessage('Floorplan saved to DB', 2500);
        }
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
    const fileExt = file.name.split('.').pop();
    const fileName = `floorplan_${Date.now()}_${Math.random().toString(36).slice(2,10)}.${fileExt}`;
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = window.btoa(binary);
    const { data: { session } } = await supabase.auth.getSession();
    const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';
    if (demoMode) throw new Error('Demo mode: server upload disabled. Paste a hosted URL instead.')
    const res = await fetch(`${API_BASE_URL}/storage/upload/floorplan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({ filename: fileName, contentType: file.type || 'image/png', base64 })
    });
    const json = await res.json();
    if (!res.ok || !json?.success) throw new Error(json?.message || 'upload failed');
    if (!json?.url) throw new Error('No URL returned');
    return json.url;
  };

  const handleSelectFloorplan = async (fp) => {
    if (!fp) return;
    setLoading(true);
    try {
      // fetch navigation points as POIs (non-blocking if table missing)
      const { data: poisData, error: poisErr } = await supabase
        .from('navigation_points')
        .select('id, name, point_type, x_coordinate, y_coordinate')
        .eq('floorplan_id', fp.id);
      if (!poisErr) {
        const mappedPois = (poisData || []).map(p => ({ id: p.id, name: p.name, type: p.point_type, x: p.x_coordinate, y: p.y_coordinate }));
        setPois(mappedPois);
      } else {
        // silently ignore missing table / 404
        setPois([]);
      }
      setNodes([]);
      setSegments([]);
      setZones([]);
      setFloorplanUrl(fp.image_url);
      setCurrentFloorplan(fp);
      if (fp.event_id) setCurrentEventId(fp.event_id);
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
    if (currentQrId && currentEventId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';
        if (demoMode) {
          showMessage('Demo mode: QR calibration stored locally', 2000);
        } else {
          const res = await fetch(`${API_BASE_URL}/editor/qr-node`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify({
              event_id: currentEventId,
              qr_id_text: currentQrId,
              x_coord: Math.round(n.x || 0),
              y_coord: Math.round(n.y || 0)
            })
          });
          if (!res.ok) {
            const j = await res.json().catch(()=>({}));
            throw new Error(j?.message || 'save failed');
          }
          showMessage('Node added and QR calibrated!', 2000);
          setCurrentQrId('');
          await fetchCalibrations(currentEventId);
        }
      } catch (err) {
        console.warn('Error saving QR node:', err);
        showMessage('Node added locally (DB save failed)', 3000);
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

  const handlePoiModalSave = async (formData) => {
    if (!pendingPoiCoords) return;
    const p = { ...pendingPoiCoords, name: formData.name, type: formData.type };
    handleNewPoi(p);
    setShowPoiModal(false);
    setPendingPoiCoords(null);
    // Persist to navigation_points when a floorplan is selected
    if (currentFloorplan && supabase) {
      try {
        const pointTypeMap = { general: 'amenity' };
        const point_type = pointTypeMap[p.type] || p.type || 'amenity';
        const { data: { session } } = await supabase.auth.getSession();
        const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';
        if (demoMode) {
          showMessage('Demo mode: POI stored locally', 2000);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/editor/poi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify({
            floorplan_id: currentFloorplan.id,
            name: p.name,
            point_type,
            x_coordinate: Math.round(p.x || 0),
            y_coordinate: Math.round(p.y || 0),
          })
        });
        if (!res.ok) {
          const j = await res.json().catch(()=>({}));
          throw new Error(j?.message || 'save failed');
        }
        showMessage('POI saved to DB', 2000);
      } catch (err) {
        console.warn('Failed to save POI to DB:', err);
        showMessage('POI added locally (DB save failed)', 3000);
      }
    }
  };

  const handlePoiModalCancel = () => {
    setShowPoiModal(false);
    setPendingPoiCoords(null);
  };

  // Simple save function - in a full editor this would call your backend / supabase table
  const handleSaveMap = async () => {
    if (!floorplanUrl || !currentFloorplan) return showMessage('Upload a floorplan first');
    const payload = {
      floorplan_id: currentFloorplan.id,
      nodes,
      segments,
      pois: pois.map(p => ({ id: p.id, name: p.name, type: p.type, x: p.x, y: p.y }))
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001/api';
      if (demoMode) {
        const blob = new Blob([JSON.stringify({ nodes, segments, pois }, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        setLastSavedMapUrl(url)
        toast.success('Demo mode: map exported locally')
        return
      }
      const res = await fetch(`${API_BASE_URL}/editor/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.message || 'save failed');
      }
      const j = await res.json().catch(()=>({ success:true, url:'' }));
      setLastSavedMapUrl(j?.url || '');
      toast.success('Map saved and exported');
      toast.success(`Public graph URL: ${j?.url || ''}`, { duration: 6000 });
    } catch (err) {
      console.warn('saveMap failed', err?.message || err);
      toast.error('Save failed: ' + (err?.message || String(err)));
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
          {lastSavedMapUrl && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Export URL: <a href={lastSavedMapUrl} target="_blank" rel="noreferrer">{lastSavedMapUrl}</a>
              <button onClick={async()=>{ try { const r = await fetch(lastSavedMapUrl); const blob = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'map.json'; a.click(); } catch{} }} style={{ marginLeft: 6, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 4 }}>Download JSON</button>
            </span>
          )}
        </div>
      </div>

        {/* Calibration panel */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12, borderTop: '1px dashed #e5e7eb', paddingTop: 12 }}>
          <div style={{ maxWidth: 360 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Event (select or paste ID)</label>
            <select
              value={currentEventId || ''}
              onChange={e => setCurrentEventId(e.target.value || null)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 6 }}
            >
              <option value="">Select event...</option>
              {myEvents.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Event UUID"
              value={currentEventId || ''}
              onChange={e => setCurrentEventId(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4 }}
            />
          </div>
          <div style={{ maxWidth: 360 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>QR Code ID</label>
            <input
              type="text"
              placeholder="e.g., test-qr-1"
              value={currentQrId}
              onChange={e => setCurrentQrId(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4 }}
            />
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {mode==='node' ? 'Enter QR ID before adding node to calibrate location' : 'Use draw-path to connect nodes into segments'}
            </p>
            {calibrations?.length>0 && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <div style={{ color:'#6b7280', marginBottom:4 }}>Existing calibrations for this event:</div>
                <ul style={{ maxHeight: 160, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:6, padding:8 }}>
                  {calibrations.map((c, idx)=> (
                    <li key={idx} style={{ display:'flex', justifyContent:'space-between' }}>
                      <span>{c.qr_id_text}</span>
                      <span style={{ color:'#6b7280' }}>({c.x_coord}, {c.y_coord})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Event (select or paste ID)</label>
                  <select
                    value={currentEventId || ''}
                    onChange={e => setCurrentEventId(e.target.value || null)}
                    style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 6 }}
                  >
                    <option value="">Select event...</option>
                    {myEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Event UUID"
                    value={currentEventId || ''}
                    onChange={e => setCurrentEventId(e.target.value)}
                    style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 4 }}
                  />
                </div>
                <ImageUploader onUploadSuccess={handleUploadSuccess} uploadFn={demoMode ? undefined : uploadToSupabase} />
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
