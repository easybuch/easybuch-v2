-- Add file_hash column to receipts table for duplicate detection
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Create index on file_hash and user_id for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_receipts_file_hash_user_id ON receipts(file_hash, user_id);

-- Add comment to explain the column
COMMENT ON COLUMN receipts.file_hash IS 'SHA-256 hash of the file content for duplicate detection';
