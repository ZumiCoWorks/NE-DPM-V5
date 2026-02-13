import { interpolate, useCurrentFrame } from 'remotion';
import React from 'react';

/**
 * Stacked Bracket Component
 * NavEaze logo motif used as a recurring UI element
 */

export interface StackedBracketProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    animated?: boolean;
}

export const StackedBracket: React.FC<StackedBracketProps> = ({
    size = 'medium',
    color = '#FF4D32',
    animated = true,
}) => {
    const frame = useCurrentFrame();

    const sizes = {
        small: { width: 60, height: 60, strokeWidth: 2 },
        medium: { width: 100, height: 100, strokeWidth: 3 },
        large: { width: 150, height: 150, strokeWidth: 4 },
    };

    const { width, height, strokeWidth } = sizes[size];

    const opacity = animated
        ? interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        })
        : 1;

    const scale = animated
        ? interpolate(frame, [0, 20], [0.8, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        })
        : 1;

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{
                opacity,
                transform: `scale(${scale})`,
            }}
        >
            {/* Outer bracket */}
            <path
                d={`M ${width * 0.2} ${height * 0.1} L ${width * 0.1} ${height * 0.1} L ${width * 0.1} ${height * 0.9} L ${width * 0.2} ${height * 0.9}`}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="square"
            />
            <path
                d={`M ${width * 0.8} ${height * 0.1} L ${width * 0.9} ${height * 0.1} L ${width * 0.9} ${height * 0.9} L ${width * 0.8} ${height * 0.9}`}
                stroke={color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="square"
            />

            {/* Inner bracket (stacked) */}
            <path
                d={`M ${width * 0.3} ${height * 0.2} L ${width * 0.2} ${height * 0.2} L ${width * 0.2} ${height * 0.8} L ${width * 0.3} ${height * 0.8}`}
                stroke={color}
                strokeWidth={strokeWidth - 1}
                fill="none"
                strokeLinecap="square"
                opacity={0.7}
            />
            <path
                d={`M ${width * 0.7} ${height * 0.2} L ${width * 0.8} ${height * 0.2} L ${width * 0.8} ${height * 0.8} L ${width * 0.7} ${height * 0.8}`}
                stroke={color}
                strokeWidth={strokeWidth - 1}
                fill="none"
                strokeLinecap="square"
                opacity={0.7}
            />
        </svg>
    );
};
