import { useEffect } from 'react';
import { useHeader } from '../context/HeaderContext';

/**
 * Hook to enable Header Auto-Hide behavior for a specific page.
 * The header will hide on scroll down and show on scroll up.
 */
export function useHeaderAutoHide() {
    const { setAutoHideEnabled } = useHeader();

    useEffect(() => {
        setAutoHideEnabled(true);
        // Clean up: disable auto-hide when navigating away
        return () => setAutoHideEnabled(false);
    }, [setAutoHideEnabled]);
}

/**
 * Alternative Component-based "Behavior" for Header Auto-Hide.
 * Can be used as <HeaderAutoHideBehavior /> inside a page.
 */
export function HeaderAutoHideBehavior() {
    useHeaderAutoHide();
    return null;
}
