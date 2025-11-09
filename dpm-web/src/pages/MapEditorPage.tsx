import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Upload,
  Pointer,
  MoveHorizontal,
  Circle,
  Pencil,
  Trash2,
  Pin,
  Share2,
  Save,
  Settings,
  Eye,
  EyeOff,
  MapPin,
  Move,
  Plus,
  FileText,
  LogOut,
  HelpCircle,
  Layout,
  Star,
  ShieldCheck,
  Link,
  Crown,
  LayoutDashboard,
} from "lucide-react";
import { FloorplanCanvas } from "@/components/FloorplanCanvas";
import { ImageUploader } from "@/components/ImageUploader";
// Temporarily disable screen-size gating for development/debugging.
// import { useScreenSize } from "@/hooks/useScreenSize";
// import ScreenSizeRestriction from "@/components/ScreenSizeRestriction";
import OnboardingFlow from "@/components/OnboardingFlow";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { default as QRCode } from "react-qr-code";
import { saveAs } from 'file-saver';


type DrawingMode = "select" | "pan" | "nodes" | "segments" | "pois" | "zones" | 'poi' | 'path' | null;

const tools = [
  { id: 'poi' as DrawingMode, label: 'Add POI', icon: MapPin, description: 'Click to add points of interest'  },
  { id: 'path' as DrawingMode, label: 'Draw Path', icon: Move, description: 'Draw navigation paths'  }
];

