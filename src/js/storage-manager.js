/**
 * Storage Manager - Handles file deletion and storage monitoring
 * Disha Digital Prints
 */

const StorageManager = {
    /**
     * Get storage usage statistics
     */
    async getStorageUsage() {
        try {
            const { data, error } = await supabase.rpc('get_storage_usage');
            
            if (error) throw error;
            
            const stats = data[0];
            return {
                success: true,
                stats: {
                    totalFiles: parseInt(stats.total_files),
                    totalBytes: parseInt(stats.total_bytes),
                    activeFiles: parseInt(stats.active_files),
                    activeBytes: parseInt(stats.active_bytes),
                    deletedFiles: parseInt(stats.deleted_files),
                    freedBytes: parseInt(stats.freed_bytes),
                    totalMB: (parseInt(stats.total_bytes) / (1024 * 1024)).toFixed(2),
                    activeMB: (parseInt(stats.active_bytes) / (1024 * 1024)).toFixed(2),
                    freedMB: (parseInt(stats.freed_bytes) / (1024 * 1024)).toFixed(2),
                    usagePercent: ((parseInt(stats.active_bytes) / (1024 * 1024 * 1024)) * 100).toFixed(1)
                }
            };
        } catch (error) {
            console.error('❌ Error getting storage usage:', error);
            return { success: false, error };
        }
    },

    /**
     * Delete file from storage and update database
     */
    async deleteFile(itemId, fileUrl, fileName) {
        try {
            // Extract file path from URL
            const filePath = this.extractFilePathFromUrl(fileUrl);
            
            if (!filePath) {
                throw new Error('Invalid file URL');
            }
            
            // Delete from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from('order-files')
                .remove([filePath]);
            
            if (storageError) throw storageError;
            
            // Update database - mark as deleted
            const { error: dbError } = await supabase
                .from('order_items')
                .update({
                    file_deleted_at: new Date().toISOString(),
                    admin_notes: `File deleted by admin on ${new Date().toLocaleString()}`
                })
                .eq('id', itemId);
            
            if (dbError) throw dbError;
            
            console.log('✅ File deleted:', fileName);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting file:', error);
            return { success: false, error };
        }
    },

    /**
     * Get files eligible for cleanup (delivered orders > 30 days)
     */
    async getFilesForCleanup(daysOld = 30) {
        try {
            const { data, error } = await supabase.rpc('get_files_for_cleanup', {
                days_old: daysOld
            });
            
            if (error) throw error;
            
            return { success: true, files: data };
        } catch (error) {
            console.error('❌ Error getting cleanup files:', error);
            return { success: false, error };
        }
    },

    /**
     * Bulk delete files from completed orders
     */
    async bulkDeleteCompletedOrderFiles(daysOld = 30) {
        try {
            // Get files to delete
            const { success, files, error } = await this.getFilesForCleanup(daysOld);
            
            if (!success) throw error;
            
            if (files.length === 0) {
                return { success: true, deletedCount: 0, freedBytes: 0 };
            }
            
            let deletedCount = 0;
            let freedBytes = 0;
            
            // Delete each file
            for (const file of files) {
                const result = await this.deleteFile(
                    file.item_id,
                    file.file_url,
                    file.file_name
                );
                
                if (result.success) {
                    deletedCount++;
                    freedBytes += parseInt(file.file_size_bytes || 0);
                }
            }
            
            return {
                success: true,
                deletedCount,
                freedBytes,
                freedMB: (freedBytes / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('❌ Error bulk deleting files:', error);
            return { success: false, error };
        }
    },

    /**
     * Download file from storage
     */
    downloadFile(fileUrl, fileName) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Extract file path from Supabase Storage URL
     */
    extractFilePathFromUrl(url) {
        try {
            // Example URL: https://xxx.supabase.co/storage/v1/object/public/order-files/orders/123-file.pdf
            const parts = url.split('/order-files/');
            return parts.length > 1 ? parts[1] : null;
        } catch (error) {
            console.error('Error extracting file path:', error);
            return null;
        }
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};

// Export for global use
window.StorageManager = StorageManager;

console.log('💾 Storage Manager loaded');
