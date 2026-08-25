"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUpdateSettings } from "../../api/settings";
import { API_URL } from "../../lib/api-client";
import { useAuthStore } from "../../store/useAuthStore";

const brandingSchema = z.object({
  primaryTheme: z.string().min(1, "Primary theme color is required"),
  lightTheme: z.string().optional(),
  darkTheme: z.string().optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
});

type BrandingValues = z.infer<typeof brandingSchema>;

export function BrandingForm({ defaultValues }: { defaultValues: any }) {
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const { addToast } = useToast();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const form = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryTheme: defaultValues?.branding?.primaryTheme || "#e5b3c5",
      lightTheme: defaultValues?.branding?.lightTheme || "#ffffff",
      darkTheme: defaultValues?.branding?.darkTheme || "#111111",
      accentColor: defaultValues?.branding?.accentColor || "#e5b3c5",
      logoUrl: defaultValues?.branding?.logoUrl || "",
      faviconUrl: defaultValues?.branding?.faviconUrl || "",
    },
  });

  useEffect(() => {
    if (defaultValues?.branding) {
      form.reset(defaultValues.branding);
    }
  }, [defaultValues, form]);

  const onSubmit = (data: BrandingValues) => {
    updateSettings({ branding: data });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "faviconUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "logoUrl") setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Always read the latest token at call time via getState()
      const token = useAuthStore.getState().token;

      // We have to use native fetch for FormData since apiClient defaults to application/json
      const response = await fetch(`${API_URL}/admin/media/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.message || `Upload failed (HTTP ${response.status})`);
      }
      const result = await response.json();
      
      form.setValue(field, result.data.mediaAsset.publicUrl, { shouldDirty: true });
      addToast({
        title: "Image uploaded successfully",
        type: "success",
      });
    } catch (error) {
      console.error("BrandingForm upload error:", error);
      addToast({
        title: "Upload Failed",
        description: "Image upload failed. Please try again.",
        type: "error",
      });
    } finally {
      if (field === "logoUrl") setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Store Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-surface overflow-hidden">
                  {form.watch("logoUrl") ? (
                    <img src={form.watch("logoUrl")} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-text-secondary">No Logo</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-border bg-transparent hover:bg-muted text-text-primary h-9 px-4 py-2">
                    {uploadingLogo ? "Uploading..." : "Upload Image"}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "logoUrl")} />
                  </label>
                  <p className="mt-1 text-xs text-text-secondary">Recommended: 400x100px PNG</p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Favicon</label>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface overflow-hidden">
                  {form.watch("faviconUrl") ? (
                    <img src={form.watch("faviconUrl")} alt="Favicon" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-text-secondary">No Icon</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-border bg-transparent hover:bg-muted text-text-primary h-8 px-3">
                    {uploadingFavicon ? "Uploading..." : "Upload Icon"}
                    <input type="file" className="hidden" accept="image/x-icon,image/png" onChange={(e) => handleFileUpload(e, "faviconUrl")} />
                  </label>
                  <p className="mt-1 text-xs text-text-secondary">Recommended: 32x32px ICO/PNG</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-text-primary mb-4">Theme Colors</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Primary Theme Color" type="color" className="h-10 cursor-pointer" {...form.register("primaryTheme")} error={form.formState.errors.primaryTheme?.message} />
              <Input label="Accent Color" type="color" className="h-10 cursor-pointer" {...form.register("accentColor")} error={form.formState.errors.accentColor?.message} />
              <Input label="Light Theme Background" type="color" className="h-10 cursor-pointer" {...form.register("lightTheme")} error={form.formState.errors.lightTheme?.message} />
              <Input label="Dark Theme Background" type="color" className="h-10 cursor-pointer" {...form.register("darkTheme")} error={form.formState.errors.darkTheme?.message} />
            </div>
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
