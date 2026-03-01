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
        <div className="min-h-screen bg-ultra-dark relative overflow-hidden">
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center">
                <div className="flex items-center">
                    <img src="/nav-eaze-logo-dark.svg" alt="NavEaze" className="h-8" />
                </div>
                <div className="flex items-center gap-6">
                    <MirrorPivot mode={mode} onModeChange={setMode} />
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/20 hover:border-white/40 shadow-sm"
                    >
                        Log In
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-12">
                {/* Background Remotion Player */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
                    <Player
                        component={HeroVideo as React.FC<any>}
                        inputProps={{
                            mode,
                            accentColor,
                            tagline,
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
                </div>

                {/* Hero Content (Foreground) */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-8 flex flex-col items-center">
                    <div className="text-center mb-16 max-w-4xl mt-12">
                        <h2 className="text-6xl sm:text-7xl md:text-8xl font-poppins font-black text-white mb-6 leading-tight">
                            {mode === 'architect' ? (
                                <>
                                    <span className="text-logic-blue">Master</span> <br className="hidden md:block" />Your Venue
                                </>
                            ) : (
                                <>
                                    <span className="text-naveaze-red">Navigate</span> <br className="hidden md:block" />With Ease
                                </>
                            )}
                        </h2>
                        <p className="text-xl md:text-2xl font-inter text-white/70 max-w-3xl mx-auto">
                            {mode === 'architect'
                                ? 'Design interactive floorplans, monitor real-time attendee flow, and manage gamified AR experiences from a single unified dashboard.'
                                : 'Find your way through complex events without downloading an app. Participate in interactive scavenger hunts and stay connected to your group.'}
                        </p>
                    </div>

                    {/* Feature Cards Grid (Moved directly into Hero) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-4">
                        {mode === 'architect' ? (
                            <>
                                <FeatureCard
                                    title="Unified Map Editor"
                                    description="Upload static floorplans, convert them to interactive digital maps, and place routing nodes instantly."
                                    color="logic-blue"
                                />
                                <FeatureCard
                                    title="AR Scavenger Hunts"
                                    description="Create location-based gamification campaigns to drive attendee engagement and capture sponsor leads."
                                    color="logic-blue"
                                />
                                <FeatureCard
                                    title="Real-Time Dashboard"
                                    description="Track active users, live heatmap density, and event statistics straight from the control center."
                                    color="logic-blue"
                                />
                            </>
                        ) : (
                            <>
                                <FeatureCard
                                    title="Frictionless PWA"
                                    description="Access interactive venue maps instantly through your browser. No app store downloads or installations required."
                                    color="naveaze-red"
                                />
                                <FeatureCard
                                    title="Interactive Wayfinding"
                                    description="Follow the path to your destination with dynamic routing overlaid on the event floorplan."
                                    color="naveaze-red"
                                />
                                <FeatureCard
                                    title="Location Sharing"
                                    description="Staff and organizers can track VIPs and securely monitor team locations across the venue."
                                    color="naveaze-red"
                                />
                            </>
                        )}
                    </div>
                </div>
            </section>

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
