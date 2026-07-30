"use client";

import { Badge, Button, Input, Modal, Select, Skeleton, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdjustInventory, useAdminInventory, useInventoryLocations } from "@/api/inventory";

const adjustSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  quantityChange: z.number({ invalid_type_error: "Must be a number" }).int("Quantity must be an integer"),
  type: z.enum(["ADJUSTMENT", "SALE", "RETURN", "RESTOCK", "TRANSFER", "RESERVE", "RELEASE"]),
  referenceType: z.string().min(1, "Reference type is required"),
  note: z.string().optional(),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

export default function InventoryPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminInventory({ page, limit: 20, search });
  const { data: locationsData, isLoading: isLoadingLocations } = useInventoryLocations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const { mutateAsync: adjustInventory, isPending: isAdjusting } = useAdjustInventory();
  
  const form = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      locationId: "",
      quantityChange: 0,
      type: "ADJUSTMENT",
      referenceType: "MANUAL",
      note: "",
    },
  });

  const openAdjustModal = (item: any) => {
    setSelectedVariant(item);
    form.reset({
      locationId: locationsData?.data?.locations?.[0]?.id || "",
      quantityChange: 0,
      type: "ADJUSTMENT",
      referenceType: "MANUAL",
      note: "",
    });
    setIsModalOpen(true);
  };

  const closeAdjustModal = () => {
    setIsModalOpen(false);
    setSelectedVariant(null);
  };

  const onSubmit = async (values: AdjustFormValues) => {
    if (!selectedVariant) return;
    
    try {
      await adjustInventory({
        variantId: selectedVariant.id,
        ...values,
      });
      addToast({ title: "Inventory updated successfully", type: "success" });
      closeAdjustModal();
    } catch (error: any) {
      addToast({ title: "Failed to adjust inventory", description: error.message, type: "error" });
    }
  };

  const locations = locationsData?.data?.locations || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Inventory</h1>
          <p className="text-sm text-text-secondary">Track and manage product stock levels</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search by SKU or product..."
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
                <th scope="col" className="px-6 py-4 font-medium">Product / Variant</th>
                <th scope="col" className="px-6 py-4 font-medium">SKU</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Available</th>
                <th scope="col" className="px-6 py-4 font-medium">Reserved</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No inventory records found</td>
                </tr>
              ) : (
                data?.data?.map((item: any) => {
                  const isLowStock = item.inventory <= 10;
                  const isOutOfStock = item.inventory === 0;
                  
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{item.product?.name || "Unknown Product"}</div>
                        <div className="text-xs text-text-secondary">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{item.sku}</td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <Badge variant="error">Out of Stock</Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" className="flex w-fit items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-600' : 'text-text-primary'}`}>
                        {item.inventory}
                      </td>
                      <td className="px-6 py-4">{item.reservedInventory || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => openAdjustModal(item)}>Adjust</Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {data?.meta && data.meta.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <span className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text-primary">{(page - 1) * 20 + 1}</span> to <span className="font-medium text-text-primary">{Math.min(page * 20, data.meta.total)}</span> of <span className="font-medium text-text-primary">{data.meta.total}</span> items
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.meta.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Adjust Inventory">
        {selectedVariant && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4 rounded-lg bg-muted p-4">
              <div className="font-medium text-text-primary">{selectedVariant.product?.name}</div>
              <div className="text-sm text-text-secondary">SKU: {selectedVariant.sku}</div>
              <div className="mt-2 text-sm text-text-secondary">
                Current Total Available: <span className="font-bold text-text-primary">{selectedVariant.inventory}</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Location *</label>
              <Select
                {...form.register("locationId")}
                disabled={isLoadingLocations || locations.length === 0}
                className="w-full"
              >
                <option value="" disabled>Select a location</option>
                {locations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </Select>
              {form.formState.errors.locationId && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.locationId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Type *</label>
                <Select {...form.register("type")} className="w-full">
                  <option value="ADJUSTMENT">Adjustment</option>
                  <option value="RESTOCK">Restock</option>
                  <option value="SALE">Sale (Decrease)</option>
                  <option value="RETURN">Return (Increase)</option>
                  <option value="RESERVE">Reserve (Decrease)</option>
                  <option value="RELEASE">Release (Increase)</option>
                  <option value="TRANSFER">Transfer</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Quantity Change *</label>
                <Input
                  type="number"
                  placeholder="+/- Quantity"
                  {...form.register("quantityChange", { valueAsNumber: true })}
                />
                {form.formState.errors.quantityChange && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.quantityChange.message}</p>
                )}
                <p className="mt-1 text-xs text-text-secondary">Use negative values to reduce stock</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Reference Note</label>
              <Input placeholder="E.g. Stock count 2026, Damaged goods, etc." {...form.register("note")} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeAdjustModal} disabled={isAdjusting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAdjusting || locations.length === 0}>
                {isAdjusting ? "Saving..." : "Adjust Inventory"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
