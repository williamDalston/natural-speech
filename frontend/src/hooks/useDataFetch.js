import { useState, useCallback } from 'react';

/**
 * Hook for fetching data with date range and filters
 * 
 * @param {Function} fetchFunction - Function that accepts request params and returns data
 * @returns {Object} - { data, loading, error, fetchData }
 */
export const useDataFetch = (fetchFunction) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (requestParams) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await fetchFunction(requestParams);
            setData(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to fetch data';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchFunction]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        data,
        loading,
        error,
        fetchData,
        reset,
    };
};

