import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WaitlistService } from '../features/waitlist/services/WaitlistService';

/**
 * NavEaze Waitlist Page
 * Captures email addresses for early access to NavEaze
 */

export const WaitlistPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [organization, setOrganization] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Save to database
        const result = await WaitlistService.addSignup({
            full_name: fullName,
            email: email,
            organization: organization || undefined,
        });

        if (result.success) {
            setSubmitted(true);
        } else {
            setError(result.error || 'Failed to join waitlist. Please try again.');
        }

        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-ultra-dark flex items-center justify-center px-8">
                <div className="max-w-2xl w-full text-center">
                    {/* Success State */}
                    <div className="mb-8">
                        <div className="text-8xl mb-6">✓</div>
                        <h1 className="text-5xl font-poppins font-black text-white mb-6">
                            You're on the list!
                        </h1>
                        <p className="text-xl font-inter text-white/70 mb-8">
                            We'll notify you at <span className="text-naveaze-red font-semibold">{email}</span> when
                            NavEaze launches.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/naveaze-landing')}
                        className="px-8 py-4 rounded-xl text-lg font-poppins font-bold bg-naveaze-red text-white hover:bg-naveaze-red/90 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                            boxShadow: '0 0 40px #FF4D3240',
                        }}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ultra-dark">
            {/* Header with Logo */}
            <header className="py-8 px-8 border-b border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src="/remotion/nav-eaze-logo-dark.svg"
                            alt="NavEaze"
                            className="h-12"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/naveaze-landing')}
                        className="text-white/70 hover:text-white font-inter transition-colors"
                    >
                        ← Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex items-center justify-center px-8 py-20">
                <div className="max-w-2xl w-full">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-6xl font-poppins font-black text-white mb-6">
                            Join the <span className="text-naveaze-red">Waitlist</span>
                        </h1>
                        <p className="text-xl font-inter text-white/70 mb-4">
                            Be the first to experience the future of event navigation.
                        </p>
                        <p className="text-lg font-inter text-white/50">
                            Get early access, exclusive updates, and special launch pricing.
                        </p>
                    </div>

                    {/* Waitlist Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white/5 border-2 border-naveaze-red/30 rounded-2xl p-8 backdrop-blur-sm">
                            {/* Full Name */}
                            <div className="mb-6">
                                <label
                                    htmlFor="fullName"
                                    className="block text-sm font-poppins font-semibold text-white/90 mb-2"
                                >
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-naveaze-red focus:ring-2 focus:ring-naveaze-red/50 transition-all font-inter"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email */}
                            <div className="mb-6">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-poppins font-semibold text-white/90 mb-2"
                                >
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-naveaze-red focus:ring-2 focus:ring-naveaze-red/50 transition-all font-inter"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {/* Organization (Optional) */}
                            <div className="mb-6">
                                <label
                                    htmlFor="organization"
                                    className="block text-sm font-poppins font-semibold text-white/90 mb-2"
                                >
                                    Organization <span className="text-white/40 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    id="organization"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-naveaze-red focus:ring-2 focus:ring-naveaze-red/50 transition-all font-inter"
                                    placeholder="Your Company or Event"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                    <p className="text-red-400 font-inter text-sm">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-8 py-4 rounded-xl text-xl font-poppins font-bold bg-naveaze-red text-white hover:bg-naveaze-red/90 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                style={{
                                    boxShadow: '0 0 40px #FF4D3240',
                                }}
                            >
                                {loading ? 'Joining...' : 'Join the Waitlist'}
                            </button>
                        </div>

                        {/* Privacy Note */}
                        <p className="text-center text-sm font-inter text-white/40">
                            We respect your privacy. No spam, ever. Unsubscribe anytime.
                        </p>
                    </form>

                    {/* Benefits */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-4xl mb-3">🎟️</div>
                            <h3 className="text-lg font-poppins font-bold text-white mb-2">Early Access</h3>
                            <p className="text-sm font-inter text-white/60">
                                Be among the first to use NavEaze
                            </p>
                        </div>

                        <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-4xl mb-3">💰</div>
                            <h3 className="text-lg font-poppins font-bold text-white mb-2">Special Pricing</h3>
                            <p className="text-sm font-inter text-white/60">
                                Exclusive launch discounts
                            </p>
                        </div>

                        <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-4xl mb-3">🔔</div>
                            <h3 className="text-lg font-poppins font-bold text-white mb-2">Stay Updated</h3>
                            <p className="text-sm font-inter text-white/60">
                                Get product news and updates
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
