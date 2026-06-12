-- Add specific double sided pricing and update single page defaults
ALTER TABLE shops 
    ALTER COLUMN bw_price_per_page SET DEFAULT 25,
    ALTER COLUMN color_price_per_page SET DEFAULT 75;

ALTER TABLE shops 
    ADD COLUMN IF NOT EXISTS bw_double_sided_price INTEGER DEFAULT 40,
    ADD COLUMN IF NOT EXISTS color_double_sided_price INTEGER DEFAULT 120;

-- Optionally remove the unused column if it was present
ALTER TABLE shops DROP COLUMN IF EXISTS double_sided_discount;
