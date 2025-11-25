import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, FileCode, FileType, Printer, Share2, Copy, QrCode, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import { exportAsTxt, exportAsMarkdown, exportAsHTML, exportAsPDF } from '../utils/exportUtils';
import { 
    copyToClipboard, 
    shareViaWebAPI, 
    shareToTwitter, 
    shareToFacebook, 
    shareToLinkedIn, 
    shareViaEmail,
    generateShareLink,
    generateQRCode,
    isWebShareSupported,
    isClipboardSupported
} from '../utils/shareUtils';
import { useToast } from '../hooks/useToast';

const ExportModal = ({ isOpen, onClose, writing }) => {
    const [activeTab, setActiveTab] = useState('export'); // 'export' or 'share'
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [generatingQR, setGeneratingQR] = useState(false);
    const modalRef = useRef(null);
    const closeButtonRef = useRef(null);
    const { success, error: showError } = useToast();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                closeButtonRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !writing) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }

            // Tab trapping
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, writing, onClose]);

    if (!isOpen || !writing) return null;

    const handleExport = async (format) => {
        try {
            switch (format) {
                case 'txt':
                    exportAsTxt(writing);
                    success('Writing exported as TXT');
                    break;
                case 'markdown':
                    exportAsMarkdown(writing);
                    success('Writing exported as Markdown');
                    break;
                case 'html':
                    exportAsHTML(writing);
                    success('Writing exported as HTML');
                    break;
                case 'pdf':
                    exportAsPDF(writing);
                    success('PDF export opened in print dialog');
                    break;
                default:
                    showError('Unknown export format');
            }
        } catch (err) {
            showError(err.message || 'Failed to export writing');
        }
    };

    const handleCopyLink = async () => {
        const link = generateShareLink(writing);
        const copied = await copyToClipboard(link);
        if (copied) {
            success('Link copied to clipboard!');
        } else {
            showError('Failed to copy link. Please try again.');
        }
    };

    const handleCopyContent = async () => {
        const copied = await copyToClipboard(writing.content);
        if (copied) {
            success('Content copied to clipboard!');
        } else {
            showError('Failed to copy content. Please try again.');
        }
    };

    const handleWebShare = async () => {
        const shared = await shareViaWebAPI(writing);
        if (shared) {
            success('Shared successfully!');
        } else if (!isWebShareSupported()) {
            showError('Web Share API is not supported in your browser');
        }
    };

    const handleGenerateQR = async () => {
        setGeneratingQR(true);
        try {
            const link = generateShareLink(writing);
            const qrUrl = await generateQRCode(link);
            if (qrUrl) {
                setQrCodeUrl(qrUrl);
                success('QR code generated!');
            } else {
                showError('Failed to generate QR code. Please try again.');
            }
        } catch (err) {
            showError(err.message || 'Failed to generate QR code');
        } finally {
            setGeneratingQR(false);
        }
    };

    const handleSocialShare = (platform) => {
        try {
            switch (platform) {
                case 'twitter':
                    shareToTwitter(writing);
                    break;
                case 'facebook':
                    shareToFacebook(writing);
                    break;
                case 'linkedin':
                    shareToLinkedIn(writing);
                    break;
                case 'email':
                    shareViaEmail(writing);
                    break;
                default:
                    showError('Unknown platform');
            }
        } catch (err) {
            showError(err.message || 'Failed to share');
        }
    };

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
                        aria-labelledby="export-modal-title"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                onClose();
                            }
                        }}
                    >
                        <motion.div
                            ref={modalRef}
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
                                        id="export-modal-title"
                                        className="text-2xl font-bold text-white mb-2"
                                    >
                                        Export & Share
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        {writing.title || 'Untitled'}
                                    </p>
                                </div>
                                <button
                                    ref={closeButtonRef}
                                    onClick={onClose}
                                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Close export modal"
                                >
                                    <X size={24} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 border-b border-gray-800">
                                <button
                                    onClick={() => setActiveTab('export')}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === 'export'
                                            ? 'text-blue-400 border-b-2 border-blue-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Export
                                </button>
                                <button
                                    onClick={() => setActiveTab('share')}
                                    className={`px-4 py-2 font-medium transition-colors ${
                                        activeTab === 'share'
                                            ? 'text-blue-400 border-b-2 border-blue-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Share
                                </button>
                            </div>

                            {/* Export Tab */}
                            {activeTab === 'export' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            onClick={() => handleExport('txt')}
                                            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FileText size={24} aria-hidden="true" />
                                            <span className="text-sm font-medium">TXT</span>
                                        </motion.button>
                                        <motion.button
                                            onClick={() => handleExport('markdown')}
                                            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FileCode size={24} aria-hidden="true" />
                                            <span className="text-sm font-medium">Markdown</span>
                                        </motion.button>
                                        <motion.button
                                            onClick={() => handleExport('html')}
                                            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <FileType size={24} aria-hidden="true" />
                                            <span className="text-sm font-medium">HTML</span>
                                        </motion.button>
                                        <motion.button
                                            onClick={() => handleExport('pdf')}
                                            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <Printer size={24} aria-hidden="true" />
                                            <span className="text-sm font-medium">PDF</span>
                                        </motion.button>
                                    </div>
                                </div>
                            )}

                            {/* Share Tab */}
                            {activeTab === 'share' && (
                                <div className="space-y-4">
                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {isWebShareSupported() && (
                                            <motion.button
                                                onClick={handleWebShare}
                                                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Share2 size={24} aria-hidden="true" />
                                                <span className="text-sm font-medium">Share</span>
                                            </motion.button>
                                        )}
                                        {isClipboardSupported() && (
                                            <>
                                                <motion.button
                                                    onClick={handleCopyLink}
                                                    className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Copy size={24} aria-hidden="true" />
                                                    <span className="text-sm font-medium">Copy Link</span>
                                                </motion.button>
                                                <motion.button
                                                    onClick={handleCopyContent}
                                                    className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Copy size={24} aria-hidden="true" />
                                                    <span className="text-sm font-medium">Copy Text</span>
                                                </motion.button>
                                            </>
                                        )}
                                        <motion.button
                                            onClick={handleGenerateQR}
                                            disabled={generatingQR}
                                            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {generatingQR ? (
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                                            ) : (
                                                <QrCode size={24} aria-hidden="true" />
                                            )}
                                            <span className="text-sm font-medium">QR Code</span>
                                        </motion.button>
                                    </div>

                                    {/* QR Code Display */}
                                    {qrCodeUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-lg"
                                        >
                                            <img 
                                                src={qrCodeUrl} 
                                                alt="QR Code" 
                                                className="w-48 h-48"
                                            />
                                            <p className="text-sm text-gray-400">Scan to share</p>
                                        </motion.div>
                                    )}

                                    {/* Social Media */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 mb-3">Share to Social Media</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <motion.button
                                                onClick={() => handleSocialShare('twitter')}
                                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Twitter size={20} aria-hidden="true" />
                                                <span className="text-sm">Twitter</span>
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleSocialShare('facebook')}
                                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Facebook size={20} aria-hidden="true" />
                                                <span className="text-sm">Facebook</span>
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleSocialShare('linkedin')}
                                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Linkedin size={20} aria-hidden="true" />
                                                <span className="text-sm">LinkedIn</span>
                                            </motion.button>
                                            <motion.button
                                                onClick={() => handleSocialShare('email')}
                                                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <Mail size={20} aria-hidden="true" />
                                                <span className="text-sm">Email</span>
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;

