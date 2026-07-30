import { EventEmitter } from "events";

class AppEventEmitter extends EventEmitter {}

export const systemEvents = new AppEventEmitter();

// Increase max listeners if needed since every dashboard SSE connection might attach a listener
systemEvents.setMaxListeners(100);

export const EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  INVENTORY_UPDATED: "inventory.updated",
  USER_REGISTERED: "user.registered",
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
} as const;
