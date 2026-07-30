"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";


const storeInfoSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  tagline: z.string().optional(),
  storeEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  customerSupportEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  businessAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
});

type StoreInfoValues = z.infer<typeof storeInfoSchema>;

export function StoreInfoForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<StoreInfoValues>({
    resolver: zodResolver(storeInfoSchema),
    defaultValues: {
      storeName: defaultValues?.store_info?.storeName || "",
      tagline: defaultValues?.store_info?.tagline || "",
      storeEmail: defaultValues?.store_info?.storeEmail || "",
      customerSupportEmail: defaultValues?.store_info?.customerSupportEmail || "",
      phoneNumber: defaultValues?.store_info?.phoneNumber || "",
      businessAddress: defaultValues?.store_info?.businessAddress || "",
      gstNumber: defaultValues?.store_info?.gstNumber || "",
      registrationNumber: defaultValues?.store_info?.registrationNumber || "",
    },
  });

  // Update form if defaultValues change (due to data fetching)
  useEffect(() => {
    if (defaultValues?.store_info) {
      form.reset(defaultValues.store_info);
    }
  }, [defaultValues, form]);

  const onSubmit = (data: StoreInfoValues) => {
    updateSettings({ store_info: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Store Name" {...form.register("storeName")} error={form.formState.errors.storeName?.message} />
            <Input label="Tagline" {...form.register("tagline")} error={form.formState.errors.tagline?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Store Email" {...form.register("storeEmail")} error={form.formState.errors.storeEmail?.message} />
            <Input label="Customer Support Email" {...form.register("customerSupportEmail")} error={form.formState.errors.customerSupportEmail?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone Number" {...form.register("phoneNumber")} error={form.formState.errors.phoneNumber?.message} />
            <Input label="GST Number (Optional)" {...form.register("gstNumber")} error={form.formState.errors.gstNumber?.message} />
          </div>
          <Input label="Business Registration Number (Optional)" {...form.register("registrationNumber")} error={form.formState.errors.registrationNumber?.message} />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Business Address</label>
            <textarea
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px]"
              {...form.register("businessAddress")}
            />
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
