-- ==============================================================================
-- Migration: 20260912_performance_composite_indexes
-- Description: Targeted composite B-tree indexes for high-frequency catalog,
--              filtering, variant lookups, and sorting queries to eliminate
--              sequential table scans.
-- ==============================================================================

-- 1. Product Catalog & Sorting Index
CREATE INDEX IF NOT EXISTS idx_product_status_deleted_created 
  ON public."Product" ("status", "deletedAt", "createdAt" DESC);

-- 2. Featured Products Index
CREATE INDEX IF NOT EXISTS idx_product_featured_status 
  ON public."Product" ("isFeatured", "status", "deletedAt");

-- 3. Product Variant Active & Deleted Index
CREATE INDEX IF NOT EXISTS idx_variant_product_active_deleted 
  ON public."ProductVariant" ("productId", "isActive", "deletedAt");

-- 4. Product Image Display & Sorting Index
CREATE INDEX IF NOT EXISTS idx_image_product_primary_sort 
  ON public."ProductImage" ("productId", "isPrimary" DESC, "sortOrder" ASC);

-- 5. Category Active & Sorting Index
CREATE INDEX IF NOT EXISTS idx_category_active_deleted_sort 
  ON public."Category" ("isActive", "deletedAt", "sortOrder" ASC);
