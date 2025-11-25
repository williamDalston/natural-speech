/**
 * Network Status Component
 * 
 * Displays network connectivity status and offline queue information.
 * Automatically processes queued requests when connection is restored.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import offlineQueue from '../utils/offlineQueue';
import { apiClient } from '../api.js';
import logger from '../utils/logger';

const NetworkStatus = ({ showWhenOnline = false }) => {
  const { state } = useApp();
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const isOnline = state.isOnline;

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(({ size }) => {
      setQueueSize(size);
    });

    // Initial queue size
    setQueueSize(offlineQueue.getSize());

    return unsubscribe;
  }, []);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queueSize > 0 && !isProcessing) {
      setIsProcessing(true);
      setLastSyncTime(null);

      offlineQueue.processQueue(apiClient)
        .then(() => {
          setLastSyncTime(Date.now());
          setQueueSize(offlineQueue.getSize());
        })
        .catch((error) => {
          logger.error('Error processing offline queue', error);
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  }, [isOnline, queueSize, isProcessing]);

  // Don't show when online unless explicitly requested
  if (isOnline && !showWhenOnline && queueSize === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {(isOnline === false || queueSize > 0 || showWhenOnline) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 glass-card p-3 rounded-lg shadow-lg max-w-sm ${
            isOnline ? 'border-green-500/20' : 'border-red-500/20'
          } border`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <Wifi className="text-green-400" size={20} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Online</p>
                  {queueSize > 0 && (
                    <p className="text-xs text-gray-400">
                      {isProcessing 
                        ? 'Syncing queued requests...' 
                        : queueSize === 0 
                          ? 'All requests synced'
                          : `${queueSize} request${queueSize !== 1 ? 's' : ''} queued`}
                    </p>
                  )}
                  {lastSyncTime && queueSize === 0 && (
                    <p className="text-xs text-gray-500">
                      Synced {new Date(lastSyncTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                {isProcessing && (
                  <RefreshCw 
                    className="text-green-400 animate-spin" 
                    size={16} 
                    aria-hidden="true"
                  />
                )}
                {!isProcessing && queueSize === 0 && (
                  <CheckCircle 
                    className="text-green-400" 
                    size={16} 
                    aria-hidden="true"
                  />
                )}
              </>
            ) : (
              <>
                <WifiOff className="text-red-400" size={20} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">Offline</p>
                  <p className="text-xs text-gray-400">
                    {queueSize > 0 
                      ? `${queueSize} request${queueSize !== 1 ? 's' : ''} will sync when online`
                      : 'Your changes will be saved when you reconnect'}
                  </p>
                </div>
                {queueSize > 0 && (
                  <AlertCircle 
                    className="text-yellow-400" 
                    size={16} 
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatus;

