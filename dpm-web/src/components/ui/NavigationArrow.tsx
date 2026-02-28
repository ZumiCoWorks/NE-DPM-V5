import React from 'react';

export const NavigationArrow: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => {
    return (
        <div className={`relative ${className}`} style={style}>
            <svg width="100%" height="100%" viewBox="120 420 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                <defs>
                    <filter id="nav-arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Layer 3: Rear Chevron (Bottom) - Starts the flow */}
                <path
                    d="M200.5 561L184 573.507L184.334 584L200.166 570.327L217 584V572.447L200.5 561Z"
                    fill="#FF0003"
                    stroke="#FF0003"
                    className="animate-arrow-flow-3 opacity-0"
                />

                {/* Layer 2: Middle Chevron - Follows */}
                <path
                    d="M200.5 503L151 541.065L152.003 573L199.497 531.387L250 573V537.839L200.5 503Z"
                    fill="#FF0003"
                    stroke="#FF0003"
                    className="animate-arrow-flow-2 opacity-0"
                />

                {/* Layer 1: Front Arrow Head (Top) - Finishes flow & pulses */}
                <path
                    d="M201 423L127 482L128.5 531.5L199.5 467L275 531.5V477L201 423Z"
                    stroke="#FF0003"
                    strokeWidth="2"
                    filter="url(#nav-arrow-glow)"
                    className="animate-arrow-pulse"
                />
            </svg>
        </div>
    );
};
