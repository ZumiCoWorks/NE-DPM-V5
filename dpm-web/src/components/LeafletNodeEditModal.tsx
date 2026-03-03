import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash2, MapPin, Link as LinkIcon } from 'lucide-react';

interface LeafletNodeEditModalProps {
    eventId: string;
    floorplanId: string;
    node: {
        id: string;
        lat: number;
        lng: number;
        name: string;
        isPOI: boolean;
        linkedNodeId?: string;
        pointType?: string;
    };
    onSave: (updatedNode: { id: string; name: string; isPOI: boolean; linkedNodeId?: string; pointType?: string }) => void;
    onDelete: (nodeId: string) => void;
    onClose: () => void;
}

export const LeafletNodeEditModal: React.FC<LeafletNodeEditModalProps> = ({
    eventId,
    floorplanId,
    node,
    onSave,
    onDelete,
    onClose
}) => {
    const [name, setName] = useState(node.name);
    const [isPOI, setIsPOI] = useState(node.isPOI);

    // Transition Node State
    const [isTransition, setIsTransition] = useState(node.pointType === 'transition' || !!node.linkedNodeId);
    const [targetFloorplanId, setTargetFloorplanId] = useState<string>('');
    const [targetNodeId, setTargetNodeId] = useState<string>(node.linkedNodeId || '');

    // Data fetching state
    const [availableFloorplans, setAvailableFloorplans] = useState<any[]>([]);
    const [availableNodes, setAvailableNodes] = useState<any[]>([]);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Fetch other floorplans for this event
    useEffect(() => {
        const fetchFloorplans = async () => {
            if (!supabase || !eventId) return;
            const query: any = supabase
                .from('floorplans')
                .select('id, name')
                .eq('event_id', eventId);
            const { data } = await query.neq('id', floorplanId);

            if (data) {
                setAvailableFloorplans(data);
                // If we already have a linked node, we need to figure out its floorplan ID to populate the dropdown
                if (node.linkedNodeId) {
                    const { data: linkedNodeData } = await supabase
                        .from('navigation_points')
                        .select('floorplan_id')
                        .eq('id', node.linkedNodeId)
                        .single();
                    if (linkedNodeData) {
                        setTargetFloorplanId((linkedNodeData as any).floorplan_id);
                    }
                }
            }
        };
        fetchFloorplans();
    }, [eventId, floorplanId, node.linkedNodeId]);

    // Fetch nodes when a target floorplan is selected
    useEffect(() => {
        const fetchNodes = async () => {
            if (!supabase || !targetFloorplanId) {
                setAvailableNodes([]);
                return;
            }
            const { data } = await supabase
                .from('navigation_points')
                .select('id, name')
                .eq('floorplan_id', targetFloorplanId);
            if (data) setAvailableNodes(data as any[]);
        };
        fetchNodes();
    }, [targetFloorplanId]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Name cannot be empty');
            return;
        }

        if (isTransition && (!targetFloorplanId || !targetNodeId)) {
            alert('Please select a target floorplan and node to link to, or uncheck Transition Node.');
            return;
        }

        try {
            setSaving(true);
            const finalPointType = isTransition ? 'transition' : (isPOI ? 'poi' : 'node');
            const finalLinkedNodeId = isTransition ? targetNodeId : null;

            // Update in database if it's a real node (not temp)
            if (supabase && !node.id.startsWith('node-')) {
                const { error } = await supabase
                    .from('navigation_points')
                    .update({
                        name: name.trim(),
                        point_type: finalPointType,
                        is_destination: isPOI,
                        linked_node_id: finalLinkedNodeId
                    })
                    .eq('id', node.id);

                if (error) {
                    console.error('Error updating node:', error);
                    alert('Failed to save changes. Please try again.');
                    return;
                }
            }

            onSave({
                id: node.id,
                name: name.trim(),
                isPOI,
                pointType: finalPointType,
                linkedNodeId: finalLinkedNodeId || undefined
            });
            onClose();
        } catch (err) {
            console.error('Error saving node:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${node.name}"? This will also remove all connected paths.`)) {
            return;
        }

        try {
            setDeleting(true);

            // Delete from database if it's a real node
            if (supabase && !node.id.startsWith('node-')) {
                // Delete connected segments (from_node_id)
                await supabase
                    .from('navigation_segments')
                    .delete()
                    .eq('start_node_id', node.id);

                // Delete connected segments (to_node_id)
                await supabase
                    .from('navigation_segments')
                    .delete()
                    .eq('end_node_id', node.id);

                // Delete the node
                const { error } = await supabase
                    .from('navigation_points')
                    .delete()
                    .eq('id', node.id);

                if (error) {
                    console.error('Error deleting node:', error);
                    alert('Failed to delete. Please try again.');
                    return;
                }
            }

            onDelete(node.id);
            onClose();
        } catch (err) {
            console.error('Error deleting node:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                        Edit {isTransition ? 'Transition Node' : (isPOI ? 'POI' : 'Node')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* GPS Coordinates */}
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 border border-gray-100">
                        <p><strong>GPS:</strong> {node.lat.toFixed(6)}, {node.lng.toFixed(6)}</p>
                    </div>

                    {/* Name */}
                    <div>
                        <label htmlFor="node-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            id="node-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={isTransition ? "e.g., Stairs to Level 5" : (isPOI ? "e.g., MTN Booth" : "e.g., Intersection A")}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Type Toggle */}
                    <div className="flex flex-col space-y-3 pt-2">
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="is-poi"
                                checked={isPOI}
                                onChange={(e) => {
                                    setIsPOI(e.target.checked);
                                    if (e.target.checked) setIsTransition(false);
                                }}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                                <label htmlFor="is-poi" className="font-medium text-gray-900 cursor-pointer">
                                    Mark as POI (Point of Interest)
                                </label>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Destinations that attendees can navigate to
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 pt-2 border-t border-gray-100">
                            <input
                                type="checkbox"
                                id="is-transition"
                                checked={isTransition}
                                onChange={(e) => {
                                    setIsTransition(e.target.checked);
                                    if (e.target.checked) setIsPOI(false);
                                }}
                                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                                <label htmlFor="is-transition" className="font-medium text-purple-900 cursor-pointer flex items-center">
                                    <LinkIcon className="h-4 w-4 mr-1.5" />
                                    Transition Node (Stairs/Doors)
                                </label>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Link this node to another floorplan's map
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transition Linking Controls */}
                    {isTransition && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-purple-900 mb-1">
                                    Target Floorplan
                                </label>
                                <select
                                    value={targetFloorplanId}
                                    onChange={(e) => {
                                        setTargetFloorplanId(e.target.value);
                                        setTargetNodeId('');
                                    }}
                                    className="block w-full px-3 py-2 border border-purple-200 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                                >
                                    <option value="">Select a floorplan...</option>
                                    {availableFloorplans.map(fp => (
                                        <option key={fp.id} value={fp.id}>
                                            {fp.name || 'Unnamed Floorplan'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {targetFloorplanId && (
                                <div>
                                    <label className="block text-sm font-medium text-purple-900 mb-1">
                                        Target Node
                                    </label>
                                    <select
                                        value={targetNodeId}
                                        onChange={(e) => setTargetNodeId(e.target.value)}
                                        className="block w-full px-3 py-2 border border-purple-200 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                                    >
                                        <option value="">Select a node to link to...</option>
                                        {availableNodes.map(node => (
                                            <option key={node.id} value={node.id}>
                                                {node.name || 'Unnamed Node'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between p-4 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={handleDelete}
                        disabled={deleting || saving}
                        className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || deleting || !name.trim() || (isTransition && (!targetFloorplanId || !targetNodeId))}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

