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
} from "lucide-react";
import { FloorplanCanvas } from "@/components/FloorplanCanvas";
import { ImageUploader } from "@/components/ImageUploader";
import { useScreenSize } from "@/hooks/useScreenSize";
import ScreenSizeRestriction from "@/components/ScreenSizeRestriction";
import OnboardingFlow from "@/components/OnboardingFlow";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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
  const [dashboardRole, setDashboardRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Venue Owner');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
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
        .from('floorplans')
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
        .from('floorplans')
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
          .from('floorplans')
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
      const { error } = await supabase.from('floorplans').delete().eq('id', floorplan.id);
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
        .from('floorplans')
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
        .from('floorplans')
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

  useEffect(() => {
    if (currentUser) {
      fetchFloorplans();
      // Based on user's role from Supabase, you might want to set the dashboardRole
      // For now, we'll leave it as a manual toggle for demonstration
    }
  }, [currentUser, fetchFloorplans]);

  useEffect(() => {
    if (eventId) {
      selectFloorplan(eventId);
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

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 flex flex-col border-r">
        <div className="p-4 border-b">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate("/events")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </div>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Tools</h2>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={drawingMode === tool.id ? "secondary" : "ghost"}
                onClick={() => setDrawingMode(drawingMode === tool.id ? null : tool.id as DrawingMode)}
                className="flex flex-col h-20"
              >
                <tool.icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="p-4 mt-auto">
          <Card>
            <CardHeader>
              <CardTitle>Event Name</CardTitle>
              <CardDescription>
                Last saved: {new Date().toLocaleTimeString()}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2">
              <Button className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </CardFooter>
          </Card>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">Map Editor</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span>Visible Layers</span>
            </div>
          </div>
        </header>
        <div className="flex-1 bg-muted/40 p-4 overflow-auto">
          <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            {currentFloorplan ? (
              <FloorplanCanvas
                ref={canvasRef}
                floorplanImageUrl={currentFloorplan.image_url}
                currentFloorplan={currentFloorplan}
                pois={currentPois}
                nodes={currentNodes}
                segments={currentSegments}
                zones={currentZones}
                drawingMode={drawingMode}
                onNewPoi={handleNewPoiOnCanvas}
                onNewNode={handleNewNodeOnCanvas}
                onNewSegment={handleNewSegmentOnCanvas}
                onNewZone={handleNewZoneOnCanvas}
                onDeletePoi={handleDeletePoiOnCanvas}
                onDeleteNode={handleDeleteNodeOnCanvas}
                onDeleteSegment={handleDeleteSegmentOnCanvas}
                onDeleteZone={handleDeleteZoneOnCanvas}
                onUpdateNodePosition={() => {}}
                onUpdatePoi={() => {}}
                onUpdateZone={() => {}}
                onSaveGeoreference={handleSaveGeoreference}
                onScaleCalibrated={handleScaleCalibrated}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
              />
            ) : (
              <div className="text-center text-slate-400">
                <ImageUploader onUploadSuccess={handleFloorplanUploadSuccess} onMessage={showEditorMessage} userId={(currentUser as any)?.id} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapEditorPage;