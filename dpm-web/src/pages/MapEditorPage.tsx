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
} from "lucide-react";
import { FloorplanCanvas } from "@/components/FloorplanCanvas";
import { ImageUploader } from "@/components/ImageUploader";
import { useScreenSize } from "@/hooks/useScreenSize";
import ScreenSizeRestriction from "@/components/ScreenSizeRestriction";
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
import QRCode from "react-qr-code";


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
  const [showScreenSizeRestriction, setShowScreenSizeRestriction] = useState(false);
  const { width, height, isSuitableForEditor } = useScreenSize();
  const [editorMessage, setEditorMessage] = useState({ text: '', type: '' });


  // Logic from FloorplanEditor.jsx
  const showEditorMessage = useCallback((text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    console.log(`[${type.toUpperCase()}]: ${text}`);
    setEditorMessage({ text, type });
    setTimeout(() => setEditorMessage({ text: '', type: '' }), 5000);
  }, []);

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
    } catch (err: any) {
      showEditorMessage('Failed to load floorplan details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFloorplanUploadSuccess = async (newFloorplan: any) => {
    setFloorplansList(prev => [...prev, newFloorplan]);
    selectFloorplan(newFloorplan.id);
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

  const handleRenameFloorplan = async (floorplanId: string) => {
    const newName = prompt("Enter new floorplan name:");
    if (newName && newName.trim() !== '') {
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

  useEffect(() => {
    setShowScreenSizeRestriction(!isSuitableForEditor);
  }, [isSuitableForEditor]);

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


  if (showScreenSizeRestriction) {
    return <ScreenSizeRestriction />;
  }

  if (showOnboardingHelp) {
    return <OnboardingFlow onComplete={() => setShowOnboardingHelp(false)} />;
  }

  const renderDashboard = () => (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="Logo" className="h-8" />
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Welcome, {currentUser?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleShowOnboardingHelp}><HelpCircle className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Label htmlFor="role-switch" className={dashboardRole === 'Venue Owner' ? 'font-bold' : ''}>Venue Owner</Label>
          <Switch
            id="role-switch"
            checked={dashboardRole === 'Event Organizer'}
            onCheckedChange={(checked) => setDashboardRole(checked ? 'Event Organizer' : 'Venue Owner')}
          />
          <Label htmlFor="role-switch" className={dashboardRole === 'Event Organizer' ? 'font-bold' : ''}>Event Organizer</Label>
        </div>

        {dashboardRole === 'Venue Owner' ? (
          <Card>
            <CardHeader>
              <CardTitle>My Venue Templates</CardTitle>
              <CardDescription>Manage your reusable venue layouts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsAddingTemplate(true)}><Plus className="mr-2 h-4 w-4" /> Upload New Template</Button>
              {isAddingTemplate && (
                <div className="mt-4">
                  <ImageUploader
                    onUploadSuccess={handleTemplateUploadSuccess}
                    uploadParams={{ type: 'venue_template', user_id: (currentUser as any).id }}
                  />
                </div>
              )}
              <div className="mt-4 space-y-2">
                {venueTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{template.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>My Events</CardTitle>
              <CardDescription>Create and manage your events.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsCreatingEvent(true)}><Plus className="mr-2 h-4 w-4" /> Create New Event</Button>
              {isCreatingEvent && (
                <div className="mt-4 p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Choose a method:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>From a Venue Template</Label>
                      <Select onValueChange={handleSelectTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Upload a Floorplan Image</Label>
                      <ImageUploader
                        onUploadSuccess={handleFloorplanUploadSuccess}
                        uploadParams={{ type: 'event_floorplan', user_id: (currentUser as any).id }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 space-y-3">
                {floorplansList.map(fp => (
                  <div
                    key={fp.id}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    onMouseEnter={() => setHoveredId(fp.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span className="font-medium text-gray-700">{fp.name}</span>
                    <div className="flex items-center space-x-2">
                      {hoveredId === fp.id && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleRenameFloorplan(fp.id)}>Rename</Button>
                          <Button variant="default" size="sm" onClick={() => navigate(`/events/${fp.id}`)}>Edit</Button>
                          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(fp.id)}>Delete</Button>
                        </>
                      )}
                    </div>
                    {showDeleteConfirm === fp.id && (
                      <Dialog open onOpenChange={() => setShowDeleteConfirm(null)}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                          </DialogHeader>
                          <p>This will permanently delete the floorplan "{fp.name}". This action cannot be undone.</p>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => handleDeleteFloorplan(fp)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
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
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-2 border-b bg-card">
          <Button variant="ghost" onClick={() => navigate('/events')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-lg font-semibold">{currentFloorplan?.name}</h1>
          <div>
            <Button variant="outline" onClick={handleExportData} className="mr-2">
              <FileText className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </header>

        <main className="flex-1 flex">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex">
            <TabsList className="flex flex-col h-full p-2 border-r bg-card">
              <TabsTrigger value="Layout"><Layout className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="Vendors"><Star className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="Beacons"><ShieldCheck className="h-5 w-5" /></TabsTrigger>
              <TabsTrigger value="Settings"><Settings className="h-5 w-5" /></TabsTrigger>
            </TabsList>

            <TabsContent value="Layout" className="flex-1 p-4">
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

            <TabsContent value="Vendors" className="flex-1 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Management</CardTitle>
                  <CardDescription>Add and manage vendors for this event.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      placeholder="New vendor name"
                    />
                    <Button onClick={handleAddVendor}>Add Vendor</Button>
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

            <TabsContent value="Beacons" className="flex-1 p-4">
               <Card>
                <CardHeader>
                  <CardTitle>Beacon Management</CardTitle>
                  <CardDescription>Register and manage iBeacons for indoor positioning.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Input name="name" value={newBeacon.name} onChange={handleBeaconInputChange} placeholder="Beacon Name (e.g., Entrance)" />
                    <Input name="uuid" value={newBeacon.uuid} onChange={handleBeaconInputChange} placeholder="UUID" />
                    <Input name="major" value={newBeacon.major} onChange={handleBeaconInputChange} placeholder="Major" />
                    <Input name="minor" value={newBeacon.minor} onChange={handleBeaconInputChange} placeholder="Minor" />
                  </div>
                  <Button onClick={handleRegisterBeacon} className="mt-4">Register Beacon</Button>
                  <div className="mt-4 space-y-2">
                    {currentBeacons.map(beacon => (
                      <div key={beacon.id} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{beacon.name}</span>
                        <span className="text-sm text-gray-500">{beacon.uuid}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Settings" className="flex-1 p-4">
              <p>Settings content goes here...</p>
            </TabsContent>
          </Tabs>
        </main>
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