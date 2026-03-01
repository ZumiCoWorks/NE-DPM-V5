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
            bronze: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
            silver: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
            gold: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
            platinum: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        };
        return colors[tier as keyof typeof colors] || 'bg-gray-500/10 text-white/50 border border-[#3A3A3A]';
    };

    if (loading) {
        return <div className="text-center py-8 text-white/50">Loading sponsors...</div>;
    }

    if (sponsors.length === 0) {
        return (
            <div className="text-center py-12 bg-[#1C1C1F] border border-[#2A2A2A] rounded-xl">
                <p className="text-white/50">No sponsors yet. Add your first sponsor to get started.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sponsors.map((sponsor) => (
                <div
                    key={sponsor.id}
                    className="bg-[#1C1C1F] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-colors duration-200"
                >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white/90">{sponsor.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTierColor(sponsor.tier)}`}>
                                    {sponsor.tier}
                                </span>
                                {sponsor.signup_completed && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-400/10 text-green-400 border border-green-400/20">
                                        ✓ Onboarded
                                    </span>
                                )}
                            </div>

                            {sponsor.booth_location && (
                                <p className="text-sm text-white/50 mt-1 flex items-center gap-1.5">
                                    <span className="text-brand-red">📍</span> {sponsor.booth_location}
                                </p>
                            )}

                            {sponsor.contact_email && (
                                <p className="text-sm text-white/50 mt-1 flex items-center gap-1.5">
                                    <span className="text-logic-blue">✉️</span> {sponsor.contact_email}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-start">
                            {sponsor.signup_token && !sponsor.signup_completed && (
                                <button
                                    onClick={() => handleCopyLink(sponsor)}
                                    className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-[#2A2A2A] hover:bg-[#3A3A3A] border border-[#3A3A3A] hover:border-[#4A4A4A] rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    {copiedId === sponsor.id ? '✓ Copied!' : '🔗 Copy Link'}
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(sponsor.id)}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg transition-colors"
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
