-- ==============================================================================
-- Migration: 20260912_supabase_security_rls
-- Description: Enable RLS on all 47 public schema tables, enforce least-privilege
--              access control, secure authentication tokens, and harden Postgres role grants.
-- ==============================================================================

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User" u
    JOIN public."Role" r ON u."roleId" = r.id
    WHERE u.id = (SELECT auth.uid())
      AND r.name IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public."User" u
    JOIN public."Role" r ON u."roleId" = r.id
    WHERE u.id = (SELECT auth.uid())
      AND r.name IN ('ADMIN', 'SUPER_ADMIN', 'STAFF')
  );
$$;

-- Grant execution of helper functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO anon, authenticated;

-- 2. Revoke dangerous DDL/table-altering permissions from anon & authenticated across all public tables
REVOKE TRUNCATE, TRIGGER ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- ==============================================================================
-- TIER 1: Highly Sensitive / Token Tables (Strictly Server-Side / Private)
-- ==============================================================================

-- RefreshToken
ALTER TABLE public."RefreshToken" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."RefreshToken" FROM anon, authenticated;
DROP POLICY IF EXISTS "Deny direct client access to RefreshToken" ON public."RefreshToken";
CREATE POLICY "Deny direct client access to RefreshToken"
  ON public."RefreshToken"
  FOR ALL
  TO anon, authenticated
  USING (false);

-- PasswordResetToken
ALTER TABLE public."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PasswordResetToken" FROM anon, authenticated;
DROP POLICY IF EXISTS "Deny direct client access to PasswordResetToken" ON public."PasswordResetToken";
CREATE POLICY "Deny direct client access to PasswordResetToken"
  ON public."PasswordResetToken"
  FOR ALL
  TO anon, authenticated
  USING (false);

-- EmailVerificationToken
ALTER TABLE public."EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."EmailVerificationToken" FROM anon, authenticated;
DROP POLICY IF EXISTS "Deny direct client access to EmailVerificationToken" ON public."EmailVerificationToken";
CREATE POLICY "Deny direct client access to EmailVerificationToken"
  ON public."EmailVerificationToken"
  FOR ALL
  TO anon, authenticated
  USING (false);

-- OAuthAccount
ALTER TABLE public."OAuthAccount" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."OAuthAccount" FROM anon, authenticated;
DROP POLICY IF EXISTS "Deny direct client access to OAuthAccount" ON public."OAuthAccount";
CREATE POLICY "Deny direct client access to OAuthAccount"
  ON public."OAuthAccount"
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ==============================================================================
-- TIER 2: System, Admin-Only & Inventory Tables
-- ==============================================================================

-- AdminProfile
ALTER TABLE public."AdminProfile" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AdminProfile" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."AdminProfile" TO authenticated;
DROP POLICY IF EXISTS "Admin profile management" ON public."AdminProfile";
CREATE POLICY "Admin profile management"
  ON public."AdminProfile"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- AuditLog
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AuditLog" FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."AuditLog" FROM authenticated;
GRANT SELECT ON TABLE public."AuditLog" TO authenticated;
DROP POLICY IF EXISTS "Admin view audit logs" ON public."AuditLog";
CREATE POLICY "Admin view audit logs"
  ON public."AuditLog"
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Role
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Role" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Role" TO authenticated;
DROP POLICY IF EXISTS "Authenticated view roles" ON public."Role";
CREATE POLICY "Authenticated view roles"
  ON public."Role"
  FOR SELECT
  TO authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage roles" ON public."Role";
CREATE POLICY "Admin manage roles"
  ON public."Role"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Permission
ALTER TABLE public."Permission" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Permission" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Permission" TO authenticated;
DROP POLICY IF EXISTS "Admin view permissions" ON public."Permission";
CREATE POLICY "Admin view permissions"
  ON public."Permission"
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admin manage permissions" ON public."Permission";
CREATE POLICY "Admin manage permissions"
  ON public."Permission"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RolePermission
ALTER TABLE public."RolePermission" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."RolePermission" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."RolePermission" TO authenticated;
DROP POLICY IF EXISTS "Admin view role permissions" ON public."RolePermission";
CREATE POLICY "Admin view role permissions"
  ON public."RolePermission"
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
DROP POLICY IF EXISTS "Admin manage role permissions" ON public."RolePermission";
CREATE POLICY "Admin manage role permissions"
  ON public."RolePermission"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Inventory
