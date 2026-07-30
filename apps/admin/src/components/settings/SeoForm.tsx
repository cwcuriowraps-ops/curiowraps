"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";


const seoSchema = z.object({
  storeTitle: z.string().min(1, "Title is required"),
  metaDescription: z.string().max(160, "Description must be under 160 characters"),
  metaKeywords: z.string().optional(),
});

type SeoValues = z.infer<typeof seoSchema>;

export function SeoForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const form = useForm<SeoValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      storeTitle: defaultValues?.seo?.storeTitle || "Curio Wrap",
      metaDescription: defaultValues?.seo?.metaDescription || "",
      metaKeywords: defaultValues?.seo?.metaKeywords || "",
    },
  });

  useEffect(() => {
    if (defaultValues?.seo) {
      form.reset(defaultValues.seo);
    }
  }, [defaultValues, form]);

  const onSubmit = (data: SeoValues) => {
    updateSettings({ seo: data });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input label="Store Title Format" placeholder="e.g. Curio Wrap | Handmade Gifts" {...form.register("storeTitle")} error={form.formState.errors.storeTitle?.message} />
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Meta Description</label>
            <textarea
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px]"
              placeholder="A brief description of your store for search engines..."
              {...form.register("metaDescription")}
            />
            {form.formState.errors.metaDescription && <p className="mt-1 text-xs text-red-500">{form.formState.errors.metaDescription.message}</p>}
            <p className="mt-1 text-xs text-text-secondary">{form.watch("metaDescription")?.length || 0}/160 characters</p>
          </div>

          <Input label="Meta Keywords (Comma separated)" placeholder="handmade, gifts, decor" {...form.register("metaKeywords")} error={form.formState.errors.metaKeywords?.message} />

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
