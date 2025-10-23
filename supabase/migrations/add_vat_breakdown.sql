-- Add VAT breakdown columns for mixed tax rate receipts
-- This allows tracking of receipts with both 7% and 19% VAT rates

-- Add columns for 7% VAT breakdown
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vat_7_net NUMERIC(10, 2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vat_7_tax NUMERIC(10, 2);

-- Add columns for 19% VAT breakdown
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vat_19_net NUMERIC(10, 2);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS vat_19_tax NUMERIC(10, 2);

-- Add comments to explain the columns
COMMENT ON COLUMN receipts.vat_7_net IS 'Net amount for items with 7% VAT rate';
COMMENT ON COLUMN receipts.vat_7_tax IS 'Tax amount for items with 7% VAT rate';
COMMENT ON COLUMN receipts.vat_19_net IS 'Net amount for items with 19% VAT rate';
COMMENT ON COLUMN receipts.vat_19_tax IS 'Tax amount for items with 19% VAT rate';