ALTER TABLE public."Inventory" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Inventory" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Inventory" TO authenticated;
DROP POLICY IF EXISTS "Admin manage inventory" ON public."Inventory";
CREATE POLICY "Admin manage inventory"
  ON public."Inventory"
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- InventoryLocation
ALTER TABLE public."InventoryLocation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."InventoryLocation" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."InventoryLocation" TO authenticated;
DROP POLICY IF EXISTS "Admin manage inventory locations" ON public."InventoryLocation";
CREATE POLICY "Admin manage inventory locations"
  ON public."InventoryLocation"
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- InventoryMovement
ALTER TABLE public."InventoryMovement" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."InventoryMovement" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."InventoryMovement" TO authenticated;
DROP POLICY IF EXISTS "Admin manage inventory movements" ON public."InventoryMovement";
CREATE POLICY "Admin manage inventory movements"
  ON public."InventoryMovement"
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

-- Setting
ALTER TABLE public."Setting" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Setting" FROM anon;
GRANT SELECT ON TABLE public."Setting" TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Setting" TO authenticated;
DROP POLICY IF EXISTS "Public view non-sensitive settings" ON public."Setting";
CREATE POLICY "Public view non-sensitive settings"
  ON public."Setting"
  FOR SELECT
  TO anon, authenticated
  USING (
    key IN ('storefront.theme', 'checkout.currency')
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage settings" ON public."Setting";
CREATE POLICY "Admin manage settings"
  ON public."Setting"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- TIER 3: User-Specific Personal Data Tables
-- ==============================================================================

-- User
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."User" FROM anon;
GRANT SELECT, UPDATE ON TABLE public."User" TO authenticated;
DROP POLICY IF EXISTS "User view own profile or admin" ON public."User";
CREATE POLICY "User view own profile or admin"
  ON public."User"
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "User update own profile or admin" ON public."User";
CREATE POLICY "User update own profile or admin"
  ON public."User"
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR public.is_admin()
  );

-- Address
ALTER TABLE public."Address" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Address" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Address" TO authenticated;
DROP POLICY IF EXISTS "Address own access or admin" ON public."Address";
CREATE POLICY "Address own access or admin"
  ON public."Address"
  FOR ALL
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );

-- Cart
ALTER TABLE public."Cart" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Cart" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Cart" TO authenticated;
DROP POLICY IF EXISTS "Cart own access or admin" ON public."Cart";
CREATE POLICY "Cart own access or admin"
  ON public."Cart"
  FOR ALL
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );

-- CartItem
ALTER TABLE public."CartItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."CartItem" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."CartItem" TO authenticated;
DROP POLICY IF EXISTS "CartItem own access or admin" ON public."CartItem";
CREATE POLICY "CartItem own access or admin"
  ON public."CartItem"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Cart" c
      WHERE c.id = "CartItem"."cartId"
        AND (c."userId" = (SELECT auth.uid()) OR public.is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Cart" c
      WHERE c.id = "CartItem"."cartId"
        AND (c."userId" = (SELECT auth.uid()) OR public.is_admin())
    )
  );

-- WishlistItem
ALTER TABLE public."WishlistItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."WishlistItem" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."WishlistItem" TO authenticated;
DROP POLICY IF EXISTS "WishlistItem own access or admin" ON public."WishlistItem";
CREATE POLICY "WishlistItem own access or admin"
  ON public."WishlistItem"
  FOR ALL
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );

-- Order
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Order" FROM anon;
GRANT SELECT ON TABLE public."Order" TO authenticated;
DROP POLICY IF EXISTS "Order view own orders or admin" ON public."Order";
CREATE POLICY "Order view own orders or admin"
  ON public."Order"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage orders" ON public."Order";
