"use client";

import { Badge, Button, Input, Modal, Select, Skeleton, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Search, Eye, CreditCard, RefreshCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdminOrders, useUpdateOrderStatus, useUpdateOrderPaymentStatus, useDeleteOrder } from "@/api/orders";
import { ActionsMenu } from "@/components/actions-menu";

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});
type StatusFormValues = z.infer<typeof statusSchema>;

const paymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"]),
});
type PaymentStatusFormValues = z.infer<typeof paymentStatusSchema>;

export default function OrdersPage() {
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminOrders({ page, limit: 15, search });
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutateAsync: updatePaymentStatus, isPending: isUpdatingPayment } = useUpdateOrderPaymentStatus();
  const { mutateAsync: deleteOrder, isPending: isDeleting } = useDeleteOrder();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: "PENDING",
    },
  });

  const paymentForm = useForm<PaymentStatusFormValues>({
    resolver: zodResolver(paymentStatusSchema),
    defaultValues: {
      paymentStatus: "PENDING",
    },
  });

  const openStatusModal = (order: any) => {
    setSelectedOrder(order);
    form.reset({ status: order.status });
    setIsModalOpen(true);
  };

  const openPaymentStatusModal = (order: any) => {
    setSelectedOrder(order);
    paymentForm.reset({ paymentStatus: order.paymentStatus });
    setIsPaymentModalOpen(true);
  };

  const openDeleteModal = (order: any) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      addToast({ title: "Order deleted successfully.", type: "success" });
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    } catch (error: any) {
      addToast({ title: "Failed to delete order", description: error.message || "An error occurred while deleting the order.", type: "error" });
    }
  };

  const onSubmit = async (values: StatusFormValues) => {
    if (!selectedOrder) return;
    try {
      await updateStatus({ id: selectedOrder.id, status: values.status });
      addToast({ title: "Order updated successfully", type: "success" });
      setIsModalOpen(false);
      setSelectedOrder(null);
    } catch (error: any) {
      addToast({ title: "Failed to update order", description: error.message, type: "error" });
    }
  };

  const onPaymentSubmit = async (values: PaymentStatusFormValues) => {
    if (!selectedOrder) return;
    try {
      await updatePaymentStatus({ id: selectedOrder.id, paymentStatus: values.paymentStatus });
      addToast({ title: "Order updated successfully", type: "success" });
      setIsPaymentModalOpen(false);
      setSelectedOrder(null);
    } catch (error: any) {
      addToast({ title: "Failed to update payment status", description: error.message, type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Orders</h1>
          <p className="text-sm text-text-secondary">Manage customer orders and fulfillment</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search by order ID or email..."
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
                <th scope="col" className="px-6 py-4 font-medium">Order ID</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium">Customer</th>
                <th scope="col" className="px-6 py-4 font-medium">Total</th>
                <th scope="col" className="px-6 py-4 font-medium">Payment</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data?.orders?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">No orders found</td>
                </tr>
              ) : (
                data?.data?.orders?.map((order: any) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-xs text-text-primary">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{order.user?.firstName} {order.user?.lastName}</span>
                        {order.items?.some((item: any) => item.customization) && (
                          <span className="text-[10px] font-semibold bg-accent/15 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                            Customized
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary">
                      ₹{order.grandTotal}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={order.paymentStatus === "PAID" ? "success" : "warning"}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          order.status === "DELIVERED" ? "success" :
                          order.status === "CANCELLED" || order.status === "REFUNDED" ? "error" :
                          "default"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionsMenu
                        items={[
                          {
                            label: "View Order Details",
                            icon: Eye,
                            onClick: () => (window.location.href = `/orders/${order.id}`),
                          },
                          {
                            label: "Update Order Status",
                            icon: RefreshCcw,
                            onClick: () => openStatusModal(order),
                          },
                          {
                            label: "Update Payment Status",
                            icon: CreditCard,
                            onClick: () => openPaymentStatusModal(order),
                          },
                          {
                            label: "Delete Order",
                            icon: Trash2,
                            danger: true,
                            onClick: () => openDeleteModal(order),
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
        
        {data?.meta && data.meta.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <span className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text-primary">{(page - 1) * 15 + 1}</span> to <span className="font-medium text-text-primary">{Math.min(page * 15, data.meta.total)}</span> of <span className="font-medium text-text-primary">{data.meta.total}</span> orders
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

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Update Order Status">
        {selectedOrder && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4 rounded-lg bg-muted p-4">
              <div className="font-medium text-text-primary">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-sm text-text-secondary">Customer: {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</div>
              <div className="mt-2 text-sm font-bold text-text-primary">
                Total: ₹{selectedOrder.grandTotal}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Status *</label>
              <Select {...form.register("status")} className="w-full">
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Processing</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </Select>
              {form.formState.errors.status && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.status.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Update Status"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} title="Update Payment Status">
        {selectedOrder && (
          <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
            <div className="mb-4 rounded-lg bg-muted p-4">
              <div className="font-medium text-text-primary">Order #{selectedOrder.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-sm text-text-secondary">Customer: {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</div>
              <div className="mt-2 text-sm font-bold text-text-primary">
                Total: ₹{selectedOrder.grandTotal}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Payment Status *</label>
              <Select {...paymentForm.register("paymentStatus")} className="w-full">
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isUpdatingPayment}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingPayment}>
                {isUpdatingPayment ? "Saving..." : "Update Payment Status"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Delete Order?">
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            This action will permanently delete this order and cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setOrderToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              width="action"
              loading={isDeleting}
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
