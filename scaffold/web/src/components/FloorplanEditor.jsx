import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import POIForm from './POIForm';
import FloorplanCanvas from './FloorplanCanvas';
import supabase, { uploadFloorplan } from '../lib/supabaseClient';

// Lightweight FloorplanEditor that wires the toolbar, uploader, POI modal and the Konva canvas.
// This is an adapted, smaller copy of the full editor UI from the reference repo.

const MODES = ['pan', 'node', 'segment', 'poi', 'zone', 'pathfind', 'edit', 'calibrate', 'georeference'];

const FloorplanEditor = ({ initialFloorplan = null, initialNodes = [], initialSegments = [], initialPois = [], initialZones = [] }) => {
  const [floorplanUrl, setFloorplanUrl] = useState(initialFloorplan);
  const [nodes, setNodes] = useState(initialNodes);
  const [segments, setSegments] = useState(initialSegments);
  const [pois, setPois] = useState(initialPois);
  const [zones, setZones] = useState(initialZones);
  const [mode, setMode] = useState('pan');
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
    // auth listener
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
    // For now just show a message and simulate persistence
    showMessage('Map saved (local state only)');
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
          <ImageUploader onUploadSuccess={handleUploadSuccess} uploadFn={uploadFloorplan} />
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

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={handleSaveMap}>Save map</button>
            <button onClick={() => handleShowQr(floorplanUrl)} disabled={!floorplanUrl}>Show map QR</button>
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
            // Pass drawingMode as the canvas drawingMode
            // The canvas component expects prop name `drawingMode` internally — adapt as needed
            onNewNode={(n) => { if (mode === 'node') handleNewNode(n); }}
            onNewSegment={(s) => { if (mode === 'segment') handleNewSegment(s); }}
            onNewPoi={(p) => { if (mode === 'poi') handleCanvasClickForPoi(p); }}
          />
        </div>
      </main>

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
          onClose={handlePoiModalCancel}
          onSave={(data) => handlePoiModalSave(data)}
          defaultName=""
          defaultType="general"
        />
      )}
    </div>
  );
};

export default FloorplanEditor;
