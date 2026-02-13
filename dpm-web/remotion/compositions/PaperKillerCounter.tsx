import {
    AbsoluteFill,
    interpolate,
    Easing,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import React from 'react';
import { ProgrammaticOverlay } from '../components/ProgrammaticOverlay';
import { StackedBracket } from '../components/StackedBracket';

/**
 * Paper Killer Counter Composition
 * ESG impact animation showing environmental metrics
 * with animated counters and before/after comparison
 */

export interface PaperKillerProps {
    signsReplaced: number;
    co2Saved: number;
    treesSaved: number;
}

export const PaperKillerCounter: React.FC<PaperKillerProps> = ({
    signsReplaced,
    co2Saved,
    treesSaved,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Animated counter values with easing - much slower
    const animatedSigns = Math.floor(
        interpolate(frame, [0, 160], [0, signsReplaced], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
        })
    );

    const animatedCO2 = interpolate(frame, [40, 200], [0, co2Saved], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
    });

    const animatedTrees = Math.floor(
        interpolate(frame, [80, 240], [0, treesSaved], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
        })
    );

    // Before/After opacity transition - slower
    const beforeOpacity = interpolate(frame, [0, 60, 120], [1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const afterOpacity = interpolate(frame, [120, 180], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // CTA pulse animation - slower
    const ctaPulse = interpolate(
        Math.sin((frame / 40) * Math.PI),
        [-1, 1],
        [0.98, 1.02]
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#0A0A0A',
                fontFamily: 'Poppins, sans-serif',
            }}
        >
            {/* Programmatic Overlays - Reduced to 2 */}
            <ProgrammaticOverlay
                position="top-left"
                label="ESG_IMPACT"
                value="CALCULATING"
                status="OK"
            />
            <ProgrammaticOverlay
                position="bottom-right"
                label="CARBON_OFFSET"
                value={`${animatedCO2.toFixed(1)}t`}
                status="OK"
            />

            {/* Main Content */}
            <AbsoluteFill
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 100,
                }}
            >
                {/* Title with Stacked Bracket */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 40,
                        marginBottom: 80,
                    }}
                >
                    <StackedBracket size="medium" color="#00FF00" animated />
                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 900,
                            color: '#FFFFFF',
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                        }}
                    >
                        THE <span style={{ color: '#00FF00' }}>PAPER KILLER</span>
                    </div>
                    <StackedBracket size="medium" color="#00FF00" animated />
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        fontSize: 24,
                        fontFamily: 'Inter, sans-serif',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        marginBottom: 60,
                        opacity: 0.8,
                        maxWidth: 900,
                    }}
                >
                    Replace single-use Correx signage with a digital layer.
                    <br />
                    Join the sustainable wayfinding revolution.
                </div>

                {/* Before/After Comparison */}
                <div
                    style={{
                        position: 'relative',
                        width: 800,
                        height: 200,
                        marginBottom: 60,
                    }}
                >
                    {/* Before */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: beforeOpacity,
                            backgroundColor: 'rgba(255, 77, 50, 0.1)',
                            border: '2px solid #FF4D32',
                            borderRadius: 8,
                            padding: 40,
                        }}
                    >
                        <div style={{ fontSize: 32, color: '#FF4D32', marginBottom: 10 }}>
                            ❌ BEFORE
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                color: '#FFFFFF',
                                textAlign: 'center',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            Thousands of disposable signs
                            <br />
                            Environmental waste • High costs
                        </div>
                    </div>

                    {/* After */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            opacity: afterOpacity,
                            backgroundColor: 'rgba(0, 255, 0, 0.1)',
                            border: '2px solid #00FF00',
                            borderRadius: 8,
                            padding: 40,
                        }}
                    >
                        <div style={{ fontSize: 32, color: '#00FF00', marginBottom: 10 }}>
                            ✓ AFTER
                        </div>
                        <div
                            style={{
                                fontSize: 20,
                                color: '#FFFFFF',
                                textAlign: 'center',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            Digital wayfinding layer
                            <br />
                            Zero waste • Sustainable • Smart
                        </div>
                    </div>
                </div>

                {/* Impact Metrics */}
                <div
                    style={{
                        display: 'flex',
                        gap: 60,
                        marginBottom: 60,
                    }}
                >
                    {/* Signs Replaced */}
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 30,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            minWidth: 220,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 56,
                                fontWeight: 900,
                                color: '#00FF00',
                                fontFamily: 'JetBrains Mono, monospace',
                                marginBottom: 10,
                            }}
                        >
                            {animatedSigns.toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                color: '#FFFFFF',
                                opacity: 0.7,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            Signs Replaced
                        </div>
                    </div>

                    {/* CO2 Saved */}
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 30,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            minWidth: 220,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 56,
                                fontWeight: 900,
                                color: '#00FF00',
                                fontFamily: 'JetBrains Mono, monospace',
                                marginBottom: 10,
                            }}
                        >
                            {animatedCO2.toFixed(1)}t
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                color: '#FFFFFF',
                                opacity: 0.7,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            CO₂ Saved
                        </div>
                    </div>

                    {/* Trees Saved */}
                    <div
                        style={{
                            textAlign: 'center',
                            padding: 30,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            minWidth: 220,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 56,
                                fontWeight: 900,
                                color: '#00FF00',
                                fontFamily: 'JetBrains Mono, monospace',
                                marginBottom: 10,
                            }}
                        >
                            {animatedTrees}
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                color: '#FFFFFF',
                                opacity: 0.7,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            Trees Saved
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <div
                    style={{
                        transform: `scale(${ctaPulse})`,
                        marginTop: 20,
                    }}
                >
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#0A0A0A',
                            backgroundColor: '#00FF00',
                            padding: '20px 60px',
                            borderRadius: 8,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            boxShadow: '0 0 40px rgba(0, 255, 0, 0.5)',
                        }}
                    >
                        Make The Switch
                    </div>
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
