import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash2, MapPin } from 'lucide-react';

interface LeafletNodeEditModalProps {
    node: {
        id: string;
        lat: number;
        lng: number;
        name: string;
        isPOI: boolean;
    };
    onSave: (updatedNode: { id: string; name: string; isPOI: boolean }) => void;
    onDelete: (nodeId: string) => void;
    onClose: () => void;
}

export const LeafletNodeEditModal: React.FC<LeafletNodeEditModalProps> = ({
    node,
    onSave,
    onDelete,
    onClose
}) => {
    const [name, setName] = useState(node.name);
    const [isPOI, setIsPOI] = useState(node.isPOI);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Name cannot be empty');
            return;
        }

        try {
            setSaving(true);

            // Update in database if it's a real node (not temp)
            if (supabase && !node.id.startsWith('node-')) {
                const { error } = await supabase
                    .from('navigation_points')
                    .update({
                        name: name.trim(),
                        point_type: isPOI ? 'poi' : 'node',
                        is_destination: isPOI
                    })
                    .eq('id', node.id);

                if (error) {
                    console.error('Error updating node:', error);
                    alert('Failed to save changes. Please try again.');
                    return;
                }
            }

            onSave({ id: node.id, name: name.trim(), isPOI });
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
                        Edit {node.isPOI ? 'POI' : 'Node'}
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
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
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
                            placeholder={isPOI ? "e.g., MTN Booth, Food Court" : "e.g., Intersection A, Waypoint 1"}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Type Toggle */}
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="is-poi"
                            checked={isPOI}
                            onChange={(e) => setIsPOI(e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                            <label htmlFor="is-poi" className="font-medium text-gray-900 cursor-pointer">
                                Mark as POI (Point of Interest)
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                                POIs are destinations that attendees can navigate to
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between p-4 border-t bg-gray-50">
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
                            disabled={saving || deleting || !name.trim()}
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
