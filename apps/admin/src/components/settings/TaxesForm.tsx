"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";

const taxesSchema = z.object({
  enabled: z.boolean(),
  taxPercentage: z.coerce.number().min(0, "Must be 0 or greater").max(100, "Cannot exceed 100%"),
  taxLabel: z.string().min(1, "Tax label is required"),
});

type TaxesValues = z.infer<typeof taxesSchema>;

export function TaxesForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<TaxesValues>({
    resolver: zodResolver(taxesSchema),
    defaultValues: {
      enabled: defaultValues?.taxes?.enabled ?? true,
      taxPercentage: defaultValues?.taxes?.taxPercentage ?? 18,
      taxLabel: defaultValues?.taxes?.taxLabel || "GST (18%)",
    },
  });

  useEffect(() => {
    if (defaultValues?.taxes) {
      form.reset({
        enabled: defaultValues.taxes.enabled ?? true,
        taxPercentage: defaultValues.taxes.taxPercentage ?? 18,
        taxLabel: defaultValues.taxes.taxLabel || "GST (18%)",
      });
    }
  }, [defaultValues, form]);

  const onSubmit = (data: TaxesValues) => {
    updateSettings({ taxes: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="tax-enabled"
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              {...form.register("enabled")}
            />
            <label htmlFor="tax-enabled" className="text-sm font-medium text-text-primary cursor-pointer select-none">
              Enable Tax Calculation
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              placeholder="e.g. 18"
              {...form.register("taxPercentage")}
              error={form.formState.errors.taxPercentage?.message}
            />
            <Input
              label="Tax Display Label (GST, VAT, Sales Tax)"
              placeholder="e.g. GST (18%)"
              {...form.register("taxLabel")}
              error={form.formState.errors.taxLabel?.message}
            />
          </div>

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
