"use client";

import { Button, Input, Skeleton, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, X, Image as ImageIcon, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";

import { useAdminBrands, useDeleteBrand, useCreateBrand, useUpdateBrand } from "@/api/brands";
import { ActionsMenu } from "@/components/actions-menu";
import { ImageUpload } from "@/components/media/image-upload";

const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format (e.g. my-brand)"),
  description: z.string().optional(),
  logoUrl: z.array(z.object({ url: z.string(), sortOrder: z.number() })).optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export default function CollectionsPage() {
  const { data, isLoading, isError, error, refetch } = useAdminBrands();
  const brands = data?.data?.brands ?? [];
  const { mutate: deleteBrand, isPending: _isDeleting } = useDeleteBrand();
  const { mutate: createBrand, isPending: isCreating } = useCreateBrand();
  const { mutate: updateBrand, isPending: isUpdating } = useUpdateBrand();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<z.input<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logoUrl: [],
      websiteUrl: "",
      isActive: true,
    }
  });

  const handleOpenModal = (brand?: any) => {
    if (brand) {
      setEditingId(brand.id);
      form.reset({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || "",
        logoUrl: brand.logoUrl ? [{ url: brand.logoUrl, sortOrder: 0 }] : [],
        websiteUrl: brand.websiteUrl || "",
        isActive: brand.isActive,
      });
    } else {
      setEditingId(null);
      form.reset({
        name: "",
        slug: "",
        description: "",
        logoUrl: [],
        websiteUrl: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.reset();
  };

  const onSubmit = async (values: z.input<typeof brandSchema>) => {
    try {
      const payload: any = {
        ...values,
        logoUrl: values.logoUrl && values.logoUrl.length > 0 ? values.logoUrl[0]?.url : null,
        websiteUrl: values.websiteUrl || null,
        description: values.description || null,
      };

      if (editingId) {
        await updateBrand({ id: editingId, data: payload });
        addToast({ title: "Collection updated successfully", type: "success" });
      } else {
        await createBrand(payload);
        addToast({ title: "Collection created successfully", type: "success" });
      }
      handleCloseModal();
    } catch (err: any) {
      addToast({
        title: editingId ? "Failed to update collection" : "Failed to create collection",
        description: err.message || "An unexpected error occurred",
        type: "error"
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this collection?")) {
      deleteBrand(id, {
        onSuccess: () => {
          addToast({ title: "Collection deleted successfully", type: "success" });
        },
        onError: (err: any) => {
          addToast({ title: "Failed to delete collection", description: err.message, type: "error" });
        }
      });
    }
  };

  const onInvalidForm = () => {
    addToast({
      title: "Validation Error",
      description: "Please fix the highlighted fields.",
      type: "warning",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-text-primary">Collections</h1>
          <p className="text-sm text-text-secondary mt-1">Manage product brands and themed collections</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-full gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" /> Add Collection
        </Button>
      </div>

      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="bg-muted text-xs uppercase text-text-primary">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Collection Name</th>
              <th scope="col" className="px-6 py-4 font-medium">Slug</th>
              <th scope="col" className="px-6 py-4 font-medium">Status</th>
              <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-red-500">Failed to load collections</p>
                  <p className="mt-1 text-xs text-text-secondary font-light">
                    {(error as any)?.message || "Something went wrong while connecting to the server."}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                    Retry
                  </Button>
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                  <p className="text-base font-medium text-text-primary">No collections found</p>
                  <p className="mt-1 text-xs text-text-secondary">Get started by creating your first collection.</p>
                </td>
              </tr>
            ) : (
              brands.map((brand: any) => (
                <tr key={brand.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-primary flex items-center gap-3">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 rounded object-contain bg-white border border-border" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center border border-border">
                        <ImageIcon className="w-4 h-4 text-text-secondary" />
                      </div>
                    )}
                    {brand.name}
                  </td>
                  <td className="px-6 py-4">{brand.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${brand.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionsMenu
                      items={[
                        {
                          label: "View Collection",
                          icon: Eye,
                          onClick: () => window.open(`http://localhost:3000/products?category=${brand.slug}`, "_blank"),
                        },
                        {
                          label: "Edit Collection",
                          icon: Edit,
                          onClick: () => handleOpenModal(brand),
                        },
                        {
                          label: brand.isActive ? "Deactivate" : "Activate",
                          icon: brand.isActive ? ToggleLeft : ToggleRight,
                          onClick: () =>
                            updateBrand(
                              { id: brand.id, data: { isActive: !brand.isActive } },
                              {
                                onSuccess: () => addToast({ title: "Collection status updated", type: "success" }),
                                onError: (err: any) => addToast({ title: "Failed to update status", description: err.message, type: "error" }),
                              }
                            ),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onClick: () => handleDelete(brand.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary">
                {editingId ? "Edit Collection" : "Add Collection"}
              </h2>
              <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit, onInvalidForm)} className="p-6 space-y-4">
              <Input label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
              <Input label="Slug" {...form.register("slug")} error={form.formState.errors.slug?.message} />
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={3}
                  {...form.register("description")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Collection Image</label>
                <Controller
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <ImageUpload 
                      value={field.value || []} 
                      onChange={field.onChange} 
                      maxFiles={1}
                    />
                  )}
                />
              </div>

              <Input label="Website URL" type="url" {...form.register("websiteUrl")} error={form.formState.errors.websiteUrl?.message} />

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  {...form.register("isActive")}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-text-primary">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? "Saving..." : "Save Collection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
