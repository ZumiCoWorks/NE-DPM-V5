import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GraphNode, GraphSegment } from '../lib/pathfinding';
import { GPSBounds } from '../lib/gpsNavigation';
import { gpsToFloorplan, floorplanToGPS, calculateGPSDistance } from '../lib/coordinateConversion';
import { LeafletNodeEditModal } from './LeafletNodeEditModal';
import { supabase } from '../lib/supabase';

// ── RotatedOverlay ────────────────────────────────────────────────────────────
// Leaflet's ImageOverlay calls L.DomUtil.setPosition(img, ...) on every zoom/pan,
// which sets `transform: translate3d(x,y,0)` and OVERWRITES any CSS rotation we
// applied separately. This component monkey-patches _reset on the raw L.imageOverlay
// instance so the final transform is always `translate3d(x,y,0) rotate(Ndeg)`,
// meaning rotation survives every map update.
function RotatedOverlay({
    url, bounds, opacity, rotationDeg,
}: {
    url: string;
    bounds: [[number, number], [number, number]];
    opacity: number;
    rotationDeg: number;
}) {
    const map = useMap();
    const layerRef = useRef<L.ImageOverlay | null>(null);
    const rotRef = useRef(rotationDeg);
    rotRef.current = rotationDeg;

    useEffect(() => {
        const layer = L.imageOverlay(url, bounds, { opacity });

        // Patch _reset so our rotation is composed with Leaflet's translate.
        const orig = (layer as any)._reset.bind(layer);
        (layer as any)._reset = function () {
            orig();
            const img: HTMLImageElement | null = (this as any)._image;
            if (img) {
                // Leaflet sets transform to translate3d; append our rotation.
                const t = img.style.transform;
                img.style.transform = t
                    ? `${t} rotate(${rotRef.current}deg)`
                    : `rotate(${rotRef.current}deg)`;
                img.style.transformOrigin = '50% 50%';
            }
        };

        layer.addTo(map);
        layerRef.current = layer;
        return () => { layer.remove(); layerRef.current = null; };
        // Re-create layer only when structural props change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, url,
        bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1],
        opacity]);

    // When rotation changes, trigger a redraw without recreating the layer
    useEffect(() => {
        rotRef.current = rotationDeg;
        (layerRef.current as any)?._reset?.();
    }, [rotationDeg]);

    return null;
}

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
    onRotationChange?: (newDeg: number) => void; // Called when user fine-tunes rotation
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

