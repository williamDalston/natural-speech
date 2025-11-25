import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Calendar, User, BookOpen, FileText, ChevronDown, ChevronUp, Save, Trash2 } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { 
    getRecentSearches, 
    saveRecentSearch, 
    clearRecentSearches,
    getSearchPresets,
    saveSearchPreset,
    deleteSearchPreset,
    getSearchSuggestions,
    formatDateForAPI
} from '../utils/searchUtils';

const AdvancedSearch = ({
    searchQuery,
    onSearchChange,
    filters = {},
    onFiltersChange,
    genres = [],
    onSearch,
    showSuggestions = true
}) => {
    const [showFilters, setShowFilters] = useState(false);
    const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [presets, setPresets] = useState({});
    const [showPresets, setShowPresets] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [showSavePreset, setShowSavePreset] = useState(false);
    
    const searchInputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const debouncedQuery = useDebounce(searchQuery, 300);

    // Load recent searches and presets
    useEffect(() => {
        setRecentSearches(getRecentSearches());
        setPresets(getSearchPresets());
    }, []);

    // Update suggestions when query changes
    useEffect(() => {
        if (debouncedQuery && showSuggestions) {
            const newSuggestions = getSearchSuggestions(debouncedQuery, recentSearches);
            setSuggestions(newSuggestions);
            setShowSuggestionsDropdown(newSuggestions.length > 0 && searchQuery.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestionsDropdown(false);
        }
    }, [debouncedQuery, recentSearches, searchQuery, showSuggestions]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowSuggestionsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (value) => {
        onSearchChange(value);
        if (value && showSuggestions) {
            setShowSuggestionsDropdown(true);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        onSearchChange(suggestion);
        saveRecentSearch(suggestion);
        setRecentSearches(getRecentSearches());
        setShowSuggestionsDropdown(false);
        if (onSearch) onSearch();
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery);
            setRecentSearches(getRecentSearches());
        }
        if (onSearch) onSearch();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestionsDropdown(false);
        }
    };

    const clearAllFilters = () => {
        onFiltersChange({
            author: '',
            genre: '',
            category: '',
            startDate: '',
            endDate: '',
            minWordCount: '',
            maxWordCount: ''
        });
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.author) count++;
        if (filters.genre) count++;
        if (filters.category) count++;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        if (filters.minWordCount) count++;
        if (filters.maxWordCount) count++;
        return count;
    };

    const activeFilterCount = getActiveFilterCount();

    const handlePresetClick = (presetName) => {
        const preset = presets[presetName];
        if (preset) {
            onFiltersChange(preset);
            if (preset.search) {
                onSearchChange(preset.search);
            }
            if (onSearch) onSearch();
        }
    };

    const handleSavePreset = () => {
        if (presetName.trim()) {
            const preset = {
                ...filters,
                search: searchQuery
            };
            saveSearchPreset(presetName.trim(), preset);
            setPresets(getSearchPresets());
            setPresetName('');
            setShowSavePreset(false);
        }
    };

    const handleDeletePreset = (name, e) => {
        e.stopPropagation();
        deleteSearchPreset(name);
        setPresets(getSearchPresets());
    };

    return (
        <div className="w-full mb-6">
            {/* Main Search Bar */}
            <div className="relative">
                <div className="relative">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search writings by title, content, or author..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0 || recentSearches.length > 0) {
                                setShowSuggestionsDropdown(true);
                            }
                        }}
                        className="w-full px-4 py-3 pl-12 pr-32 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        aria-label="Search writings"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    
                    {/* Action Buttons */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    onSearchChange('');
                                    setShowSuggestionsDropdown(false);
                                }}
                                className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-1.5 rounded transition-colors relative ${
                                activeFilterCount > 0
                                    ? 'text-blue-400 hover:text-blue-300'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            aria-label="Toggle filters"
                        >
                            <Filter size={16} />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Suggestions Dropdown */}
                <AnimatePresence>
                    {showSuggestionsDropdown && (suggestions.length > 0 || recentSearches.length > 0) && (
                        <motion.div
                            ref={suggestionsRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
                        >
                            {suggestions.length > 0 && (
                                <div className="p-2">
                                    <div className="text-xs text-gray-500 px-3 py-2">Suggestions</div>
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                                        >
                                            <Search size={14} className="inline mr-2 text-gray-400" />
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {recentSearches.length > 0 && (
                                <div className="p-2 border-t border-gray-800">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <div className="text-xs text-gray-500">Recent Searches</div>
                                        <button
                                            onClick={clearRecentSearches}
                                            className="text-xs text-gray-400 hover:text-gray-300"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {recentSearches.slice(0, 5).map((search, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSuggestionClick(search)}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                                        >
                                            <Search size={14} className="inline mr-2 text-gray-400" />
                                            {search}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 glass-card p-4 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Filter size={18} />
                                Advanced Filters
                            </h3>
                            <div className="flex gap-2">
                                {Object.keys(presets).length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowPresets(!showPresets)}
                                            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-white flex items-center gap-2"
                                        >
                                            Presets
                                            {showPresets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <AnimatePresence>
                                            {showPresets && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-10 min-w-[200px]"
                                                >
                                                    {Object.keys(presets).map((name) => (
                                                        <div key={name} className="flex items-center justify-between p-2 hover:bg-gray-800">
                                                            <button
                                                                onClick={() => handlePresetClick(name)}
                                                                className="flex-1 text-left text-sm text-white px-2 py-1"
                                                            >
                                                                {name}
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeletePreset(name, e)}
                                                                className="p-1 text-gray-400 hover:text-red-400"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg text-white flex items-center gap-2"
                                    >
                                        <X size={14} />
                                        Clear All ({activeFilterCount})
                                    </button>
                                )}
                                {!showSavePreset && (
                                    <button
                                        onClick={() => setShowSavePreset(true)}
                                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg text-white flex items-center gap-2"
                                    >
                                        <Save size={14} />
                                        Save Preset
                                    </button>
                                )}
                            </div>
                        </div>

                        {showSavePreset && (
                            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Preset name..."
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSavePreset();
                                        if (e.key === 'Escape') {
                                            setShowSavePreset(false);
                                            setPresetName('');
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSavePreset}
                                    disabled={!presetName.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSavePreset(false);
                                        setPresetName('');
                                    }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Author Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                    <User size={14} />
                                    Author
                                </label>
                                <input
                                    type="text"
                                    placeholder="Filter by author..."
                                    value={filters.author || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Genre Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                    <BookOpen size={14} />
                                    Genre
                                </label>
                                <select
                                    value={filters.genre || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, genre: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Genres</option>
                                    {genres.map((genre) => (
                                        <option key={genre} value={genre}>
                                            {genre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                    <FileText size={14} />
                                    Category
                                </label>
                                <select
                                    value={filters.category || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    <option value="user">User Writings</option>
                                    <option value="curated">Curated Writings</option>
                                </select>
                            </div>

                            {/* Start Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* End Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                    <Calendar size={14} />
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Word Count Filters */}
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Word Count
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minWordCount || ''}
                                        onChange={(e) => onFiltersChange({ ...filters, minWordCount: e.target.value ? parseInt(e.target.value) : '' })}
                                        min="0"
                                        className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400 self-center">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxWordCount || ''}
                                        onChange={(e) => onFiltersChange({ ...filters, maxWordCount: e.target.value ? parseInt(e.target.value) : '' })}
                                        min="0"
                                        className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdvancedSearch;