const MapEditorPage = () => {
  const { user: currentUser } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // State from FloorplanEditor.jsx
  const [drawingMode, setDrawingMode] = useState<DrawingMode | null>(null);
  const [currentFloorplan, setCurrentFloorplan] = useState<any>(null);
  const [currentNodes, setCurrentNodes] = useState<any[]>([]);
  const [currentSegments, setCurrentSegments] = useState<any[]>([]);
  const [currentPois, setCurrentPois] = useState<any[]>([]);
  const [currentZones, setCurrentZones] = useState<any[]>([]);
  const [currentBeacons, setCurrentBeacons] = useState<any[]>([]);
  const [newBeacon, setNewBeacon] = useState({ name: '', uuid: '', major: '', minor: '' });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [floorplansList, setFloorplansList] = useState<any[]>([]);
  const [venueTemplates, setVenueTemplates] = useState<any[]>([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [currentVendors, setCurrentVendors] = useState<any[]>([]);
  const [newVendorName, setNewVendorName] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [activeTab, setActiveTab] = useState('Layout');
  const [dashboardRole, setDashboardRole] = useState<'Venue Owner' | 'Event Organizer'>('Event Organizer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Venue Owner');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [signupLink, setSignupLink] = useState('');
  const [showOnboardingHelp, setShowOnboardingHelp] = useState(false);
  // Screen-size gating temporarily disabled to avoid blocking the editor in dev/test.
  // Keep the state var for now so other code paths remain unchanged.
  const [showScreenSizeRestriction, setShowScreenSizeRestriction] = useState(false);
  // Stub values (force-editor enabled)
  const width = 1024;
  const height = 768;
  const isSuitableForEditor = true;
  const [editorMessage, setEditorMessage] = useState({ text: '', type: '' });
  const [quicketEventId, setQuicketEventId] = useState('');


  // Logic from FloorplanEditor.jsx
  const showEditorMessage = useCallback((text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    console.log(`[${type.toUpperCase()}]: ${text}`);
    setEditorMessage({ text, type });
    setTimeout(() => setEditorMessage({ text: '', type: '' }), 5000);
  }, []);

  useEffect(() => {
    if (currentFloorplan) {
      setQuicketEventId(currentFloorplan.quicket_event_id || '');
    }
  }, [currentFloorplan]);

  const handleSaveQuicketId = async () => {
    if (!currentFloorplan) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ quicket_event_id: quicketEventId })
        .eq('id', currentFloorplan.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentFloorplan(data);
      showEditorMessage('Quicket Event ID saved successfully!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to save Quicket Event ID: ' + err.message, 'error');
    }
  };

  const handleSyncQuicketAttendees = async () => {
    if (!currentFloorplan?.quicket_event_id) {
      showEditorMessage('Please save a Quicket Event ID before syncing.', 'warning');
      return;
    }
    try {
      showEditorMessage('Syncing with Quicket... This may take a moment.', 'info');
      const { error } = await supabase.functions.invoke('import-quicket-attendees', {
        body: { eventId: currentFloorplan.id }
      });
      if (error) throw error;
      showEditorMessage('Successfully synced attendees from Quicket!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to sync with Quicket: ' + err.message, 'error');
    }
  };

  const handleDownloadQrCode = () => {
    const svg = document.getElementById("event-qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `event-qr-${currentFloorplan.id}.png`);
          }
        });
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const fetchVenueTemplates = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_templates')
        .select('*')
        .eq('user_id', (currentUser as any).id);
      if (error) throw error;
      setVenueTemplates(data);
    } catch (err: any) {
      showEditorMessage('Failed to fetch venue templates: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showEditorMessage]);

  const fetchAllVenueTemplates = useCallback(async () => {
    if (!currentUser) return; // guard to avoid anon requests that cause 401 during dev
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_templates')
        .select('*');
      if (error) throw error;
      setAvailableTemplates(data);
    } catch (err: any) {
      showEditorMessage('Failed to fetch available templates: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showEditorMessage]);

  const fetchFloorplans = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', (currentUser as any).id);
      if (error) throw error;
      setFloorplansList(data);
    } catch (err: any) {
      showEditorMessage('Failed to fetch floorplans: ' + err.message, 'error');
    }
  }, [currentUser, showEditorMessage]);

  const selectFloorplan = async (floorplanId: string) => {
    try {
      setLoading(true);
      const { data: floorplanData, error: floorplanError } = await supabase
        .from('events')
        .select('*')
        .eq('id', floorplanId)
        .single();
      if (floorplanError) throw floorplanError;
      setCurrentFloorplan(floorplanData);

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

      const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*').eq('floorplan_id', floorplanId);
      if (vendorsError) throw vendorsError;
      setCurrentVendors(vendorsData);

      const { data: beaconsData, error: beaconsError } = await supabase.from('beacons').select('*').eq('floorplan_id', floorplanId);
      if (beaconsError) throw beaconsError;
      setCurrentBeacons(beaconsData);
    } catch (err: any) {
      showEditorMessage('Failed to load floorplan details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFloorplanUploadSuccess = async (newFloorplan: any) => {
    setFloorplansList(prev => [...prev, newFloorplan]);
    // navigate to editor route so the page loads via URL and state is consistent
    navigate(`/map-editor/${newFloorplan.id}`);
    setIsCreatingEvent(false);
    showEditorMessage('Floorplan uploaded successfully!', 'success');
  };

  const handleTemplateUploadSuccess = (newTemplate: any) => {
    setVenueTemplates(prev => [...prev, newTemplate]);
    setIsAddingTemplate(false);
    showEditorMessage('Template uploaded successfully!', 'success');
  };

  const handleSelectTemplate = async (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    if (!template || !currentUser) return;

    try {
      const { data: newFloorplan, error } = await supabase.rpc('create_event_from_template', {
        template_id: template.id,
        user_id: (currentUser as any).id,
        event_name: `${template.name} Event`
      });

      if (error) throw error;

      await fetchFloorplans();
      showEditorMessage('New event created from template!', 'success');
      setIsCreatingEvent(false);
    } catch (err: any) {
      showEditorMessage('Failed to create event from template: ' + err.message, 'error');
    }
  };

  const handleRenameFloorplan = async (floorplanId: string, newName: string) => {
    if (!newName || newName.trim() === '' || newName.trim() === currentFloorplan?.name) {
      return; // No change or empty name
    }
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ name: newName.trim() })
        .eq('id', floorplanId)
        .select()
        .single();
      if (error) throw error;
      setFloorplansList(prev => prev.map(fp => fp.id === floorplanId ? data : fp));
      if (currentFloorplan && currentFloorplan.id === floorplanId) {
        setCurrentFloorplan(data);
      }
      showEditorMessage('Floorplan renamed!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to rename floorplan: ' + err.message, 'error');
    }
  };

  const handleDeleteFloorplan = async (floorplan: any) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', floorplan.id);
      if (error) throw error;
      setFloorplansList(prev => prev.filter(fp => fp.id !== floorplan.id));
      if (currentFloorplan && currentFloorplan.id === floorplan.id) {
        setCurrentFloorplan(null);
      }
      setShowDeleteConfirm(null);
      showEditorMessage('Floorplan deleted.', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to delete floorplan: ' + err.message, 'error');
    }
  };

  const handleNewNodeOnCanvas = async (newNode: any) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('nodes').insert({
        ...newNode,
        floorplan_id: currentFloorplan.id,
        user_id: (currentUser as any).id,
      }).select().single();
      if (error) throw error;
      setCurrentNodes(prev => [...prev, data]);
    } catch (err: any) {
      showEditorMessage('Failed to save node: ' + err.message, 'error');
    }
  };

  const handleNewSegmentOnCanvas = async (newSegment: any) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('segments').insert({
        ...newSegment,
        floorplan_id: currentFloorplan.id,
        user_id: (currentUser as any).id,
      }).select().single();
      if (error) throw error;
      setCurrentSegments(prev => [...prev, data]);
    } catch (err: any) {
      showEditorMessage('Failed to save segment: ' + err.message, 'error');
    }
  };

  const handleNewPoiOnCanvas = async (newPoi: any) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('pois').insert({
        ...newPoi,
        floorplan_id: currentFloorplan.id,
        user_id: (currentUser as any).id,
      }).select().single();
      if (error) throw error;
      setCurrentPois(prev => [...prev, data]);
    } catch (err: any) {
      showEditorMessage('Failed to save POI: ' + err.message, 'error');
    }
  };

  const handleNewZoneOnCanvas = async (newZone: any) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('zones').insert({
        ...newZone,
        floorplan_id: currentFloorplan.id,
        user_id: (currentUser as any).id,
      }).select().single();
      if (error) throw error;
      setCurrentZones(prev => [...prev, data]);
    } catch (err: any) {
      showEditorMessage('Failed to save zone: ' + err.message, 'error');
    }
  };

    const handleScaleCalibrated = async (scale: number) => {
    if (!currentFloorplan) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ scale_meters_per_pixel: scale })
        .eq('id', currentFloorplan.id)
        .select()
        .single();
      if (error) throw error;
      setCurrentFloorplan(data);
      showEditorMessage('Scale calibrated and saved!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to save scale: ' + err.message, 'error');
    }
  };

  const handleSaveGeoreference = async (geoData: any) => {
    if (!currentFloorplan) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ georeference_data: geoData })
        .eq('id', currentFloorplan.id)
        .select()
        .single();
      if (error) throw error;
      setCurrentFloorplan(data);
      showEditorMessage("Georeference data saved successfully!", 'success');
    } catch (err: any) {
      showEditorMessage("Failed to save georeference data: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNodeOnCanvas = async (nodeId: string) => {
    try {
      const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
      if (error) throw error;
      setCurrentNodes(prev => prev.filter(n => n.id !== nodeId));
    } catch (err: any) {
      showEditorMessage('Failed to delete node: ' + err.message, 'error');
    }
  };

  const handleDeleteSegmentOnCanvas = async (segmentId: string) => {
    try {
      const { error } = await supabase.from('segments').delete().eq('id', segmentId);
      if (error) throw error;
      setCurrentSegments(prev => prev.filter(s => s.id !== segmentId));
    } catch (err: any) {
      showEditorMessage('Failed to delete segment: ' + err.message, 'error');
    }
  };

  const handleDeletePoiOnCanvas = async (poiId: string) => {
    try {
      const { error } = await supabase.from('pois').delete().eq('id', poiId);
      if (error) throw error;
      setCurrentPois(prev => prev.filter(p => p.id !== poiId));
    } catch (err: any) {
      showEditorMessage('Failed to delete POI: ' + err.message, 'error');
    }
  };

  const handleDeleteZoneOnCanvas = async (zoneId: string) => {
    try {
      const { error } = await supabase.from('zones').delete().eq('id', zoneId);
      if (error) throw error;
      setCurrentZones(prev => prev.filter(z => z.id !== zoneId));
    } catch (err: any) {
      showEditorMessage('Failed to delete zone: ' + err.message, 'error');
    }
  };

  const handleDeleteBeacon = async (beaconId: string) => {
    try {
      const { error } = await supabase.from('beacons').delete().eq('id', beaconId);
      if (error) throw error;
      setCurrentBeacons(prev => prev.filter(b => b.id !== beaconId));
      showEditorMessage('Beacon deleted successfully!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to delete beacon: ' + err.message, 'error');
    }
  };

  const handleBeaconInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBeacon(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterBeacon = async () => {
    if (!currentFloorplan || !newBeacon.name || !newBeacon.uuid) {
      showEditorMessage('Beacon name and UUID are required.', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.from('beacons').insert({
        ...newBeacon,
        floorplan_id: currentFloorplan.id,
      }).select().single();
      if (error) throw error;
      setCurrentBeacons(prev => [...prev, data]);
      setNewBeacon({ name: '', uuid: '', major: '', minor: '' });
      showEditorMessage('Beacon registered successfully!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to register beacon: ' + err.message, 'error');
    }
  };

  const handleAddVendor = async () => {
    if (!currentFloorplan || !newVendorName.trim()) {
      showEditorMessage('Vendor name is required.', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.from('vendors').insert({
        name: newVendorName.trim(),
        floorplan_id: currentFloorplan.id,
      }).select().single();
      if (error) throw error;
      setCurrentVendors(prev => [...prev, data]);
      setNewVendorName('');
      showEditorMessage('Vendor added successfully!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to add vendor: ' + err.message, 'error');
    }
  };

  const handleGenerateSignupLink = async (vendorId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('vendor-signup', {
        body: { vendorId }
      });
      if (error) throw error;
      setSignupLink(data.signupLink);
      setIsQrModalOpen(true);
      setQrCodeValue(data.signupLink);
    } catch (err: any) {
      showEditorMessage('Failed to generate signup link: ' + err.message, 'error');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    showEditorMessage("Signed out successfully!", 'success');
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

  const handleShowOnboardingHelp = () => {
    setShowOnboardingHelp(true);
  };

  const handleOnboardingHelpComplete = () => {
    setShowOnboardingHelp(false);
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (currentUser as any).id)
          .single();
        if (data) {
          setUserRole(data.role);
          setDashboardRole(data.role);
        }
      }
    };
    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (dashboardRole === 'Event Organizer') {
        fetchFloorplans();
        fetchAllVenueTemplates();
      }
      if (dashboardRole === 'Venue Owner') {
        fetchVenueTemplates();
      }
    }
  }, [currentUser, dashboardRole, fetchFloorplans, fetchAllVenueTemplates, fetchVenueTemplates]);

  useEffect(() => {
    if (eventId) {
      selectFloorplan(eventId);
    } else {
      setCurrentFloorplan(null);
    }
  }, [eventId]);

  // Screen-size restriction useEffect intentionally removed while feature is disabled.

  useEffect(() => {
    if (!currentFloorplan) return;
    const channel = supabase
      .channel(`pois-for-floorplan-${currentFloorplan.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pois', filter: `floorplan_id=eq.${currentFloorplan.id}` },
        (payload: any) => {
          console.log('Real-time POI update received!', payload.new);
          setCurrentPois((prevPois) => prevPois.map((poi) => poi.id === payload.new.id ? { ...poi, is_active: payload.new.is_active, last_pinged_at: payload.new.last_pinged_at } : poi));
          showEditorMessage(`Location '${payload.new.name}' is now active!`, 'success');
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentFloorplan, showEditorMessage]);


  // ScreenSizeRestriction is disabled for now so the editor/dashboard render consistently.

  if (showOnboardingHelp) {
    return <OnboardingFlow onComplete={() => setShowOnboardingHelp(false)} />;
  }

  const renderDashboard = () => (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          {/* Replace with your logo if you have one */}
          <LayoutDashboard className="h-8 w-8 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 hidden md:inline">Welcome, {currentUser?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleShowOnboardingHelp}><HelpCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
        {userRole === 'Venue Owner' && (
          <div className="flex items-center justify-center mb-6">
            <Label htmlFor="role-switch" className="mr-3 font-semibold">Event Organizer</Label>
            <Switch
              id="role-switch"
              checked={dashboardRole === 'Venue Owner'}
              onCheckedChange={(checked) => setDashboardRole(checked ? 'Venue Owner' : 'Event Organizer')}
            />
            <Label htmlFor="role-switch" className="ml-3 font-semibold">Venue Owner</Label>
          </div>
        )}

        {/* Venue Owner Dashboard */}
        {dashboardRole === 'Venue Owner' ? (
          <Card>
            <CardHeader>
              <CardTitle>My Venue Templates</CardTitle>
              <CardDescription>Manage your reusable venue layouts.</CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingTemplate ? (
                <div>
                  <h3 className="font-semibold mb-2">Upload New Venue Template</h3>
                  <ImageUploader onUploadSuccess={handleTemplateUploadSuccess} onMessage={showEditorMessage} userId={(currentUser as any).id} isVenueTemplate={true} />
                  <Button variant="outline" className="mt-2" onClick={() => setIsAddingTemplate(false)}>Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => setIsAddingTemplate(true)}><Plus className="mr-2 h-4 w-4" /> Add New Template</Button>
              )}
              <div className="mt-4 space-y-2">
                {venueTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <FileText className="mr-2" />
                    <span className="flex-grow">{template.name}</span>
                    {/* Add rename/delete for templates if needed */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Event Organizer Dashboard */
          <Card>
            <CardHeader>
              <CardTitle>My Events</CardTitle>
              <CardDescription>Create a new event or edit an existing one.</CardDescription>
            </CardHeader>
            <CardContent>
              {isCreatingEvent ? (
                <div>
                  <h3 className="font-semibold mb-2">Create New Event</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">From a Template</h4>
                      <Select onValueChange={handleSelectTemplate}>
                        <SelectTrigger><SelectValue placeholder="Select a venue template" /></SelectTrigger>
                        <SelectContent>
                          {availableTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">From Scratch</h4>
                      <ImageUploader onUploadSuccess={handleFloorplanUploadSuccess} onMessage={showEditorMessage} userId={(currentUser as any).id} />
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4" onClick={() => setIsCreatingEvent(false)}>Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => {
                  console.log('Create New Event button clicked');
                  setIsCreatingEvent(true);
                }}><Plus className="mr-2 h-4 w-4" /> Create New Event</Button>
              )}
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold">Existing Events</h3>
                {floorplansList.map(fp => (
                  <div key={fp.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                    <span className="font-medium">{fp.name}</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const newName = prompt("Enter new floorplan name:", fp.name);
                        if (newName) {
                          handleRenameFloorplan(fp.id, newName);
                        }
                      }}><Pencil className="h-4 w-4 mr-1" /> Rename</Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/map-editor/${fp.id}`)}><Layout className="h-4 w-4 mr-1" /> Edit</Button>
                      <Dialog open={showDeleteConfirm === fp.id} onOpenChange={(isOpen) => !isOpen && setShowDeleteConfirm(null)}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(fp.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Are you sure?</DialogTitle></DialogHeader>
                          <p>This will permanently delete the event "{fp.name}". This action cannot be undone.</p>
                          <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button variant="destructive" onClick={() => handleDeleteFloorplan(fp)}>Yes, Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );

  const renderEditor = () => (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Editor</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
              <Tabs defaultValue="Layout" className="w-full">
                <TabsList>
                  <TabsTrigger value="Layout">Layout</TabsTrigger>
                  <TabsTrigger value="Vendors">Vendors</TabsTrigger>
                  <TabsTrigger value="Beacons">Beacons</TabsTrigger>
                  <TabsTrigger value="Settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="Layout">
                  <FloorplanCanvas
                    ref={canvasRef}
                    floorplan={currentFloorplan}
                    nodes={currentNodes}
                    segments={currentSegments}
                    pois={currentPois}
                    zones={currentZones}
                    drawingMode={drawingMode}
                    onNewNode={handleNewNodeOnCanvas}
                    onNewSegment={handleNewSegmentOnCanvas}
                    onNewPoi={handleNewPoiOnCanvas}
                    onNewZone={handleNewZoneOnCanvas}
                    onDeleteNode={handleDeleteNodeOnCanvas}
                    onDeleteSegment={handleDeleteSegmentOnCanvas}
                    onDeletePoi={handleDeletePoiOnCanvas}
                    onDeleteZone={handleDeleteZoneOnCanvas}
                    onScaleCalibrated={handleScaleCalibrated}
                    onSaveGeoreference={handleSaveGeoreference}
                  />
                </TabsContent>
                <TabsContent value="Vendors">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Input
                          value={newVendorName}
                          onChange={(e) => setNewVendorName(e.target.value)}
                          placeholder="New vendor name"
                        />
                        <Button onClick={handleAddVendor}>Add</Button>
                      </div>
                      <div className="mt-4 space-y-2">
                        {currentVendors.map(vendor => (
                          <div key={vendor.id} className="flex items-center justify-between p-2 border rounded-md">
                            <span>{vendor.name}</span>
                            <Button size="sm" onClick={() => handleGenerateSignupLink(vendor.id)}>
                              <Link className="mr-2 h-4 w-4" />
                              Get Link
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="Beacons">
                  <Card>
                    <CardHeader>
                      <CardTitle>Beacon Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <Input name="name" value={newBeacon.name} onChange={handleBeaconInputChange} placeholder="Name" />
                        <Input name="uuid" value={newBeacon.uuid} onChange={handleBeaconInputChange} placeholder="UUID" />
                        <Input name="major" value={newBeacon.major} onChange={handleBeaconInputChange} placeholder="Major" />
                        <Input name="minor" value={newBeacon.minor} onChange={handleBeaconInputChange} placeholder="Minor" />
                      </div>
                      <Button onClick={handleRegisterBeacon} className="mt-4 w-full">Register</Button>
                      <div className="mt-4 space-y-2">
                        {currentBeacons.map((beacon) => (
                          <div key={beacon.id} className="flex items-center justify-between p-2 border-b">
                            <div>
                              <p className="font-semibold">{beacon.name}</p>
                              <p className="text-xs text-gray-500">{beacon.uuid}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteBeacon(beacon.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="Settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Settings</CardTitle>
                      <CardDescription>Manage your event details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="eventName">Event Name</Label>
                        <div className="flex space-x-2">
                          <Input id="eventName" defaultValue={currentFloorplan?.name} onBlur={(e) => handleRenameFloorplan(currentFloorplan.id, e.target.value)} />
                        </div>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Quicket Integration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="quicketId">Quicket Event ID</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="quicketId"
                                placeholder="Enter Quicket Event ID"
                                value={quicketEventId}
                                onChange={(e) => setQuicketEventId(e.target.value)}
                              />
                              <Button onClick={handleSaveQuicketId}>Save</Button>
                            </div>
                          </div>
                          <Button onClick={handleSyncQuicketAttendees} className="w-full" disabled={!quicketEventId}>
                            <Link className="mr-2 h-4 w-4" /> Sync Attendees
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Event Map QR Code</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 flex flex-col items-center">
                          <div className="bg-white p-4 rounded-md">
                            <QRCode id="event-qr-code" value={`${window.location.origin}/event/${currentFloorplan?.id}/map`} size={128} />
                          </div>
                          <Button onClick={handleDownloadQrCode} className="w-full">
                            Download QR Code
                          </Button>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <Label>Danger Zone</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you sure?</DialogTitle>
                            </DialogHeader>
                            <p>This will permanently delete the event and all its associated data. This action cannot be undone.</p>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button variant="destructive" onClick={() => handleDeleteFloorplan(currentFloorplan)}>
                                Yes, delete it
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vendor Signup Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <QRCode value={qrCodeValue} size={256} />
            <p className="mt-4 text-sm text-center break-all">{qrCodeValue}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => navigator.clipboard.writeText(qrCodeValue)}>Copy Link</Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return currentFloorplan ? renderEditor() : renderDashboard();
};

export default MapEditorPage;