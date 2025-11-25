/**
 * useFocusTrap Hook
 * 
 * Provides focus trapping functionality for modals and dialogs
 * Ensures keyboard navigation stays within the trapped element
 */

import { useEffect, useRef } from 'react';

export const useFocusTrap = (isActive, options = {}) => {
    const containerRef = useRef(null);
    const previouslyFocusedElement = useRef(null);
    const { 
        initialFocus = null, // Element to focus initially
        returnFocus = true, // Whether to return focus on deactivate
        escapeDeactivates = true, // Whether Escape key deactivates
        onEscape = null, // Callback for Escape key
    } = options;

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Store the element that had focus before activating
        previouslyFocusedElement.current = document.activeElement;

        // Focus initial element or first focusable element
        const focusInitial = () => {
            if (initialFocus && typeof initialFocus === 'function') {
                const element = initialFocus();
                if (element) {
                    element.focus();
                    return;
                }
            }
            
            if (initialFocus && initialFocus.current) {
                initialFocus.current.focus();
                return;
            }

            // Find first focusable element
            const focusableElements = containerRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        };

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(focusInitial, 100);

        const handleKeyDown = (e) => {
            if (!containerRef.current) return;

            // Handle Escape key
            if (e.key === 'Escape' && escapeDeactivates) {
                if (onEscape) {
                    e.preventDefault();
                    onEscape();
                }
                return;
            }

            // Handle Tab key for focus trapping
            if (e.key === 'Tab') {
                const focusableElements = Array.from(
                    containerRef.current.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    )
                ).filter(el => {
                    // Filter out disabled and hidden elements
                    return !el.disabled && 
                           el.offsetParent !== null && 
                           !el.hasAttribute('aria-hidden');
                });

                if (focusableElements.length === 0) {
                    e.preventDefault();
                    return;
                }

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                const currentIndex = focusableElements.indexOf(document.activeElement);

                if (e.shiftKey) {
                    // Shift + Tab
                    if (currentIndex === 0 || document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (currentIndex === focusableElements.length - 1 || 
                        document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Prevent body scroll when trap is active
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;

            // Return focus to previously focused element
            if (returnFocus && previouslyFocusedElement.current) {
                // Check if element still exists and is focusable
                if (previouslyFocusedElement.current.focus) {
                    try {
                        previouslyFocusedElement.current.focus();
                    } catch (e) {
                        // Element might not be focusable anymore
                        console.warn('Could not return focus to previous element');
                    }
                }
                previouslyFocusedElement.current = null;
            }
        };
    }, [isActive, initialFocus, returnFocus, escapeDeactivates, onEscape]);

    return containerRef;
};

