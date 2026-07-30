"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, useToast } from "@dashboard/ui";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Package, CreditCard, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useAdminOrder, useUpdateOrderStatus, useUpdateOrderPaymentStatus } from "@/api/orders";

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();
  
  const { data, isLoading } = useAdminOrder(id);
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateOrderStatus();
  const { mutateAsync: updatePaymentStatus, isPending: isUpdatingPayment } = useUpdateOrderPaymentStatus();

  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  const order = data?.data?.order;

  // Initialize state once order is loaded
  if (order && !status) {
    setStatus(order.status);
  }
  if (order && !paymentStatus) {
    setPaymentStatus(order.paymentStatus);
  }

  const handleUpdateStatus = async () => {
    try {
      await updateStatus({ id, status });
      addToast({ title: "Order status updated successfully", type: "success" });
    } catch (error: any) {
      addToast({ title: error.message || "Failed to update status", type: "error" });
    }
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      await updatePaymentStatus({ id, paymentStatus });
      addToast({ title: "Payment status updated successfully", type: "success" });
    } catch (error: any) {
      addToast({ title: error.message || "Failed to update payment status", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-text-primary">Order not found</h2>
        <p className="mt-2 text-text-secondary">The order you're looking for doesn't exist or has been deleted.</p>
        <Link href="/orders" className="mt-6">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-3">
            Order #{order.id.slice(0, 8).toUpperCase()}
            <Badge 
              variant={
                order.status === "DELIVERED" ? "success" :
                order.status === "CANCELLED" || order.status === "REFUNDED" ? "error" :
                "default"
              }
            >
              {order.status}
            </Badge>
          </h1>
          <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
            <Clock className="h-3.5 w-3.5" />
            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 divide-y divide-border">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between pt-4 first:pt-0">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md bg-muted flex-shrink-0 border border-border overflow-hidden">
                        {item.productVariant?.product?.images?.[0]?.url ? (
                          <img 
                            src={item.productVariant.product.images[0].url} 
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{item.productName}</div>
                        {item.productVariant?.title !== "Default" && (
                          <div className="text-xs text-text-secondary">{item.productVariant?.title}</div>
                        )}
                        {item.customization && (
                          <div className="mt-2 rounded-lg bg-muted/60 p-2.5 text-xs text-text-secondary border border-border max-w-lg">
                            <span className="font-semibold block mb-0.5 text-text-primary text-[10px] uppercase tracking-wider">Customization Instructions</span>
                            <p className="whitespace-pre-wrap font-light">{item.customization}</p>
                          </div>
                        )}
                        <div className="text-sm font-medium text-text-primary mt-1">
                          ₹{item.unitPrice} × {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-text-primary">
                      ₹{item.totalPrice}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  <span>₹{order.shippingTotal}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Tax</span>
                  <span>₹{order.taxTotal}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-success font-medium">
                    <span>Discount</span>
                    <span>-₹{order.discountTotal}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-text-primary text-base pt-2 border-t border-border mt-2">
                  <span>Total</span>
                  <span>₹{order.grandTotal}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline / Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">Current Status</label>
                  <select value={status} onChange={(e: any) => setStatus(e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
                <Button 
                  onClick={handleUpdateStatus} 
                  disabled={isUpdating || status === order.status}
                >
                  {isUpdating ? "Saving..." : "Update Status"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link href={`/customers/${order.userId}`} className="font-medium text-accent hover:underline">
                  {order.user?.firstName} {order.user?.lastName}
                </Link>
                <div className="text-sm text-text-secondary mt-1">
                  <a href={`mailto:${order.user?.email}`} className="hover:text-text-primary">{order.user?.email}</a>
                </div>
                {order.user?.phone && (
                  <div className="text-sm text-text-secondary mt-1">
                    <a href={`tel:${order.user?.phone}`} className="hover:text-text-primary">{order.user?.phone}</a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="text-sm text-text-secondary space-y-1">
                  <div className="font-medium text-text-primary">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </div>
                  <div>{order.shippingAddress.line1}</div>
                  {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</div>
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.phone && <div className="mt-2">Phone: {order.shippingAddress.phone}</div>}
                </div>
              ) : (
                <p className="text-sm text-text-secondary italic">No shipping address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-text-secondary mb-1">Method</div>
                <div className="text-sm font-medium text-text-primary">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-text-secondary">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="AUTHORIZED">Authorised</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                  <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <Button
                className="w-full"
                onClick={handleUpdatePaymentStatus}
                disabled={isUpdatingPayment || paymentStatus === order.paymentStatus}
              >
                {isUpdatingPayment ? "Saving..." : "Update Payment Status"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
