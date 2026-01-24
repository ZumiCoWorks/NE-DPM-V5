import React, { useState } from 'react';
import { sponsorService } from '../services/SponsorService';
import type { SponsorTier } from '../types/Sponsor';

interface AddSponsorModalProps {
    eventId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddSponsorModal: React.FC<AddSponsorModalProps> = ({
    eventId,
    isOpen,
    onClose,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        name: '',
        tier: 'bronze' as SponsorTier,
        booth_location: '',
        contact_email: ''
    });
    const [loading, setLoading] = useState(false);
    const [signupLink, setSignupLink] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const sponsor = await sponsorService.registerSponsor({
                ...formData,
                event_id: eventId
            });

            // Generate signup link
            if (sponsor.signup_token) {
                const link = sponsorService.generateSignupLink(sponsor.id, sponsor.signup_token);
                setSignupLink(link);
            }

            onSuccess();
        } catch (error) {
            console.error('Failed to add sponsor:', error);
            alert('Failed to add sponsor. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!signupLink) return;
        await navigator.clipboard.writeText(signupLink);
        alert('Signup link copied to clipboard!');
    };

    const handleClose = () => {
        setFormData({
            name: '',
            tier: 'bronze',
            booth_location: '',
            contact_email: ''
        });
        setSignupLink(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {signupLink ? 'Sponsor Added!' : 'Add New Sponsor'}
                    </h2>

                    {signupLink ? (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Sponsor has been registered. Share this link with them to complete their onboarding:
                            </p>

                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-sm text-gray-800 break-all font-mono">{signupLink}</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopyLink}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                >
                                    📋 Copy Link
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sponsor Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., MTN, Coca-Cola"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sponsor Tier *
                                </label>
                                <select
                                    value={formData.tier}
                                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as SponsorTier })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="bronze">Bronze</option>
                                    <option value="silver">Silver</option>
                                    <option value="gold">Gold</option>
                                    <option value="platinum">Platinum</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Booth Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.booth_location}
                                    onChange={(e) => setFormData({ ...formData, booth_location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Hall A, Booth 12"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="sponsor@company.com"
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Sponsor'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
