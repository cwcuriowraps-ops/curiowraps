import { z } from "zod";

export const createShippingZoneSchema = z.object({
  name: z.string().min(2),
  countries: z.array(z.string()),
  isActive: z.boolean().optional(),
});

export const updateShippingZoneSchema = createShippingZoneSchema.partial();

export const createShippingMethodSchema = z.object({
  zoneId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  deliveryTime: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateShippingMethodSchema = createShippingMethodSchema.partial();

export const createShippingRateSchema = z.object({
  methodId: z.string().uuid(),
  name: z.string().min(2),
  type: z.enum(["FLAT", "WEIGHT", "PRICE"]),
  price: z.number().min(0),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
});

export const updateShippingRateSchema = createShippingRateSchema.partial();
