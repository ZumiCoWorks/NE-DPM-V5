import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoModeContextType {
    demoMode: boolean;
    toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [demoMode, setDemoMode] = useState(() => {
        const saved = localStorage.getItem('app_demo_mode');
        return saved ? JSON.parse(saved) : false; // Default to production mode
    });

    const toggleDemoMode = () => {
        const newMode = !demoMode;
        setDemoMode(newMode);
        localStorage.setItem('app_demo_mode', JSON.stringify(newMode));
        // Reload the page to refresh all data
        window.location.reload();
    };

    return (
        <DemoModeContext.Provider value={{ demoMode, toggleDemoMode }}>
            {children}
        </DemoModeContext.Provider>
    );
};

export const useDemoMode = () => {
    const context = useContext(DemoModeContext);
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoModeProvider');
    }
    return context;
};
