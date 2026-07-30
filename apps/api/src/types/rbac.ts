export const PERMISSIONS = {
  PRODUCT_CREATE: "manage:products",
  PRODUCT_UPDATE: "manage:products",
  PRODUCT_DELETE: "manage:products",
  INVENTORY_UPDATE: "inventory.write",
  COUPON_MANAGE: "manage:coupons",
  BANNER_MANAGE: "manage:cms",
  CMS_MANAGE: "manage:cms",
  ANALYTICS_VIEW: "analytics.read",
  USERS_MANAGE: "manage:users",
  ORDERS_MANAGE: "manage:orders",
  SETTINGS_MANAGE: "manage:settings",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
