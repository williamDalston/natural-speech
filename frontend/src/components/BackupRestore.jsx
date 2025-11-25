import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { exportAllData, parseBackupFile, getBackupInfo, validateBackupFile } from '../utils/backupUtils';
import { getWritings, createWriting } from '../api';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from './ConfirmationModal';
import logger from '../utils/logger';

const BackupRestore = ({ isOpen, onClose }) => {
    const [backupInfo, setBackupInfo] = useState(null);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importConfirmOpen, setImportConfirmOpen] = useState(false);
    const fileInputRef = useRef(null);
    const { success, error: showError } = useToast();

    const handleExport = async () => {
        try {
            setExporting(true);
            await exportAllData(getWritings);
            success('Backup exported successfully!');
        } catch (err) {
            showError(err.message || 'Failed to export backup');
        } finally {
            setExporting(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await parseBackupFile(file);
            const info = getBackupInfo(data);
            setBackupInfo(info);
            setImportFile(data);
            setImportConfirmOpen(true);
        } catch (err) {
            showError(err.message || 'Failed to parse backup file');
            setImportFile(null);
            setBackupInfo(null);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;

        try {
            setImporting(true);
            const validation = validateBackupFile(importFile);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Import writings one by one
            let imported = 0;
            let failed = 0;

            for (const writing of importFile.writings) {
                try {
                    await createWriting({
                        title: writing.title,
                        content: writing.content,
                        author: writing.author,
                    });
                    imported++;
                } catch (err) {
                    logger.error('Failed to import writing', err);
                    failed++;
                }
            }

            if (imported > 0) {
                success(`Successfully imported ${imported} writing(s)${failed > 0 ? `. ${failed} failed.` : ''}`);
            } else {
                showError('Failed to import any writings');
            }

            // Reset state
            setImportFile(null);
            setBackupInfo(null);
            setImportConfirmOpen(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            showError(err.message || 'Failed to import backup');
        } finally {
            setImporting(false);
        }
    };

    const handleCancelImport = () => {
        setImportFile(null);
        setBackupInfo(null);
        setImportConfirmOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="backup-restore-title"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300
                            }}
                            className="glass-card p-6 max-w-2xl w-full my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2
                                        id="backup-restore-title"
                                        className="text-2xl font-bold text-white mb-2"
                                    >
                                        Backup & Restore
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        Export all your writings or import from a backup
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Close backup restore modal"
                                >
                                    <X size={24} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Export Section */}
                            <div className="mb-6 pb-6 border-b border-gray-800">
                                <h3 className="text-lg font-semibold text-white mb-4">Export Backup</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Download all your writings as a JSON backup file. This file can be used to restore your data later.
                                </p>
                                <motion.button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {exporting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                            <span>Exporting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} aria-hidden="true" />
                                            <span>Export All Writings</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>

                            {/* Import Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Import Backup</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Restore your writings from a previously exported backup file.
                                </p>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,application/json"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="backup-file-input"
                                    aria-label="Select backup file"
                                />

                                <label
                                    htmlFor="backup-file-input"
                                    className="block w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center justify-center gap-2 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500"
                                >
                                    <Upload size={20} aria-hidden="true" />
                                    <span>Choose Backup File</span>
                                </label>

                                {/* Backup Info Preview */}
                                {backupInfo && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 p-4 bg-gray-800/50 rounded-lg"
                                    >
                                        <div className="flex items-start gap-3">
                                            <FileJson size={24} className="text-blue-400 flex-shrink-0 mt-1" aria-hidden="true" />
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-2">Backup Information</h4>
                                                <div className="space-y-1 text-sm text-gray-400">
                                                    <p><span className="text-gray-300">Version:</span> {backupInfo.version}</p>
                                                    <p><span className="text-gray-300">Export Date:</span> {backupInfo.exportDate}</p>
                                                    <p><span className="text-gray-300">Total Writings:</span> {backupInfo.totalWritings}</p>
                                                    <p><span className="text-gray-300">Total Characters:</span> {backupInfo.totalCharacters.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Warning */}
                            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <div className="text-sm text-yellow-200">
                                        <p className="font-medium mb-1">Important Notes:</p>
                                        <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
                                            <li>Importing will add writings to your existing collection (not replace)</li>
                                            <li>Make sure to export a backup before importing if you want to preserve current data</li>
                                            <li>Large backups may take a few moments to import</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Import Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={importConfirmOpen}
                        onClose={handleCancelImport}
                        onConfirm={handleImport}
                        title="Import Backup"
                        message={
                            backupInfo
                                ? `Import ${backupInfo.totalWritings} writing(s) from this backup? This will add them to your existing collection.`
                                : 'Import this backup?'
                        }
                        confirmLabel={importing ? 'Importing...' : 'Import'}
                        cancelLabel="Cancel"
                        variant="primary"
                        isLoading={importing}
                    />
                </>
            )}
        </AnimatePresence>
    );
};

export default BackupRestore;

