/**
 * Backup and restore utilities for writings
 * Supports exporting all data and importing it back
 */
import logger from './logger';

/**
 * Export all writings as JSON backup
 */
export const exportAllData = async (getWritings) => {
    try {
        // Fetch all writings
        const response = await getWritings(0, 10000); // Large limit to get all
        const writings = response.writings || [];

        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            writings: writings.map(writing => ({
                id: writing.id,
                title: writing.title,
                content: writing.content,
                author: writing.author,
                category: writing.category,
                genre: writing.genre,
                created_at: writing.created_at,
                updated_at: writing.updated_at,
            })),
            metadata: {
                totalWritings: writings.length,
                totalCharacters: writings.reduce((sum, w) => sum + (w.content?.length || 0), 0),
            }
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prose-and-pause-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return backupData;
    } catch (error) {
        logger.error('Error exporting data', error);
        throw new Error('Failed to export data. Please try again.');
    }
};

/**
 * Validate backup file format
 */
export const validateBackupFile = (data) => {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid backup file format' };
    }

    if (!data.version) {
        return { valid: false, error: 'Backup file missing version information' };
    }

    if (!Array.isArray(data.writings)) {
        return { valid: false, error: 'Backup file missing writings array' };
    }

    // Validate each writing
    for (let i = 0; i < data.writings.length; i++) {
        const writing = data.writings[i];
        if (!writing.content || typeof writing.content !== 'string') {
            return { 
                valid: false, 
                error: `Writing at index ${i} is missing required content field` 
            };
        }
    }

    return { valid: true };
};

/**
 * Parse backup file from file input
 */
export const parseBackupFile = async (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            reject(new Error('Invalid file type. Please select a JSON backup file.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const validation = validateBackupFile(data);
                
                if (!validation.valid) {
                    reject(new Error(validation.error));
                    return;
                }

                resolve(data);
            } catch (error) {
                reject(new Error('Failed to parse backup file. Please ensure it is valid JSON.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Failed to read backup file.'));
        };
        reader.readAsText(file);
    });
};

/**
 * Get backup file info (for preview before import)
 */
export const getBackupInfo = (backupData) => {
    if (!backupData) {
        return null;
    }

    return {
        version: backupData.version || 'Unknown',
        exportDate: backupData.exportDate 
            ? new Date(backupData.exportDate).toLocaleString()
            : 'Unknown',
        totalWritings: backupData.writings?.length || 0,
        totalCharacters: backupData.metadata?.totalCharacters || 
            backupData.writings?.reduce((sum, w) => sum + (w.content?.length || 0), 0) || 0,
    };
};

