import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DataSelector from '../components/DataSelector';
import DataViewer from '../components/DataViewer';
import { useDataFetch } from '../hooks/useDataFetch';
import { fetchData, exportDataToCSV, getAccounts, getPlatforms } from '../api/dataApi';
import { useToast } from '../hooks/useToast';
import logger from '../utils/logger';
/**
 * Data Page - Example implementation of Data Selector
 * 
 * This page demonstrates how to use the DataSelector component
 * with date range selection (Today, This Month, Custom) and
 * filtering by accounts and platforms.
 */
function DataPage() {
    const [accounts, setAccounts] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [lastRequestParams, setLastRequestParams] = useState(null);
    const { data, loading, error, fetchData, reset } = useDataFetch(fetchData);
    const { success, error: showError } = useToast();

    // Load accounts and platforms on mount
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [accs, plats] = await Promise.all([
                    getAccounts(),
                    getPlatforms(),
                ]);
                setAccounts(accs);
                setPlatforms(plats);
            } catch (err) {
                logger.error('Failed to load accounts/platforms', err);
                showError('Failed to load accounts and platforms');
            }
        };

        loadOptions();
    }, []);

    const handleDataRequest = async (requestParams) => {
        try {
            setLastRequestParams(requestParams);
            await fetchData(requestParams);
            success('Data loaded successfully!');
        } catch (err) {
            logger.error('Data request failed', err);
            showError(err.message || 'Failed to load data');
        }
    };

    const handleExport = async () => {
        if (!lastRequestParams) {
            showError('No data to export. Please fetch data first.');
            return;
        }

        try {
            const blob = await exportDataToCSV(lastRequestParams);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `data-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            success('Data exported successfully!');
        } catch (err) {
            logger.error('Export failed', err);
            showError(err.message || 'Failed to export data');
        }
    };

    const handleRefresh = () => {
        if (lastRequestParams) {
            handleDataRequest(lastRequestParams);
        }
    };

    return (
        <motion.div 
            className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 px-2 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <motion.div 
                className="mb-6 sm:mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Data Selection</h2>
                <p className="text-gray-400 text-sm sm:text-base">
                    Select date range and filters to view data from all accounts and platforms
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {/* Left Column: Data Selector */}
                <motion.div 
                    className="lg:col-span-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <DataSelector
                        accounts={accounts}
                        platforms={platforms}
                        onDataRequest={handleDataRequest}
                        isLoading={loading}
                    />
                </motion.div>

                {/* Right Column: Data Viewer */}
                <motion.div 
                    className="lg:col-span-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <DataViewer
                        data={data}
                        loading={loading}
                        error={error}
                        onRefresh={handleRefresh}
                        onExport={handleExport}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}

export default DataPage;

