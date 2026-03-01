import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

/**
 * Hero Video Composition
 * Clean, animated background without intrusive text or overlays.
 */

export interface HeroVideoProps {
    mode: 'architect' | 'companion';
    accentColor: string;
    tagline: string;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({
    accentColor,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Subtle glow pulse for the background
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
                backgroundColor: '#050505',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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

            {/* Subtle accent line at bottom */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
                    opacity: glowIntensity * 1.5,
                }}
            />
        </AbsoluteFill>
    );
};
