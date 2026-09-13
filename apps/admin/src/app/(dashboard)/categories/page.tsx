"use client";

import { Button, Input, Skeleton, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, X, Image as ImageIcon, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";

import { useAdminCategories, useDeleteCategory, useCreateCategory, useUpdateCategory } from "@/api/categories";
import { ActionsMenu } from "@/components/actions-menu";
import { ImageUpload } from "@/components/media/image-upload";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format (e.g. my-category)"),
  description: z.string().optional(),
  imageUrl: z.array(z.object({ url: z.string(), sortOrder: z.number() })).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function CategoriesPage() {
  const { data, isLoading, isError, error, refetch } = useAdminCategories();
  const categories = data?.data?.categories ?? [];
  const { mutate: deleteCategory, isPending: _isDeleting } = useDeleteCategory();
  const { mutateAsync: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.input<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: [],
      parentId: "",
      isActive: true,
    }
  });

  const watchName = form.watch("name");

  // Auto-generate slug from name in create mode if user hasn't manually edited slug
  useEffect(() => {
    if (!editingId && watchName) {
      const generatedSlug = slugify(watchName);
      form.setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [watchName, editingId, form]);

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingId(category.id);
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl ? [{ url: category.imageUrl, sortOrder: 0 }] : [],
        parentId: category.parentId || "",
        isActive: category.isActive,
      });
    } else {
      setEditingId(null);
      form.reset({
        name: "",
        slug: "",
        description: "",
        imageUrl: [],
        parentId: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (values: z.input<typeof categorySchema>) => {
    console.log("1. onSubmit entered", values);
    setIsSaving(true);
    try {
      // Cropping and upload finish before this form can be submitted; the uploaded URL is its runtime proof.
      console.log("2. crop completed", values.imageUrl);
      const imageUrl = values.imageUrl?.[0]?.url ?? null;
      console.log("3. upload completed", imageUrl);

      const payload = {
        ...values,
        imageUrl,
        parentId: values.parentId && values.parentId !== "" ? values.parentId : null,
      };
      console.log("4. payload built", payload);

      console.log("5. sending API request");
      const response = editingId
        ? await updateCategory({ id: editingId, data: payload })
        : await createCategory(payload);
      console.log("6. API response", response);

      console.log("7. success handler");
      addToast({ title: "Category saved successfully", type: "success" });
      handleCloseModal();
      console.log("8. category saved");
    } catch (error: any) {
      console.error("[Category Form] Save failed", error);
      if (error?.status === 409 || error?.code === "CONFLICT" || error?.message?.includes("slug")) {
        form.setError("slug", { type: "manual", message: "A category with this slug already exists." });
      }
      addToast({
        title: "Save Failed",
        description: "Failed to save category. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      console.log("[Category Form] Loading cleared");
    }
  };

  const onInvalid = (errors: any) => {
    console.warn("[Category Form] 3. Validation FAILED! Form Errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      addToast({
        title: "Validation Error",
        description: firstError.message.toString(),
        type: "warning",
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteCategory(id, {
      onSuccess: () => addToast({ title: "Category deleted successfully", type: "success" }),
      onError: (_err: any) => addToast({ title: "Delete Failed", description: "Failed to delete category. Please try again.", type: "error" }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Categories</h1>
          <p className="text-sm text-text-secondary">Manage your product categories</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-left text-sm text-text-secondary">
          <thead className="bg-muted text-xs uppercase text-text-primary">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Category Name</th>
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
                  <p className="text-sm font-semibold text-red-500">Failed to load categories</p>
                  <p className="mt-1 text-xs text-text-secondary font-light">
                    {(error as any)?.message || "Something went wrong while connecting to the server."}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                    Retry
                  </Button>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-secondary">
                  <p className="text-base font-medium text-text-primary">No categories found</p>
                  <p className="mt-1 text-xs text-text-secondary">Get started by creating your first product category.</p>
                </td>
              </tr>
            ) : (
              categories.map((cat: any) => (
                <tr key={cat.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-primary flex items-center gap-3">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-text-secondary" />
                      </div>
                    )}
                    {cat.name}
                  </td>
                  <td className="px-6 py-4">{cat.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionsMenu
                      items={[
                        {
                          label: "View Category",
                          icon: Eye,
                          onClick: () => window.open(`http://localhost:3000/products?category=${cat.slug}`, "_blank"),
                        },
                        {
                          label: "Edit Category",
                          icon: Edit,
                          onClick: () => handleOpenModal(cat),
                        },
                        {
                          label: cat.isActive ? "Deactivate" : "Activate",
                          icon: cat.isActive ? ToggleLeft : ToggleRight,
                          onClick: () =>
                            updateCategory(
                              { id: cat.id, data: { isActive: !cat.isActive } },
                              {
                                onSuccess: () => addToast({ title: "Category status updated", type: "success" }),
                                onError: (err: any) => addToast({ title: "Failed to update status", description: err.message, type: "error" }),
                              }
                            ),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          onClick: () => handleDelete(cat.id),
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
                {editingId ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-text-primary mb-2">Category Image</label>
                <Controller
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <ImageUpload 
                      value={field.value || []} 
                      onChange={field.onChange} 
                      maxFiles={1}
                      enableCrop={true}
                      cropShape="circle"
                      categoryName={form.watch("name") || "Category"}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Parent Category (Optional)</label>
                <select 
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  {...form.register("parentId")}
                >
                  <option value="">None (Top Level)</option>
                  {data?.data?.categories?.filter((c: any) => c.id !== editingId).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

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
                <Button
                  type="submit"
                  width="action"
                  loading={isSaving || isCreating || isUpdating}
                  disabled={isSaving || isCreating || isUpdating}
                  onClick={() => console.log("[Category Form] 1. Save Category Button clicked!")}
                >
                  Save Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
