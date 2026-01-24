import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SponsorList } from '../../features/sponsors/components/SponsorList';
import { AddSponsorModal } from '../../features/sponsors/components/AddSponsorModal';

export const SponsorManagementPage: React.FC = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    if (!eventId) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">No event selected. Please select an event first.</p>
                </div>
            </div>
        );
    }

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1); // Trigger re-render of SponsorList
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sponsor Management</h1>
                        <p className="text-gray-600 mt-1">
                            Manage event sponsors and generate onboarding links
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        + Add Sponsor
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SponsorList key={refreshKey} eventId={eventId} />
            </div>

            <AddSponsorModal
                eventId={eventId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />

            {/* Help Section */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 How it works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>1. Add sponsors and assign them a tier (Bronze, Silver, Gold, Platinum)</li>
                    <li>2. Copy the unique signup link generated for each sponsor</li>
                    <li>3. Send the link to sponsors via email or WhatsApp</li>
                    <li>4. Sponsors complete their profile and get access to their analytics dashboard</li>
                </ul>
            </div>
        </div>
    );
};
