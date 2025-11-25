/**
 * Data API Module
 * Handles data fetching with date ranges, accounts, and platforms
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/**
 * Fetch data for specified date range, accounts, and platforms
 * 
 * @param {Object} params - Request parameters
 * @param {Object} params.dateRange - { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 * @param {Array} params.accounts - Array of account IDs
 * @param {Array} params.platforms - Array of platform IDs
 * @param {string} params.rangeType - 'today' | 'this_month' | 'custom'
 * @returns {Promise<Object>} - Data response
 */
export const fetchData = async (params) => {
    const { dateRange, accounts, platforms, rangeType } = params;

    const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            start_date: dateRange.start,
            end_date: dateRange.end,
            accounts: accounts,
            platforms: platforms,
            range_type: rangeType,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Export data to CSV
 * 
 * @param {Object} params - Same as fetchData
 * @returns {Promise<Blob>} - CSV file blob
 */
export const exportDataToCSV = async (params) => {
    const { dateRange, accounts, platforms, rangeType } = params;

    const response = await fetch(`${API_BASE_URL}/data/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            start_date: dateRange.start,
            end_date: dateRange.end,
            accounts: accounts,
            platforms: platforms,
            range_type: rangeType,
            format: 'csv',
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to export data');
    }

    return response.blob();
};

/**
 * Get available accounts
 * 
 * @returns {Promise<Array>} - Array of account objects
 */
export const getAccounts = async () => {
    const response = await fetch(`${API_BASE_URL}/accounts`);

    if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get available platforms
 * 
 * @returns {Promise<Array>} - Array of platform objects
 */
export const getPlatforms = async () => {
    const response = await fetch(`${API_BASE_URL}/platforms`);

    if (!response.ok) {
        throw new Error(`Failed to fetch platforms: ${response.statusText}`);
    }

    return response.json();
};

