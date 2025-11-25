/**
 * Focus Management Utilities
 * Provides utilities for managing focus in modals and dialogs
 * Ensures WCAG 2.1 AA compliance for keyboard navigation
 */

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - The container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export const getFocusableElements = (container) => {
    const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
        .filter(el => {
            // Filter out hidden elements
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
        });
};

/**
 * Trap focus within a container (for modals)
 * @param {HTMLElement} container - The container element
 * @param {HTMLElement} initialFocus - Element to focus initially (optional)
 */
export const trapFocus = (container, initialFocus = null) => {
    const focusableElements = getFocusableElements(container);
    
    if (focusableElements.length === 0) return;

    // Focus the initial element or first focusable element
    const firstElement = initialFocus || focusableElements[0];
    firstElement?.focus();

    // Handle Tab key to cycle through focusable elements
    const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

/**
 * Restore focus to a previously focused element
 * @param {HTMLElement} element - Element to restore focus to
 */
export const restoreFocus = (element) => {
    if (element && typeof element.focus === 'function') {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            element.focus();
        }, 0);
    }
};

/**
 * Save the currently focused element
 * @returns {HTMLElement|null} The currently focused element
 */
export const saveFocus = () => {
    return document.activeElement;
};

/**
 * Focus management hook for React components
 * Usage in modals:
 *   const { trapFocus, restoreFocus, saveFocus } = useFocusManagement();
 *   const previousFocus = saveFocus();
 *   useEffect(() => {
 *     const cleanup = trapFocus(modalRef.current, firstButtonRef.current);
 *     return () => {
 *       cleanup();
 *       restoreFocus(previousFocus);
 *     };
 *   }, []);
 */
export const useFocusManagement = () => {
    return {
        trapFocus,
        restoreFocus,
        saveFocus,
        getFocusableElements
    };
};

