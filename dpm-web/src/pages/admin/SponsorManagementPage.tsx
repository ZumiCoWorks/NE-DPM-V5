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
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                    <p className="text-red-400 font-medium">No event selected. Please select an event first.</p>
                </div>
            </div>
        );
    }

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1); // Trigger re-render of SponsorList
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-white/90">Sponsor Management</h1>
                    <p className="text-sm text-white/50 mt-1">
                        Manage event sponsors and generate onboarding links
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-brand-red/50 text-sm font-medium rounded-lg shadow-sm text-brand-red bg-brand-red/10 hover:bg-brand-red/20 transition-colors whitespace-nowrap"
                >
                    <span className="mr-2">+</span> Add Sponsor
                </button>
            </div>

            <div className="bg-[#111113] rounded-xl shadow-sm border border-[#2A2A2A] overflow-hidden">
                <SponsorList key={refreshKey} eventId={eventId} />
            </div>

            <AddSponsorModal
                eventId={eventId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />

            {/* Help Section */}
            <div className="bg-[#1C1C1F] border border-[#2A2A2A] rounded-xl p-6">
                <h3 className="font-semibold text-white/90 mb-3 flex items-center gap-2">
                    <span className="text-brand-red">💡</span> How it works
                </h3>
                <ul className="text-sm text-white/60 space-y-2">
                    <li className="flex items-start gap-2">
                        <span className="text-white/30 font-mono text-xs mt-0.5">1.</span>
                        Add sponsors and assign them a tier (Bronze, Silver, Gold, Platinum)
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-white/30 font-mono text-xs mt-0.5">2.</span>
                        Copy the unique signup link generated for each sponsor
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-white/30 font-mono text-xs mt-0.5">3.</span>
                        Send the link to sponsors via email or WhatsApp
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-white/30 font-mono text-xs mt-0.5">4.</span>
                        Sponsors complete their profile and get access to their analytics dashboard
                    </li>
                </ul>
            </div>
        </div>
    );
};
