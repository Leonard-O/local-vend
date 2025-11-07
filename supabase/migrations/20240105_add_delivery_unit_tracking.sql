-- Add unit information columns to deliveries table for historical tracking
-- This ensures that even if a product's unit changes, the order history remains accurate

-- Note: The products column in deliveries is JSONB, so unit info is stored within the JSON structure
-- No schema changes needed as JSONB is flexible

-- Create index on products JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_deliveries_products_gin ON deliveries USING gin(products);

-- Add comment to document the products structure
COMMENT ON COLUMN deliveries.products IS 'JSONB array containing product details including: productId, productName, quantity, price, unit_type, unit_value, unit_label';
