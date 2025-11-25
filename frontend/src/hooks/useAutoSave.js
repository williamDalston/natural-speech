import { useEffect, useRef, useCallback, useState } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook for auto-saving form data to localStorage
 * @param {string} storageKey - Unique key for localStorage
 * @param {object} data - Data to save
 * @param {object} options - Configuration options
 * @param {number} options.interval - Auto-save interval in milliseconds (default: 30000)
 * @param {boolean} options.saveOnBlur - Whether to save on blur (default: true)
 * @param {boolean} options.saveBeforeUnload - Whether to save before page unload (default: true)
 * @param {function} options.onSave - Callback when data is saved
 * @returns {object} { isSaving, lastSaved, hasUnsavedChanges, clearDraft, recoverDraft }
 */
export const useAutoSave = (storageKey, data, options = {}) => {
    const {
        interval = 30000, // 30 seconds
        saveOnBlur = true,
        saveBeforeUnload = true,
        onSave = null,
    } = options;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    const dataRef = useRef(data);
    const intervalRef = useRef(null);
    const lastSavedRef = useRef(null);

    // Update data ref when data changes
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Save function
    const saveDraft = useCallback(() => {
        try {
            const dataToSave = {
                ...dataRef.current,
                _timestamp: new Date().toISOString(),
                _storageKey: storageKey,
            };

            // Check if data has actually changed
            const existingDraft = localStorage.getItem(storageKey);
            if (existingDraft) {
                try {
                    const parsed = JSON.parse(existingDraft);
                    if (JSON.stringify(parsed) === JSON.stringify(dataToSave)) {
                        // No changes, skip save
                        return;
                    }
                } catch (e) {
                    // If parsing fails, continue with save
                }
            }

            setIsSaving(true);
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            
            const now = new Date();
            setLastSaved(now);
            lastSavedRef.current = now;
            setHasUnsavedChanges(false);

            if (onSave) {
                onSave(dataToSave);
            }
        } catch (error) {
            logger.error('Failed to save draft', error);
        } finally {
            // Small delay to show saving indicator
            setTimeout(() => setIsSaving(false), 300);
        }
    }, [storageKey, onSave]);

    // Auto-save on interval
    useEffect(() => {
        if (interval > 0) {
            intervalRef.current = setInterval(() => {
                // Only save if there are actual changes
                const hasData = Object.values(dataRef.current || {}).some(
                    value => value !== null && value !== undefined && value !== ''
                );
                
                if (hasData) {
                    setHasUnsavedChanges(true);
                    saveDraft();
                }
            }, interval);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [interval, saveDraft]);

    // Save on blur - using a timeout to debounce rapid blur events
    useEffect(() => {
        if (!saveOnBlur) return;

        let blurTimeout = null;
        const handleBlur = (e) => {
            // Only save if we're leaving an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Debounce to avoid saving too frequently
                if (blurTimeout) clearTimeout(blurTimeout);
                blurTimeout = setTimeout(() => {
                    const hasData = Object.values(dataRef.current || {}).some(
                        value => value !== null && value !== undefined && value !== ''
                    );
                    
                    if (hasData) {
                        saveDraft();
                    }
                }, 500); // Wait 500ms after blur before saving
            }
        };

        document.addEventListener('blur', handleBlur, true);
        return () => {
            document.removeEventListener('blur', handleBlur, true);
            if (blurTimeout) clearTimeout(blurTimeout);
        };
    }, [saveOnBlur, saveDraft]);

    // Save before page unload
    useEffect(() => {
        if (!saveBeforeUnload) return;

        const handleBeforeUnload = (e) => {
            const hasData = Object.values(dataRef.current || {}).some(
                value => value !== null && value !== undefined && value !== ''
            );
            
            if (hasData) {
                // Synchronous save before unload
                try {
                    const dataToSave = {
                        ...dataRef.current,
                        _timestamp: new Date().toISOString(),
                        _storageKey: storageKey,
                    };
                    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
                } catch (error) {
                    logger.error('Failed to save draft on unload', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveBeforeUnload, storageKey]);

    // Clear draft
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
            setLastSaved(null);
            lastSavedRef.current = null;
            setHasUnsavedChanges(false);
        } catch (error) {
            logger.error('Failed to clear draft', error);
        }
    }, [storageKey]);

    // Recover draft
    const recoverDraft = useCallback(() => {
        try {
            const draft = localStorage.getItem(storageKey);
            if (draft) {
                const parsed = JSON.parse(draft);
                // Remove metadata
                const { _timestamp, _storageKey, ...data } = parsed;
                return data;
            }
            return null;
        } catch (error) {
            logger.error('Failed to recover draft', error);
            return null;
        }
    }, [storageKey]);

    // Check for unsaved changes on mount
    useEffect(() => {
        try {
            const draft = localStorage.getItem(storageKey);
            if (draft) {
                const parsed = JSON.parse(draft);
                const { _timestamp, _storageKey, ...savedData } = parsed;
                
                // Compare with current data
                const currentDataStr = JSON.stringify(dataRef.current);
                const savedDataStr = JSON.stringify(savedData);
                
                if (currentDataStr !== savedDataStr) {
                    setHasUnsavedChanges(true);
                }
                
                if (parsed._timestamp) {
                    setLastSaved(new Date(parsed._timestamp));
                }
            }
        } catch (error) {
            logger.error('Failed to check for unsaved changes', error);
        }
    }, [storageKey]);

    return {
        isSaving,
        lastSaved,
        hasUnsavedChanges,
        clearDraft,
        recoverDraft,
        saveDraft, // Expose manual save function
    };
};

