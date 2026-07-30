"use client";

import { Badge, Button, Input, Modal, Skeleton, useToast } from "@dashboard/ui";
import { Plus, Search, Edit, Trash2, Copy, Eye, ToggleLeft, ToggleRight, Archive, RefreshCcw, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAdminProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useRestoreProduct } from "@/api/products";
import { ActionsMenu } from "@/components/actions-menu";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // Include archived/deleted products by default in admin if API supports it via params.
  const { data, isLoading } = useAdminProducts({ page, limit: 10, search, includeDeleted: true });
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { mutate: createProduct, isPending: _isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: _isUpdating } = useUpdateProduct();
  const { mutate: restoreProduct, isPending: _isRestoring } = useRestoreProduct();
  const { addToast } = useToast();

  const [deleteModalProduct, setDeleteModalProduct] = useState<any | null>(null);

  const handleDelete = (id: string) => {
    deleteProduct(id, {
      onSuccess: () => {
        addToast({ title: "Product deleted successfully", type: "success" });
      },
      onError: (err: any) => {
        addToast({ title: "Failed to delete product", description: err.message, type: "error" });
      }
    });
  };

  const handleArchive = (id: string) => {
    updateProduct({ id, data: { status: "ARCHIVED" } }, {
      onSuccess: () => {
        addToast({ title: "Product archived successfully", type: "success" });
      },
      onError: (err: any) => {
        addToast({ title: "Failed to archive product", description: err.message, type: "error" });
      }
    });
  };

  const handleRestore = (id: string) => {
    restoreProduct(id, {
      onSuccess: () => {
        addToast({ title: "Product restored successfully", type: "success" });
      },
      onError: (err: any) => {
        addToast({ title: "Failed to restore product", description: err.message, type: "error" });
      }
    });
  };

  const handleDuplicate = (product: any) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, deletedAt: _deletedAt, slug, ...rest } = product;
    const duplicateData = {
      ...rest,
      name: `${product.name} (Copy)`,
      slug: `${slug}-copy-${Math.random().toString(36).substring(2, 6)}`,
      status: "DRAFT",
      isFeatured: false,
      variants: {
        create: product.variants?.map((v: any) => {
          const { id: _vId, productId: _productId, createdAt: _vCa, updatedAt: _vUa, deletedAt: _vDa, sku, ...vRest } = v;
          return {
            ...vRest,
            sku: `${sku}-COPY-${Math.random().toString(36).substring(2, 6)}`
          };
        }) || []
      },
      images: {
        create: product.images?.map((img: any) => ({ url: img.url, sortOrder: img.sortOrder })) || []
      },
      categories: {
        create: product.categories?.map((c: any) => ({ categoryId: c.categoryId, sortOrder: c.sortOrder })) || []
      }
    };

    createProduct(duplicateData, {
      onSuccess: () => {
        addToast({ title: "Product duplicated successfully", type: "success" });
      },
      onError: (err: any) => {
        addToast({ title: "Failed to duplicate product", description: err.message, type: "error" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Products</h1>
          <p className="text-sm text-text-secondary">Manage your product catalog</p>
        </div>
        <Link href="/products/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-muted text-xs uppercase text-text-primary">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Product</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Inventory</th>
                <th scope="col" className="px-6 py-4 font-medium">Price</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data?.products?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-text-primary">No products found</p>
                    <p className="mt-1 text-xs text-text-secondary">Try adjusting your search</p>
                  </td>
                </tr>
              ) : (
                data?.data?.products?.map((product: any) => (
                  <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0]?.url ? (
                          <img 
                            src={encodeURI(product.images[0].url)} 
                            alt={product.name}
                            className={`h-10 w-10 rounded-md object-cover bg-muted ${product.deletedAt ? "opacity-50 grayscale" : ""}`}
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-md bg-muted flex items-center justify-center text-text-secondary text-[10px] font-semibold ${product.deletedAt ? "opacity-50 grayscale" : ""}`}>
                            {product.name?.substring(0, 2).toUpperCase() || "CW"}
                          </div>
                        )}
                        <div>
                          <div className={`font-medium text-text-primary ${product.deletedAt ? "line-through text-text-secondary" : ""}`}>{product.name}</div>
                          <div className="text-xs text-text-secondary">{product.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={product.deletedAt ? "error" : product.status === "ACTIVE" ? "success" : product.status === "ARCHIVED" ? "warning" : "default"}>
                        {product.deletedAt ? "Deleted" : product.status === "ACTIVE" ? "Active" : product.status === "ARCHIVED" ? "Archived" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary">{product.variants?.reduce((sum: number, v: any) => sum + v.inventory, 0) || 0} in stock</div>
                      <div className="text-xs text-text-secondary">{product.variants?.length || 0} variants</div>
                    </td>
                    <td className="px-6 py-4 text-text-primary font-medium">
                      ₹{product.basePrice}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionsMenu
                        items={[
                          {
                            label: "View Product",
                            icon: Eye,
                            onClick: () => window.open(`http://localhost:3000/products/${product.slug}`, "_blank"),
                          },
                          ...(!product.deletedAt
                            ? [
                                {
                                  label: "Edit Product",
                                  icon: Edit,
                                  onClick: () => (window.location.href = `/products/${product.id}/edit`),
                                },
                                {
                                  label: product.status === "ACTIVE" ? "Set as Draft" : "Activate Product",
                                  icon: product.status === "ACTIVE" ? ToggleLeft : ToggleRight,
                                  onClick: () =>
                                    updateProduct(
                                      { id: product.id, data: { status: product.status === "ACTIVE" ? "DRAFT" : "ACTIVE" } },
                                      {
                                        onSuccess: () => addToast({ title: "Product status updated", type: "success" }),
                                        onError: (err: any) => addToast({ title: "Failed to update status", description: err.message, type: "error" }),
                                      }
                                    ),
                                },
                                {
                                  label: "Duplicate",
                                  icon: Copy,
                                  onClick: () => handleDuplicate(product),
                                },
                                {
                                  label: "Archive",
                                  icon: Archive,
                                  onClick: () => handleArchive(product.id),
                                },
                                {
                                  label: "Delete Product",
                                  icon: Trash2,
                                  danger: true,
                                  onClick: () => setDeleteModalProduct(product),
                                },
                              ]
                            : [
                                {
                                  label: "Restore Product",
                                  icon: RefreshCcw,
                                  onClick: () => handleRestore(product.id),
                                },
                                {
                                  label: "Delete Product",
                                  icon: Trash2,
                                  danger: true,
                                  onClick: () => setDeleteModalProduct(product),
                                },
                              ]),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Product Confirmation Modal */}
      {deleteModalProduct && (
        <Modal
          open={!!deleteModalProduct}
          onOpenChange={() => setDeleteModalProduct(null)}
          title="Delete Product"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">Confirm Product Deletion</p>
                <p className="mt-0.5">
                  Are you sure you want to delete <strong className="font-bold">{deleteModalProduct.name}</strong>? This action will remove the product from your store catalog.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteModalProduct(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDelete(deleteModalProduct.id);
                  setDeleteModalProduct(null);
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
