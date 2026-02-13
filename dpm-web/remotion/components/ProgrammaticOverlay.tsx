import { AbsoluteFill } from 'remotion';
import React from 'react';

/**
 * Programmatic Overlay Component
 * Displays monospaced data labels in corners of video compositions
 * Gives the "dev tool" / "server-side rendering" aesthetic
 */

export interface ProgrammaticOverlayProps {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    label: string;
    value: string;
    status?: 'OK' | 'WARNING' | 'ERROR';
}

export const ProgrammaticOverlay: React.FC<ProgrammaticOverlayProps> = ({
    position,
    label,
    value,
    status = 'OK',
}) => {
    const positionStyles = {
        'top-left': { top: 20, left: 20 },
        'top-right': { top: 20, right: 20 },
        'bottom-left': { bottom: 20, left: 20 },
        'bottom-right': { bottom: 20, right: 20 },
    };

    const statusColors = {
        OK: '#00FF00',
        WARNING: '#FFD700',
        ERROR: '#FF4D32',
    };

    return (
        <AbsoluteFill
            style={{
                ...positionStyles[position],
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: 100,
            }}
        >
            <div
                style={{
                    fontFamily: 'JetBrains Mono, Courier New, monospace',
                    fontSize: 12,
                    color: '#00FF00',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '4px 8px',
                    borderRadius: 2,
                    border: `1px solid ${statusColors[status]}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}
            >
                <span style={{ opacity: 0.7 }}>{label}: </span>
                <span style={{ color: statusColors[status], fontWeight: 600 }}>
                    {value}
                </span>
            </div>
        </AbsoluteFill>
    );
};
