import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sponsorService } from '../../features/sponsors/services/SponsorService';
import type { Sponsor } from '../../features/sponsors/types/Sponsor';

export const SponsorSignupPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [sponsor, setSponsor] = useState<Sponsor | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        logo_url: ''
    });

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        verifySponsor();
    }, [token]);

    const verifySponsor = async () => {
        try {
            const data = await sponsorService.verifySponsorToken(token!);
            if (data) {
                setSponsor(data);
            }
        } catch (error) {
            console.error('Failed to verify token:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setSubmitting(true);
        try {
            await sponsorService.completeSponsorSignup({
                token,
                ...formData
            });

            alert('Signup completed! You can now access your sponsor dashboard.');
            navigate('/sponsor/dashboard'); // TODO: Create sponsor dashboard
        } catch (error) {
            console.error('Failed to complete signup:', error);
            alert('Failed to complete signup. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying signup link...</p>
                </div>
            </div>
        );
    }

    if (!token || !sponsor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <div className="text-center">
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Signup Link</h1>
                        <p className="text-gray-600">
                            This signup link is invalid or has already been used. Please contact the event organizer for a new link.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome, {sponsor.name}!
                        </h1>
                        <p className="text-gray-600">
                            Complete your sponsor profile to access your analytics dashboard
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">🎯</div>
                            <div>
                                <h3 className="font-semibold text-blue-900">Your Sponsorship Details</h3>
                                <p className="text-sm text-blue-800 mt-1">
                                    Tier: <span className="font-medium">{sponsor.tier.toUpperCase()}</span>
                                    {sponsor.booth_location && (
                                        <> • Booth: <span className="font-medium">{sponsor.booth_location}</span></>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="john@company.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+27 12 345 6789"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Logo URL (optional)
                            </label>
                            <input
                                type="url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                        >
                            {submitting ? 'Completing Signup...' : 'Complete Signup'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
