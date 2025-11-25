import { useEffect } from 'react';

/**
 * Hook for number key navigation to sidebar items
 * Maps number keys 1-9 to sidebar menu items
 */
export const useSidebarNavigation = (setActiveTab, enabled = true) => {
    useEffect(() => {
        if (!enabled) return;

        // Menu items in order (matching Layout.jsx)
        const menuItems = [
            'editor',      // 1 - Create Writing
            'library',     // 2 - My Writings
            'curated',     // 3 - Browse Amazing Writing
            'progress',    // 4 - Progress & Stats
            'speech',      // 5 - Speech Practice
            'practice',    // 6 - Conversation Practice
            'interactive', // 7 - Interactive Chat
            'rhetorical',  // 8 - Rhetorical Devices
            'poems',       // 9 - Create Poem
        ];

        const handleKeyDown = (e) => {
            // Don't handle if user is typing in input/textarea
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
            
            // Only handle number keys if no modifiers are pressed
            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || isInput) {
                return;
            }

            // Handle number keys 1-9
            const keyNum = parseInt(e.key);
            if (keyNum >= 1 && keyNum <= 9) {
                const tabId = menuItems[keyNum - 1];
                if (tabId) {
                    e.preventDefault();
                    setActiveTab(tabId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTab, enabled]);
};

