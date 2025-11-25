import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpIcon } from './Tooltip';

const DATE_RANGE_OPTIONS = {
    TODAY: 'today',
    THIS_MONTH: 'this_month',
    CUSTOM: 'custom',
};

const DataSelector = ({ 
    accounts = [], 
    platforms = [], 
    onDataRequest,
    isLoading = false 
}) => {
    const [selectedRange, setSelectedRange] = useState(DATE_RANGE_OPTIONS.TODAY);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Initialize with all accounts/platforms selected
    useEffect(() => {
        if (accounts.length > 0 && selectedAccounts.length === 0) {
            setSelectedAccounts(accounts.map(acc => acc.id || acc));
        }
        if (platforms.length > 0 && selectedPlatforms.length === 0) {
            setSelectedPlatforms(platforms.map(plat => plat.id || plat));
        }
    }, [accounts, platforms]);

    // Get date range based on selection
    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (selectedRange) {
            case DATE_RANGE_OPTIONS.TODAY:
                return {
                    start: today.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0],
                };
            case DATE_RANGE_OPTIONS.THIS_MONTH:
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return {
                    start: firstDay.toISOString().split('T')[0],
                    end: lastDay.toISOString().split('T')[0],
                };
            case DATE_RANGE_OPTIONS.CUSTOM:
                return {
                    start: customStartDate || today.toISOString().split('T')[0],
                    end: customEndDate || today.toISOString().split('T')[0],
                };
            default:
                return { start: '', end: '' };
        }
    };

    const handleAccountToggle = (accountId) => {
        setSelectedAccounts(prev => 
            prev.includes(accountId)
                ? prev.filter(id => id !== accountId)
                : [...prev, accountId]
        );
    };

    const handlePlatformToggle = (platformId) => {
        setSelectedPlatforms(prev => 
            prev.includes(platformId)
                ? prev.filter(id => id !== platformId)
                : [...prev, platformId]
        );
    };

    const handleSelectAllAccounts = () => {
        if (selectedAccounts.length === accounts.length) {
            setSelectedAccounts([]);
        } else {
            setSelectedAccounts(accounts.map(acc => acc.id || acc));
        }
    };

    const handleSelectAllPlatforms = () => {
        if (selectedPlatforms.length === platforms.length) {
            setSelectedPlatforms([]);
        } else {
            setSelectedPlatforms(platforms.map(plat => plat.id || plat));
        }
    };

    const handleRequestData = () => {
        const dateRange = getDateRange();
        const requestData = {
            dateRange,
            accounts: selectedAccounts,
            platforms: selectedPlatforms,
            rangeType: selectedRange,
        };

        if (onDataRequest) {
            onDataRequest(requestData);
        }
    };

    const getRangeDescription = () => {
        const range = getDateRange();
        switch (selectedRange) {
            case DATE_RANGE_OPTIONS.TODAY:
                return `Today (${new Date().toLocaleDateString()})`;
            case DATE_RANGE_OPTIONS.THIS_MONTH:
                const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return `This Month (${month})`;
            case DATE_RANGE_OPTIONS.CUSTOM:
                return customStartDate && customEndDate
                    ? `${customStartDate} to ${customEndDate}`
                    : 'Custom Range';
            default:
                return 'Select Date Range';
        }
    };

    return (
        <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="text-blue-400" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Data Selection</h3>
                        <p className="text-sm text-gray-400">Choose date range and filters</p>
                    </div>
                </div>
                <HelpIcon 
                    content="Select today's data, this month's data, or a custom date range. Filter by accounts and platforms."
                    position="left"
                />
            </div>

            {/* Date Range Selection */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-400">Date Range</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <motion.button
                        onClick={() => setSelectedRange(DATE_RANGE_OPTIONS.TODAY)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                            selectedRange === DATE_RANGE_OPTIONS.TODAY
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400 pop-shadow-lg'
                                : 'border-gray-700 hover:border-gray-600 text-gray-300 pop-shadow hover:pop-shadow-lg'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="font-semibold mb-1">Today</div>
                            <div className="text-xs opacity-75">
                                {new Date().toLocaleDateString()}
                            </div>
                        </div>
                    </motion.button>

                    <motion.button
                        onClick={() => setSelectedRange(DATE_RANGE_OPTIONS.THIS_MONTH)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                            selectedRange === DATE_RANGE_OPTIONS.THIS_MONTH
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400 pop-shadow-lg'
                                : 'border-gray-700 hover:border-gray-600 text-gray-300 pop-shadow hover:pop-shadow-lg'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="font-semibold mb-1">This Month</div>
                            <div className="text-xs opacity-75">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </motion.button>

                    <motion.button
                        onClick={() => setSelectedRange(DATE_RANGE_OPTIONS.CUSTOM)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                            selectedRange === DATE_RANGE_OPTIONS.CUSTOM
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400 pop-shadow-lg'
                                : 'border-gray-700 hover:border-gray-600 text-gray-300 pop-shadow hover:pop-shadow-lg'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="font-semibold mb-1">Custom</div>
                            <div className="text-xs opacity-75">Select dates</div>
                        </div>
                    </motion.button>
                </div>

                {/* Custom Date Range */}
                <AnimatePresence>
                    {selectedRange === DATE_RANGE_OPTIONS.CUSTOM && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                        >
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="input-field"
                                    max={customEndDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="input-field"
                                    min={customStartDate}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Selected Range Display */}
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/60 pop-shadow">
                    <div className="text-sm text-gray-400">Selected Range:</div>
                    <div className="text-white font-medium">{getRangeDescription()}</div>
                </div>
            </div>

            {/* Filters Toggle */}
            {(accounts.length > 0 || platforms.length > 0) && (
                <div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <Filter size={16} />
                        <span>Filter by Accounts & Platforms</span>
                        <span className="ml-auto">
                            {showFilters ? '▼' : '▶'}
                        </span>
                    </button>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-4"
                            >
                                {/* Accounts Filter */}
                                {accounts.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-gray-400">
                                                Accounts ({selectedAccounts.length}/{accounts.length})
                                            </label>
                                            <button
                                                onClick={handleSelectAllAccounts}
                                                className="text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                {selectedAccounts.length === accounts.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                                            {accounts.map((account, index) => {
                                                const accountId = account.id || account;
                                                const accountName = account.name || account;
                                                const isSelected = selectedAccounts.includes(accountId);
                                                return (
                                                    <motion.button
                                                        key={accountId}
                                                        onClick={() => handleAccountToggle(accountId)}
                                                        className={`p-2 rounded-lg text-sm transition-all ${
                                                            isSelected
                                                                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400 pop-shadow'
                                                                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-gray-600 pop-shadow hover:pop-shadow-lg'
                                                        }`}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.05, duration: 0.2 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        {accountName}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Platforms Filter */}
                                {platforms.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-gray-400">
                                                Platforms ({selectedPlatforms.length}/{platforms.length})
                                            </label>
                                            <button
                                                onClick={handleSelectAllPlatforms}
                                                className="text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                {selectedPlatforms.length === platforms.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                                            {platforms.map((platform, index) => {
                                                const platformId = platform.id || platform;
                                                const platformName = platform.name || platform;
                                                const isSelected = selectedPlatforms.includes(platformId);
                                                return (
                                                    <motion.button
                                                        key={platformId}
                                                        onClick={() => handlePlatformToggle(platformId)}
                                                        className={`p-2 rounded-lg text-sm transition-all ${
                                                            isSelected
                                                                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400 pop-shadow'
                                                                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-gray-600 pop-shadow hover:pop-shadow-lg'
                                                        }`}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: index * 0.05, duration: 0.2 }}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        {platformName}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Action Button */}
            <motion.button
                onClick={handleRequestData}
                disabled={isLoading || selectedAccounts.length === 0 || selectedPlatforms.length === 0}
                className={`w-full btn-primary flex items-center justify-center gap-2 ${
                    (selectedAccounts.length === 0 || selectedPlatforms.length === 0) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                }`}
                whileHover={isLoading || (selectedAccounts.length === 0 || selectedPlatforms.length === 0) ? {} : { scale: 1.02 }}
                whileTap={isLoading || (selectedAccounts.length === 0 || selectedPlatforms.length === 0) ? {} : { scale: 0.98 }}
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Loading Data...</span>
                    </>
                ) : (
                    <>
                        <Download size={18} />
                        <span>Get Data</span>
                    </>
                )}
            </motion.button>

            {/* Summary */}
            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 text-xs text-gray-400 pop-shadow">
                <div className="flex items-center justify-between">
                    <span>Selected:</span>
                    <span className="text-white">
                        {selectedAccounts.length} account{selectedAccounts.length !== 1 ? 's' : ''}, {' '}
                        {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DataSelector;

