/**
 * Offline Queue Utility
 * 
 * Manages a queue of actions to be executed when the app comes back online
 * Provides offline/online state management and action queuing
 */

class OfflineQueue {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.listeners = [];
        this.maxQueueSize = 100;
        
        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    handleOnline = () => {
        this.isOnline = true;
        this.processQueue();
        this.notifyListeners('online');
    };

    handleOffline = () => {
        this.isOnline = false;
        this.notifyListeners('offline');
    };

    /**
     * Add an action to the queue
     */
    enqueue(action) {
        if (this.queue.length >= this.maxQueueSize) {
            // Remove oldest item
            this.queue.shift();
        }
        
        const queueItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action,
            timestamp: Date.now(),
            retries: 0,
            maxRetries: 3,
        };
        
        this.queue.push(queueItem);
        
        // Try to process immediately if online
        if (this.isOnline) {
            this.processQueue();
        }
        
        return queueItem.id;
    }

    /**
     * Process the queue
     */
    async processQueue() {
        if (!this.isOnline || this.queue.length === 0) {
            return;
        }

        const itemsToProcess = [...this.queue];
        this.queue = [];

        for (const item of itemsToProcess) {
            try {
                await item.action();
                this.notifyListeners('success', item.id);
            } catch (error) {
                // Retry if under max retries
                if (item.retries < item.maxRetries) {
                    item.retries++;
                    this.queue.push(item);
                    this.notifyListeners('retry', item.id, item.retries);
                } else {
                    this.notifyListeners('error', item.id, error);
                }
            }
        }

        // Process any remaining items
        if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), 1000);
        }
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            queueLength: this.queue.length,
            items: this.queue.map(item => ({
                id: item.id,
                timestamp: item.timestamp,
                retries: item.retries,
            })),
        };
    }

    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
        this.notifyListeners('cleared');
    }

    /**
     * Remove a specific item from the queue
     */
    remove(id) {
        this.queue = this.queue.filter(item => item.id !== id);
        this.notifyListeners('removed', id);
    }

    /**
     * Subscribe to queue events
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event, ...args) {
        this.listeners.forEach(listener => {
            try {
                listener(event, ...args);
            } catch (error) {
                console.error('Error in offline queue listener:', error);
            }
        });
    }
}

// Create singleton instance
const offlineQueue = new OfflineQueue();

export default offlineQueue;
