import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@remotion/player';
import { HeroVideo } from '../../remotion/compositions/HeroVideo';
import { HeatmapAnimation } from '../../remotion/compositions/HeatmapAnimation';
import { PaperKillerCounter } from '../../remotion/compositions/PaperKillerCounter';
import { MirrorPivot } from '../components/landing/MirrorPivot';

/**
 * NavEaze Marketing Landing Page
 * High-motion landing page with Remotion programmatic video compositions
 * Features dual-mode system (Data Architect vs Helpful Companion)
 */

export const NavEazeLandingPage: React.FC = () => {
    const [mode, setMode] = useState<'architect' | 'companion'>('companion');
    const navigate = useNavigate();

    // Dynamic props based on mode
    const accentColor = mode === 'architect' ? '#3B82F6' : '#FF4D32';
    const tagline =
        mode === 'architect'
            ? 'Turning physical movement into digital currency.'
            : 'Certainty in Chaos. Find your way. Keep your tribe.';

    return (
        <div className="min-h-screen bg-ultra-dark relative">
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center">
                <div className="flex items-center">
                    <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-8" />
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20"
                >
                    Log In
                </button>
            </div>
            {/* Hero Section with Remotion Player */}
            <section className="relative w-full h-screen">
                <Player
                    component={HeroVideo as React.FC<any>}
                    inputProps={{
                        mode,
                        accentColor,
                        tagline,
                        title: mode === 'architect' ? (
                            <>
                                <span style={{ color: '#3B82F6' }}>Eradicate</span> <br /> The Black Box
                            </>
                        ) : (
                            <>
                                <span style={{ color: '#FF4D32' }}>Certainty</span> <br /> in Chaos
                            </>
                        )
                    }}
                    durationInFrames={240}
                    compositionWidth={1920}
                    compositionHeight={1080}
                    fps={60}
                    loop
                    autoPlay
                    controls={false}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            </section>

            {/* Mirror Pivot Toggle */}
            <section className="relative z-10 -mt-20">
                <MirrorPivot mode={mode} onModeChange={setMode} />
            </section>

            {/* Mode-Specific Content Section */}
            <section className="py-20 px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-poppins font-black text-white mb-6">
                            {mode === 'architect' ? (
                                <>
                                    <span className="text-logic-blue">Eradicate</span> The Black Box
                                </>
                            ) : (
                                <>
                                    <span className="text-naveaze-red">Certainty</span> in Chaos
                                </>
                            )}
                        </h2>
                        <p className="text-xl font-inter text-white/70 max-w-3xl mx-auto">
                            {mode === 'architect'
                                ? 'Transform crowd movement into actionable intelligence. Justify safety to insurers, monitor real-time CDV (Crowd Density Value), and prevent bottlenecks before they happen.'
                                : 'Navigate "concrete data holes" with zero friction. No app downloads required. We are the invisible layer that provides psychological safety and keeps your tribe together.'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Mode-Specific Visualization Section */}
            {mode === 'architect' ? (
                // ARCHITECT MODE: Density Heatmap
                <section className="py-20 px-8 bg-black/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-5xl font-poppins font-black text-white mb-4">
                                <span className="text-logic-blue">LIVE</span> Density Intelligence
                            </h2>
                            <p className="text-lg font-inter text-white/60">
                                Real-time crowd density visualization for event organizers
                            </p>
                        </div>

                        {/* Heatmap Player */}
                        <div className="rounded-2xl overflow-hidden border-2 border-logic-blue/30 shadow-2xl">
                            <Player
                                component={HeatmapAnimation as React.FC<any>}
                                inputProps={{
                                    mode,
                                    showMetrics: true,
                                }}
                                durationInFrames={360}
                                compositionWidth={1920}
                                compositionHeight={1080}
                                fps={60}
                                loop
                                autoPlay
                                controls={false}
                                style={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                }}
                            />
                        </div>

                        {/* Architect Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                            <FeatureCard
                                title="Financial Assurance"
                                description="Digitize the emergency response audit trail to provide insurers and OHS auditors with exact timestamped data."
                                color="logic-blue"
                            />
                            <FeatureCard
                                title="The Red Alert Engine"
                                description="Automated logic that monitors CDV (Crowd Density Value) to dictate crowd flow and trigger emergency protocols."
                                color="logic-blue"
                            />
                            <FeatureCard
                                title="QR-Anchoring Logic"
                                description="Infinitely scalable, zero CapEx solution to fix GPS drift in massive concrete venues without expensive Bluetooth beacons."
                                color="logic-blue"
                            />
                        </div>
                    </div>
                </section>
            ) : (
                // COMPANION MODE: Social Connection Features
                <section className="py-20 px-8 bg-black/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-5xl font-poppins font-black text-white mb-4">
                                <span className="text-naveaze-red">Find Your Tribe</span> Instantly
                            </h2>
                            <p className="text-lg font-inter text-white/60">
                                Never lose your friends in the crowd again
                            </p>
                        </div>

                        {/* Social Features Illustration */}
                        <div className="rounded-2xl overflow-hidden border-2 border-naveaze-red/30 shadow-2xl bg-gradient-to-br from-naveaze-red/10 to-transparent p-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                {/* Left: Visual */}
                                <div className="relative">
                                    <div className="aspect-square rounded-full bg-naveaze-red/20 border-4 border-naveaze-red/40 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-8xl mb-4">👥</div>
                                            <div className="text-3xl font-poppins font-bold text-white">
                                                Your Tribe
                                            </div>
                                            <div className="text-naveaze-red font-mono text-xl mt-2">
                                                5 friends nearby
                                            </div>
                                        </div>
                                    </div>
                                    {/* Pulsing rings */}
                                    <div className="absolute inset-0 rounded-full border-2 border-naveaze-red/30 animate-ping" />
                                </div>

                                {/* Right: Features */}
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl">📍</div>
                                        <div>
                                            <h3 className="text-2xl font-poppins font-bold text-white mb-2">
                                                Real-Time Location
                                            </h3>
                                            <p className="text-white/70 font-inter">
                                                See where your friends are on the map, updated live as they move
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl">🔔</div>
                                        <div>
                                            <h3 className="text-2xl font-poppins font-bold text-white mb-2">
                                                Smart Notifications
                                            </h3>
                                            <p className="text-white/70 font-inter">
                                                Get alerts when friends are nearby or when the group splits up
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="text-4xl">🛡️</div>
                                        <div>
                                            <h3 className="text-2xl font-poppins font-bold text-white mb-2">
                                                Psychological Safety
                                            </h3>
                                            <p className="text-white/70 font-inter">
                                                Avoid crowded areas and find the safest routes to meet up
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Companion Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                            <FeatureCard
                                title="The Invisible Guardian"
                                description="A Tech-Lite PWA with zero downloads required. We stay perfectly invisible until you need us."
                                color="naveaze-red"
                            />
                            <FeatureCard
                                title="The Distress Pin"
                                description="Drop secure emergency markers that instantly alert on-ground staff to your exact VIP location."
                                color="naveaze-red"
                            />
                            <FeatureCard
                                title="POPIA Compliant"
                                description="Complete privacy by design. Navigate as an anonymous coordinate without handing over personal data."
                                color="naveaze-red"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* Paper Killer ESG Section */}
            <section className="py-20 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-5xl font-poppins font-black text-white mb-4">
                            <span className="text-green-400">Sustainable</span> Wayfinding
                        </h2>
                        <p className="text-lg font-inter text-white/60">
                            Replace disposable signage with a digital layer
                        </p>
                    </div>

                    {/* Paper Killer Counter Player */}
                    <div className="rounded-2xl overflow-hidden border-2 border-green-400/30 shadow-2xl">
                        <Player
                            component={PaperKillerCounter as React.FC<any>}
                            inputProps={{
                                signsReplaced: 12847,
                                co2Saved: 4.2,
                                treesSaved: 89,
                            }}
                            durationInFrames={300}
                            compositionWidth={1920}
                            compositionHeight={1080}
                            fps={60}
                            loop
                            autoPlay
                            controls={false}
                            style={{
                                width: '100%',
                                aspectRatio: '16/9',
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-20 px-8 bg-black/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-6xl font-poppins font-black text-white mb-6">
                        Ready to Transform Your Event?
                    </h2>
                    <p className="text-xl font-inter text-white/70 mb-12">
                        Join the future of event navigation with NavEaze
                    </p>
                    <button
                        onClick={() => navigate('/waitlist')}
                        className={`
              px-12 py-6 rounded-xl text-2xl font-poppins font-bold
              transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer
              ${mode === 'architect'
                                ? 'bg-logic-blue text-white hover:bg-logic-blue/90'
                                : 'bg-naveaze-red text-white hover:bg-naveaze-red/90'
                            }
            `}
                        style={{
                            boxShadow: `0 0 40px ${mode === 'architect' ? '#3B82F6' : '#FF4D32'}40`,
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </section>
        </div>
    );
};

// Feature Card Component
interface FeatureCardProps {
    title: string;
    description: string;
    color: 'logic-blue' | 'naveaze-red';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, color }) => {
    return (
        <div
            className={`
        p-8 rounded-xl bg-white/5 border-2 transition-all duration-300
        hover:scale-105 hover:bg-white/10
        ${color === 'logic-blue' ? 'border-logic-blue/30' : 'border-naveaze-red/30'}
      `}
        >
            <h3
                className={`
          text-2xl font-poppins font-bold mb-4
          ${color === 'logic-blue' ? 'text-logic-blue' : 'text-naveaze-red'}
        `}
            >
                {title}
            </h3>
            <p className="text-white/70 font-inter">{description}</p>
        </div>
    );
};
