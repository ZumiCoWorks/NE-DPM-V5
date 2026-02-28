import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PinProtectionProps {
    children: React.ReactNode;
}

export const PinProtection: React.FC<PinProtectionProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState(false);

    const requiredPin = import.meta.env.VITE_APP_PIN;

    useEffect(() => {
        // If no PIN is configured for this environment, immediately authenticate
        if (!requiredPin) {
            setIsAuthenticated(true);
            return;
        }

        // Check if previously authenticated in this browser
        const savedStatus = localStorage.getItem('naveaze_pwa_unlocked');
        if (savedStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, [requiredPin]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pinInput === requiredPin) {
            localStorage.setItem('naveaze_pwa_unlocked', 'true');
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setPinInput('');
        }
    };

    const createDigits = (num: number) => {
        if (pinInput.length < 6) {
            setPinInput(prev => prev + num.toString());
            setError(false);
        }
    };

    const removeDigit = () => {
        setPinInput(prev => prev.slice(0, -1));
    };

    // Render the protected content if authenticated or no PIN required
    if (isAuthenticated || !requiredPin) {
        return <>{children}</>;
    }

    // Render the lock screen
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div>
                    <div className="mx-auto w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Private Beta Access</h2>
                    <p className="text-gray-400">Please enter your 4-digit PIN to continue</p>
                </div>

                <div className="flex justify-center space-x-4 my-8">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-colors duration-200 ${i < pinInput.length ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-red-400 text-sm animate-bounce">Incorrect PIN. Please try again.</p>
                )}

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto mt-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            type="button"
                            onClick={() => createDigits(num)}
                            className="w-16 h-16 rounded-full bg-gray-800 text-white text-2xl font-light hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center mx-auto"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="w-16 h-16"></div>
                    <button
                        type="button"
                        onClick={() => createDigits(0)}
                        className="w-16 h-16 rounded-full bg-gray-800 text-white text-2xl font-light hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-center mx-auto"
                    >
                        0
                    </button>
                    <button
                        type="button"
                        onClick={removeDigit}
                        className="w-16 h-16 rounded-full bg-transparent text-gray-400 text-xl font-light hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-center mx-auto"
                    >
                        Del
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-8">
                    <input type="hidden" value={pinInput} />
                    <button
                        type="submit"
                        disabled={pinInput.length !== 4}
                        className="w-full max-w-[280px] bg-blue-600 text-white rounded-lg py-4 font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        UNLOCK
                    </button>
                </form>

            </div>
        </div>
    );
};
