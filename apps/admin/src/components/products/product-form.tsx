"use client";

import { Button, Input, Card, CardContent, CardHeader, CardTitle, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";

import { ImageUpload } from "../media/image-upload";

import { useAdminBrands } from "@/api/brands";
import { useAdminCategories } from "@/api/categories";
import { useCreateProduct, useUpdateProduct } from "@/api/products";


const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "DISCONTINUED"]).default("DRAFT"),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  taxable: z.boolean().default(true),
  requiresShipping: z.boolean().default(true),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(
    z.object({
      url: z.string(),
      sortOrder: z.number(),
    })
  ).default([]),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      sku: z.string().optional(),
      title: z.string().optional(),
      price: z.coerce.number().min(0, "Price must be non-negative"),
      compareAtPrice: z.coerce.number().optional().nullable(),
      weight: z.coerce.number().optional().nullable(),
    })
  ).default([]),
});



interface ProductFormProps {
  initialData?: any;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categoriesData } = useAdminCategories();
  const { data: brandsData } = useAdminBrands();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<z.input<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description || "",
      shortDescription: initialData.shortDescription || "",
      basePrice: initialData.basePrice || initialData.variants?.[0]?.price || 0,
      status: initialData.status || (initialData.isPublished ? "ACTIVE" : "DRAFT"),
      categoryId: initialData.categories?.[0]?.categoryId || "",
      brandId: initialData.brandId || "",
      isFeatured: initialData.isFeatured || false,
      taxable: initialData.taxable ?? true,
      requiresShipping: initialData.requiresShipping ?? true,
      seoTitle: initialData.seoTitle || "",
      seoDescription: initialData.seoDescription || "",
      images: initialData.images || [],
      variants: initialData.variants || [],
    } : {
      name: "",
      slug: "",
      description: "",
      shortDescription: "",
      basePrice: 0,
      status: "DRAFT",
      categoryId: "",
      brandId: "",
      isFeatured: false,
      taxable: true,
      requiresShipping: true,
      seoTitle: "",
      seoDescription: "",
      images: [],
      variants: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const onSubmit = async (data: z.input<typeof productSchema>) => {
    setIsLoading(true);
    try {
      const cleanBrandId = data.brandId && data.brandId.trim() !== "" ? data.brandId : undefined;
      const cleanCategoryId = data.categoryId && data.categoryId.trim() !== "" ? data.categoryId : undefined;

      let payload: any;

      if (initialData) {
        // Format payload for update
        payload = {
          name: data.name,
          slug: data.slug,
          description: data.description || undefined,
          shortDescription: data.shortDescription || undefined,
          status: data.status,
          brandId: cleanBrandId,
          isFeatured: data.isFeatured,
          taxable: data.taxable,
          requiresShipping: data.requiresShipping,
          seoTitle: data.seoTitle || undefined,
          seoDescription: data.seoDescription || undefined,
          ...(cleanCategoryId && {
            categories: {
              deleteMany: {},
              create: [{ categoryId: cleanCategoryId, sortOrder: 0 }],
            },
          }),
          images: {
            deleteMany: {},
            ...(data.images && data.images.length > 0
              ? {
                  create: data.images.map((img, i) => ({ url: img.url, sortOrder: i, isPrimary: i === 0 })),
                }
              : {}),
          },
          ...(data.variants && data.variants.length > 0
            ? {
                variants: {
                  deleteMany: {},
                  create: data.variants.map((v) => ({
                    sku: v.sku,
                    title: v.title,
                    price: Number(v.price),
                    compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                    weight: v.weight ? Number(v.weight) : null,
                    optionValues: {},
                  })),
                },
              }
            : {}),
        };
      } else {
        // Format payload for creation (NO deleteMany)
        payload = {
          name: data.name,
          slug: data.slug || undefined,
          description: data.description || undefined,
          shortDescription: data.shortDescription || undefined,
          status: data.status,
          brandId: cleanBrandId,
          categoryId: cleanCategoryId,
          basePrice: data.basePrice ? Number(data.basePrice) : 0,
          isFeatured: data.isFeatured,
          taxable: data.taxable,
          requiresShipping: data.requiresShipping,
          seoTitle: data.seoTitle || undefined,
          seoDescription: data.seoDescription || undefined,
          ...(data.images && data.images.length > 0
            ? {
                images: data.images.map((img, i) => ({ url: img.url, sortOrder: i, isPrimary: i === 0 })),
              }
            : {}),
          ...(data.variants && data.variants.length > 0
            ? {
                variants: data.variants.map((v, i) => ({
                  sku: v.sku,
                  title: v.title,
                  price: Number(v.price),
                  compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                  weight: v.weight ? Number(v.weight) : null,
                  isDefault: i === 0,
                  optionValues: {},
                })),
              }
            : {}),
        };
      }

      if (initialData) {
        await updateProduct.mutateAsync({ id: initialData.id, data: payload });
        addToast({ title: "Product updated successfully", type: "success" });
      } else {
        await createProduct.mutateAsync(payload);
        addToast({ title: "Product added successfully", type: "success" });
      }
      router.push("/products");
      router.refresh();
    } catch (error: any) {
      const errorMessage = error.data?.error?.message || error.message || "Failed to save product";
      addToast({ title: "Product Saving Failed", description: errorMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    setIsLoading(false);
    console.warn("[ProductForm][ValidationFailed]", errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorKey = errorKeys[0];
      if (firstErrorKey === "name" || firstErrorKey === "slug" || firstErrorKey === "description") {
        setActiveTab("basic");
      } else if (firstErrorKey === "basePrice") {
        setActiveTab("pricing");
      } else if (firstErrorKey === "variants") {
        setActiveTab("variants");
      }
      if (firstErrorKey) {
        const errVal = errors[firstErrorKey];
        const firstErrorMsg = errVal?.message || errVal?.root?.message || "Please fix validation errors in the form.";
        addToast({
          title: "Validation Error",
          description: String(firstErrorMsg),
          type: "warning",
        });
      }
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "media", label: "Media" },
    { id: "pricing", label: "Pricing Settings" },
    { id: "variants", label: "Variants" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 max-w-5xl">
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${
              activeTab === tab.id ? "border-accent text-accent" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === "basic" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Product Name" {...form.register("name")} error={form.formState.errors.name?.message} />
                <Input label="Slug" {...form.register("slug")} error={form.formState.errors.slug?.message} />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Short Description</label>
                  <textarea
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    rows={2}
                    {...form.register("shortDescription")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Full Description</label>
                  <textarea
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[150px]"
                    {...form.register("description")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                  <select 
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                    {...form.register("status")}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                  <select 
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                    {...form.register("categoryId")}
                  >
                    <option value="">Select Category</option>
                    {categoriesData?.data?.categories?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Collection</label>
                  <select 
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                    {...form.register("brandId")}
                  >
                    <option value="">Select Collection</option>
                    {brandsData?.data?.brands?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...form.register("isFeatured")} className="rounded border-border text-accent focus:ring-accent" />
                    <span className="text-sm font-medium text-text-primary">Featured Product</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className={activeTab === "media" ? "block" : "hidden"}>
        <Card>
          <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="images"
              render={({ field }) => (
                <ImageUpload 
                  value={field.value || []} 
                  onChange={field.onChange} 
                />
              )}
            />
          </CardContent>
        </Card>
      </div>

      <div className={activeTab === "pricing" ? "block" : "hidden"}>
        <Card>
          <CardHeader><CardTitle>Pricing Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Base Price (₹)" type="number" step="0.01" {...form.register("basePrice")} error={form.formState.errors.basePrice?.message} />
            </div>
            <div className="flex gap-4 pt-4 border-t border-border mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...form.register("taxable")} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text-primary">Charge tax on this product</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...form.register("requiresShipping")} className="rounded border-border text-accent focus:ring-accent" />
                <span className="text-sm text-text-primary">Requires shipping</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={activeTab === "variants" ? "block" : "hidden"}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Variants</CardTitle>
            <Button type="button" size="sm" onClick={() => appendVariant({ sku: "", title: "", price: 0 })}>
              <Plus className="w-4 h-4 mr-2" /> Add Variant
            </Button>
          </CardHeader>
          <CardContent>
            {variantFields.length === 0 ? (
              <div className="text-center py-8 text-text-secondary border-2 border-dashed border-border rounded-lg">
                No variants added. The product will be created with a default variant.
              </div>
            ) : (
              <div className="space-y-4">
                {variantFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-surface border border-border p-4 rounded-lg relative group">
                    <div className="col-span-3">
                      <Input label="Variant Title (e.g. Red / XL)" {...form.register(`variants.${index}.title`)} error={form.formState.errors.variants?.[index]?.title?.message} />
                    </div>
                    <div className="col-span-3">
                      <Input label="SKU" {...form.register(`variants.${index}.sku`)} error={form.formState.errors.variants?.[index]?.sku?.message} />
                    </div>
                    <div className="col-span-2">
                      <Input label="Price" type="number" step="0.01" {...form.register(`variants.${index}.price`)} error={form.formState.errors.variants?.[index]?.price?.message} />
                    </div>
                    <div className="col-span-2">
                      <Input label="Compare At" type="number" step="0.01" {...form.register(`variants.${index}.compareAtPrice`)} />
                    </div>
                    <div className="col-span-2 pb-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)} className="text-red-500 w-full">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={activeTab === "seo" ? "block" : "hidden"}>
        <Card>
          <CardHeader><CardTitle>Search Engine Optimization</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="SEO Title" {...form.register("seoTitle")} />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">SEO Description</label>
              <textarea
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px]"
                {...form.register("seoDescription")}
                maxLength={320}
              />
              <p className="text-xs text-text-secondary mt-1">Recommended 150-160 characters.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={() => router.push("/products")} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" width="action" loading={isLoading} disabled={isLoading}>
          {initialData ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
