// src/components/FloorplanEditor.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import ImageUploader from './ImageUploader.jsx';
import FloorplanCanvas from './FloorplanCanvas.jsx';
import OnboardingFlow from './OnboardingFlow.jsx'
import ScreenSizeRestriction from './ScreenSizeRestriction.jsx';
import useScreenSize from '../hooks/useScreenSize.js';
import QRCode from "react-qr-code";

// --- SVG Icon Components ---
const LayoutIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" x2="21" y1="9" y2="9"></line><line x1="9" x2="9" y1="21" y2="9"></line>
  </svg>
);

const VendorsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const CrownIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519L20.69 18.25A1.5 1.5 0 0 1 19.203 19.5H4.797a1.5 1.5 0 0 1-1.487-1.25L2.019 6.019a.5.5 0 0 1 .798-.519l4.277 3.664a1 1 0 0 0 1.516-.294z"/>
  </svg>
);

const ShieldCheckIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-8 8.5-4.5-1-8-3.5-8-8.5V7l8-3 8 3z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const LinkIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.71"/>
  </svg>
);

const StarIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const SettingsIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const HelpIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <path d="M12 17h.01"/>
  </svg>
);

const TABS = [
  { name: 'Layout', Icon: LayoutIcon },
  { name: 'Vendors / Dynamic Locations', Icon: VendorsIcon },
  { name: 'Settings', Icon: SettingsIcon }
];

