import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Share2,
  Save,
  Settings,
  MapPin,
  Move,
  Plus,
  Trash2,
  LayoutDashboard,
  Users,
  Store,
  Star,
} from "lucide-react";
import { FloorplanCanvas } from "@/components/FloorplanCanvas";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
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
import { saveAs } from 'file-saver';
import { ImageUploader } from "@/components/ImageUploader";
// Typed wrapper to satisfy TS JSX element expectations for react-qr-code
const QRCodeComponent = QRCode as unknown as React.ComponentType<{
  id?: string;
  value: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}>;

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

  const [drawingMode, setDrawingMode] = useState<DrawingMode | null>(null);
  const [currentFloorplan, setCurrentFloorplan] = useState<any>(null);
  const [currentNodes, setCurrentNodes] = useState<any[]>([]);
  const [currentSegments, setCurrentSegments] = useState<any[]>([]);
  const [currentPois, setCurrentPois] = useState<any[]>([]);
  const [currentZones, setCurrentZones] = useState<any[]>([]);
  const [currentVendors, setCurrentVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [activeTab, setActiveTab] = useState('Layout');
  const [editorMessage, setEditorMessage] = useState({ text: '', type: '' });
  const [quicketEventId, setQuicketEventId] = useState('');
  const [scaleInput, setScaleInput] = useState<string>('');


  const showEditorMessage = useCallback((text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    console.log(`[${type.toUpperCase()}]: ${text}`);
    setEditorMessage({ text, type });
    setTimeout(() => setEditorMessage({ text: '', type: '' }), 5000);
  }, []);

  const handleCreateEvent = async () => {
    if (!currentUser) {
      showEditorMessage('You must be logged in to create an event.', 'error');
      return;
    }
    try {
      setIsCreatingEvent(true);
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          name: `New Event - ${new Date().toLocaleDateString()}`,
          user_id: currentUser.id,
        })
        .select()
        .single();

      if (error) throw error;

      showEditorMessage('New event created successfully!', 'success');
      navigate(`/map-editor/${newEvent.id}`);
    } catch (err: any) {
      showEditorMessage('Failed to create new event: ' + err.message, 'error');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleFloorplanUploadSuccess = async (imageUrl: string) => {
    if (!currentFloorplan) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ floorplan_image_url: imageUrl })
        .eq('id', currentFloorplan.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentFloorplan(data);
      showEditorMessage('Map uploaded successfully!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to save map URL: ' + err.message, 'error');
    }
  };


  // Logic from FloorplanEditor.jsx

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

  const fetchEvents = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setEvents(data);
    } catch (err: any) {
      showEditorMessage('Failed to fetch events: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showEditorMessage]);

  const selectEvent = useCallback(async (selectedEventId: string) => {
    try {
      setLoading(true);
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', selectedEventId)
        .single();
      if (eventError) throw eventError;
      setCurrentFloorplan(eventData);
      // Initialize calibration input from event or localStorage fallback
      const storedScale = localStorage.getItem(`event:${selectedEventId}:scale_meters_per_pixel`);
      const initScale = (eventData?.scale_meters_per_pixel ?? (storedScale ? Number(storedScale) : ''));
      setScaleInput(initScale !== '' && !Number.isNaN(initScale) ? String(initScale) : '');

      const { data: nodesData, error: nodesError } = await supabase.from('nodes').select('*').eq('event_id', selectedEventId);
      if (nodesError) throw nodesError;
      setCurrentNodes(nodesData);

      const { data: segmentsData, error: segmentsError } = await supabase.from('segments').select('*').eq('event_id', selectedEventId);
      if (segmentsError) throw segmentsError;
      setCurrentSegments(segmentsData);

      const { data: poisData, error: poisError } = await supabase.from('pois').select('*').eq('event_id', selectedEventId);
      if (poisError) throw poisError;
      setCurrentPois(poisData);

      const { data: zonesData, error: zonesError } = await supabase.from('zones').select('*').eq('event_id', selectedEventId);
      if (zonesError) throw zonesError;
      setCurrentZones(zonesData);

      const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*').eq('event_id', selectedEventId);
      if (vendorsError) throw vendorsError;
      setCurrentVendors(vendorsData);

    } catch (err: any) {
      showEditorMessage('Failed to load event details: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showEditorMessage]);

  useEffect(() => {
    if (eventId) {
      selectEvent(eventId);
    } else {
      fetchEvents();
    }
  }, [eventId, fetchEvents, selectEvent]);


  const handleRenameEvent = async (eventIdToRename: string, newName: string) => {
    if (!newName || newName.trim() === '') return;
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ name: newName.trim() })
        .eq('id', eventIdToRename)
        .select()
        .single();
      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === eventIdToRename ? data : e));
      if (currentFloorplan && currentFloorplan.id === eventIdToRename) {
        setCurrentFloorplan(data);
      }
      showEditorMessage('Event renamed!', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to rename event: ' + err.message, 'error');
    }
  };

  const handleDeleteEvent = async (eventToDelete: any) => {
    try {
      await supabase.from('events').delete().eq('id', eventToDelete.id);
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      if (currentFloorplan && currentFloorplan.id === eventToDelete.id) {
        setCurrentFloorplan(null);
        navigate('/map-editor');
      }
      showEditorMessage('Event deleted.', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to delete event: ' + err.message, 'error');
    }
  };

  const handleNewNodeOnCanvas = async (newNode: any) => {
    if (!currentFloorplan || !currentUser) return;
    try {
      const { data, error } = await supabase.from('nodes').insert({
        ...newNode,
        event_id: currentFloorplan.id,
        user_id: currentUser.id,
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
        event_id: currentFloorplan.id,
        user_id: currentUser.id,
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
        event_id: currentFloorplan.id,
        user_id: currentUser.id,
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
        event_id: currentFloorplan.id,
        user_id: currentUser.id,
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
        // Fallback: persist locally so the MVP remains usable without DB column
        try {
          localStorage.setItem(`event:${currentFloorplan.id}:scale_meters_per_pixel`, String(scale));
          setCurrentFloorplan({ ...currentFloorplan, scale_meters_per_pixel: scale });
          showEditorMessage('Saved scale locally (DB update failed).', 'warning');
        } catch (storageErr: any) {
          showEditorMessage('Failed to save scale: ' + (storageErr?.message || err.message), 'error');
        }
      }
    };

  const handleUpdateNode = async (nodeId: string, updates: any) => {
    if (!currentFloorplan) return;
    try {
      const { data, error } = await supabase.from('nodes').update(updates).eq('id', nodeId).select().single();
      if (error) throw error;
      setCurrentNodes(prev => prev.map(n => n.id === nodeId ? data : n));
    } catch (err: any) {
      showEditorMessage('Failed to update node: ' + err.message, 'error');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!currentFloorplan) return;
    try {
      await supabase.from('segments').delete().or(`start_node_id.eq.${nodeId},end_node_id.eq.${nodeId}`);
      await supabase.from('nodes').delete().eq('id', nodeId);
      setCurrentNodes(prev => prev.filter(n => n.id !== nodeId));
      setCurrentSegments(prev => prev.filter(s => s.start_node_id !== nodeId && s.end_node_id !== nodeId));
    } catch (err: any) {
      showEditorMessage('Failed to delete node: ' + err.message, 'error');
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (!currentFloorplan) return;
    try {
      await supabase.from('segments').delete().eq('id', segmentId);
      setCurrentSegments(prev => prev.filter(s => s.id !== segmentId));
    } catch (err: any) {
      showEditorMessage('Failed to delete segment: ' + err.message, 'error');
    }
  };

  const handleDeletePoi = async (poiId: string) => {
    if (!currentFloorplan) return;
    try {
      await supabase.from('pois').delete().eq('id', poiId);
      setCurrentPois(prev => prev.filter(p => p.id !== poiId));
    } catch (err: any) {
      showEditorMessage('Failed to delete POI: ' + err.message, 'error');
    }
  };

  const handleUpdatePoi = async (poiId: string, updates: any) => {
    if (!currentFloorplan) return;
    try {
      const { data, error } = await supabase.from('pois').update(updates).eq('id', poiId).select().single();
      if (error) throw error;
      setCurrentPois(prev => prev.map(p => p.id === poiId ? data : p));
    } catch (err: any) {
      showEditorMessage('Failed to update POI: ' + err.message, 'error');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!currentFloorplan) return;
    try {
      await supabase.from('zones').delete().eq('id', zoneId);
      setCurrentZones(prev => prev.filter(z => z.id !== zoneId));
    } catch (err: any) {
      showEditorMessage('Failed to delete zone: ' + err.message, 'error');
    }
  };

  const handleAddVendor = async () => {
    if (!currentFloorplan || !newVendorName || !currentUser) return;
    try {
      const { data, error } = await supabase.from('vendors').insert({
        name: newVendorName,
        event_id: currentFloorplan.id,
        user_id: currentUser.id,
      }).select().single();
      if (error) throw error;
      setCurrentVendors(prev => [...prev, data]);
      setNewVendorName('');
    } catch (err: any) {
      showEditorMessage('Failed to add vendor: ' + err.message, 'error');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!currentFloorplan) return;
    try {
      await supabase.from('pois').update({ vendor_id: null }).eq('vendor_id', vendorId);
      await supabase.from('vendors').delete().eq('id', vendorId);
      setCurrentVendors(prev => prev.filter(v => v.id !== vendorId));
      const { data: poisData, error: poisError } = await supabase.from('pois').select('*').eq('event_id', currentFloorplan.id);
      if (poisError) throw poisError;
      setCurrentPois(poisData);
    } catch (err: any) {
      showEditorMessage('Failed to delete vendor: ' + err.message, 'error');
    }
  };

  const handleLinkVendorToPoi = async (poiId: string, vendorId: string | null) => {
    try {
      const { data, error } = await supabase
        .from('pois')
        .update({ vendor_id: vendorId })
        .eq('id', poiId)
        .select()
        .single();
      if (error) throw error;
      setCurrentPois(prev => prev.map(p => p.id === poiId ? data : p));
      showEditorMessage('POI updated successfully', 'success');
    } catch (err: any) {
      showEditorMessage('Failed to link vendor: ' + err.message, 'error');
    }
  };

  const handleGenerateSignupLink = async (vendorId: string) => {
    try {
      const { data, error } = await supabase.rpc('create_vendor_signup_token', { vendor_id_arg: vendorId });

      if (error) throw error;

      const signupUrl = `${window.location.origin}/vendor-signup?token=${data}`;
      setQrCodeValue(signupUrl);
      setIsQrModalOpen(true);
      showEditorMessage('Signup link generated!', 'success');

    } catch (err: any) {
      showEditorMessage('Failed to generate signup link: ' + err.message, 'error');
    }
  };

  const generateAndSetQrCodeValue = (role: 'attendee' | 'vendor' | 'sponsor') => {
    if (!currentFloorplan) return;
    const url = `${window.location.origin}/mobile-view/${currentFloorplan.id}?role=${role}`;
    setQrCodeValue(url);
    setIsQrModalOpen(true);
  };

  const renderEditor = () => {
    if (loading) {
      return <div>Loading...</div>
    }

    if (!currentFloorplan?.floorplan_image_url) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Upload Your Map</h2>
            <p className="text-gray-600">Your event needs a floorplan to get started.</p>
          </div>
          <ImageUploader
            eventId={currentFloorplan.id}
            onUploadSuccess={handleFloorplanUploadSuccess}
          />
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/map-editor')} title="Back to Dashboard">
            <LayoutDashboard className="h-6 w-6" />
          </Button>
          <div className="flex-grow space-y-2">
            {tools.map(tool => (
              <Button
                key={tool.id}
                variant={drawingMode === tool.id ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setDrawingMode(tool.id)}
                title={tool.label}
              >
                <tool.icon className="h-6 w-6" />
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} title="Global Settings">
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b p-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={currentFloorplan?.name || ''}
                onChange={(e) => setCurrentFloorplan({ ...currentFloorplan, name: e.target.value })}
                onBlur={(e) => handleRenameEvent(currentFloorplan.id, e.target.value)}
                className="font-semibold text-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => generateAndSetQrCodeValue('attendee')}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 bg-gray-200 relative">
              <FloorplanCanvas
                ref={canvasRef}
                floorplanImage={currentFloorplan?.floorplan_image_url}
                nodes={currentNodes}
                segments={currentSegments}
                pois={currentPois}
                zones={currentZones}
                drawingMode={drawingMode}
                onNodeAdd={handleNewNodeOnCanvas}
                onSegmentAdd={handleNewSegmentOnCanvas}
                onPoiAdd={handleNewPoiOnCanvas}
                onZoneAdd={handleNewZoneOnCanvas}
                onScaleCalibrated={handleScaleCalibrated}
                onNodeUpdate={handleUpdateNode}
                onNodeDelete={handleDeleteNode}
                onSegmentDelete={handleDeleteSegment}
                onPoiDelete={handleDeletePoi}
                onPoiUpdate={handleUpdatePoi}
                onZoneDelete={handleDeleteZone}
              />
            </div>

            <div className="w-80 bg-white border-l overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Layout">Layout</TabsTrigger>
                  <TabsTrigger value="Vendors">Vendors</TabsTrigger>
                  <TabsTrigger value="Settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="Layout" className="p-4">
                  <h3 className="font-semibold mb-2">Points of Interest</h3>
                  <ul className="space-y-2">
                    {currentPois.map(poi => (
                      <li key={poi.id} className="flex items-center justify-between text-sm">
                        <span>{poi.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePoi(poi.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="Vendors" className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Manage Vendors</h3>
                      <div className="flex gap-2">
                        <Input
                          value={newVendorName}
                          onChange={(e) => setNewVendorName(e.target.value)}
                          placeholder="New vendor name"
                        />
                        <Button onClick={handleAddVendor}>Add</Button>
                      </div>
                      <ul className="mt-2 space-y-2">
                        {currentVendors.map(vendor => (
                          <li key={vendor.id} className="flex items-center justify-between text-sm p-2 border rounded-md">
                            <span>{vendor.name}</span>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleGenerateSignupLink(vendor.id)}>
                                Get Link
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(vendor.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <hr/>
                    <div>
                      <h3 className="font-semibold mb-2">Link POI to Vendor</h3>
                      {currentPois.map(poi => (
                        <div key={poi.id} className="grid grid-cols-2 gap-2 items-center mb-2">
                          <Label>{poi.name}</Label>
                          <Select
                            value={poi.vendor_id || ''}
                            onValueChange={(value) => handleLinkVendorToPoi(poi.id, value || null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {currentVendors.map(vendor => (
                                <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="Settings" className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Quicket Integration</h3>
                    <div className="flex gap-2">
                      <Input
                        value={quicketEventId}
                        onChange={(e) => setQuicketEventId(e.target.value)}
                        placeholder="Quicket Event ID"
                      />
                      <Button onClick={handleSaveQuicketId}>Save</Button>
                    </div>
                    <Button onClick={handleSyncQuicketAttendees} className="mt-2 w-full">
                      Sync Attendees
                    </Button>
                  </div>
                  <hr/>
                  <div>
                    <h3 className="font-semibold mb-2">Map Calibration</h3>
                    <p className="text-xs text-slate-500 mb-2">Set meters per pixel to align on-screen distances with real-world measurements.</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.0001"
                        value={scaleInput}
                        onChange={(e) => setScaleInput(e.target.value)}
                        placeholder="Meters per pixel (e.g., 0.075)"
                      />
                      <Button
                        onClick={() => {
                          const val = Number(scaleInput);
                          if (!Number.isFinite(val) || val <= 0) {
                            showEditorMessage('Please enter a valid positive number for meters per pixel.', 'error');
                            return;
                          }
                          handleScaleCalibrated(val);
                        }}
                      >Save</Button>
                    </div>
                  </div>
                  <hr/>
                  <div>
                    <h3 className="font-semibold mb-2">Shareable Links</h3>
                    <div className="space-y-2">
                      <Button className="w-full justify-start" variant="outline" onClick={() => generateAndSetQrCodeValue('attendee')}>
                        <Users className="mr-2 h-4 w-4"/> Attendee Link
                      </Button>
                       <Button className="w-full justify-start" variant="outline" onClick={() => generateAndSetQrCodeValue('vendor')}>
                        <Store className="mr-2 h-4 w-4"/> Vendor Link
                      </Button>
                       <Button className="w-full justify-start" variant="outline" onClick={() => generateAndSetQrCodeValue('sponsor')}>
                        <Star className="mr-2 h-4 w-4"/> Sponsor Link
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4" style={{ background: 'white' }}>
            <QRCodeComponent id="event-qr-code" value={qrCodeValue} size={256} />
            <p className="mt-4 text-sm text-gray-500 break-all">{qrCodeValue}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(qrCodeValue)}>Copy Link</Button>
            <Button onClick={handleDownloadQrCode}>Download QR</Button>
            <Button variant="secondary" onClick={() => setIsQrModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    );
  };

  const renderDashboard = () => (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Events</h1>
        <Button onClick={handleCreateEvent} disabled={isCreatingEvent}>
          <Plus className="mr-2 h-4 w-4" />
          {isCreatingEvent ? 'Creating...' : 'Create New Event'}
        </Button>
      </div>
      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Created on: {new Date(event.created_at).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => navigate(`/map-editor/${event.id}`)}>
                  Edit
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p>This will permanently delete the event and all its data. This action cannot be undone.</p>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={() => handleDeleteEvent(event)}>
                        Yes, delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (loading && eventId) {
    return <div>Loading Editor...</div>;
  }

  return eventId ? renderEditor() : renderDashboard();
};

export default MapEditorPage;