CREATE POLICY "Admin manage orders"
  ON public."Order"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- OrderItem
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."OrderItem" FROM anon;
GRANT SELECT ON TABLE public."OrderItem" TO authenticated;
DROP POLICY IF EXISTS "OrderItem view own order items or admin" ON public."OrderItem";
CREATE POLICY "OrderItem view own order items or admin"
  ON public."OrderItem"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Order" o
      WHERE o.id = "OrderItem"."orderId"
        AND (o."userId" = (SELECT auth.uid()) OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "Admin manage order items" ON public."OrderItem";
CREATE POLICY "Admin manage order items"
  ON public."OrderItem"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payment
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Payment" FROM anon;
GRANT SELECT ON TABLE public."Payment" TO authenticated;
DROP POLICY IF EXISTS "Payment view own order payments or admin" ON public."Payment";
CREATE POLICY "Payment view own order payments or admin"
  ON public."Payment"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Order" o
      WHERE o.id = "Payment"."orderId"
        AND (o."userId" = (SELECT auth.uid()) OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "Admin manage payments" ON public."Payment";
CREATE POLICY "Admin manage payments"
  ON public."Payment"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Shipment
ALTER TABLE public."Shipment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Shipment" FROM anon;
GRANT SELECT ON TABLE public."Shipment" TO authenticated;
DROP POLICY IF EXISTS "Shipment view own order shipments or admin" ON public."Shipment";
CREATE POLICY "Shipment view own order shipments or admin"
  ON public."Shipment"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Order" o
      WHERE o.id = "Shipment"."orderId"
        AND (o."userId" = (SELECT auth.uid()) OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS "Admin manage shipments" ON public."Shipment";
CREATE POLICY "Admin manage shipments"
  ON public."Shipment"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Notification
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Notification" FROM anon;
GRANT SELECT, UPDATE ON TABLE public."Notification" TO authenticated;
DROP POLICY IF EXISTS "Notification own access or admin" ON public."Notification";
CREATE POLICY "Notification own access or admin"
  ON public."Notification"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Notification own update or admin" ON public."Notification";
CREATE POLICY "Notification own update or admin"
  ON public."Notification"
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );

-- CouponRedemption
ALTER TABLE public."CouponRedemption" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."CouponRedemption" FROM anon;
GRANT SELECT ON TABLE public."CouponRedemption" TO authenticated;
DROP POLICY IF EXISTS "CouponRedemption own access or admin" ON public."CouponRedemption";
CREATE POLICY "CouponRedemption own access or admin"
  ON public."CouponRedemption"
  FOR SELECT
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage coupon redemptions" ON public."CouponRedemption";
CREATE POLICY "Admin manage coupon redemptions"
  ON public."CouponRedemption"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- RecentlyViewedProduct
ALTER TABLE public."RecentlyViewedProduct" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."RecentlyViewedProduct" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."RecentlyViewedProduct" TO authenticated;
DROP POLICY IF EXISTS "RecentlyViewedProduct own access or admin" ON public."RecentlyViewedProduct";
CREATE POLICY "RecentlyViewedProduct own access or admin"
  ON public."RecentlyViewedProduct"
  FOR ALL
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );

-- ==============================================================================
-- TIER 4: Public Catalog & Content Tables
-- ==============================================================================

-- Product
ALTER TABLE public."Product" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Product" FROM anon;
GRANT SELECT ON TABLE public."Product" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Product" TO authenticated;
DROP POLICY IF EXISTS "Public view active products or admin" ON public."Product";
CREATE POLICY "Public view active products or admin"
  ON public."Product"
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'ACTIVE'
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage products" ON public."Product";
CREATE POLICY "Admin manage products"
  ON public."Product"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ProductVariant
ALTER TABLE public."ProductVariant" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ProductVariant" FROM anon;
GRANT SELECT ON TABLE public."ProductVariant" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ProductVariant" TO authenticated;
DROP POLICY IF EXISTS "Public view variants of active products" ON public."ProductVariant";
CREATE POLICY "Public view variants of active products"
  ON public."ProductVariant"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage product variants" ON public."ProductVariant";
CREATE POLICY "Admin manage product variants"
  ON public."ProductVariant"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ProductImage
ALTER TABLE public."ProductImage" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ProductImage" FROM anon;
GRANT SELECT ON TABLE public."ProductImage" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ProductImage" TO authenticated;
DROP POLICY IF EXISTS "Public view product images" ON public."ProductImage";
CREATE POLICY "Public view product images"
  ON public."ProductImage"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage product images" ON public."ProductImage";
CREATE POLICY "Admin manage product images"
  ON public."ProductImage"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Category
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Category" FROM anon;
GRANT SELECT ON TABLE public."Category" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Category" TO authenticated;
DROP POLICY IF EXISTS "Public view active categories" ON public."Category";
CREATE POLICY "Public view active categories"
  ON public."Category"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage categories" ON public."Category";
CREATE POLICY "Admin manage categories"
  ON public."Category"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ProductCategory
ALTER TABLE public."ProductCategory" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ProductCategory" FROM anon;
GRANT SELECT ON TABLE public."ProductCategory" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ProductCategory" TO authenticated;
DROP POLICY IF EXISTS "Public view product categories" ON public."ProductCategory";
CREATE POLICY "Public view product categories"
  ON public."ProductCategory"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage product categories" ON public."ProductCategory";
CREATE POLICY "Admin manage product categories"
  ON public."ProductCategory"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Brand
ALTER TABLE public."Brand" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Brand" FROM anon;
GRANT SELECT ON TABLE public."Brand" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Brand" TO authenticated;
DROP POLICY IF EXISTS "Public view active brands" ON public."Brand";
CREATE POLICY "Public view active brands"
  ON public."Brand"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage brands" ON public."Brand";
CREATE POLICY "Admin manage brands"
  ON public."Brand"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Attribute
ALTER TABLE public."Attribute" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Attribute" FROM anon;
GRANT SELECT ON TABLE public."Attribute" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Attribute" TO authenticated;
DROP POLICY IF EXISTS "Public view attributes" ON public."Attribute";
CREATE POLICY "Public view attributes"
  ON public."Attribute"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage attributes" ON public."Attribute";
CREATE POLICY "Admin manage attributes"
  ON public."Attribute"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- AttributeValue
ALTER TABLE public."AttributeValue" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."AttributeValue" FROM anon;
GRANT SELECT ON TABLE public."AttributeValue" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."AttributeValue" TO authenticated;
DROP POLICY IF EXISTS "Public view attribute values" ON public."AttributeValue";
CREATE POLICY "Public view attribute values"
  ON public."AttributeValue"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage attribute values" ON public."AttributeValue";
CREATE POLICY "Admin manage attribute values"
  ON public."AttributeValue"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ProductVariantAttributeValue
ALTER TABLE public."ProductVariantAttributeValue" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ProductVariantAttributeValue" FROM anon;
GRANT SELECT ON TABLE public."ProductVariantAttributeValue" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ProductVariantAttributeValue" TO authenticated;
DROP POLICY IF EXISTS "Public view variant attribute values" ON public."ProductVariantAttributeValue";
CREATE POLICY "Public view variant attribute values"
  ON public."ProductVariantAttributeValue"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage variant attribute values" ON public."ProductVariantAttributeValue";
CREATE POLICY "Admin manage variant attribute values"
  ON public."ProductVariantAttributeValue"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- FeaturedProduct
ALTER TABLE public."FeaturedProduct" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."FeaturedProduct" FROM anon;
GRANT SELECT ON TABLE public."FeaturedProduct" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."FeaturedProduct" TO authenticated;
DROP POLICY IF EXISTS "Public view featured products" ON public."FeaturedProduct";
CREATE POLICY "Public view featured products"
  ON public."FeaturedProduct"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage featured products" ON public."FeaturedProduct";
CREATE POLICY "Admin manage featured products"
  ON public."FeaturedProduct"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Banner
ALTER TABLE public."Banner" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Banner" FROM anon;
GRANT SELECT ON TABLE public."Banner" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Banner" TO authenticated;
DROP POLICY IF EXISTS "Public view active banners" ON public."Banner";
CREATE POLICY "Public view active banners"
  ON public."Banner"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage banners" ON public."Banner";
CREATE POLICY "Admin manage banners"
  ON public."Banner"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- HomepageSection
ALTER TABLE public."HomepageSection" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."HomepageSection" FROM anon;
GRANT SELECT ON TABLE public."HomepageSection" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."HomepageSection" TO authenticated;
DROP POLICY IF EXISTS "Public view active homepage sections" ON public."HomepageSection";
CREATE POLICY "Public view active homepage sections"
  ON public."HomepageSection"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage homepage sections" ON public."HomepageSection";
CREATE POLICY "Admin manage homepage sections"
  ON public."HomepageSection"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CmsPage
ALTER TABLE public."CmsPage" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."CmsPage" FROM anon;
GRANT SELECT ON TABLE public."CmsPage" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."CmsPage" TO authenticated;
DROP POLICY IF EXISTS "Public view published cms pages" ON public."CmsPage";
CREATE POLICY "Public view published cms pages"
  ON public."CmsPage"
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'PUBLISHED'
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage cms pages" ON public."CmsPage";
CREATE POLICY "Admin manage cms pages"
  ON public."CmsPage"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- FlashSale
ALTER TABLE public."FlashSale" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."FlashSale" FROM anon;
GRANT SELECT ON TABLE public."FlashSale" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."FlashSale" TO authenticated;
DROP POLICY IF EXISTS "Public view flash sales" ON public."FlashSale";
CREATE POLICY "Public view flash sales"
  ON public."FlashSale"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage flash sales" ON public."FlashSale";
CREATE POLICY "Admin manage flash sales"
  ON public."FlashSale"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- FlashSaleItem
ALTER TABLE public."FlashSaleItem" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."FlashSaleItem" FROM anon;
GRANT SELECT ON TABLE public."FlashSaleItem" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."FlashSaleItem" TO authenticated;
DROP POLICY IF EXISTS "Public view flash sale items" ON public."FlashSaleItem";
CREATE POLICY "Public view flash sale items"
  ON public."FlashSaleItem"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage flash sale items" ON public."FlashSaleItem";
CREATE POLICY "Admin manage flash sale items"
  ON public."FlashSaleItem"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ShippingZone
ALTER TABLE public."ShippingZone" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ShippingZone" FROM anon;
GRANT SELECT ON TABLE public."ShippingZone" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ShippingZone" TO authenticated;
DROP POLICY IF EXISTS "Public view shipping zones" ON public."ShippingZone";
CREATE POLICY "Public view shipping zones"
  ON public."ShippingZone"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage shipping zones" ON public."ShippingZone";
CREATE POLICY "Admin manage shipping zones"
  ON public."ShippingZone"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ShippingMethod
ALTER TABLE public."ShippingMethod" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ShippingMethod" FROM anon;
GRANT SELECT ON TABLE public."ShippingMethod" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ShippingMethod" TO authenticated;
DROP POLICY IF EXISTS "Public view shipping methods" ON public."ShippingMethod";
CREATE POLICY "Public view shipping methods"
  ON public."ShippingMethod"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage shipping methods" ON public."ShippingMethod";
CREATE POLICY "Admin manage shipping methods"
  ON public."ShippingMethod"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ShippingRate
ALTER TABLE public."ShippingRate" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."ShippingRate" FROM anon;
GRANT SELECT ON TABLE public."ShippingRate" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."ShippingRate" TO authenticated;
DROP POLICY IF EXISTS "Public view shipping rates" ON public."ShippingRate";
CREATE POLICY "Public view shipping rates"
  ON public."ShippingRate"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Admin manage shipping rates" ON public."ShippingRate";
CREATE POLICY "Admin manage shipping rates"
  ON public."ShippingRate"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Coupon
ALTER TABLE public."Coupon" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Coupon" FROM anon;
GRANT SELECT ON TABLE public."Coupon" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Coupon" TO authenticated;
DROP POLICY IF EXISTS "Public view active coupons" ON public."Coupon";
CREATE POLICY "Public view active coupons"
  ON public."Coupon"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isActive" = true
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage coupons" ON public."Coupon";
CREATE POLICY "Admin manage coupons"
  ON public."Coupon"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- MediaAsset
ALTER TABLE public."MediaAsset" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."MediaAsset" FROM anon;
GRANT SELECT ON TABLE public."MediaAsset" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."MediaAsset" TO authenticated;
DROP POLICY IF EXISTS "Public view media assets" ON public."MediaAsset";
CREATE POLICY "Public view media assets"
  ON public."MediaAsset"
  FOR SELECT
  TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Authenticated upload media assets" ON public."MediaAsset";
CREATE POLICY "Authenticated upload media assets"
  ON public."MediaAsset"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "uploadedByUserId" = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Admin manage media assets" ON public."MediaAsset";
CREATE POLICY "Admin manage media assets"
  ON public."MediaAsset"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- TIER 5: Interactive / Community Tables
-- ==============================================================================

-- Review
ALTER TABLE public."Review" ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public."Review" FROM anon;
GRANT SELECT ON TABLE public."Review" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public."Review" TO authenticated;
DROP POLICY IF EXISTS "Public view approved reviews or own" ON public."Review";
CREATE POLICY "Public view approved reviews or own"
  ON public."Review"
  FOR SELECT
  TO anon, authenticated
  USING (
    "isApproved" = true
    OR "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "Authenticated create own review" ON public."Review";
CREATE POLICY "Authenticated create own review"
  ON public."Review"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );
DROP POLICY IF EXISTS "User manage own review or admin" ON public."Review";
CREATE POLICY "User manage own review or admin"
  ON public."Review"
  FOR ALL
  TO authenticated
  USING (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    "userId" = (SELECT auth.uid())
    OR public.is_admin()
  );

-- ContactMessage
ALTER TABLE public."ContactMessage" ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON TABLE public."ContactMessage" TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public."ContactMessage" TO authenticated;
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public."ContactMessage";
CREATE POLICY "Anyone can submit contact message"
  ON public."ContactMessage"
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage contact messages" ON public."ContactMessage";
CREATE POLICY "Admin manage contact messages"
  ON public."ContactMessage"
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
