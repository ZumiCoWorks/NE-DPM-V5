import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';
import React, { useEffect, useRef } from 'react';
import { ProgrammaticOverlay } from '../components/ProgrammaticOverlay';

/**
 * Heatmap Animation Composition
 * Canvas-based animated heatmap showing live data-density scan
 * of a stadium or festival with pulsing hotspots
 */

export interface HeatmapProps {
    mode: 'architect' | 'companion';
    showMetrics: boolean;
}

export const HeatmapAnimation: React.FC<HeatmapProps> = ({
    mode,
    showMetrics,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const accentColor = mode === 'architect' ? '#3B82F6' : '#FF4D32';

    // Scan line animation - much slower
    const scanLineY = interpolate(
        frame % 240,
        [0, 240],
        [0, height],
        {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        }
    );

    // Hotspot pulse animation - slower
    const hotspotPulse = spring({
        frame: frame % 80,
        fps,
        config: {
            damping: 20,
        },
    });

    // Draw heatmap on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Create gradient background (simulating heat density)
        const gradient = ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            Math.max(width, height) / 2
        );

        // Animate gradient colors based on frame
        const gradientShift = interpolate(
            frame % 180,
            [0, 90, 180],
            [0, 0.5, 0],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            }
        );

        if (mode === 'architect') {
            gradient.addColorStop(0, `rgba(59, 130, 246, ${0.8 - gradientShift})`);
            gradient.addColorStop(0.3, `rgba(59, 130, 246, ${0.5 - gradientShift})`);
            gradient.addColorStop(0.6, `rgba(59, 130, 246, ${0.3 - gradientShift})`);
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
        } else {
            gradient.addColorStop(0, `rgba(255, 77, 50, ${0.8 - gradientShift})`);
            gradient.addColorStop(0.3, `rgba(255, 77, 50, ${0.5 - gradientShift})`);
            gradient.addColorStop(0.6, `rgba(255, 77, 50, ${0.3 - gradientShift})`);
            gradient.addColorStop(1, 'rgba(255, 77, 50, 0.1)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw hotspots (pulsing circles)
        const hotspots = [
            { x: width * 0.3, y: height * 0.4, density: 847 },
            { x: width * 0.6, y: height * 0.3, density: 623 },
            { x: width * 0.5, y: height * 0.6, density: 1024 },
            { x: width * 0.7, y: height * 0.7, density: 456 },
        ];

        hotspots.forEach((hotspot, index) => {
            const phaseOffset = index * 10;
            const radius = interpolate(
                (frame + phaseOffset) % 40,
                [0, 20, 40],
                [30, 50, 30],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            const hotspotGradient = ctx.createRadialGradient(
                hotspot.x,
                hotspot.y,
                0,
                hotspot.x,
                hotspot.y,
                radius
            );

            hotspotGradient.addColorStop(0, `${accentColor}80`);
            hotspotGradient.addColorStop(0.5, `${accentColor}40`);
            hotspotGradient.addColorStop(1, `${accentColor}00`);

            ctx.fillStyle = hotspotGradient;
            ctx.beginPath();
            ctx.arc(hotspot.x, hotspot.y, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw grid overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < height; y += height / 10) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }, [frame, width, height, mode, accentColor]);

    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#0A0A0A',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {/* Canvas for heatmap */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            />

            {/* Scan line */}
            <div
                style={{
                    position: 'absolute',
                    top: scanLineY,
                    left: 0,
                    width: '100%',
                    height: 2,
                    backgroundColor: accentColor,
                    boxShadow: `0 0 20px ${accentColor}`,
                    opacity: 0.8,
                }}
            />

            {/* Zone Labels */}
            {showMetrics && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            top: height * 0.4,
                            left: width * 0.3,
                            transform: 'translate(-50%, -50%)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 14,
                            color: '#FFFFFF',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: '8px 12px',
                            borderRadius: 4,
                            border: `1px solid ${accentColor}`,
                        }}
                    >
                        ZONE: A-14
                        <br />
                        <span style={{ color: accentColor }}>847 ppl/m²</span>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            top: height * 0.3,
                            left: width * 0.6,
                            transform: 'translate(-50%, -50%)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 14,
                            color: '#FFFFFF',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: '8px 12px',
                            borderRadius: 4,
                            border: `1px solid ${accentColor}`,
                        }}
                    >
                        ZONE: B-07
                        <br />
                        <span style={{ color: accentColor }}>623 ppl/m²</span>
                    </div>
                </>
            )}

            {/* Programmatic Overlays - Reduced to 2 */}
            <ProgrammaticOverlay
                position="top-left"
                label="DENSITY_SCAN"
                value="ACTIVE"
                status="OK"
            />
            <ProgrammaticOverlay
                position="bottom-right"
                label="AVG_DENSITY"
                value="687 ppl/m²"
                status="OK"
            />

            {/* Title */}
            <div
                style={{
                    position: 'absolute',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 48,
                    fontWeight: 900,
                    fontFamily: 'Poppins, sans-serif',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                }}
            >
                <span style={{ color: accentColor }}>LIVE</span> DENSITY HEATMAP
            </div>
        </AbsoluteFill>
    );
};
