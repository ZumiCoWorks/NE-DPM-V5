import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Upload, MapPin } from 'lucide-react';

interface NodeEditModalProps {
    node: {
        id: string;
        name: string;
        x: number;
        y: number;
        qr_id?: string | null;
        is_landmark?: boolean;
        landmark_name?: string | null;
        landmark_description?: string | null;
        landmark_photo_url?: string | null;
    };
    onSave: () => void;
    onClose: () => void;
    eventId: string;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({ node, onSave, onClose, eventId }) => {
    const [isLandmark, setIsLandmark] = useState(node.is_landmark || false);
    const [landmarkName, setLandmarkName] = useState(node.landmark_name || '');
    const [landmarkDesc, setLandmarkDesc] = useState(node.landmark_description || '');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const handlePhotoUpload = async (): Promise<string | null> => {
        if (!photoFile) return node.landmark_photo_url || null;

        try {
            setUploading(true);
            const fileName = `landmarks/${eventId}/${node.id}_${Date.now()}.${photoFile.name.split('.').pop()}`;

            const { data, error } = await supabase.storage
                .from('floorplans')
                .upload(fileName, photoFile, {
                    contentType: photoFile.type,
                    upsert: true
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('floorplans')
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Failed to upload photo. Please try again.');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            let photoUrl = node.landmark_photo_url;

            // Upload photo if provided
            if (photoFile) {
                photoUrl = await handlePhotoUpload();
                if (!photoUrl && photoFile) {
                    // Upload failed
                    return;
                }
            }

            // Update database
            const { error } = await supabase
                .from('navigation_points')
                .update({
                    is_landmark: isLandmark,
                    landmark_name: isLandmark ? landmarkName.trim() || null : null,
                    landmark_description: isLandmark ? landmarkDesc.trim() || null : null,
                    landmark_photo_url: isLandmark ? photoUrl : null
                })
                .eq('id', node.id);

            if (error) {
                console.error('Error updating node:', error);
                alert('Failed to save changes. Please try again.');
                return;
            }

            alert('✅ Node updated successfully!');
            onSave();
            onClose();
        } catch (err) {
            console.error('Error saving node:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                        Edit Node: {node.name}
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
                    {/* Node Info */}
                    <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                        <p><strong>Position:</strong> ({Math.round(node.x)}, {Math.round(node.y)})</p>
                        {node.qr_id && <p><strong>QR Code:</strong> {node.qr_id}</p>}
                    </div>

                    {/* Landmark Toggle */}
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="is-landmark"
                            checked={isLandmark}
                            onChange={(e) => setIsLandmark(e.target.checked)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                            <label htmlFor="is-landmark" className="font-medium text-gray-900 cursor-pointer">
                                Mark as Landmark
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                                Landmarks help attendees navigate when GPS signal is weak
                            </p>
                        </div>
                    </div>

                    {/* Landmark Fields (shown when checked) */}
                    {isLandmark && (
                        <div className="space-y-4 pl-7 border-l-2 border-blue-200">
                            {/* Landmark Name */}
                            <div>
                                <label htmlFor="landmark-name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Landmark Name *
                                </label>
                                <input
                                    type="text"
                                    id="landmark-name"
                                    value={landmarkName}
                                    onChange={(e) => setLandmarkName(e.target.value)}
                                    placeholder="e.g., Red Food Truck, Main Fountain"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose something visually distinctive
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="landmark-desc" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description for Attendees
                                </label>
                                <textarea
                                    id="landmark-desc"
                                    rows={3}
                                    value={landmarkDesc}
                                    onChange={(e) => setLandmarkDesc(e.target.value)}
                                    placeholder="e.g., Large red truck selling tacos near the main entrance"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Help attendees recognize this landmark
                                </p>
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Photo (Optional)
                                </label>
                                <div className="flex items-center space-x-3">
                                    <label className="flex-1 cursor-pointer">
                                        <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                            <Upload className="h-4 w-4 mr-2" />
                                            {photoFile ? photoFile.name : 'Choose File'}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                {node.landmark_photo_url && !photoFile && (
                                    <div className="mt-2">
                                        <img
                                            src={node.landmark_photo_url}
                                            alt="Current landmark"
                                            className="h-20 w-20 object-cover rounded border"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Current photo</p>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Photo helps attendees visually confirm location
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading || (isLandmark && !landmarkName.trim())}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
