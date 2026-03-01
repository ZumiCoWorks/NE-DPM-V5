import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Img } from 'remotion';
import React from 'react';
import { ProgrammaticOverlay } from '../components/ProgrammaticOverlay';

/**
 * Hero Video Composition
 * Calmer, more refined programmatic video with NavEaze logo
 */

export interface HeroVideoProps {
    mode: 'architect' | 'companion';
    accentColor: string;
    tagline: string;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
    mode,
    accentColor,
    tagline,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const title = mode === 'architect' ? (
        <>
            <span style={{ color: '#3B82F6' }}>Eradicate</span> <br /> The Black Box
        </>
    ) : (
        <>
            <span style={{ color: '#FF4D32' }}>Certainty</span> <br /> in Chaos
        </>
    );

    // Slow, subtle pulsing animation for logo
    const logoPulse = interpolate(
        frame,
        [0, durationInFrames / 2, durationInFrames],
        [1, 1.03, 1],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Gentle fade in for text
    const textOpacity = spring({
        frame: frame - 30,
        fps,
        config: {
            damping: 100,
        },
    });

    // Subtle glow pulse
    const glowIntensity = interpolate(
        frame,
        [0, durationInFrames / 2, durationInFrames],
        [0.2, 0.4, 0.2],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#0A0A0A',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}
        >
            {/* Subtle background gradient */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 50% 50%, ${accentColor}10 0%, transparent 70%)`,
                    opacity: glowIntensity,
                }}
            />

            {/* NavEaze Logo */}
            <div
                style={{
                    transform: `scale(${logoPulse})`,
                    marginBottom: 60,
                }}
            >
                <Img
                    src="/nav-eaze-logo-dark.svg"
                    style={{
                        width: 500,
                        height: 'auto',
                        filter: `drop-shadow(0 0 ${glowIntensity * 30}px ${accentColor}80)`,
                    }}
                />
            </div>

            {/* Main Headline */}
            <div
                style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: 64,
                    fontWeight: 900,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    letterSpacing: '0.03em',
                    opacity: textOpacity,
                    marginBottom: 24,
                    lineHeight: 1.2,
                }}
            >
                {title}
            </div>

            {/* Tagline */}
            <div
                style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 24,
                    fontWeight: 400,
                    color: '#FFFFFF',
                    opacity: textOpacity * 0.7,
                    textAlign: 'center',
                    maxWidth: 700,
                    lineHeight: 1.6,
                }}
            >
                {tagline}
            </div>

            {/* Minimal Programmatic Overlays - Only 2 corners */}
            <ProgrammaticOverlay
                position="top-left"
                label="STATUS"
                value="LIVE"
                status="OK"
            />

            <ProgrammaticOverlay
                position="bottom-right"
                label="MODE"
                value={mode === 'architect' ? 'DATA' : 'SOCIAL'}
                status="OK"
            />

            {/* Subtle accent line at bottom */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
                    opacity: glowIntensity * 1.5,
                }}
            />
        </AbsoluteFill>
    );
};
