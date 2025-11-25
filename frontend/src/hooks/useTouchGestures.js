import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook for handling touch gestures (swipe, long press)
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {Function} options.onSwipeUp - Callback for up swipe
 * @param {Function} options.onSwipeDown - Callback for down swipe
 * @param {Function} options.onLongPress - Callback for long press
 * @param {number} options.swipeThreshold - Minimum distance for swipe (default: 50)
 * @param {number} options.longPressDelay - Delay for long press in ms (default: 500)
 * @returns {Object} Ref to attach to element
 */
export const useTouchGestures = ({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
}) => {
    const elementRef = useRef(null);
    const touchStartRef = useRef(null);
    const longPressTimerRef = useRef(null);
    const isLongPressRef = useRef(false);

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };

        // Start long press timer
        if (onLongPress) {
            isLongPressRef.current = false;
            longPressTimerRef.current = setTimeout(() => {
                isLongPressRef.current = true;
                onLongPress(e);
            }, longPressDelay);
        }
    }, [onLongPress, longPressDelay]);

    const handleTouchMove = useCallback((e) => {
        // Cancel long press if user moves
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        // Cancel long press timer
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        // If long press was triggered, don't process swipe
        if (isLongPressRef.current) {
            isLongPressRef.current = false;
            return;
        }

        if (!touchStartRef.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Only process swipe if movement is significant and fast enough
        if (distance > swipeThreshold && deltaTime < 300) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX > absY) {
                // Horizontal swipe
                if (deltaX > 0 && onSwipeRight) {
                    onSwipeRight(e);
                } else if (deltaX < 0 && onSwipeLeft) {
                    onSwipeLeft(e);
                }
            } else {
                // Vertical swipe
                if (deltaY > 0 && onSwipeDown) {
                    onSwipeDown(e);
                } else if (deltaY < 0 && onSwipeUp) {
                    onSwipeUp(e);
                }
            }
        }

        touchStartRef.current = null;
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return elementRef;
};

/**
 * Hook for pull-to-refresh gesture
 * @param {Function} onRefresh - Callback when pull-to-refresh is triggered
 * @param {number} threshold - Distance to pull before triggering (default: 80)
 * @returns {Object} Ref to attach to scrollable element
 */
export const usePullToRefresh = (onRefresh, threshold = 80) => {
    const elementRef = useRef(null);
    const touchStartYRef = useRef(null);
    const pullDistanceRef = useRef(0);

    const handleTouchStart = useCallback((e) => {
        const element = elementRef.current;
        if (!element) return;

        // Only trigger if at top of scroll
        if (element.scrollTop === 0) {
            touchStartYRef.current = e.touches[0].clientY;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (touchStartYRef.current === null) return;

        const element = elementRef.current;
        if (!element || element.scrollTop > 0) {
            touchStartYRef.current = null;
            return;
        }

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartYRef.current;

        if (deltaY > 0) {
            pullDistanceRef.current = deltaY;
            // Visual feedback could be added here
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (touchStartYRef.current === null) return;

        if (pullDistanceRef.current >= threshold && onRefresh) {
            onRefresh();
        }

        touchStartYRef.current = null;
        pullDistanceRef.current = 0;
    }, [onRefresh, threshold]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return elementRef;
};

