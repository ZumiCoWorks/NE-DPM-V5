import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GraphNode, GraphSegment } from '../lib/pathfinding';
import { GPSBounds } from '../lib/gpsNavigation';
import { gpsToPixel as affineGpsToPixel, pixelToGPS as affinePixelToGPS } from '../lib/affineCalibration';
import { gpsToFloorplan as fallbackGpsToPixel, floorplanToGPS as fallbackPixelToGPS } from '../lib/coordinateConversion';
import { LeafletNodeEditModal } from './LeafletNodeEditModal';
import { supabase } from '../lib/supabase';

// Fix Leaflet default marker icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapEditorProps {
    eventId: string;
    floorplanId: string;
    floorplanUrl: string;
    gpsBounds: GPSBounds;
    floorplanSize?: { width: number; height: number };
    rotationDegrees?: number;  // Clockwise degrees from North — from calibration data
    scaleMetersPerPixel?: number; // From calibration data — used to compute correct overlay bounds
    originGpsLat?: number; // GPS mapping for Top-Left corner 
    originGpsLng?: number;
    onRotationChange?: (newDeg: number) => void;
    onExport?: (nodes: GraphNode[], segments: GraphSegment[]) => void;
}

interface LeafletNode {
    id: string;
    lat: number;
    lng: number;
    name: string;
    isPOI: boolean;
    linkedNodeId?: string;
    pointType?: string;
}

interface LeafletSegment {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    path: [number, number][];
}

type DrawMode = 'point' | 'line' | 'poi' | 'edit' | 'delete' | null;

