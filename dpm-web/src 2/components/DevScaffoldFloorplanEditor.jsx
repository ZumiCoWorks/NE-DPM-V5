import React, { useState, useEffect, useCallback, useRef } from 'react';
import ImageUploader from './scaffold/ImageUploader';
import POIForm from './scaffold/POIForm';
import FloorplanCanvas from './FloorplanCanvas';
import { supabase } from '../lib/supabase';

// Adapted dev copy of the scaffold FloorplanEditor. This file lives inside `src/` so Vite can resolve it.
// It imports some scaffold components directly (ImageUploader/POIForm/FloorplanCanvas) from scaffold/ but
// calls the app's `src/lib/supabase` for DB calls. This is a dev-only bridge to preview the editor.

const MODES = ['pan', 'node', 'segment', 'poi', 'zone', 'draw-path', 'pathfind', 'edit', 'calibrate', 'georeference'];

const DevScaffoldFloorplanEditor = ({ initialFloorplan = null, initialNodes = [], initialSegments = [], initialPois = [], initialZones = [] }) => {
  const [floorplanUrl, setFloorplanUrl] = useState(initialFloorplan);
  const [nodes, setNodes] = useState(initialNodes);
  const [segments, setSegments] = useState(initialSegments);
  const [pois, setPois] = useState(initialPois);
  const [zones, setZones] = useState(initialZones);
  const [mode, setMode] = useState('pan');
  const [highlightPath, setHighlightPath] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDestination, setPreviewDestination] = useState(null);
  const [previewUserLocation, setPreviewUserLocation] = useState(null);
  const [showQrListModal, setShowQrListModal] = useState(false);
  const [generatedQrs, setGeneratedQrs] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [floorplansList, setFloorplansList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [showPoiModal, setShowPoiModal] = useState(false);
  const [pendingPoiCoords, setPendingPoiCoords] = useState(null);

  // Simple message banner
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (initialFloorplan) setFloorplanUrl(initialFloorplan);
  }, [initialFloorplan]);

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
      showMessage(`Loaded floorplan: ${fp.name}`);
    } catch (err) {
      console.warn('selectFloorplan supabase fetch failed:', err.message || err);
      showMessage('Loaded floorplan image only');
      setFloorplanUrl(fp.image_url);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName) return showMessage('Template name required');
    if (!floorplanUrl) return showMessage('Upload a floorplan image first');
    setLoading(true);
    try {
      const payload = { template_name: templateName, image_url: floorplanUrl, dimensions: { width: 0, height: 0 } };
      if (supabase && currentUser) {
        const { error } = await supabase.from('venue_templates').insert({ ...payload, user_id: currentUser.id });
        if (error) throw error;
        showMessage('Template created');
        setShowTemplateModal(false);
        setTemplateName('');
      } else {
        showMessage('Template saved locally (no DB)');
        setShowTemplateModal(false);
        setTemplateName('');
      }
    } catch (err) {
      console.warn('create template failed:', err.message || err);
      showMessage('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQr = (value) => {
    if (!value) return;
    setQrValue(value);
    setShowQrModal(true);
  };

  const handleAuth = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setLoading(true);
    try {
      if (isSigningUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showMessage('Sign-up started; check your email');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showMessage('Signed in');
      }
    } catch (err) {
      console.warn('auth failed', err.message || err);
      showMessage('Auth failed');
    } finally {
      setLoading(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      showMessage('Signed out');
    } catch (err) {
      console.warn('signout failed', err.message || err);
    }
  };

  const handleNewNode = useCallback((n) => {
    const id = `n_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const node = { id, name: `Node ${nodes.length+1}`, ...n };
    setNodes(prev => [...prev, node]);
    showMessage('Node added');
    return node;
  }, [nodes.length]);

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

  // Frontend-only helpers: local save, export/import JSON (no backend required)
  const fileInputRef = useRef(null);

  const handleLocalSave = () => {
    if (!floorplanUrl) return showMessage('Upload a floorplan first');
    const payload = { floorplanUrl, nodes, segments, pois, zones, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem('dev_floorplan_auto_save', JSON.stringify(payload));
      showMessage('Saved to localStorage (dev_floorplan_auto_save)');
    } catch (err) {
      console.warn('localSave failed', err);
      showMessage('Local save failed');
    }
  };

  const handleExportJSON = () => {
    if (!floorplanUrl) return showMessage('Upload a floorplan first');
    const payload = { floorplanUrl, nodes, segments, pois, zones, exportedAt: new Date().toISOString() };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floorplan_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showMessage('Exported JSON');
    } catch (err) {
      console.warn('export failed', err);
      showMessage('Export failed');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleImportFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        // defensive mapping
        setFloorplanUrl(parsed.floorplanUrl || parsed.storage_url || parsed.image_url || null);
        setNodes(Array.isArray(parsed.nodes) ? parsed.nodes : (parsed.nodes || []));
        setSegments(Array.isArray(parsed.segments) ? parsed.segments : (parsed.paths || []));
        setPois(Array.isArray(parsed.pois) ? parsed.pois : (parsed.pois || []));
        setZones(Array.isArray(parsed.zones) ? parsed.zones : (parsed.zones || []));
        showMessage('Imported JSON');
      } catch (err) {
        console.warn('import parse failed', err);
        showMessage('Failed to import JSON');
      }
    };
    reader.readAsText(f);
    // reset so same file can be re-imported later
    e.target.value = '';
  };

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

  // Preview navigation: pick destination (booth), pick a localization POI as start, compute path
  const startPreviewNavigation = (destinationPoiId, localizationPoiId = null) => {
    const destPoi = pois.find(p => p.id === destinationPoiId);
    if (!destPoi) return showMessage('Select a destination POI');
    let startPoi = null;
    if (localizationPoiId) startPoi = pois.find(p => p.id === localizationPoiId);
    if (!startPoi) startPoi = pois.find(p => p.type === 'localization') || pois[0];
    if (!startPoi) return showMessage('No localization POI available (add one)');
    setPreviewDestination(destPoi.id);
    setPreviewUserLocation(startPoi.id);
    // map to nearest nodes
    const startNode = nearestNodeForPoi(startPoi);
    const endNode = nearestNodeForPoi(destPoi);
    if (!startNode || !endNode) return showMessage('Both start and destination must be near defined nodes');
    const nodePath = findShortestNodePath(startNode.id, endNode.id);
    const coords = nodePathToCoords(nodePath);
    setHighlightPath(coords);
    setPreviewMode(true);
    showMessage('Preview route generated');
  };

  // Generate QR codes for localization and booth POIs (uses online qr API, returns display URLs)
  const handleGenerateQRCodes = () => {
    const targets = pois.filter(p => p.type === 'localization' || p.type === 'booth');
    if (targets.length === 0) return showMessage('No localization or booth POIs to generate QR for');
    const qrs = targets.map(p => {
      const payload = { type: p.type, poi_id: p.id, name: p.name, map_url: floorplanUrl };
      const data = encodeURIComponent(JSON.stringify(payload));
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}`;
      return { poi: p, url };
    });
    setGeneratedQrs(qrs);
    setShowQrListModal(true);
  };

  return (
    <div style={{ padding: 12, display: 'flex', gap: 12 }}>
      {/* Left column: floorplans, templates, auth */}
      <aside style={{ width: 300, border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Floorplans</h3>
        <div style={{ maxHeight: 300, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                <button onClick={() => handleShowQr(fp.image_url)} style={{ padding: '4px 8px' }}>QR</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
    <ImageUploader onUploadSuccess={handleUploadSuccess} uploadFn={uploadToSupabase} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={() => setShowTemplateModal(true)} style={{ width: '100%', padding: 8 }}>Create Template</button>
        </div>

        <div style={{ marginTop: 12, borderTop: '1px dashed #e5e7eb', paddingTop: 12 }}>
          <h4 style={{ margin: '6px 0' }}>Account</h4>
          {currentUser ? (
            <div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>Signed in as {currentUser.email}</div>
              <button onClick={handleLogout} style={{ padding: '6px 8px' }}>Sign out</button>
            </div>
          ) : (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ padding: '6px 8px' }}>{isSigningUp ? 'Sign up' : 'Sign in'}</button>
                <button type="button" onClick={() => setIsSigningUp(s => !s)} style={{ padding: '6px 8px' }}>{isSigningUp ? 'Switch to sign in' : 'Switch to sign up'}</button>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* Right column: editor */}
      <main style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {MODES.map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 10px', background: mode === m ? '#111827' : '#fff', color: mode === m ? '#fff' : '#111827', border: '1px solid #e5e7eb', borderRadius: 6 }}>{m}</button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleSaveMap}>Save (server)</button>
            <button onClick={handleLocalSave}>Save (local)</button>
            <button onClick={handleExportJSON}>Export JSON</button>
            <button onClick={handleImportClick}>Import JSON</button>
            <button onClick={() => handleShowQr(floorplanUrl)} disabled={!floorplanUrl}>Show map QR</button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
          </div>
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
            highlightPath={highlightPath}
            onNewNode={(n) => { if (mode === 'node') handleNewNode(n); }}
            onNewSegment={(s) => { if (mode === 'segment') handleNewSegment(s); }}
            onNewPoi={(p) => { if (mode === 'poi') handleCanvasClickForPoi(p); }}
          />
        </div>
      </main>

      {/* QR list modal (bulk generated) */}
      {showQrListModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 720, maxHeight: '80vh', overflow: 'auto', background: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>Generated QR Anchors</h3>
            <p style={{ marginTop: 0 }}>Download or open each QR. The QR encodes a small JSON payload with keys: type, poi_id, name, map_url.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {generatedQrs.map((q) => (
                <div key={q.poi.id} style={{ border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{q.poi.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{q.poi.type}</div>
                  <img src={q.url} alt={`qr-${q.poi.id}`} style={{ width: 180, height: 180, marginTop: 8 }} />
                  <div style={{ marginTop: 8 }}>
                    <a href={q.url} target="_blank" rel="noreferrer" style={{ marginRight: 8 }}>Open</a>
                    <a href={q.url} download={`qr_${q.poi.id}.png`}>Download</a>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setShowQrListModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview / mobile-sim controls (simple) */}
      <div style={{ position: 'fixed', right: 16, bottom: 16 }}> 
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setPreviewMode(p => !p); setHighlightPath([]); }}>{previewMode ? 'Exit Preview' : 'Enter Preview'}</button>
          <button onClick={handleGenerateQRCodes}>Generate QR Anchors</button>
        </div>
      </div>

      {/* Preview panel (simple mobile-sim) */}
      {previewMode && (
        <div style={{ position: 'fixed', left: 16, bottom: 16, width: 360, height: 640, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'auto' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #f3f4f6' }}>
            <h4 style={{ margin: 0 }}>Preview (Attendee)</h4>
            <div style={{ marginTop: 8 }}>
              <select value={previewDestination || ''} onChange={e => setPreviewDestination(e.target.value)} style={{ width: '100%' }}>
                <option value="">Select destination (POI)</option>
                {pois.filter(p=>p.type === 'booth' || p.type === 'general').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => startPreviewNavigation(previewDestination)}>Start Navigation (simulate scan)</button>
                <button onClick={() => { setPreviewDestination(null); setPreviewUserLocation(null); setHighlightPath([]); }}>Reset</button>
              </div>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Scan simulation: choose a localization anchor in the map editor by adding POIs with type 'localization'. The preview will use the first available localization POI if none explicitly selected.</div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600 }}>Localization POIs</div>
              <ul>
                {pois.filter(p=>p.type === 'localization').map(p => (
                  <li key={p.id}>{p.name} — <button onClick={() => startPreviewNavigation(previewDestination, p.id)}>Use & Navigate</button></li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600 }}>Route</div>
              {highlightPath && highlightPath.length > 0 ? (
                <ol>
                  {highlightPath.map((pt, idx) => (<li key={idx}>{Math.round(pt.x)},{Math.round(pt.y)}</li>))}
                </ol>
              ) : (
                <div style={{ color: '#6b7280' }}>No route — draw nodes & segments in the editor first.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template modal */}
      {showTemplateModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 480, background: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>Create Template</h3>
            <input placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTemplateModal(false)}>Cancel</button>
              <button onClick={handleCreateTemplate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* QR modal */}
      {showQrModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 360, background: '#fff', padding: 16, borderRadius: 8, textAlign: 'center' }}>
            <h4>Scan to open</h4>
            {qrValue ? (
              <img alt="qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`} />
            ) : (
              <div>No QR data</div>
            )}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setShowQrModal(false)}>Close</button>
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
