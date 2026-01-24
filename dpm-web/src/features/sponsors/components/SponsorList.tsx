import React, { useState, useEffect } from 'react';
import { sponsorService } from '../services/SponsorService';
import type { Sponsor } from '../types/Sponsor';

interface SponsorListProps {
    eventId: string;
}

export const SponsorList: React.FC<SponsorListProps> = ({ eventId }) => {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        loadSponsors();
    }, [eventId]);

    const loadSponsors = async () => {
        try {
            setLoading(true);
            const data = await sponsorService.getEventSponsors(eventId);
            setSponsors(data);
        } catch (error) {
            console.error('Failed to load sponsors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = async (sponsor: Sponsor) => {
        if (!sponsor.signup_token) return;

        const link = sponsorService.generateSignupLink(sponsor.id, sponsor.signup_token);
        await navigator.clipboard.writeText(link);
        setCopiedId(sponsor.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (sponsorId: string) => {
        if (!confirm('Are you sure you want to delete this sponsor?')) return;

        try {
            await sponsorService.deleteSponsor(sponsorId);
            setSponsors(sponsors.filter(s => s.id !== sponsorId));
        } catch (error) {
            console.error('Failed to delete sponsor:', error);
            alert('Failed to delete sponsor');
        }
    };

    const getTierColor = (tier: string) => {
        const colors = {
            bronze: 'bg-orange-100 text-orange-800',
            silver: 'bg-gray-100 text-gray-800',
            gold: 'bg-yellow-100 text-yellow-800',
            platinum: 'bg-purple-100 text-purple-800'
        };
        return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <div className="text-center py-8">Loading sponsors...</div>;
    }

    if (sponsors.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No sponsors yet. Add your first sponsor to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sponsors.map((sponsor) => (
                <div
                    key={sponsor.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900">{sponsor.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(sponsor.tier)}`}>
                                    {sponsor.tier.toUpperCase()}
                                </span>
                                {sponsor.signup_completed && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                        ✓ Onboarded
                                    </span>
                                )}
                            </div>

                            {sponsor.booth_location && (
                                <p className="text-sm text-gray-600 mt-1">📍 {sponsor.booth_location}</p>
                            )}

                            {sponsor.contact_email && (
                                <p className="text-sm text-gray-600 mt-1">✉️ {sponsor.contact_email}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {sponsor.signup_token && !sponsor.signup_completed && (
                                <button
                                    onClick={() => handleCopyLink(sponsor)}
                                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    {copiedId === sponsor.id ? '✓ Copied!' : '🔗 Copy Link'}
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(sponsor.id)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
