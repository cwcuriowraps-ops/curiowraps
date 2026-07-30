"use client";

import { Badge, Button, Input, Modal, Select, Skeleton, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Edit, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdminCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon } from "@/api/coupons";
import { ActionsMenu } from "@/components/actions-menu";

const couponSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/, "Only uppercase letters, numbers, hyphens, and underscores allowed"),
  type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  value: z.number({ invalid_type_error: "Must be a number" }).min(0),
  minOrderAmount: z.number({ invalid_type_error: "Must be a number" }).min(0).optional().or(z.literal(0)),
  maxDiscount: z.number({ invalid_type_error: "Must be a number" }).min(0).optional().or(z.literal(0)),
  usageLimit: z.number({ invalid_type_error: "Must be a number" }).int().min(1).optional().or(z.literal(0)),
  perUserLimit: z.number({ invalid_type_error: "Must be a number" }).int().min(1).optional().or(z.literal(0)),
  isActive: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const { addToast } = useToast();
  const { data, isLoading } = useAdminCoupons();
  const { mutateAsync: createCoupon, isPending: isCreating } = useCreateCoupon();
  const { mutateAsync: updateCoupon, isPending: isUpdating } = useUpdateCoupon();
  const { mutate: deleteCoupon, isPending: _isDeleting } = useDeleteCoupon();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      type: "PERCENTAGE",
      value: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      usageLimit: 0,
      perUserLimit: 0,
      isActive: true,
    },
  });

  const handleDelete = (id: string) => {
    deleteCoupon(id, {
      onSuccess: () => addToast({ title: "Coupon deleted successfully", type: "success" }),
      onError: (err: any) => addToast({ title: "Failed to delete coupon", description: err.message, type: "error" }),
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    form.reset({
      code: "",
      type: "PERCENTAGE",
      value: 0,
      minOrderAmount: 0,
      maxDiscount: 0,
      usageLimit: 0,
      perUserLimit: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setEditingId(coupon.id);
    form.reset({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : 0,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : 0,
      usageLimit: coupon.usageLimit || 0,
      perUserLimit: coupon.perUserLimit || 0,
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CouponFormValues) => {
    try {
      const payload = {
        ...values,
        minOrderAmount: values.minOrderAmount || undefined,
        maxDiscount: values.maxDiscount || undefined,
        usageLimit: values.usageLimit || undefined,
        perUserLimit: values.perUserLimit || undefined,
      };

      if (editingId) {
        await updateCoupon({ id: editingId, data: payload });
        addToast({ title: "Coupon saved successfully", type: "success" });
      } else {
        await createCoupon(payload);
        addToast({ title: "Coupon saved successfully", type: "success" });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      addToast({ title: "Failed to save coupon", description: error.message, type: "error" });
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Coupons</h1>
          <p className="text-sm text-text-secondary">Manage discount codes and promotions</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-muted text-xs uppercase text-text-primary">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Code</th>
                <th scope="col" className="px-6 py-4 font-medium">Type</th>
                <th scope="col" className="px-6 py-4 font-medium">Value</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Expires</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data?.coupons?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No coupons found</td>
                </tr>
              ) : (
                data?.data?.coupons?.map((coupon: any) => {
                  const isActive = coupon.isActive && (!coupon.endDate || new Date(coupon.endDate) > new Date());
                  return (
                    <tr key={coupon.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-text-primary">{coupon.code}</td>
                      <td className="px-6 py-4">{coupon.type}</td>
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `₹${coupon.value}`}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isActive ? "success" : "default"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {coupon.endDate ? format(new Date(coupon.endDate), "MMM d, yyyy") : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionsMenu
                          items={[
                            {
                              label: "Edit Coupon",
                              icon: Edit,
                              onClick: () => openEditModal(coupon),
                            },
                            {
                              label: coupon.isActive ? "Deactivate" : "Activate",
                              icon: coupon.isActive ? ToggleLeft : ToggleRight,
                              onClick: () =>
                                updateCoupon(
                                  { id: coupon.id, data: { isActive: !coupon.isActive } },
                                  {
                                    onSuccess: () => addToast({ title: "Coupon saved successfully", type: "success" }),
                                    onError: (err: any) => addToast({ title: "Failed to update status", description: err.message, type: "error" }),
                                  }
                                ),
                            },
                            {
                              label: "Delete",
                              icon: Trash2,
                              danger: true,
                              onClick: () => handleDelete(coupon.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingId ? "Edit Coupon" : "Create Coupon"}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">Coupon Code *</label>
            <Input placeholder="E.g. SUMMER20" {...form.register("code")} />
            {form.formState.errors.code && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
            <p className="mt-1 text-xs text-text-secondary">Only uppercase letters, numbers, hyphens, and underscores.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Type *</label>
              <Select {...form.register("type")} className="w-full">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </Select>
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Value *</label>
              <Input type="number" step="0.01" {...form.register("value", { valueAsNumber: true })} />
              {form.formState.errors.value && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.value.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Min. Order Amount (₹)</label>
              <Input type="number" step="0.01" placeholder="Leave as 0 for no minimum" {...form.register("minOrderAmount", { valueAsNumber: true })} />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Max. Discount (₹)</label>
              <Input type="number" step="0.01" placeholder="Leave as 0 for no limit" {...form.register("maxDiscount", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Total Usage Limit</label>
              <Input type="number" placeholder="Leave as 0 for unlimited" {...form.register("usageLimit", { valueAsNumber: true })} />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Per User Limit</label>
              <Input type="number" placeholder="Leave as 0 for unlimited" {...form.register("perUserLimit", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              {...form.register("isActive")}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
              Active (Available for use)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
