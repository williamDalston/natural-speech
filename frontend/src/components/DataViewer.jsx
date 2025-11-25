import React from 'react';
import { Download, RefreshCw, TrendingUp, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import ErrorDisplay from './ErrorDisplay';

const DataViewer = ({ data, loading, error, onRefresh, onExport }) => {
    if (loading) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-6">
                <ErrorDisplay error={error} />
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="mt-4 btn-primary flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        <span>Try Again</span>
                    </button>
                )}
            </div>
        );
    }

    if (!data) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                <Globe className="text-gray-600 mb-4" size={48} />
                <p className="text-gray-400 mb-2">No data selected</p>
                <p className="text-sm text-gray-500">Use the data selector to fetch data</p>
            </div>
        );
    }

    // Extract summary stats if available
    const stats = data.summary || {};
    const records = data.records || [];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {stats && Object.keys(stats).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.total_records !== undefined && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="text-blue-400" size={24} />
                                <span className="text-2xl font-bold text-white">
                                    {stats.total_records?.toLocaleString() || 0}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">Total Records</p>
                        </motion.div>
                    )}

                    {stats.total_accounts !== undefined && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Users className="text-green-400" size={24} />
                                <span className="text-2xl font-bold text-white">
                                    {stats.total_accounts?.toLocaleString() || 0}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">Accounts</p>
                        </motion.div>
                    )}

                    {stats.total_platforms !== undefined && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Globe className="text-purple-400" size={24} />
                                <span className="text-2xl font-bold text-white">
                                    {stats.total_platforms?.toLocaleString() || 0}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">Platforms</p>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Data Table */}
            {records.length > 0 && (
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Data Records</h3>
                        {onExport && (
                            <motion.button
                                onClick={onExport}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Download size={18} />
                                <span>Export CSV</span>
                            </motion.button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    {Object.keys(records[0] || {}).map((key) => (
                                        <th
                                            key={key}
                                            className="text-left py-3 px-4 text-sm font-medium text-gray-400"
                                        >
                                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.slice(0, 100).map((record, index) => (
                                    <motion.tr
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.01, duration: 0.2 }}
                                        className="border-b border-gray-800 hover:bg-gray-800/30"
                                        whileHover={{ scale: 1.01, x: 4 }}
                                    >
                                        {Object.values(record).map((value, i) => (
                                            <td key={i} className="py-3 px-4 text-sm text-gray-300">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        {records.length > 100 && (
                            <div className="mt-4 text-center text-sm text-gray-400">
                                Showing first 100 of {records.length} records
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {records.length === 0 && (
                <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                    <Globe className="text-gray-600 mb-4" size={48} />
                    <p className="text-gray-400 mb-2">No data found</p>
                    <p className="text-sm text-gray-500">
                        Try adjusting your date range or filters
                    </p>
                </div>
            )}
        </div>
    );
};

export default DataViewer;

