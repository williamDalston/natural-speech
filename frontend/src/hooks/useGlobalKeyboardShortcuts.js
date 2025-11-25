import { useEffect, useRef, useCallback } from 'react';

/**
 * Global keyboard shortcuts hook for the entire application
 * Handles all global shortcuts like Ctrl/Cmd + K, Ctrl/Cmd + N, etc.
 */
export const useGlobalKeyboardShortcuts = ({
    onQuickSearch,
    onNewWriting,
    onShowShortcuts,
    onNavigateSidebar,
    activeTab,
    setActiveTab,
    onSave,
    canSave = false,
    onNavigateWriting,
    writingIndex = -1,
    totalWritings = 0,
    isInputFocused = false, // Whether user is typing in an input/textarea
}) => {
    const callbacksRef = useRef({
        onQuickSearch,
        onNewWriting,
        onShowShortcuts,
        onNavigateSidebar,
        onSave,
        onNavigateWriting,
    });

    // Update callbacks ref when they change
    useEffect(() => {
        callbacksRef.current = {
            onQuickSearch,
            onNewWriting,
            onShowShortcuts,
            onNavigateSidebar,
            onSave,
            onNavigateWriting,
        };
    }, [onQuickSearch, onNewWriting, onShowShortcuts, onNavigateSidebar, onSave, onNavigateWriting]);

    const handleKeyDown = useCallback((e) => {
        const isModifier = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const key = e.key.toLowerCase();

        // Don't trigger shortcuts when user is typing in inputs/textarea unless it's Escape
        if (isInputFocused && key !== 'escape') {
            // Allow Ctrl/Cmd + S in inputs
            if (isModifier && key === 's' && canSave) {
                e.preventDefault();
                callbacksRef.current.onSave?.();
                return;
            }
            return;
        }

        // Ctrl/Cmd + K: Quick search
        if (isModifier && key === 'k') {
            e.preventDefault();
            callbacksRef.current.onQuickSearch?.();
            return;
        }

        // Ctrl/Cmd + N: New writing
        if (isModifier && key === 'n') {
            e.preventDefault();
            callbacksRef.current.onNewWriting?.();
            return;
        }

        // Ctrl/Cmd + S: Save (in editor)
        if (isModifier && key === 's' && canSave) {
            e.preventDefault();
            callbacksRef.current.onSave?.();
            return;
        }

        // Ctrl/Cmd + / or ?: Show shortcuts help
        if ((isModifier && (key === '/' || key === '?')) || (key === '?' && !isModifier && !isShift)) {
            e.preventDefault();
            callbacksRef.current.onShowShortcuts?.();
            return;
        }

        // Number keys 1-9: Navigate to sidebar items
        if (!isModifier && !isShift && !e.altKey && /^[1-9]$/.test(key)) {
            const number = parseInt(key, 10);
            callbacksRef.current.onNavigateSidebar?.(number);
            return;
        }

        // Ctrl/Cmd + Arrow Left/Right: Navigate writings (only in library view)
        if (isModifier && !isShift && (key === 'arrowleft' || key === 'arrowright')) {
            if (activeTab === 'library' && totalWritings > 0 && writingIndex >= 0) {
                e.preventDefault();
                const direction = key === 'arrowleft' ? 'prev' : 'next';
                callbacksRef.current.onNavigateWriting?.(direction);
            }
            return;
        }
    }, [isInputFocused, canSave, activeTab, totalWritings, writingIndex]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};
