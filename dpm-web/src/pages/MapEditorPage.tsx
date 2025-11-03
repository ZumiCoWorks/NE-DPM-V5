import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Move, Upload, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FloorplanCanvas from '@/components/FloorplanCanvas'
// removed Layout import because it was unused

type DrawingMode = 'poi' | 'path' | null;

interface POI {
  id: string;
  x: number;
  y: number;
  label: string;
}

export const MapEditorPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [mapImage, setMapImage] = useState<string | null>(null);

  const [floorplans, setFloorplans] = useState<any[]>([]);
  const [currentFloorplan, setCurrentFloorplan] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [pois, setPois] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

    const fileName = `${user?.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-maps')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return;
    }

    const { data: urlData } = supabase.storage.from('event-maps').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    const { data: mapData, error: mapError } = await supabase
      .from('event_maps')
      .insert([{ event_id: eventId, image_url: imageUrl, name: file.name }])
      .select();

    if (mapError) {
      console.error('Error creating map record:', mapError);
    } else if (mapData) {
      setFloorplans([...floorplans, mapData[0]]);
      selectFloorplan(mapData[0]);
    }
  };

  const fetchFloorplans = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('event_maps')
      .select('*')
      .eq('event_id', eventId);
    if (error) {
      console.error('Error fetching floorplans:', error);
    } else {
      setFloorplans(data);
      if (data.length > 0) {
        selectFloorplan(data[0]);
      }
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchFloorplans();
  }, [fetchFloorplans]);

  const selectFloorplan = async (floorplan: any) => {
    setCurrentFloorplan(floorplan);
    setMapImage(floorplan.image_url);

    const { data: poisData, error: poisError } = await supabase.from('pois').select('*').eq('map_id', floorplan.id);
    if (poisError) console.error('Error fetching POIs:', poisError); else setPois(poisData || []);

    const { data: nodesData, error: nodesError } = await supabase.from('nodes').select('*').eq('map_id', floorplan.id);
    if (nodesError) console.error('Error fetching nodes:', nodesError); else setNodes(nodesData || []);

    const { data: segmentsData, error: segmentsError } = await supabase.from('segments').select('*').eq('map_id', floorplan.id);
    if (segmentsError) console.error('Error fetching segments:', segmentsError); else setSegments(segmentsData || []);

    const { data: zonesData, error: zonesError } = await supabase.from('zones').select('*').eq('map_id', floorplan.id);
    if (zonesError) console.error('Error fetching zones:', zonesError); else setZones(zonesData || []);
  };


  const handleNewPoiOnCanvas = async (poi: any) => {
    if (!user || !currentFloorplan) return;
    const { data, error } = await supabase
      .from('pois')
      .insert([{ ...poi, map_id: currentFloorplan.id, user_id: user.id }])
      .select();
    if (error) {
      console.error('Error creating POI:', error);
    } else if (data) {
      setPois([...pois, data[0]]);
    }
  };

  const handleDeletePoiOnCanvas = async (poiId: string) => {
    const { error } = await supabase.from('pois').delete().eq('id', poiId);
    if (error) {
      console.error('Error deleting POI:', error);
    } else {
      setPois(pois.filter(p => p.id !== poiId));
    }
  };

  const handleDeleteNodeOnCanvas = async (nodeId: string) => {
    const { error } = await supabase.from('nodes').delete().eq('id', nodeId);
    if (error) {
      console.error('Error deleting node:', error);
    } else {
      setNodes(nodes.filter(n => n.id !== nodeId));
    }
  };

  const handleDeleteSegmentOnCanvas = async (segmentId: string) => {
    const { error } = await supabase.from('segments').delete().eq('id', segmentId);
    if (error) {
      console.error('Error deleting segment:', error);
    } else {
      setSegments(segments.filter(s => s.id !== segmentId));
    }
  };

  const handleDeleteZoneOnCanvas = async (zoneId: string) => {
    const { error } = await supabase.from('zones').delete().eq('id', zoneId);
    if (error) {
      console.error('Error deleting zone:', error);
    } else {
      setZones(zones.filter(z => z.id !== zoneId));
    }
  };

  const handleUpdateNodePositionOnCanvas = async (nodeId: string, x: number, y: number) => {
    const { error } = await supabase.from('nodes').update({ x, y }).eq('id', nodeId);
    if (error) {
      console.error('Error updating node position:', error);
    } else {
      setNodes(nodes.map(n => n.id === nodeId ? { ...n, x, y } : n));
    }
  };

  const handleUpdatePoiOnCanvas = async (poiId: string, updates: any) => {
    const { error } = await supabase.from('pois').update(updates).eq('id', poiId);
    if (error) {
      console.error('Error updating POI:', error);
    } else {
      setPois(pois.map(p => p.id === poiId ? { ...p, ...updates } : p));
    }
  };

  const handleUpdateZoneOnCanvas = async (zoneId: string, updates: any) => {
    const { error } = await supabase.from('zones').update(updates).eq('id', zoneId);
    if (error) {
      console.error('Error updating zone:', error);
    } else {
      setZones(zones.map(z => z.id === zoneId ? { ...z, ...updates } : z));
    }
  };

  const handleSaveGeoreferenceOnCanvas = async (georeference: any) => {
    if (!currentFloorplan) return;
    const { error } = await supabase.from('event_maps').update(georeference).eq('id', currentFloorplan.id);
    if (error) {
      console.error('Error saving georeference:', error);
    }
  };

  const handleNewNodeOnCanvas = async (node: any) => {
    if (!user || !currentFloorplan) return;
    const { data, error } = await supabase
      .from('nodes')
      .insert([{ ...node, map_id: currentFloorplan.id, user_id: user.id }])
      .select();
    if (error) {
      console.error('Error creating node:', error);
    } else if (data) {
      setNodes([...nodes, data[0]]);
    }
  };

  const handleNewSegmentOnCanvas = async (segment: any) => {
    if (!user || !currentFloorplan) return;
    const { data, error } = await supabase
      .from('segments')
      .insert([{ ...segment, map_id: currentFloorplan.id, user_id: user.id }])
      .select();
    if (error) {
      console.error('Error creating segment:', error);
    } else if (data) {
      setSegments([...segments, data[0]]);
    }
  };

  const handleNewZoneOnCanvas = (zone: any) => {
    // Not implemented yet
  };

  const tools = [
    { id: 'poi' as DrawingMode, label: 'Add POI', icon: MapPin, description: 'Click to add points of interest' },
    { id: 'path' as DrawingMode, label: 'Draw Path', icon: Move, description: 'Draw navigation paths' }
  ];

  return (
    <div>
      <div className="mb-8">
        {eventId && (
          <Button variant="ghost" onClick={() => navigate(`/events/${eventId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
        )}
        <h1 className="text-3xl mb-2">Map Editor</h1>
        <p className="text-slate-600">Create and edit interactive event maps{eventId ? ` for Event #${eventId}` : ''}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="map-upload"
                />
                <label htmlFor="map-upload">
                  <Button asChild className="w-full">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Map Image
                    </span>
                  </Button>
                </label>
              </div>

              <div className="border-t pt-3 space-y-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant={drawingMode === tool.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setDrawingMode(tool.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tool.label}
                    </Button>
                  );
                })}
              </div>

              {drawingMode !== null && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {tools.find(t => t.id === drawingMode)?.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Canvas</CardTitle>
            </CardHeader>
            <CardContent>
             {currentFloorplan ? (
                <FloorplanCanvas
                  floorplanImageUrl={currentFloorplan.image_url}
                  currentFloorplan={currentFloorplan}
                  pois={pois}
                  nodes={nodes}
                  segments={segments}
                  zones={zones}
                  drawingMode={drawingMode}
                  onNewPoi={handleNewPoiOnCanvas}
                  onNewNode={handleNewNodeOnCanvas}
                  onNewSegment={handleNewSegmentOnCanvas}
                  onNewZone={handleNewZoneOnCanvas}
                  onDeletePoi={handleDeletePoiOnCanvas}
                  onDeleteNode={handleDeleteNodeOnCanvas}
                  onDeleteSegment={handleDeleteSegmentOnCanvas}
                  onDeleteZone={handleDeleteZoneOnCanvas}
                  onUpdateNodePosition={handleUpdateNodePositionOnCanvas}
                  onUpdatePoi={handleUpdatePoiOnCanvas}
                  onUpdateZone={handleUpdateZoneOnCanvas}
                  onSaveGeoreference={handleSaveGeoreferenceOnCanvas}
                />
              ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Upload className="w-16 h-16 mx-auto mb-4" />
                      <p>Upload a map image to get started</p>
                      <p className="text-sm mt-2">Click "Upload Map Image" to begin</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};