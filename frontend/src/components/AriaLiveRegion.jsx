import React, { useEffect, useState } from 'react';

/**
 * ARIA Live Region Component
 * Provides accessible announcements for screen readers
 * Supports different priority levels: polite, assertive, off
 */
const AriaLiveRegion = ({ 
    message, 
    priority = 'polite', // 'polite', 'assertive', 'off'
    id = 'aria-live-region'
}) => {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (message) {
            // Clear previous message to ensure screen readers announce new messages
            setAnnouncement('');
            // Use setTimeout to ensure the clear happens before the new message
            const timer = setTimeout(() => {
                setAnnouncement(message);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div
            id={id}
            role="status"
            aria-live={priority}
            aria-atomic="true"
            className="sr-only"
            aria-relevant="additions text"
        >
            {announcement}
        </div>
    );
};

/**
 * Hook for managing ARIA live announcements
 */
export const useAriaLive = () => {
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('polite');

    const announce = (text, messagePriority = 'polite') => {
        setPriority(messagePriority);
        setMessage(text);
        // Clear message after announcement to allow re-announcement
        setTimeout(() => setMessage(''), 1000);
    };

    const announcePolite = (text) => announce(text, 'polite');
    const announceAssertive = (text) => announce(text, 'assertive');

    return {
        announce,
        announcePolite,
        announceAssertive,
        AriaLiveRegion: () => <AriaLiveRegion message={message} priority={priority} />
    };
};

export default AriaLiveRegion;

