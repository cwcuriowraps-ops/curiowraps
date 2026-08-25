"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";

const shippingSchema = z.object({
  enabled: z.boolean(),
  baseShippingCharge: z.coerce.number().min(0, "Must be 0 or greater"),
  freeShippingThreshold: z.coerce.number().min(0, "Must be 0 or greater"),
  estimatedDeliveryDays: z.string().min(1, "Estimated delivery text is required"),
});

type ShippingValues = z.infer<typeof shippingSchema>;

export function ShippingForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<ShippingValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      enabled: defaultValues?.shipping?.enabled ?? true,
      baseShippingCharge: defaultValues?.shipping?.baseShippingCharge ?? 100,
      freeShippingThreshold: defaultValues?.shipping?.freeShippingThreshold ?? 1000,
      estimatedDeliveryDays: defaultValues?.shipping?.estimatedDeliveryDays || "3-5 Business Days",
    },
  });

  useEffect(() => {
    if (defaultValues?.shipping) {
      form.reset({
        enabled: defaultValues.shipping.enabled ?? true,
        baseShippingCharge: defaultValues.shipping.baseShippingCharge ?? 100,
        freeShippingThreshold: defaultValues.shipping.freeShippingThreshold ?? 1000,
        estimatedDeliveryDays: defaultValues.shipping.estimatedDeliveryDays || "3-5 Business Days",
      });
    }
  }, [defaultValues, form]);

  const onSubmit = (data: ShippingValues) => {
    updateSettings({ shipping: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="shipping-enabled"
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              {...form.register("enabled")}
            />
            <label htmlFor="shipping-enabled" className="text-sm font-medium text-text-primary cursor-pointer select-none">
              Enable Shipping Fee Calculation
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Flat Shipping Fee (₹)"
              type="number"
              step="0.01"
              {...form.register("baseShippingCharge")}
              error={form.formState.errors.baseShippingCharge?.message}
            />
            <Input
              label="Free Shipping Threshold (₹)"
              type="number"
              step="0.01"
              {...form.register("freeShippingThreshold")}
              error={form.formState.errors.freeShippingThreshold?.message}
            />
          </div>

          <Input
            label="Estimated Delivery Days"
            placeholder="e.g. 3-5 Business Days"
            {...form.register("estimatedDeliveryDays")}
            error={form.formState.errors.estimatedDeliveryDays?.message}
          />

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" width="action" loading={isPending} disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
