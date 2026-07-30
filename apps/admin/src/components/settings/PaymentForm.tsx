"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";


const paymentSchema = z.object({
  enableRazorpay: z.boolean(),
  enableCod: z.boolean(),
  razorpayKeyId: z.string().optional(),
  razorpayKeySecret: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
});

type PaymentValues = z.infer<typeof paymentSchema>;

export function PaymentForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      enableRazorpay: defaultValues?.payments?.enableRazorpay ?? false,
      enableCod: defaultValues?.payments?.enableCod ?? true,
      razorpayKeyId: defaultValues?.payments?.razorpayKeyId || "",
      razorpayKeySecret: defaultValues?.payments?.razorpayKeySecret || "",
      currency: defaultValues?.payments?.currency || "INR",
    },
  });

  useEffect(() => {
    if (defaultValues?.payments) {
      form.reset(defaultValues.payments);
    }
  }, [defaultValues, form]);

  const onSubmit = (data: PaymentValues) => {
    updateSettings({ payments: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Gateways</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h4 className="font-medium text-text-primary">Razorpay</h4>
              <p className="text-sm text-text-secondary">Accept payments via UPI, Credit/Debit cards, Netbanking.</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-border text-accent focus:ring-accent" {...form.register("enableRazorpay")} />
          </div>
          
          {form.watch("enableRazorpay") && (
            <div className="space-y-4 pt-2">
              <Input label="Razorpay Key ID" type="password" placeholder="rzp_live_..." {...form.register("razorpayKeyId")} />
              <Input label="Razorpay Key Secret" type="password" placeholder="••••••••••••••••" {...form.register("razorpayKeySecret")} />
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border pb-4 pt-2">
            <div>
              <h4 className="font-medium text-text-primary">Cash on Delivery (COD)</h4>
              <p className="text-sm text-text-secondary">Allow customers to pay upon delivery.</p>
            </div>
            <input type="checkbox" className="h-4 w-4 rounded border-border text-accent focus:ring-accent" {...form.register("enableCod")} />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-text-primary mb-1">Store Currency</label>
            <select className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" {...form.register("currency")}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
