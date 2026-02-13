import React, { useState } from 'react';
import { Database, Users } from 'lucide-react';

/**
 * Mirror Pivot Toggle Component
 * High-contrast toggle that switches between Data Architect and Helpful Companion modes
 */

export interface MirrorPivotProps {
    mode: 'architect' | 'companion';
    onModeChange: (mode: 'architect' | 'companion') => void;
}

export const MirrorPivot: React.FC<MirrorPivotProps> = ({ mode, onModeChange }) => {
    const [isFlipping, setIsFlipping] = useState(false);

    const handleToggle = () => {
        setIsFlipping(true);
        setTimeout(() => {
            onModeChange(mode === 'architect' ? 'companion' : 'architect');
            setIsFlipping(false);
        }, 300);
    };

    const accentColor = mode === 'architect' ? 'logic-blue' : 'naveaze-red';
    const Icon = mode === 'architect' ? Database : Users;

    return (
        <div className="flex items-center justify-center py-12">
            <div className="relative">
                {/* Toggle Button */}
                <button
                    onClick={handleToggle}
                    className={`
            relative flex items-center gap-6 px-12 py-6 rounded-xl
            bg-ultra-dark border-2 transition-all duration-300
            hover:scale-105 active:scale-95
            ${mode === 'architect' ? 'border-logic-blue' : 'border-naveaze-red'}
            ${isFlipping ? 'animate-pulse' : ''}
          `}
                    style={{
                        transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s',
                    }}
                >
                    {/* Icon */}
                    <div
                        className={`
              p-4 rounded-lg transition-colors duration-300
              ${mode === 'architect' ? 'bg-logic-blue/20' : 'bg-naveaze-red/20'}
            `}
                    >
                        <Icon
                            size={32}
                            className={mode === 'architect' ? 'text-logic-blue' : 'text-naveaze-red'}
                        />
                    </div>

                    {/* Label */}
                    <div className="text-left">
                        <div className="text-sm font-mono text-white/50 uppercase tracking-wider mb-1">
                            Current Mode
                        </div>
                        <div className="text-2xl font-poppins font-black text-white uppercase tracking-wide">
                            {mode === 'architect' ? (
                                <>
                                    <span className="text-logic-blue">Data</span> Architect
                                </>
                            ) : (
                                <>
                                    <span className="text-naveaze-red">Helpful</span> Companion
                                </>
                            )}
                        </div>
                    </div>

                    {/* Toggle Indicator */}
                    <div className="ml-4">
                        <div
                            className={`
                w-16 h-8 rounded-full relative transition-colors duration-300
                ${mode === 'architect' ? 'bg-logic-blue/30' : 'bg-naveaze-red/30'}
              `}
                        >
                            <div
                                className={`
                  absolute top-1 w-6 h-6 rounded-full transition-all duration-300
                  ${mode === 'architect' ? 'left-1 bg-logic-blue' : 'left-9 bg-naveaze-red'}
                `}
                                style={{
                                    boxShadow: `0 0 10px ${mode === 'architect' ? '#3B82F6' : '#FF4D32'}`,
                                }}
                            />
                        </div>
                    </div>
                </button>

                {/* Decorative Glow */}
                <div
                    className={`
            absolute inset-0 -z-10 blur-2xl opacity-30 rounded-xl
            ${mode === 'architect' ? 'bg-logic-blue' : 'bg-naveaze-red'}
          `}
                />
            </div>
        </div>
    );
};