// Map event handler component
// containerRotationDeg: how much the map container div is CSS-rotated.
// We must apply the INVERSE rotation to the click latlng so nodes land at the
// correct real-world GPS even though the tiles are visually rotated.
function MapClickHandler({
    mode,
    onMapClick,
    onMarkerClick,
    containerRotationDeg = 0,
}: {
    mode: DrawMode;
    onMapClick: (lat: number, lng: number) => void;
    onMarkerClick: (id: string) => void;
    containerRotationDeg?: number;
}) {
    const map = useMap();
    useMapEvents({
        click: (e) => {
            if (mode === 'point' || mode === 'poi') {
                if (containerRotationDeg === 0) {
                    onMapClick(e.latlng.lat, e.latlng.lng);
                    return;
                }
                // Correct for the CSS-rotated container: rotate the clicked latlng
                // by +containerRotationDeg around the current map center so the
                // stored GPS is in true geographic space.
                const mc = map.getCenter();
                const cosLat = Math.cos(mc.lat * Math.PI / 180);
                const degToM = 111320;
                const dx = (e.latlng.lng - mc.lng) * degToM * cosLat;
                const dy = (e.latlng.lat - mc.lat) * degToM;
                const rad = containerRotationDeg * Math.PI / 180;
                const cos = Math.cos(rad), sin = Math.sin(rad);
                const dx2 = dx * cos - dy * sin;
                const dy2 = dx * sin + dy * cos;
                onMapClick(
                    mc.lat + dy2 / degToM,
                    mc.lng + dx2 / (degToM * cosLat)
                );
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
    onRotationChange,
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
    const overlayRef = useRef<any>(null);
    // Rotation fine-tune: user-adjustable offset on top of calibrated value
    const [rotationOffset, setRotationOffset] = useState(0);
    const effectiveRotation = ((rotationDegrees + rotationOffset) % 360 + 360) % 360;
    const adjustRotation = (delta: number) => {
        setRotationOffset(prev => {
            const next = prev + delta;
            onRotationChange?.((((rotationDegrees + next) % 360) + 360) % 360);
            return next;
        });
    };

    // ── Axis-aligned bbox from gpsBounds — used only for map centering/zoom
    const bounds = useMemo<[[number, number], [number, number]]>(() => {
        if (!gpsBounds?.sw || !gpsBounds?.ne ||
            typeof gpsBounds.sw.lat !== 'number' || typeof gpsBounds.sw.lng !== 'number' ||
            typeof gpsBounds.ne.lat !== 'number' || typeof gpsBounds.ne.lng !== 'number') {
            return [[-26.0, 28.0], [-25.9, 28.1]];
        }
        return [
            [gpsBounds.sw.lat, gpsBounds.sw.lng],
            [gpsBounds.ne.lat, gpsBounds.ne.lng]
        ];
    }, [gpsBounds?.sw?.lat, gpsBounds?.sw?.lng, gpsBounds?.ne?.lat, gpsBounds?.ne?.lng]);

    const center = useMemo<[number, number]>(() => [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2
    ], [bounds]);

    // ── Overlay bounds: sized to the ACTUAL building footprint, not the rotated bbox.
    // The axis-aligned bbox of a rotated rectangle is wider/taller than the original, so
    // placing an image there and then CSS-rotating produces the wrong scale/position.
    // Instead, we compute a rectangle matching the true building geographic dimensions
    // (image pixels × scale m/px), centred at the building midpoint, then CSS-rotate.
    const overlayBounds = useMemo<[[number, number], [number, number]]>(() => {
        if (scaleMetersPerPixel > 0 && floorplanSize.width > 0 && floorplanSize.height > 0 &&
            gpsBounds?.sw && gpsBounds?.ne) {
            const bldgWidthM = floorplanSize.width * scaleMetersPerPixel;
            const bldgHeightM = floorplanSize.height * scaleMetersPerPixel;
            const cLat = (gpsBounds.sw.lat + gpsBounds.ne.lat) / 2;
            const cLng = (gpsBounds.sw.lng + gpsBounds.ne.lng) / 2;
            const halfLatDeg = (bldgHeightM / 2) / 111320;
            const halfLngDeg = (bldgWidthM / 2) / (111320 * Math.cos(cLat * Math.PI / 180));
            return [
                [cLat - halfLatDeg, cLng - halfLngDeg],
                [cLat + halfLatDeg, cLng + halfLngDeg]
            ];
        }
        return bounds; // fall-back before calibration data loads
    }, [bounds, scaleMetersPerPixel, floorplanSize.width, floorplanSize.height,
        gpsBounds?.sw?.lat, gpsBounds?.sw?.lng, gpsBounds?.ne?.lat, gpsBounds?.ne?.lng]);

    // (Rotation is now handled inside RotatedOverlay — no separate useEffect needed)


    // Load existing navigation data from database
    useEffect(() => {
        const loadNavigationData = async () => {
            if (!floorplanId) {
                console.log('⏭️ Skipping load: missing floorplanId');
                return;
            }

            if (!supabase) {
                console.error('❌ Supabase client not available');
                return;
            }

            console.log(`🔄 Loading navigation data for floorplan ${floorplanId}`);

            try {
                // Fetch navigation points
                const { data: points, error: pointsError } = await supabase
                    .from('navigation_points')
                    .select('*')

                    .eq('floorplan_id', floorplanId);

                if (pointsError) throw pointsError;

                console.log(`📍 Fetched ${(points as any[] || []).length} points from database`);

                // Filter out points with null GPS coordinates (Classic Editor nodes)
                const validPoints = ((points as any[]) || []).filter((point: any) =>
                    point.gps_lat !== null &&
                    point.gps_lng !== null &&
                    !isNaN(point.gps_lat) &&
                    !isNaN(point.gps_lng)
                );

                if (points && (points as any[]).length > 0) {
                    if (validPoints.length < (points as any[]).length) {
                        console.warn(`⚠️ Filtered out ${(points as any[]).length - validPoints.length} nodes with missing GPS coordinates`);
                    }

                    // Use a Set to track unique node IDs and prevent duplicates
                    const seenIds = new Set();
                    const loadedNodes: LeafletNode[] = validPoints
                        .filter((point: any) => {
                            if (seenIds.has(point.id)) {
                                console.warn(`⚠️ Skipping duplicate point: ${point.id}`);
                                return false;
                            }
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

                    // Enhanced logging to identify duplicates
                    console.log(`✅ Loaded ${loadedNodes.length} nodes with valid GPS`);
                    console.log('📊 Node breakdown:', {
                        total: loadedNodes.length,
                        pois: loadedNodes.filter(n => n.isPOI).length,
                        regularNodes: loadedNodes.filter(n => !n.isPOI).length
                    });

                    // Check for duplicate GPS coordinates
                    const coordMap = new Map();
                    loadedNodes.forEach(node => {
                        const coordKey = `${node.lat.toFixed(6)},${node.lng.toFixed(6)}`;
                        if (!coordMap.has(coordKey)) {
                            coordMap.set(coordKey, []);
                        }
                        coordMap.get(coordKey).push({ id: node.id, name: node.name, isPOI: node.isPOI });
                    });

                    // Log any duplicate coordinates
                    coordMap.forEach((nodes, coords) => {
                        if (nodes.length > 1) {
                            console.warn(`⚠️ Multiple nodes at ${coords}:`, nodes);
                        }
                    });
                }

                // Fetch segments
                const { data: segs, error: segsError } = await supabase
                    .from('navigation_segments')
                    .select('*')

                    .eq('floorplan_id', floorplanId);

                if (segsError) throw segsError;

                console.log(`🔗 Fetched ${(segs as any[] || []).length} segments from database`);

                if (segs && (segs as any[]).length > 0) {
                    // Create a Set of valid node IDs (nodes with GPS coordinates)
                    const validNodeIds = new Set(validPoints.map((p: any) => p.id));

                    // Filter segments to only include those where both endpoints have GPS
                    const validSegments = (segs as any[]).filter((seg: any) =>
                        validNodeIds.has(seg.start_node_id) &&
                        validNodeIds.has(seg.end_node_id)
                    );

                    if (validSegments.length < (segs as any[]).length) {
                        console.warn(`⚠️ Filtered out ${(segs as any[]).length - validSegments.length} segments with invalid endpoints`);
                    }

                    // Create a map of node IDs to positions for quick lookup
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
                    console.log(`✅ Loaded ${loadedSegments.length} segments with valid endpoints`);
                }
            } catch (err) {
                console.error('❌ Error loading navigation data:', err);
                showMessage('Failed to load existing navigation data');
            }
        };

        loadNavigationData();
    }, [floorplanId]);

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleMapClick = async (lat: number, lng: number) => {
        if (drawMode === 'point' || drawMode === 'poi') {
            const nodeName = drawMode === 'poi' ? `POI ${nodes.filter(n => n.isPOI).length + 1}` : `Node ${nodes.length + 1}`;

            if (!supabase) return;

            try {
                // Convert GPS to floorplan coordinates
                const floorplanCoords = gpsToFloorplan(lat, lng, gpsBounds, floorplanSize);

                // Save to database immediately
                const { data, error } = await supabase
                    .from('navigation_points')
                    .insert({

                        floorplan_id: floorplanId,
                        name: nodeName,
                        x_coord: Math.round(floorplanCoords.x),
                        y_coord: Math.round(floorplanCoords.y),
                        gps_lat: lat,
                        gps_lng: lng,
                        point_type: drawMode === 'poi' ? 'poi' : 'node',
                        is_destination: drawMode === 'poi'
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (!data) throw new Error('No data returned');

                // Use real UUID from database
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
        // Open edit modal when clicking node (unless in specific modes)
        if (drawMode === 'delete') {
            // Delete handled by modal now
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
                // Create segment and save to database immediately
                const fromNode = nodes.find(n => n.id === selectedNodeForLine);
                const toNode = nodes.find(n => n.id === nodeId);

                if (fromNode && toNode) {
                    if (!supabase) return;

                    try {
                        // Save to database immediately
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

                        // Use real UUID from database
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
            // Default: open edit modal
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                setEditingNode(node);
                setShowEditModal(true);
            }
        }
    };

    const handleExport = async () => {
        // Convert to GraphNode format
        const graphNodes: GraphNode[] = nodes.map(node => {
            const floorplanCoords = gpsToFloorplan(node.lat, node.lng, gpsBounds, floorplanSize);
            return {
                id: node.id,
                x: floorplanCoords.x,
                y: floorplanCoords.y,
                name: node.name,
                type: node.isPOI ? 'poi' : 'node',
                metadata: {
                    gps_lat: node.lat,
                    gps_lng: node.lng
                }
            };
        });

        // Convert to GraphSegment format
        const graphSegments: GraphSegment[] = segments.map(seg => {
            const fromNode = nodes.find(n => n.id === seg.fromNodeId);
            const toNode = nodes.find(n => n.id === seg.toNodeId);
            const distance = fromNode && toNode ? calculateGPSDistance(
                { lat: fromNode.lat, lng: fromNode.lng },
                { lat: toNode.lat, lng: toNode.lng }
            ) : 0;

            return {
                id: seg.id,
                start_node_id: seg.fromNodeId,
                end_node_id: seg.toNodeId
            };
        });

        if (onExport) {
            onExport(graphNodes, graphSegments);
        }

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

    // Custom marker icon for POIs
    const poiIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Static icons for regular nodes to prevent duplicate markers
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
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDrawMode(drawMode === 'point' ? null : 'point')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'point'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📍 Add Node
                        </button>
                        <button
                            onClick={() => setDrawMode(drawMode === 'poi' ? null : 'poi')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'poi'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🎯 Add POI
                        </button>
                        <button
                            onClick={() => {
                                setDrawMode(drawMode === 'line' ? null : 'line');
                                setSelectedNodeForLine(null);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'line'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            ➖ Draw Path
                        </button>
                        <button
                            onClick={() => setDrawMode(drawMode === 'edit' ? null : 'edit')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'edit'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            title="Click nodes to edit name, type, or delete"
                        >
                            ✏️ Edit Mode
                        </button>
                        <button
                            onClick={() => setDrawMode(drawMode === 'delete' ? null : 'delete')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'delete'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🗑️ Delete
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600 font-medium">Overlay Opacity:</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={floorplanOpacity * 100}
                            onChange={(e) => setFloorplanOpacity(parseInt(e.target.value) / 100)}
                            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            title="Adjust floorplan overlay transparency"
                        />
                        <span className="text-xs text-gray-500 font-mono w-8">{Math.round(floorplanOpacity * 100)}%</span>
                    </div>

                    {/* Rotation fine-tune */}
                    <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
                        <span className="text-xs text-gray-600 font-medium mr-1">Rotation:</span>
                        <button onClick={() => adjustRotation(-5)} className="text-xs px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-mono" title="−5°">−5°</button>
                        <button onClick={() => adjustRotation(-1)} className="text-xs px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-mono" title="−1°">−1°</button>
                        <span className="text-xs font-mono w-14 text-center text-blue-700 font-semibold">{effectiveRotation.toFixed(1)}°</span>
                        <button onClick={() => adjustRotation(1)} className="text-xs px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-mono" title="+1°">+1°</button>
                        <button onClick={() => adjustRotation(5)} className="text-xs px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded font-mono" title="+5°">+5°</button>
                        {rotationOffset !== 0 && (
                            <button onClick={() => { setRotationOffset(0); onRotationChange?.(rotationDegrees); }}
                                className="text-xs px-1.5 py-0.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded ml-1" title="Reset to calibrated value">
                                Reset
                            </button>
                        )}
                    </div>

                    <span className="text-sm text-gray-600 px-3 py-2 border-l border-gray-300">
                        {nodes.length} nodes • {segments.length} paths
                    </span>
                </div>
            </div>

            {message && (
                <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
                    {message}
                </div>
            )}

            <div className="flex-1 relative">
                <MapContainer
                    center={center}
                    zoom={18}
                    maxZoom={22}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    {/* OpenStreetMap base tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Floorplan overlay — stays at 0° (natural upload orientation).
                 The map container itself is CSS-rotated to align tiles with the floorplan. */}
                    <RotatedOverlay
                        url={floorplanUrl}
                        bounds={overlayBounds}
                        opacity={floorplanOpacity}
                        rotationDeg={0}
                    />

                    {/* Map click handler — corrects click coordinates for the container rotation */}
                    <MapClickHandler
                        mode={drawMode}
                        onMapClick={handleMapClick}
                        onMarkerClick={handleMarkerClick}
                        containerRotationDeg={effectiveRotation}
                    />

                    {/* Nodes */}
                    {(() => {
                        return nodes.map(node => {
                            const isPlacingPOI = drawMode === 'poi';
                            const markerIcon = node.isPOI
                                ? poiIcon
                                : (isPlacingPOI ? nodeIconSmall : nodeIcon);

                            return (
                                <Marker
                                    key={node.id}
                                    position={[node.lat, node.lng]}
                                    icon={markerIcon}
                                    opacity={isPlacingPOI ? 0.4 : 1}
                                    eventHandlers={{
                                        click: (e) => {
                                            // Stop event from bubbling to map
                                            L.DomEvent.stopPropagation(e.originalEvent);

                                            // Disable node clicks when placing POIs
                                            if (!isPlacingPOI) {
                                                handleMarkerClick(node.id);
                                            }
                                        }
                                    }}
                                />
                            );
                        });
                    })()}

                    {/* Segments */}
                    {segments.map(seg => {
                        // Make paths more transparent when placing POIs
                        const isPlacingPOI = drawMode === 'poi';
                        return (
                            <Polyline
                                key={seg.id}
                                positions={seg.path}
                                pathOptions={{
                                    color: 'blue',
                                    weight: isPlacingPOI ? 2 : 3,
                                    opacity: isPlacingPOI ? 0.3 : 0.7
                                }}
                            />
                        );
                    })}

                    {/* Highlight selected node for line drawing */}
                    {selectedNodeForLine && (
                        <Marker
                            position={[
                                nodes.find(n => n.id === selectedNodeForLine)!.lat,
                                nodes.find(n => n.id === selectedNodeForLine)!.lng
                            ]}
                            icon={new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })}
                        />
                    )}
                </MapContainer>
            </div>

            {/* Edit Modal */}
            {
                showEditModal && editingNode && (
                    <LeafletNodeEditModal
                        eventId={eventId}
                        floorplanId={floorplanId}
                        node={editingNode}
                        onSave={handleNodeEditSave}
                        onDelete={handleNodeDelete}
                        onClose={() => {
                            setShowEditModal(false);
                            setEditingNode(null);
                        }}
                    />
                )
            }
        </div >
    );
};

export default LeafletMapEditor;
