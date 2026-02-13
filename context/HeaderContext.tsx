import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextType {
    headerContent: ReactNode;
    setHeaderContent: (content: ReactNode) => void;
    clearHeaderContent: () => void;

    // Visibility management
    isHeaderHidden: boolean;
    setHeaderHidden: (hidden: boolean) => void;
    autoHideEnabled: boolean;
    setAutoHideEnabled: (enabled: boolean) => void;
    headerHeight: number;
    setHeaderHeight: (height: number) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [headerContent, setHeaderContent] = useState<ReactNode>(null);
    const [isHeaderHidden, setHeaderHidden] = useState(false);
    const [autoHideEnabled, setAutoHideEnabled] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(80);

    const clearHeaderContent = () => setHeaderContent(null);

    return (
        <HeaderContext.Provider value={{
            headerContent,
            setHeaderContent,
            clearHeaderContent,
            isHeaderHidden,
            setHeaderHidden,
            autoHideEnabled,
            setAutoHideEnabled,
            headerHeight,
            setHeaderHeight
        }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
}
