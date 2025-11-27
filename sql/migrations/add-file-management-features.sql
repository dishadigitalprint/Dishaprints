-- Migration: Add File Management Features
-- Date: 2025-11-27
-- Description: Adds file size tracking, deletion tracking, and automated cleanup

-- Add file_size_bytes and file_deleted_at to order_items
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS file_deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for file cleanup queries
CREATE INDEX IF NOT EXISTS idx_order_items_file_status 
ON order_items(file_url, file_deleted_at) WHERE file_url IS NOT NULL;

-- Create index for file size queries
CREATE INDEX IF NOT EXISTS idx_order_items_file_size 
ON order_items(file_size_bytes) WHERE file_size_bytes > 0;

-- Add admin_notes column if it doesn't exist
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Function to calculate total storage usage
CREATE OR REPLACE FUNCTION get_storage_usage()
RETURNS TABLE(
    total_files BIGINT,
    total_bytes BIGINT,
    active_files BIGINT,
    active_bytes BIGINT,
    deleted_files BIGINT,
    freed_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE file_url IS NOT NULL) as total_files,
        COALESCE(SUM(file_size_bytes) FILTER (WHERE file_url IS NOT NULL), 0) as total_bytes,
        COUNT(*) FILTER (WHERE file_url IS NOT NULL AND file_deleted_at IS NULL) as active_files,
        COALESCE(SUM(file_size_bytes) FILTER (WHERE file_url IS NOT NULL AND file_deleted_at IS NULL), 0) as active_bytes,
        COUNT(*) FILTER (WHERE file_deleted_at IS NOT NULL) as deleted_files,
        COALESCE(SUM(file_size_bytes) FILTER (WHERE file_deleted_at IS NOT NULL), 0) as freed_bytes
    FROM order_items;
END;
$$ LANGUAGE plpgsql;

-- Function to find old files for cleanup (delivered orders > 30 days)
CREATE OR REPLACE FUNCTION get_files_for_cleanup(days_old INTEGER DEFAULT 30)
RETURNS TABLE(
    item_id UUID,
    order_id UUID,
    file_name VARCHAR(255),
    file_url TEXT,
    file_size_bytes BIGINT,
    order_status VARCHAR(20),
    delivered_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.id as item_id,
        oi.order_id,
        oi.file_name,
        oi.file_url,
        oi.file_size_bytes,
        o.status as order_status,
        o.delivered_at
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE 
        oi.file_url IS NOT NULL 
        AND oi.file_deleted_at IS NULL
        AND o.status = 'delivered'
        AND o.delivered_at < NOW() - (days_old || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update order updated_at on item changes
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders 
    SET updated_at = NOW() 
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_items_update_order ON order_items;
CREATE TRIGGER order_items_update_order
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_timestamp();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_storage_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION get_files_for_cleanup(INTEGER) TO authenticated;

-- Comments
COMMENT ON COLUMN order_items.file_size_bytes IS 'File size in bytes for storage management';
COMMENT ON COLUMN order_items.file_deleted_at IS 'Timestamp when file was deleted from storage';
COMMENT ON FUNCTION get_storage_usage() IS 'Returns storage usage statistics';
COMMENT ON FUNCTION get_files_for_cleanup(INTEGER) IS 'Returns files eligible for cleanup from delivered orders';
