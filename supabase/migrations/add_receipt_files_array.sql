-- Add support for multiple files per receipt
-- This allows storing multiple images for a single receipt (e.g., long receipts split into parts)

-- Add a JSONB column to store array of file paths
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS file_paths JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN receipts.file_paths IS 'Array of file paths for multi-image receipts. Format: [{"path": "user_id/file1.jpg", "order": 1}, {"path": "user_id/file2.jpg", "order": 2}]';

-- For existing receipts, migrate file_url to file_paths array
UPDATE receipts 
SET file_paths = jsonb_build_array(
  jsonb_build_object('path', file_url, 'order', 1)
)
WHERE file_paths = '[]'::jsonb AND file_url IS NOT NULL;