function MapEventsHandler({ mode, onMapClick }: { mode: DrawMode; onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            if (mode === 'point' || mode === 'poi') {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

const LeafletMapEditor: React.FC<LeafletMapEditorProps> = ({
    eventId,
    floorplanId,
    floorplanUrl,
    gpsBounds,
    floorplanSize = { width: 1000, height: 1000 },
    rotationDegrees = 0,
    scaleMetersPerPixel = 0,
    originGpsLat,
    originGpsLng,
    onExport
}) => {
    const [nodes, setNodes] = useState<LeafletNode[]>([]);
    const [segments, setSegments] = useState<LeafletSegment[]>([]);
    const [drawMode, setDrawMode] = useState<DrawMode>(null);
    const [selectedNodeForLine, setSelectedNodeForLine] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');
    const [floorplanOpacity, setFloorplanOpacity] = useState<number>(0.7);
    const [editingNode, setEditingNode] = useState<LeafletNode | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Bounds for CRS.Simple: [[y1, x1], [y2, x2]]
    const overlayBounds = useMemo<[[number, number], [number, number]]>(() => {
        const height = floorplanSize?.height || 1000;
        const width = floorplanSize?.width || 1000;
        return [[0, 0], [height, width]];
    }, [floorplanSize]);

    // Center map on floorplan image
    const center = useMemo<[number, number]>(() => {
        return [floorplanSize.height / 2, floorplanSize.width / 2];
    }, [floorplanSize]);

    // Hook to auto-fit bounds on mount
    function AutoFitBounds() {
        const map = useMap();
        useEffect(() => {
            if (overlayBounds && overlayBounds[1][0] !== 0) {
                map.fitBounds(overlayBounds, { animate: false });
                setTimeout(() => {
                    map.invalidateSize();
                    map.fitBounds(overlayBounds, { animate: false });
                }, 250);
            }
        }, [map, overlayBounds]);
        return null;
    }

    // coordinate conversions
    const getPixelCoords = (lat: number, lng: number): { x: number, y: number } => {
        if (originGpsLat !== undefined && originGpsLng !== undefined && scaleMetersPerPixel > 0) {
            return affineGpsToPixel({ lat, lng }, scaleMetersPerPixel, rotationDegrees, { lat: originGpsLat, lng: originGpsLng });
        }
        return fallbackGpsToPixel(lat, lng, gpsBounds, floorplanSize);
    };

    const getGpsCoords = (x: number, y: number): { lat: number, lng: number } => {
        if (originGpsLat !== undefined && originGpsLng !== undefined && scaleMetersPerPixel > 0) {
            return affinePixelToGPS({ x, y }, scaleMetersPerPixel, rotationDegrees, { lat: originGpsLat, lng: originGpsLng });
        }
        return fallbackPixelToGPS(x, y, gpsBounds, floorplanSize);
    };

    // Leaflet maps latLng to/from Pixel Coords 
    // CRS.Simple puts (0,0) at bottom-left. We map our HTML image (0,0 top-left)
    const toMapLeaflet = (x: number, y: number): [number, number] => {
        return [floorplanSize.height - y, x];
    };

    const fromMapLeaflet = (lat: number, lng: number): { x: number, y: number } => {
        return { x: lng, y: floorplanSize.height - lat };
    };

    useEffect(() => {
        const loadNavigationData = async () => {
            if (!floorplanId || !supabase) return;

            try {
                // Fetch navigation points
                const { data: points, error: pointsError } = await supabase
                    .from('navigation_points')
                    .select('*')
                    .eq('floorplan_id', floorplanId);

                if (pointsError) throw pointsError;

                const validPoints = ((points as any[]) || []).filter((point: any) =>
                    point.gps_lat !== null && point.gps_lng !== null &&
                    !isNaN(point.gps_lat) && !isNaN(point.gps_lng)
                );

                if (validPoints.length > 0) {
                    const seenIds = new Set();
                    const loadedNodes: LeafletNode[] = validPoints
                        .filter((point: any) => {
                            if (seenIds.has(point.id)) return false;
                            seenIds.add(point.id);
                            return true;
                        })
                        .map((point: any) => ({
                            id: point.id,
                            lat: point.gps_lat,
                            lng: point.gps_lng,
                            name: point.name || point.poi_name || 'Unnamed',
                            isPOI: point.is_destination || point.point_type === 'poi',
                            linkedNodeId: point.linked_node_id,
                            pointType: point.point_type
                        }));
                    setNodes(loadedNodes);
                }

                // Fetch segments
                const { data: segs, error: segsError } = await supabase
                    .from('navigation_segments')
                    .select('*')
                    .eq('floorplan_id', floorplanId);

                if (segsError) throw segsError;

                if (segs && (segs as any[]).length > 0) {
                    const validNodeIds = new Set(validPoints.map((p: any) => p.id));
                    const validSegments = (segs as any[]).filter((seg: any) =>
                        validNodeIds.has(seg.start_node_id) && validNodeIds.has(seg.end_node_id)
                    );

                    const nodePositions = new Map(validPoints.map((p: any) => [
                        p.id,
                        { lat: p.gps_lat, lng: p.gps_lng }
                    ]));

                    const loadedSegments: LeafletSegment[] = validSegments.map((seg: any) => {
                        const fromPos = nodePositions.get(seg.start_node_id);
                        const toPos = nodePositions.get(seg.end_node_id);
                        return {
                            id: seg.id,
                            fromNodeId: seg.start_node_id,
                            toNodeId: seg.end_node_id,
                            path: fromPos && toPos ? [[fromPos.lat, fromPos.lng], [toPos.lat, toPos.lng]] : []
                        };
                    });
                    setSegments(loadedSegments);
                }
            } catch (err) {
                console.error('Error loading navigation data:', err);
            }
        };

        loadNavigationData();
    }, [floorplanId, supabase]);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleMapClick = async (leafletLat: number, leafletLng: number) => {
        if (drawMode === 'point' || drawMode === 'poi') {
            const nodeName = drawMode === 'poi' ? `POI ${nodes.filter(n => n.isPOI).length + 1}` : `Node ${nodes.length + 1}`;
            if (!supabase) return;

            try {
                // Convert Map click to Pixel and Pixel to real GPS coordinates
                const { x: pixelX, y: pixelY } = fromMapLeaflet(leafletLat, leafletLng);
                const { lat, lng } = getGpsCoords(pixelX, pixelY);

                // Save to database
                const { data, error } = await supabase
                    .from('navigation_points')
                    .insert({
                        floorplan_id: floorplanId,
                        name: nodeName,
                        x_coord: Math.round(pixelX),
                        y_coord: Math.round(pixelY),
                        gps_lat: lat,
                        gps_lng: lng,
                        point_type: drawMode === 'poi' ? 'poi' : 'node',
                        is_destination: drawMode === 'poi'
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                const newNode: LeafletNode = {
                    id: (data as any).id,
                    lat,
                    lng,
                    name: nodeName,
                    isPOI: drawMode === 'poi',
                    pointType: drawMode === 'poi' ? 'poi' : 'node'
                };

                setNodes([...nodes, newNode]);
                showMessage(`Added ${drawMode === 'poi' ? 'POI' : 'node'}: ${newNode.name}`);
            } catch (err) {
                console.error('Error saving node:', err);
                showMessage('Failed to save node');
            }
        }
    };

    const handleMarkerClick = async (nodeId: string) => {
        if (drawMode === 'delete') {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                setEditingNode(node);
                setShowEditModal(true);
            }
        } else if (drawMode === 'line') {
            if (!selectedNodeForLine) {
                setSelectedNodeForLine(nodeId);
                showMessage('Click another node to connect');
            } else if (selectedNodeForLine !== nodeId) {
                const fromNode = nodes.find(n => n.id === selectedNodeForLine);
                const toNode = nodes.find(n => n.id === nodeId);

                if (fromNode && toNode) {
                    if (!supabase) return;
                    try {
                        const { data, error } = await supabase
                            .from('navigation_segments')
                            .insert({
                                floorplan_id: floorplanId,
                                start_node_id: selectedNodeForLine,
                                end_node_id: nodeId,
                                is_bidirectional: true
                            })
                            .select()
                            .single();

                        if (error) throw error;
                        if (!data) throw new Error('No data returned');

                        const newSegment: LeafletSegment = {
                            id: (data as any).id,
                            fromNodeId: selectedNodeForLine,
                            toNodeId: nodeId,
                            path: [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]]
                        };
                        setSegments([...segments, newSegment]);
                        showMessage('Path created and saved');
                    } catch (err) {
                        console.error('Error saving segment:', err);
                        showMessage('Failed to save path');
                    }
                }
                setSelectedNodeForLine(null);
            }
        } else if (drawMode === null || drawMode === 'edit') {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                setEditingNode(node);
                setShowEditModal(true);
            }
        }
    };

    const handleExport = async () => {
        const graphNodes: GraphNode[] = nodes.map(node => {
            const { x, y } = getPixelCoords(node.lat, node.lng);
            return {
                id: node.id,
                x,
                y,
                name: node.name,
                type: node.isPOI ? 'poi' : 'node',
                metadata: {
                    gps_lat: node.lat,
                    gps_lng: node.lng
                }
            };
        });

        const graphSegments: GraphSegment[] = segments.map(seg => ({
            id: seg.id,
            start_node_id: seg.fromNodeId,
            end_node_id: seg.toNodeId
        }));

        if (onExport) onExport(graphNodes, graphSegments);
        showMessage(`Exported ${graphNodes.length} nodes and ${graphSegments.length} segments`);
    };

    const handleNodeEditSave = (updatedNode: { id: string; name: string; isPOI: boolean; linkedNodeId?: string; pointType?: string }) => {
        setNodes(nodes.map(n =>
            n.id === updatedNode.id
                ? { ...n, name: updatedNode.name, isPOI: updatedNode.isPOI, linkedNodeId: updatedNode.linkedNodeId, pointType: updatedNode.pointType }
                : n
        ));
        showMessage(`Updated: ${updatedNode.name}`);
        setShowEditModal(false);
        setEditingNode(null);
    };

    const handleNodeDelete = (nodeId: string) => {
        setNodes(nodes.filter(n => n.id !== nodeId));
        setSegments(segments.filter(s => s.fromNodeId !== nodeId && s.toNodeId !== nodeId));
        showMessage('Node deleted');
        setShowEditModal(false);
        setEditingNode(null);
    };

    const poiIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const nodeIcon = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const nodeIconSmall = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [15, 25],
        iconAnchor: [7, 25],
        popupAnchor: [1, -34],
        shadowSize: [25, 25]
    });

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button onClick={() => setDrawMode(drawMode === 'point' ? null : 'point')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'point' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>📍 Add Node</button>
                        <button onClick={() => setDrawMode(drawMode === 'poi' ? null : 'poi')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'poi' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🎯 Add POI</button>
                        <button onClick={() => { setDrawMode(drawMode === 'line' ? null : 'line'); setSelectedNodeForLine(null); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'line' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>➖ Draw Path</button>
                        <button onClick={() => setDrawMode(drawMode === 'edit' ? null : 'edit')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'edit' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} title="Click nodes to edit name, type, or delete">✏️ Edit Mode</button>
                        <button onClick={() => setDrawMode(drawMode === 'delete' ? null : 'delete')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'delete' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🗑️ Delete</button>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 font-medium">Overlay Opacity:</label>
                        <input type="range" min="0" max="100" value={floorplanOpacity * 100} onChange={(e) => setFloorplanOpacity(parseInt(e.target.value) / 100)} className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-xs text-gray-500 font-mono w-8">{Math.round(floorplanOpacity * 100)}%</span>
                    </div>

                    <span className="text-sm text-gray-600 px-3 py-2 border-l border-gray-300">
                        {nodes.length} nodes • {segments.length} paths
                    </span>
                </div>
            </div>

            {message && <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">{message}</div>}

            <div className="flex-1 relative" style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <MapContainer
                    crs={L.CRS.Simple}
                    center={center}
                    bounds={overlayBounds}
                    maxZoom={5}
                    minZoom={-3}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        height: '100%', width: '100%',
                        background: 'transparent'
                    }}
                    zoomControl={true}
                >
                    <AutoFitBounds />
                    <ImageOverlay url={floorplanUrl} bounds={overlayBounds} opacity={floorplanOpacity} />
                    <MapEventsHandler mode={drawMode} onMapClick={handleMapClick} />

                    {nodes.map(node => {
                        let px = { x: 0, y: 0 };
                        if (originGpsLat !== undefined && originGpsLng !== undefined && scaleMetersPerPixel > 0) {
                            px = affineGpsToPixel({ lat: node.lat, lng: node.lng }, scaleMetersPerPixel, rotationDegrees, { lat: originGpsLat, lng: originGpsLng });
                        } else {
                            px = fallbackGpsToPixel(node.lat, node.lng, gpsBounds, floorplanSize);
                        }
                        const position = toMapLeaflet(px.x, px.y);

                        const isPlacingPOI = drawMode === 'poi';
                        const markerIcon = node.isPOI ? poiIcon : (isPlacingPOI ? nodeIconSmall : nodeIcon);

                        return (
                            <Marker
                                key={node.id}
                                position={position}
                                icon={markerIcon}
                                opacity={isPlacingPOI ? 0.4 : 1}
                                eventHandlers={{
                                    click: (e) => {
                                        L.DomEvent.stopPropagation(e.originalEvent);
                                        if (!isPlacingPOI) handleMarkerClick(node.id);
                                    }
                                }}
                            />
                        );
                    })}

                    {segments.map(seg => {
                        const fromNode = nodes.find(n => n.id === seg.fromNodeId);
                        const toNode = nodes.find(n => n.id === seg.toNodeId);
                        if (!fromNode || !toNode) return null;

                        let px1 = { x: 0, y: 0 };
                        let px2 = { x: 0, y: 0 };

                        if (originGpsLat !== undefined && originGpsLng !== undefined && scaleMetersPerPixel > 0) {
                            px1 = affineGpsToPixel({ lat: fromNode.lat, lng: fromNode.lng }, scaleMetersPerPixel, rotationDegrees, { lat: originGpsLat, lng: originGpsLng });
                            px2 = affineGpsToPixel({ lat: toNode.lat, lng: toNode.lng }, scaleMetersPerPixel, rotationDegrees, { lat: originGpsLat, lng: originGpsLng });
                        } else {
                            px1 = fallbackGpsToPixel(fromNode.lat, fromNode.lng, gpsBounds, floorplanSize);
                            px2 = fallbackGpsToPixel(toNode.lat, toNode.lng, gpsBounds, floorplanSize);
                        }

                        const isPlacingPOI = drawMode === 'poi';

                        return (
                            <Polyline
                                key={seg.id}
                                positions={[toMapLeaflet(px1.x, px1.y), toMapLeaflet(px2.x, px2.y)]}
                                pathOptions={{ color: 'blue', weight: isPlacingPOI ? 2 : 3, opacity: isPlacingPOI ? 0.3 : 0.7 }}
                            />
                        );
                    })}

                    {selectedNodeForLine && (() => {
                        const sNode = nodes.find(n => n.id === selectedNodeForLine);
                        if (!sNode) return null;

                        let px = { x: 0, y: 0 };
                        if (originGpsLat !== undefined && originGpsLng !== undefined && scaleMetersPerPixel > 0) {
                            px = affineGpsToPixel({ lat: sNode.lat, lng: sNode.lng }, scaleMetersPerPixel, rotationDegrees, { lat: originGpsLat, lng: originGpsLng });
                        } else {
                            px = fallbackGpsToPixel(sNode.lat, sNode.lng, gpsBounds, floorplanSize);
                        }

                        return (
                            <Marker
                                position={toMapLeaflet(px.x, px.y)}
                                icon={new L.Icon({
                                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
                                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                                    iconSize: [25, 41],
                                    iconAnchor: [12, 41],
                                    popupAnchor: [1, -34],
                                    shadowSize: [41, 41]
                                })}
                            />
                        );
                    })()}
                </MapContainer>
            </div>

            {showEditModal && editingNode && (
                <LeafletNodeEditModal
                    eventId={eventId}
                    floorplanId={floorplanId}
                    node={editingNode}
                    onSave={handleNodeEditSave}
                    onDelete={handleNodeDelete}
                    onClose={() => { setShowEditModal(false); setEditingNode(null); }}
                />
            )}
        </div>
    );
};

export default LeafletMapEditor;
