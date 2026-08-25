"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { QrCode, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";

import { ImageUpload } from "@/components/media/image-upload";

const paymentSchema = z.object({
  enableUpi: z.boolean(),
  enableCod: z.boolean(),
  upiId: z
    .string()
    .optional()
    .refine((val) => !val || (val.includes("@") && val.trim().length >= 3), {
      message: "Please enter a valid UPI ID (e.g. merchant@upi or 9876543210@paytm)",
    }),
  upiQrImageUrl: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
});

type PaymentValues = z.infer<typeof paymentSchema>;

export function PaymentForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const { addToast } = useToast();

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      enableUpi: defaultValues?.payments?.enableUpi ?? true,
      enableCod: defaultValues?.payments?.enableCod ?? true,
      upiId: defaultValues?.payments?.upiId || "",
      upiQrImageUrl: defaultValues?.payments?.upiQrImageUrl || "",
      currency: defaultValues?.payments?.currency || "INR",
    },
  });

  useEffect(() => {
    if (defaultValues?.payments) {
      form.reset({
        enableUpi: defaultValues.payments.enableUpi ?? true,
        enableCod: defaultValues.payments.enableCod ?? true,
        upiId: defaultValues.payments.upiId || "",
        upiQrImageUrl: defaultValues.payments.upiQrImageUrl || "",
        currency: defaultValues.payments.currency || "INR",
      });
    }
  }, [defaultValues, form]);

  const onSubmit = (data: PaymentValues) => {
    if (data.enableUpi && !data.upiId?.trim()) {
      form.setError("upiId", { message: "UPI ID is required when UPI Payments are enabled" });
      addToast({
        title: "Validation Error",
        description: "UPI ID is required when UPI payments are enabled.",
        type: "warning",
      });
      return;
    }
    updateSettings({ payments: data });
  };

  const qrImageUrl = form.watch("upiQrImageUrl");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-accent" />
            Payment Gateways & Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* UPI Settings Section */}
          <div className="border-b border-border pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text-primary">Manual UPI Payment</h4>
                <p className="text-sm text-text-secondary">
                  Allow customers to pay via QR Code or UPI ID (Google Pay, PhonePe, Paytm, BHIM).
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                {...form.register("enableUpi")}
              />
            </div>

            {form.watch("enableUpi") && (
              <div className="space-y-6 pt-2 bg-muted/20 p-4 rounded-xl border border-border">
                {/* UPI ID Field */}
                <div>
                  <Input
                    label="Merchant UPI ID *"
                    placeholder="e.g. curiowraps@upi or 9876543210@ybl"
                    {...form.register("upiId")}
                    error={form.formState.errors.upiId?.message}
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    This UPI ID will be displayed to customers during storefront checkout.
                  </p>
                </div>

                {/* QR Code Upload & Preview */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-text-primary">
                    UPI QR Code Image *
                  </label>
                  <p className="text-xs text-text-secondary">
                    Upload your shop&apos;s UPI QR Code (PNG, JPG, WEBP). It will be saved securely on Cloudinary.
                  </p>

                  <ImageUpload
                    value={qrImageUrl ? [{ url: qrImageUrl, sortOrder: 0 }] : []}
                    onChange={(items) => {
                      const newUrl = items[0]?.url || "";
                      form.setValue("upiQrImageUrl", newUrl, { shouldDirty: true, shouldValidate: true });
                    }}
                    maxFiles={1}
                    enableCrop={false}
                    enableEditor={false}
                  />

                  {/* QR Preview Card */}
                  {qrImageUrl && (
                    <div className="mt-4 flex items-start gap-4 p-4 rounded-xl bg-surface border border-border max-w-md">
                      <div className="w-32 h-32 rounded-lg border border-border p-1 bg-white flex-shrink-0">
                        <img
                          src={qrImageUrl}
                          alt="UPI QR Code Preview"
                          className="w-full h-full object-contain rounded"
                        />
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="font-semibold text-text-primary flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> QR Code Active
                        </div>
                        <p className="text-xs text-text-secondary font-mono break-all">{form.watch("upiId") || "No UPI ID set"}</p>
                        <p className="text-[11px] text-text-secondary pt-2">Customers will scan this QR at checkout to pay.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cash on Delivery */}
          <div className="flex items-center justify-between border-b border-border pb-4 pt-2">
            <div>
              <h4 className="font-medium text-text-primary">Cash on Delivery (COD)</h4>
              <p className="text-sm text-text-secondary">Allow customers to pay upon delivery.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              {...form.register("enableCod")}
            />
          </div>

          {/* Store Currency */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-text-primary mb-1">Store Currency</label>
            <select
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              {...form.register("currency")}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isPending || !form.formState.isDirty}>
              {isPending ? "Saving..." : "Save Payment Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