const FloorplanEditor = () => {
  const [currentFloorplan, setCurrentFloorplan] = useState(null);
  const [currentNodes, setCurrentNodes] = useState([]);
  const [currentSegments, setCurrentSegments] = useState([]);
  const [currentPois, setCurrentPois] = useState([]);
  const [currentZones, setCurrentZones] = useState([]);
  const [currentBeacons, setCurrentBeacons] = useState([]);
  const [newBeacon, setNewBeacon] = useState({ name: '', uuid: '', major: '', minor: '' });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [floorplansList, setFloorplansList] = useState([]);
  const [venueTemplates, setVenueTemplates] = useState([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [currentVendors, setCurrentVendors] = useState([]);
  const [newVendorName, setNewVendorName] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeValue] = useState('');
  const [activeTab, setActiveTab] = useState('Layout');
  const [dashboardRole, setDashboardRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Venue Owner');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [signupLink, setSignupLink] = useState('')
  const [showOnboardingHelp, setShowOnboardingHelp] = useState(false)
  const [showScreenSizeRestriction, setShowScreenSizeRestriction] = useState(false);

  // Screen size detection
  const { width, height, isSuitableForEditor } = useScreenSize()

const showEditorMessage = useCallback((msg, type = 'info', duration = 3000) => {
  // Create a temporary message display
  const messageEl = document.createElement('div');
  messageEl.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    padding: 15px 20px; border-radius: 8px; color: white; font-weight: 500;
    background-color: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  `;
  messageEl.textContent = msg;
  document.body.appendChild(messageEl);
  
  const timer = setTimeout(() => {
    document.body.removeChild(messageEl);
  }, duration);
  return () => clearTimeout(timer);
}, []);

  const fetchVenueTemplates = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_templates')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVenueTemplates(data);
    } catch (err) {
      showEditorMessage("Failed to fetch venue templates: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showEditorMessage]);

  const fetchAllVenueTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableTemplates(data);
    } catch (err) {
      showEditorMessage("Failed to fetch available templates: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showEditorMessage]);

  const fetchFloorplans = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('floorplans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      setFloorplansList(data);
    } catch (err) {
      showEditorMessage("Failed to fetch floorplans: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showEditorMessage]);

  useEffect(() => {
    if (!currentFloorplan) return;
    const channel = supabase
      .channel(`pois-for-floorplan-${currentFloorplan.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pois',
          filter: `floorplan_id=eq.${currentFloorplan.id}`,
        },
        (payload) => {
          console.log('Real-time POI update received!', payload.new);
          setCurrentPois((prevPois) =>
            prevPois.map((poi) =>
              poi.id === payload.new.id ? { ...poi, is_active: payload.new.is_active, last_pinged_at: payload.new.last_pinged_at } : poi
            )
          );
          showEditorMessage(`Location '${payload.new.name}' is now active!`, 'success');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentFloorplan, showEditorMessage]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const role = user?.user_metadata?.role;
      setCurrentUser(user);
      setUserRole(role);
      setDashboardRole(role);
      if (!user) {
        setUserRole(null);
        setDashboardRole(null);
        setCurrentFloorplan(null);
        setFloorplansList([]);
        setVenueTemplates([]);
        setCurrentBeacons([]);
        setAvailableTemplates([]);
        setIsCreatingEvent(false);
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (dashboardRole === 'Event Organizer') {
        fetchFloorplans(currentUser.id);
        fetchAllVenueTemplates();
      }
      if (userRole === 'Venue Owner') {
        fetchVenueTemplates();
      }
    }
  }, [currentUser, userRole, dashboardRole, fetchFloorplans, fetchAllVenueTemplates, fetchVenueTemplates]);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSigningUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role: role } }
        });
        if (error) throw error;
        showEditorMessage("Sign up successful! Please check your email to confirm.", 'info');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showEditorMessage("Logged in successfully!", 'success');
      }
    } catch (err) {
      showEditorMessage("Authentication failed: " + err.message, 'error');
    } finally {
      setLoading(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleShowOnboardingHelp = () => {
    setShowOnboardingHelp(true);
  };

  const handleOnboardingHelpComplete = () => {
    setShowOnboardingHelp(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showEditorMessage("Signed out successfully!", 'success');
  };

  const selectFloorplan = useCallback(async (floorplanId) => {
    // Check screen size before proceeding to editor
    if (!isSuitableForEditor) {
      setShowScreenSizeRestriction(true);
      return;
    }

    setLoading(true);
    try {
      const { data: floorplan, error: fpError } = await supabase.from('floorplans').select('*').eq('id', floorplanId).single();
      if (fpError) throw fpError;
      setCurrentFloorplan(floorplan);
      setActiveTab('Layout');
      const { data: nodesData, error: nodesError } = await supabase.from('nodes').select('*').eq('floorplan_id', floorplanId);
      if (nodesError) throw nodesError;
      setCurrentNodes(nodesData);
      const { data: segmentsData, error: segmentsError } = await supabase.from('segments').select('*').eq('floorplan_id', floorplanId);
      if (segmentsError) throw segmentsError;
      setCurrentSegments(segmentsData);
      const { data: poisData, error: poisError } = await supabase.from('pois').select('*').eq('floorplan_id', floorplanId);
      if (poisError) throw poisError;
      setCurrentPois(poisData);
      const { data: zonesData, error: zonesError } = await supabase.from('zones').select('*').eq('floorplan_id', floorplanId);
      if (zonesError) throw zonesError;
      setCurrentZones(zonesData);
      const { data: beaconsData, error: beaconsError } = await supabase.from('beacons').select('*').eq('floorplan_id', floorplanId);
      if (beaconsError) throw beaconsError;
      setCurrentBeacons(beaconsData);
      const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*').eq('floorplan_id', floorplanId);
      if (vendorsError) throw vendorsError;
      setCurrentVendors(vendorsData);
      showEditorMessage(`Selected floorplan: ${floorplan.name}`, 'success');
    } catch (err) {
      showEditorMessage("Failed to select floorplan: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showEditorMessage, isSuitableForEditor]);

  const handleFloorplanUploadSuccess = async (imageUrl, dimensions) => {
    if (!currentUser) {
      showEditorMessage("Please sign in to upload a floorplan.", 'warning');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('floorplans')
        .insert({
          name: `New Floorplan ${new Date().toLocaleString()}`,
          image_url: imageUrl,
          dimensions: dimensions,
          scale_meters_per_pixel: 0,
          user_id: currentUser.id
        })
        .select()
        .single();
      if (error) throw error;
      setCurrentFloorplan(data);
      fetchFloorplans(currentUser.id);
      setIsCreatingEvent(false);
      showEditorMessage('Floorplan saved! Now calibrate its scale.', 'success');
    } catch (err) {
      console.error('Error saving floorplan to DB:', err.message);
      showEditorMessage('Failed to save floorplan: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateUploadSuccess = async (imageUrl, dimensions) => {
    if (!currentUser) {
      showEditorMessage("Please sign in to create a template.", 'warning');
      return;
    }
    setLoading(true);
    try {
      const userProvidedName = prompt("Enter a name for your new template:", `New Template - ${new Date().toLocaleDateString()}`);
      if (!userProvidedName) {
        showEditorMessage("Template creation cancelled.", 'info');
        setLoading(false);
        return;
      }
      const { error } = await supabase
        .from('venue_templates')
        .insert({
          template_name: userProvidedName,
          image_url: imageUrl,
          dimensions: dimensions,
          user_id: currentUser.id,
        });
      if (error) throw error;
      showEditorMessage('Venue template created successfully!', 'success');
      await fetchVenueTemplates();
      setIsAddingTemplate(false);
    } catch (err) {
      showEditorMessage('Failed to create venue template: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    if (!currentUser) {
      showEditorMessage("You must be logged in to create an event.", "warning");
      return;
    }
    setLoading(true);
    try {
      const eventName = prompt("Enter a name for your new event:", template.template_name);
      if (!eventName) {
        showEditorMessage("Event creation cancelled.", 'info');
        setLoading(false);
        return;
      }
      const { data: newEvent, error } = await supabase
        .from('floorplans')
        .insert({
          name: eventName,
          image_url: template.image_url,
          dimensions: template.dimensions,
          template_id: template.id,
          user_id: currentUser.id,
          scale_meters_per_pixel: 0,
        })
        .select()
        .single();
      if (error) throw error;
      showEditorMessage(`Event "${newEvent.name}" created successfully!`, 'success');
      await fetchFloorplans(currentUser.id);
      await selectFloorplan(newEvent.id);
      setIsCreatingEvent(false);
    } catch (err) {
      showEditorMessage(`Failed to create event from template: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameFloorplan = async (floorplanId) => {
    const newName = prompt("Enter the new name for the floorplan:");
    if (!newName || newName.trim() === '') {
      showEditorMessage("Rename cancelled or name is empty.", 'warning');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('floorplans').update({ name: newName.trim() }).eq('id', floorplanId);
      if (error) throw error;

      showEditorMessage("Floorplan renamed successfully!", 'success');
      fetchFloorplans(currentUser.id);
      if (currentFloorplan && currentFloorplan.id === floorplanId) {
        setCurrentFloorplan(prev => ({ ...prev, name: newName.trim() }));
      }
    } catch (err) {
      showEditorMessage("Failed to rename floorplan: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFloorplan = async (floorplan) => {
    if (!floorplan) return;
    setLoading(true);
    try {
      const fileName = floorplan.image_url.split('/').pop();
      const { error: storageError } = await supabase.storage.from('floorplans').remove([fileName]);
      if (storageError) {
        console.error("Could not delete storage object, but proceeding with DB deletion:", storageError.message);
      }
      const { error: dbError } = await supabase.from('floorplans').delete().eq('id', floorplan.id);
      if (dbError) throw dbError;
      showEditorMessage(`"${floorplan.name}" deleted successfully.`, 'success');
      if (currentFloorplan && currentFloorplan.id === floorplan.id) {
        setCurrentFloorplan(null);
      }
      fetchFloorplans(currentUser.id);
    } catch (err) {
      showEditorMessage("Failed to delete floorplan: " + err.message, 'error');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleNewNodeOnCanvas = async (newNode) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('nodes').insert({
        ...newNode,
        floorplan_id: currentFloorplan.id,
        user_id: currentUser.id,
      }).select().single();
      if (error) throw error;
      setCurrentNodes(prev => [...prev, data]);
    } catch (err) {
      showEditorMessage('Failed to save node: ' + err.message, 'error');
    }
  };

  const handleNewSegmentOnCanvas = async (newSegment) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('segments').insert({
        start_node_id: newSegment.startNodeId,
        end_node_id: newSegment.endNodeId,
        points: newSegment.points,
        floorplan_id: currentFloorplan.id,
        user_id: currentUser.id,
      }).select().single();
      if (error) throw error;
      setCurrentSegments(prev => [...prev, data]);
    } catch (err) {
      showEditorMessage('Failed to save segment: ' + err.message, 'error');
    }
  };

  const handleNewPoiOnCanvas = async (newPoi) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('pois').insert({
        ...newPoi,
        floorplan_id: currentFloorplan.id,
        user_id: currentUser.id,
      }).select().single();
      if (error) throw error;
      setCurrentPois(prev => [...prev, data]);
    } catch (err) {
      showEditorMessage('Failed to save POI: ' + err.message, 'error');
    }
  };

  const handleNewZoneOnCanvas = async (newZone) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('zones').insert({
        ...newZone,
        floorplan_id: currentFloorplan.id,
        user_id: currentUser.id,
      }).select().single();
      if (error) throw error;
      setCurrentZones(prev => [...prev, data]);
    } catch (err) {
      showEditorMessage('Failed to save zone: ' + err.message, 'error');
    }
  };

  const handleScaleCalibrated = async (scale) => {
    if (!currentFloorplan) return;
    try {
      const { data, error } = await supabase
        .from('floorplans')
        .update({ scale_meters_per_pixel: scale })
        .eq('id', currentFloorplan.id)
        .select()
        .single();
      if (error) throw error;
      setCurrentFloorplan(data);
    } catch (err) {
      showEditorMessage('Failed to save scale: ' + err.message, 'error');
    }
  };

  const handleExportData = () => {
    if (!currentFloorplan) {
      showEditorMessage("No floorplan selected to export.", "warning");
      return;
    }
    const exportData = {
      floorplan: currentFloorplan,
      nodes: currentNodes,
      segments: currentSegments,
      pois: currentPois,
      zones: currentZones,
      vendors: currentVendors,
      export_metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showEditorMessage("Event data exported successfully!", "success");
  };

  const handleSaveGeoreference = async (geoData) => {
    if (!currentFloorplan) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('floorplans')
        .update({ georeference: geoData })
        .eq('id', currentFloorplan.id)
        .select()
        .single();
      if (error) throw error;
      setCurrentFloorplan(data);
      showEditorMessage("Georeference data saved successfully!", 'success');
    } catch (err) {
      showEditorMessage("Failed to save georeference data: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNodeOnCanvas = async (nodeId) => {
    try {
      const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
      if (error) throw error;
      setCurrentNodes(prev => prev.filter(n => n.id !== nodeId));
    } catch (err) {
      showEditorMessage('Failed to delete node: ' + err.message, 'error');
    }
  };

  const handleDeleteSegmentOnCanvas = async (segmentId) => {
    try {
      const { error } = await supabase.from('segments').delete().eq('id', segmentId);
      if (error) throw error;
      setCurrentSegments(prev => prev.filter(s => s.id !== segmentId));
    } catch (err) {
      showEditorMessage('Failed to delete segment: ' + err.message, 'error');
    }
  };

  const handleDeletePoiOnCanvas = async (poiId) => {
    try {
      const { error } = await supabase.from('pois').delete().eq('id', poiId);
      if (error) throw error;
      setCurrentPois(prev => prev.filter(p => p.id !== poiId));
    } catch (err) {
      showEditorMessage('Failed to delete POI: ' + err.message, 'error');
    }
  };

  const handleDeleteZoneOnCanvas = async (zoneId) => {
    try {
      const { error } = await supabase.from('zones').delete().eq('id', zoneId);
      if (error) throw error;
      setCurrentZones(prev => prev.filter(z => z.id !== zoneId));
    } catch (err) {
      showEditorMessage('Failed to delete zone: ' + err.message, 'error');
    }
  };

  const handleBeaconInputChange = (e) => {
    const { name, value } = e.target;
    setNewBeacon(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterBeacon = async (event) => {
    event.preventDefault();
    if (!newBeacon.name || !newBeacon.uuid || !newBeacon.major || !newBeacon.minor) {
      showEditorMessage("Please fill out all beacon fields.", "warning");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('beacons')
        .insert({
          name: newBeacon.name,
          uuid: newBeacon.uuid,
          major: parseInt(newBeacon.major, 10),
          minor: parseInt(newBeacon.minor, 10),
          floorplan_id: currentFloorplan.id,
          user_id: currentUser.id,
        })
        .select()
        .single();
      if (error) throw error;
      setCurrentBeacons(prev => [...prev, data]);
      setNewBeacon({ name: '', uuid: '', major: '', minor: '' });
      showEditorMessage("Beacon registered successfully!", "success");
    } catch (err) {
      showEditorMessage("Failed to register beacon: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (event) => {
    event.preventDefault();
    if (!newVendorName.trim()) {
        showEditorMessage("Please provide a vendor name.", "warning");
        return;
    }
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('vendors')
            .insert({
                name: newVendorName.trim(),
                floorplan_id: currentFloorplan.id,
                user_id: currentUser.id,
            })
            .select()
            .single();
        if (error) throw error;
        setCurrentVendors(prev => [...prev, data]);
        setNewVendorName('');
        showEditorMessage("Vendor pre-registered! Now generate their sign-up link.", "success");
    } catch (err) {
        showEditorMessage("Failed to add vendor: " + err.message, "error");
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateSignupLink = async (vendorId) => {
    setLoading(true);
    setSignupLink('');
    try {
      const token = crypto.randomUUID();
      const { data: updatedVendor, error } = await supabase
        .from('vendors')
        .update({ signup_token: token })
        .eq('id', vendorId)
        .select()
        .single();
      if (error) throw error;
      const signupUrl = `${globalThis.location.origin}/signup?token=${token}`;
      setSignupLink(signupUrl);
      setCurrentVendors(vendors => vendors.map(v => v.id === vendorId ? updatedVendor : v));
      showEditorMessage("Sign-up link generated. Copy and send to the vendor.", 'success');
    } catch (err) {
      showEditorMessage("Failed to generate link: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = (variant, isHovered) => {
    const baseStyle = {
      padding: '8px 16px',
      borderRadius: '8px',
      border: '1px solid transparent',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
      transition: 'all 0.2s ease-in-out'
    };

    switch (variant) {
      case 'primary':
        return { 
          ...baseStyle, 
          background: isHovered ? 'var(--accent-hover)' : 'var(--accent)', 
          color: '#FFFFFF', 
          border: `1px solid ${isHovered ? 'var(--silver-light)' : 'var(--silver-accent)'}`,
          boxShadow: isHovered ? '0 4px 15px rgba(192, 192, 192, 0.3)' : '0 2px 8px rgba(192, 192, 192, 0.2)',
          transform: isHovered ? 'scale(1.03)' : 'scale(1)' 
        };
      case 'danger':
        return { 
          ...baseStyle, 
          background: isHovered ? 'var(--danger-hover)' : 'var(--danger)', 
          color: '#FFFFFF', 
          border: `1px solid ${isHovered ? 'var(--border-hover)' : 'var(--border-color)'}`,
          transform: isHovered ? 'scale(1.03)' : 'scale(1)' 
        };
      case 'secondary':
      default: {
        const isSecondaryHovered = isHovered;
        return {
          ...baseStyle,
          background: isSecondaryHovered ? 'var(--surface)' : 'transparent',
          color: isSecondaryHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderColor: isSecondaryHovered ? 'var(--border-hover)' : 'var(--border-color)',
          transform: isSecondaryHovered ? 'scale(1.03)' : 'scale(1)'
        };
      }
    }
  };

  const getInputStyle = (isSelect = false) => ({
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    transition: 'border-color 0.2s ease-in-out',
    ...(isSelect ? { appearance: 'none' } : {}),
    ':focus': {
      borderColor: 'var(--border-hover)',
      outline: 'none',
      boxShadow: '0 0 0 2px rgba(192, 192, 192, 0.2)'
    }
  });

  if (!currentUser) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '20px'
      }}>
        <div style={{
          padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
        }}>
          <h1 style={{ textAlign: 'center', color: 'var(--accent-solid)', marginBottom: '10px', fontSize: '2rem', fontWeight: 'bold' }}>NavEaze DPM</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0', marginBottom: '30px' }}>
            {isSigningUp ? 'Create a new account' : 'Sign in to your account'}
          </p>
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={getInputStyle()} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={getInputStyle()} />
            </div>

            {isSigningUp && (
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="role" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Your Role</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required style={getInputStyle(true)}>
                  <option value="Venue Owner">Venue Owner</option>
                  <option value="Event Organizer">Event Organizer</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...getButtonStyle('primary', false), width: '100%', padding: '12px', fontSize: '16px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Processing...' : (isSigningUp ? 'Sign Up' : 'Log In')}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button type="button" onClick={() => setIsSigningUp(!isSigningUp)} style={{ background: 'none', border: 'none', color: 'var(--accent-solid)', cursor: 'pointer', textDecoration: 'underline' }}>
              {isSigningUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '95vw', margin: '20px auto', color: 'var(--text-primary)' }}>
      <style>{`
        .switch { position: relative; display: inline-block; width: 60px; height: 34px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
        .slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
        input:checked + .slider { background: var(--accent-solid); }
        input:focus + .slider { box-shadow: 0 0 1px var(--accent-solid); }
        input:checked + .slider:before { transform: translateX(26px); }
        .slider.round { border-radius: 34px; }
        .slider.round:before { border-radius: 50%; }
        @keyframes pulse { 
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } 
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .premium-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent);
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.2), 0 0 10px rgba(255, 215, 0, 0.1); }
          50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.2); }
        }
        .premium-glow {
          animation: glow 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .premium-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)'
      }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', margin: 0, fontWeight: 'bold' }}>NavEaze DPM</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Logged in as <strong style={{ color: 'var(--text-primary)' }}>{currentUser.email}</strong>
            {userRole && ` (${userRole})`}
          </p>
          <button type="button" onClick={handleShowOnboardingHelp} style={getButtonStyle('secondary', hoveredId === 'help-btn')}
            onMouseEnter={() => setHoveredId('help-btn')} onMouseLeave={() => setHoveredId(null)}
            title="View onboarding guide">
            <HelpIcon className="w-4 h-4" />
            Help
          </button>
          <button type="button" onClick={handleLogout} style={getButtonStyle('secondary', hoveredId === 'logout-btn')}
            onMouseEnter={() => setHoveredId('logout-btn')} onMouseLeave={() => setHoveredId(null)}>
            Sign Out
          </button>
        </div>
      </div>

      {!currentFloorplan && (
        <div>
          {userRole === 'Venue Owner' && (
            <div data-onboarding="venue-section" style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              marginBottom: '20px', padding: '10px', background: 'var(--bg-secondary)',
              borderRadius: '12px', border: '1px solid var(--border-color)'
            }}>
              <span style={{ marginRight: '10px', color: 'var(--text-secondary)' }}>View as:</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={dashboardRole === 'Event Organizer'}
                  onChange={() => setDashboardRole(prev => prev === 'Venue Owner' ? 'Event Organizer' : 'Venue Owner')}
                />
                <span className="slider round"></span>
              </label>
              <span style={{ marginLeft: '10px', color: 'var(--text-primary)', fontWeight: '500' }}>
                {dashboardRole === 'Venue Owner' ? 'Venue Owner' : 'Event Organizer'}
              </span>
            </div>
          )}

          {dashboardRole === 'Venue Owner' && (
            <div>
              <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '12px', marginBottom: '30px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                {isAddingTemplate ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '22px', margin: 0, color: 'var(--text-primary)' }}>Upload New Template</h2>
                      <button type="button" onClick={() => setIsAddingTemplate(false)} style={getButtonStyle('secondary', hoveredId === 'cancel-template-btn')}
                        onMouseEnter={() => setHoveredId('cancel-template-btn')} onMouseLeave={() => setHoveredId(null)}>
                        Cancel
                      </button>
                    </div>
                    <ImageUploader onUploadSuccess={handleTemplateUploadSuccess} onMessage={showEditorMessage} />
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '22px', margin: 0, color: 'var(--text-primary)' }}>My Venue Templates</h2>
                      <button type="button" onClick={() => setIsAddingTemplate(true)} style={getButtonStyle('primary', hoveredId === 'new-template-btn')}
                        onMouseEnter={() => setHoveredId('new-template-btn')} onMouseLeave={() => setHoveredId(null)}>
                        Create New Template
                      </button>
                    </div>
                    {loading ? <p>Loading templates...</p> : venueTemplates.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No venue templates found. Create one to get started!</p>
                    ) : (
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                        {venueTemplates.map(template => (
                          <li key={template.id} style={{
                            background: 'var(--bg-secondary)',
                            padding: '15px 20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontWeight: '500'
                          }}>
                            {template.template_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                <h2 style={{ fontSize: '22px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px', color: 'var(--text-primary)' }}>Events Using My Templates</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>A list of events created by organizers using your templates will be displayed here.</p>
              </div>
            </div>
          )}

          {dashboardRole === 'Event Organizer' && (
            <div data-onboarding="events-section">
              {isCreatingEvent ? (
                <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', margin: 0, color: 'var(--text-primary)' }}>Create New Event</h2>
                    <button type="button" onClick={() => setIsCreatingEvent(false)} style={getButtonStyle('secondary', hoveredId === 'cancel-event-btn')}
                      onMouseEnter={() => setHoveredId('cancel-event-btn')} onMouseLeave={() => setHoveredId(null)}>
                      Cancel
                    </button>
                  </div>

                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', color: 'var(--text-primary)' }}>Choose from a Venue Template</h3>
                    {loading ? <p>Loading templates...</p> : availableTemplates.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No venue templates are available right now.</p>
                    ) : (
                      <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                        {availableTemplates.map(template => {
                          const isHovered = hoveredId === `template-${template.id}`;
                          return (
                            <li key={template.id} style={{
                              background: isHovered ? 'var(--accent-solid)' : 'var(--bg-secondary)',
                              padding: '15px 20px', borderRadius: '8px', border: '1px solid var(--border-color)',
                              color: isHovered ? '#FFFFFF' : 'var(--text-primary)',
                              fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease'
                            }}
                              onClick={() => handleSelectTemplate(template)}
                              onMouseEnter={() => setHoveredId(`template-${template.id}`)} onMouseLeave={() => setHoveredId(null)}>
                              {template.template_name}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-primary)', borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>Or Upload Your Own Floorplan</h3>
                    <ImageUploader onUploadSuccess={handleFloorplanUploadSuccess} onMessage={showEditorMessage} />
                  </div>
                </div>

              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', margin: 0 }}>Your Floorplans / Events</h2>
                    <button type="button" onClick={() => setIsCreatingEvent(true)} style={getButtonStyle('primary', hoveredId === 'new-event-btn')}
                      onMouseEnter={() => setHoveredId('new-event-btn')} onMouseLeave={() => setHoveredId(null)}>
                      Create New Event
                    </button>
                  </div>
                  
                  {floorplansList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No events found. Create one to get started!</p>
                    </div>
                  ) : (
                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'grid', gap: '20px' }}>
                      {floorplansList.map(fp => {
                        const isHovered = hoveredId === fp.id;
                        const cardStyle = {
                          background: 'var(--surface)',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          padding: '20px 25px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: isHovered ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                          transition: 'all 0.2s ease-in-out'
                        };
                        return (
                          <li key={fp.id} style={cardStyle} onMouseEnter={() => setHoveredId(fp.id)} onMouseLeave={() => setHoveredId(null)}>
                            <span style={{ fontWeight: '600', fontSize: '18px', color: 'var(--text-primary)' }}>{fp.name}</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button type="button" onClick={() => handleRenameFloorplan(fp.id)} style={getButtonStyle('secondary', hoveredId === `${fp.id}-rename`)}
                                onMouseEnter={() => setHoveredId(`${fp.id}-rename`)} onMouseLeave={() => setHoveredId(fp.id)}>
                                Rename
                              </button>
                              <button type="button" onClick={() => selectFloorplan(fp.id)} style={getButtonStyle('primary', hoveredId === `${fp.id}-edit`)}
                                onMouseEnter={() => setHoveredId(`${fp.id}-edit`)} onMouseLeave={() => setHoveredId(fp.id)}>
                                Edit Map
                              </button>
                              <button type="button" onClick={() => setShowDeleteConfirm(fp)} style={getButtonStyle('danger', hoveredId === `${fp.id}-delete`)}
                                onMouseEnter={() => setHoveredId(`${fp.id}-delete`)} onMouseLeave={() => setHoveredId(fp.id)}>
                                Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {currentFloorplan && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button type="button" onClick={() => { setCurrentFloorplan(null); }} style={getButtonStyle('secondary', hoveredId === 'back-btn')}
              onMouseEnter={() => setHoveredId('back-btn')} onMouseLeave={() => setHoveredId(null)}>
              ← Back to Dashboard
            </button>
            <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Editing: {currentFloorplan.name}</h2>
            <button data-onboarding="export-section" type="button" onClick={handleExportData} style={getButtonStyle('primary', hoveredId === 'export-btn')}
              onMouseEnter={() => setHoveredId('export-btn')} onMouseLeave={() => setHoveredId(null)}>
              Export Data
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.name;
              const tabId = tab.name === 'Vendors / Dynamic Locations' ? 'vendors-tab' : 
                           tab.name === 'Layout' ? 'layout-tab' : 
                           tab.name === 'Settings' ? 'settings-tab' : '';
              const baseStyle = {
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease-in-out',
              };
              const activeStyle = {
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  borderColor: 'var(--text-primary)',
              };
              
              return (
                <button
                  type="button"
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  data-onboarding={tabId}
                  style={{ ...baseStyle, ...(isActive && activeStyle) }}
                >
                  <tab.Icon />
                  {tab.name}
                </button>
              );
            })}
          </div>

          <div style={{ paddingTop: '10px' }}>
  {activeTab === 'Layout' && (
    <div data-onboarding="canvas-area" style={{ padding: '30px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
      <FloorplanCanvas
        floorplanImageUrl={currentFloorplan.image_url}
        currentFloorplan={currentFloorplan}
        pois={currentPois || []}
        nodes={currentNodes || []}
        segments={currentSegments || []}
        zones={currentZones || []}
        isCalibrated={currentFloorplan.scale_meters_per_pixel > 0}
        isGeoreferenced={!!currentFloorplan.georeference}
        onNewNode={handleNewNodeOnCanvas}
        onNewSegment={handleNewSegmentOnCanvas}
        onNewPoi={handleNewPoiOnCanvas}
        onNewZone={handleNewZoneOnCanvas}
        onScaleCalibrated={handleScaleCalibrated}
        onSaveGeoreference={handleSaveGeoreference}
        onDeleteNode={handleDeleteNodeOnCanvas}
        onDeleteSegment={handleDeleteSegmentOnCanvas}
        onDeletePoi={handleDeletePoiOnCanvas}
        onDeleteZone={handleDeleteZoneOnCanvas}
      />
      <div style={{ marginTop: '40px' }}>
        <h3 data-onboarding="beacons-section" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px', fontSize: '20px', color: 'var(--text-primary)' }}>Beacon Management</h3>
        <form onSubmit={handleRegisterBeacon} style={{ marginBottom: '30px' }}>
          <h4 style={{ marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>Register New Beacon</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Name</label>
              <input type="text" name="name" placeholder="e.g., Entrance Beacon" value={newBeacon.name} onChange={handleBeaconInputChange} style={{ ...getInputStyle(), marginBottom: 0 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>UUID</label>
              <input type="text" name="uuid" placeholder="f7826da6-4fa2-4e98-8024-bc5b71e0893e" value={newBeacon.uuid} onChange={handleBeaconInputChange} style={{ ...getInputStyle(), marginBottom: 0 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Major</label>
              <input type="number" name="major" placeholder="100" value={newBeacon.major} onChange={handleBeaconInputChange} style={{ ...getInputStyle(), marginBottom: 0 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Minor</label>
              <input type="number" name="minor" placeholder="1" value={newBeacon.minor} onChange={handleBeaconInputChange} style={{ ...getInputStyle(), marginBottom: 0 }} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...getButtonStyle('primary', hoveredId === 'register-beacon'), marginTop: '20px' }}>
            {loading ? 'Registering...' : 'Register Beacon'}
          </button>
        </form>
        <div>
          <h4 style={{ marginBottom: '20px', fontSize: '18px', color: 'var(--text-primary)' }}>Registered Beacons</h4>
          {currentBeacons.length > 0 ? (
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {currentBeacons.map(beacon => (
                <li key={beacon.id} style={{ background: 'var(--bg-secondary)', padding: '15px 20px', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{beacon.name}</strong><br />
                  <span style={{ fontSize: '14px' }}>UUID: {beacon.uuid} | Major: {beacon.major}, Minor: {beacon.minor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No beacons registered for this floorplan yet.</p>
          )}
        </div>
      </div>
    </div>
  )}

  {activeTab === 'Vendors / Dynamic Locations' && (
    <div data-onboarding="vendors-section" style={{ padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', background: 'linear-gradient(135deg, var(--surface) 0%, rgba(55, 65, 81, 0.9) 100%)' }}>
      
      {/* Vendor Management Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '35px', padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <VendorsIcon className="w-8 h-8" style={{ color: '#3b82f6', marginRight: '15px' }} />
        <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, textAlign: 'center' }}>
          Vendor Management
        </h3>
        <VendorsIcon className="w-8 h-8" style={{ color: '#3b82f6', marginLeft: '15px' }} />
      </div>

      {/* Vendor Registration Form - Enhanced Card */}
      <div style={{ 
        marginBottom: '40px',
        padding: '32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(31, 41, 55, 0.95) 100%)',
        border: '2px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '60px', height: '60px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <StarIcon style={{ color: '#3b82f6', marginRight: '12px', width: '24px', height: '24px' }} />
          <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Pre-register a New Vendor</h4>
        </div>
        
        <form onSubmit={handleAddVendor} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                color: 'var(--text-secondary)', 
                fontSize: '16px', 
                fontWeight: '500',
                letterSpacing: '0.025em'
              }}>Vendor Name</label>
              <input 
                type="text" 
                placeholder="e.g., F's Fantastic Uniforms" 
                value={newVendorName} 
                onChange={(e) => setNewVendorName(e.target.value)} 
                style={{ 
                  ...getInputStyle(), 
                  height: '52px',
                  fontSize: '16px',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  transition: 'all 0.3s ease',
                  ':focus': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                  }
                }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                ...getButtonStyle('primary', hoveredId === 'add-vendor'), 
                height: '52px',
                padding: '0 28px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease',
                transform: hoveredId === 'add-vendor' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={() => setHoveredId('add-vendor')} 
              onMouseLeave={() => setHoveredId(null)}
            >
              <VendorsIcon style={{ width: '18px', height: '18px' }} />
              {loading ? 'Adding...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>

      {/* Vendor List - Enhanced Cards */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
          <ShieldCheckIcon style={{ color: '#3b82f6', marginRight: '12px', width: '24px', height: '24px' }} />
          <h4 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Registered Vendors</h4>
          <div style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <span style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>{currentVendors.length} Total</span>
          </div>
        </div>
        
        {currentVendors.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {currentVendors.map((vendor, index) => {
              const isHovered = hoveredId === `vendor-${vendor.id}`;
              const isRegistered = vendor.is_registered;
              
              return (
                <div 
                  key={vendor.id} 
                  style={{ 
                    background: isRegistered 
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: isRegistered 
                      ? '2px solid rgba(34, 197, 94, 0.3)' 
                      : '2px solid rgba(251, 191, 36, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isHovered 
                      ? '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={() => setHoveredId(`vendor-${vendor.id}`)} 
                  onMouseLeave={() => setHoveredId(null)}
                >
                  
                  {/* Status Badge */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    right: '16px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: isRegistered ? '#22c55e' : '#f59e0b',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}>
                    {isRegistered ? 'ACTIVE' : 'PENDING'}
                  </div>

{/* Vendor Number Badge */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}>
                    {index + 1}
                  </div>

                  {/* Decorative glow */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-50%', 
                    left: '-50%', 
                    width: '200%', 
                    height: '200%', 
                    background: isRegistered 
                      ? 'radial-gradient(circle, rgba(34, 197, 94, 0.03) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(251, 191, 36, 0.03) 0%, transparent 70%)',
                    animation: isHovered ? 'pulse 2s infinite' : 'none'
                  }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginTop: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <VendorsIcon style={{ color: '#3b82f6', marginRight: '8px', width: '20px', height: '20px' }} />
                        <h5 style={{ 
                          margin: 0, 
                          fontSize: '20px', 
                          fontWeight: 'bold', 
                          color: 'var(--text-primary)',
                          letterSpacing: '0.025em'
                        }}>{vendor.name}</h5>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isRegistered ? (
                          <ShieldCheckIcon style={{ color: '#22c55e', width: '16px', height: '16px' }} />
                        ) : (
                          <StarIcon style={{ color: '#f59e0b', width: '16px', height: '16px' }} />
                        )}
                        <span style={{ 
                          fontSize: '14px', 
                          color: isRegistered ? '#22c55e' : '#f59e0b',
                          fontWeight: '600',
                          letterSpacing: '0.025em'
                        }}>
                          {isRegistered ? `Registered • ${vendor.email}` : 'Awaiting Registration'}
                        </span>
                      </div>
                    </div>
                    
                    {!isRegistered && (
                      <button 
                        type="button" 
                        onClick={() => handleGenerateSignupLink(vendor.id)} 
                        style={{ 
                          padding: '10px 20px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease',
                          transform: hoveredId === `link-${vendor.id}` ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={() => setHoveredId(`link-${vendor.id}`)} 
                        onMouseLeave={() => setHoveredId(`vendor-${vendor.id}`)}
                      >
                        <LinkIcon style={{ width: '16px', height: '16px' }} />
                        Generate Invite
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 40px',
            borderRadius: '16px',
            border: '2px dashed rgba(59, 130, 246, 0.3)',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
            position: 'relative'
          }}>
            <VendorsIcon style={{ color: 'rgba(59, 130, 246, 0.5)', width: '48px', height: '48px', marginBottom: '16px' }} />
            <h4 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>No Vendors Yet</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>Start building your vendor network</p>
          </div>
        )}
      </div>

      {/* Vendor Signup Link Modal */}
      {signupLink && (
        <div style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--surface) 0%, rgba(31, 41, 55, 0.95) 100%)',
            padding: '40px',
            borderRadius: '20px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(59, 130, 246, 0.1)',
            width: '90%',
            maxWidth: '600px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
            
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <LinkIcon style={{ color: '#3b82f6', width: '32px', height: '32px', marginRight: '12px' }} />
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Vendor Invitation Link</h3>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
                Share this invitation link with your vendor
              </p>
              
              <div style={{ 
                background: 'rgba(17, 24, 39, 0.8)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                marginBottom: '24px'
              }}>
                <input 
                  type="text" 
                  readOnly 
                  value={signupLink} 
                  style={{ 
                    ...getInputStyle(), 
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    border: 'none',
                    background: 'transparent',
                    color: '#3b82f6'
                  }} 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => { 
                    navigator.clipboard.writeText(signupLink); 
                    showEditorMessage('Invitation link copied to clipboard!', 'success'); 
                  }} 
                  style={{ 
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <LinkIcon style={{ width: '18px', height: '18px' }} />
                  Copy Link
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setSignupLink('')} 
                  style={{ 
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )}
  
  {activeTab === 'Settings' && (
    <div style={{ padding: '40px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', textAlign: 'center', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>Future settings, such as privacy and collaboration options, will be configured here.</p>
    </div>
  )}
</div>

          {isQrModalOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
              justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
              <div style={{
                background: 'var(--surface)', padding: '40px',
                borderRadius: '12px', border: '1px solid var(--border-color)',
                textAlign: 'center', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
              }}>
                <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>QR Code for {JSON.parse(qrCodeValue).vendorName}</h2>
                <div style={{ padding: '20px', background: 'white', display: 'inline-block', borderRadius: '8px' }}>
                  <QRCode value={qrCodeValue} size={256} />
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>
                  Vendor should scan this code at their assigned location to confirm their presence.
                </p>
                <button type="button" onClick={() => setIsQrModalOpen(false)} style={{ ...getButtonStyle('primary', hoveredId === 'close-qr-btn'), marginTop: '20px' }}
                  onMouseEnter={() => setHoveredId('close-qr-btn')} onMouseLeave={() => setHoveredId(null)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0, 0, 0, 0.5)', display: 'flex',
              justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
              <div style={{
                background: 'var(--surface)', padding: '30px', borderRadius: '12px',
                width: '100%', maxWidth: '400px', textAlign: 'center',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
              }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>Are you sure?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
                  You are about to delete "{showDeleteConfirm.name}". This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                  <button type="button" onClick={() => setShowDeleteConfirm(null)} style={getButtonStyle('secondary', hoveredId === 'cancel-delete')}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => handleDeleteFloorplan(showDeleteConfirm)} style={getButtonStyle('danger', hoveredId === 'confirm-delete')}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Help Onboarding Flow */}
      {currentUser && showOnboardingHelp && (
        <OnboardingFlow
          currentUser={currentUser}
          onComplete={handleOnboardingHelpComplete}
          onSkip={handleOnboardingHelpComplete}
        />
      )}

      {/* Screen Size Restriction Modal */}
      {showScreenSizeRestriction && (
        <ScreenSizeRestriction
          onClose={() =>  setShowScreenSizeRestriction(false)}
          currentWidth={width}
          currentHeight={height}
        />
      )}
    </div>
  );
};

export default  FloorplanEditor;