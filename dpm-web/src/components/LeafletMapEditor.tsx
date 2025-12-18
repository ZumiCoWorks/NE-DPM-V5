import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GraphNode, GraphSegment } from '../lib/pathfinding';
import { GPSBounds } from '../lib/gpsNavigation';
import { gpsToFloorplan, floorplanToGPS, calculateGPSDistance } from '../lib/coordinateConversion';

// Fix Leaflet default marker icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapEditorProps {
    eventId: string;
    floorplanUrl: string;
    gpsBounds: GPSBounds;
    floorplanSize?: { width: number; height: number };
    onExport?: (nodes: GraphNode[], segments: GraphSegment[]) => void;
}

interface LeafletNode {
    id: string;
    lat: number;
    lng: number;
    name: string;
    isPOI: boolean;
}

interface LeafletSegment {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    path: [number, number][];
}

type DrawMode = 'point' | 'line' | 'poi' | 'edit' | 'delete' | null;

// Map event handler component
function MapClickHandler({
    mode,
    onMapClick,
    onMarkerClick
}: {
    mode: DrawMode;
    onMapClick: (lat: number, lng: number) => void;
    onMarkerClick: (id: string) => void;
}) {
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
    floorplanUrl,
    gpsBounds,
    floorplanSize = { width: 1000, height: 1000 },
    onExport
}) => {
    const [nodes, setNodes] = useState<LeafletNode[]>([]);
    const [segments, setSegments] = useState<LeafletSegment[]>([]);
    const [drawMode, setDrawMode] = useState<DrawMode>(null);
    const [selectedNodeForLine, setSelectedNodeForLine] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');

    // Calculate map bounds from GPS bounds
    const bounds: [[number, number], [number, number]] = [
        [gpsBounds.sw.lat, gpsBounds.sw.lng],
        [gpsBounds.ne.lat, gpsBounds.ne.lng]
    ];

    const center: [number, number] = [
        (gpsBounds.sw.lat + gpsBounds.ne.lat) / 2,
        (gpsBounds.sw.lng + gpsBounds.ne.lng) / 2
    ];

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleMapClick = (lat: number, lng: number) => {
        if (drawMode === 'point' || drawMode === 'poi') {
            const newNode: LeafletNode = {
                id: `node-${Date.now()}`,
                lat,
                lng,
                name: drawMode === 'poi' ? `POI ${nodes.filter(n => n.isPOI).length + 1}` : `Node ${nodes.length + 1}`,
                isPOI: drawMode === 'poi'
            };
            setNodes([...nodes, newNode]);
            showMessage(`Added ${drawMode === 'poi' ? 'POI' : 'node'}: ${newNode.name}`);
        }
    };

    const handleMarkerClick = (nodeId: string) => {
        if (drawMode === 'delete') {
            // Delete node and all connected segments
            setNodes(nodes.filter(n => n.id !== nodeId));
            setSegments(segments.filter(s => s.fromNodeId !== nodeId && s.toNodeId !== nodeId));
            showMessage('Node deleted');
        } else if (drawMode === 'line') {
            if (!selectedNodeForLine) {
                setSelectedNodeForLine(nodeId);
                showMessage('Click another node to connect');
            } else if (selectedNodeForLine !== nodeId) {
                // Create segment
                const fromNode = nodes.find(n => n.id === selectedNodeForLine);
                const toNode = nodes.find(n => n.id === nodeId);

                if (fromNode && toNode) {
                    const newSegment: LeafletSegment = {
                        id: `seg-${Date.now()}`,
                        fromNodeId: selectedNodeForLine,
                        toNodeId: nodeId,
                        path: [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]]
                    };
                    setSegments([...segments, newSegment]);
                    showMessage('Segment created');
                }
                setSelectedNodeForLine(null);
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

    // Custom marker icon for POIs
    const poiIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
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
                            onClick={() => setDrawMode(drawMode === 'delete' ? null : 'delete')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${drawMode === 'delete'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            🗑️ Delete
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <span className="text-sm text-gray-600 px-3 py-2">
                            {nodes.length} nodes • {segments.length} paths
                        </span>
                        <button
                            onClick={handleExport}
                            disabled={nodes.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            💾 Export to Database
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm">
                        {message}
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={center}
                    zoom={18}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    {/* Floorplan overlay */}
                    <ImageOverlay
                        url={floorplanUrl}
                        bounds={bounds}
                        opacity={0.7}
                    />

                    {/* Map click handler */}
                    <MapClickHandler
                        mode={drawMode}
                        onMapClick={handleMapClick}
                        onMarkerClick={handleMarkerClick}
                    />

                    {/* Nodes */}
                    {nodes.map(node => (
                        <Marker
                            key={node.id}
                            position={[node.lat, node.lng]}
                            icon={node.isPOI ? poiIcon : new L.Icon.Default()}
                            eventHandlers={{
                                click: () => handleMarkerClick(node.id)
                            }}
                        />
                    ))}

                    {/* Segments */}
                    {segments.map(seg => (
                        <Polyline
                            key={seg.id}
                            positions={seg.path}
                            pathOptions={{ color: 'blue', weight: 3, opacity: 0.7 }}
                        />
                    ))}

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
        </div>
    );
};

export default LeafletMapEditor;
