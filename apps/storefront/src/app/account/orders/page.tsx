"use client";

import { Badge, Button, Input, Skeleton, useToast } from "@dashboard/ui";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, MessageSquare, Package, Star, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useOrders } from "@/api/orders";
import { useMyReviews, useSubmitReview } from "@/api/reviews";
import { sanitizeErrorMessage } from "@/lib/toast-utils";

export default function OrdersPage() {
  const { data, isLoading } = useOrders();
  const { data: myReviewsData } = useMyReviews();
  const submitReview = useSubmitReview();
  const { addToast } = useToast();

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Review modal state for Order History
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; productName: string; existingReview?: any } | null>(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [titleInput, setTitleInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imagesList, setImagesList] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const myReviews = myReviewsData?.reviews || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      case "SHIPPED":
      case "PROCESSING":
        return "accent";
      default:
        return "default";
    }
  };

  const getPaymentStatusLabel = (paymentStatus: string, paymentMethod: string) => {
    if (paymentMethod === "COD") {
      switch (paymentStatus) {
        case "PENDING":    return { label: "Pending Collection", color: "text-yellow-600 dark:text-yellow-400" };
        case "PAID":       return { label: "Cash Collected",     color: "text-green-600 dark:text-green-400" };
        case "FAILED":     return { label: "Collection Failed",  color: "text-red-600 dark:text-red-400" };
        default:           return { label: paymentStatus,         color: "text-text-secondary" };
      }
    }
    if (paymentMethod === "UPI") {
      switch (paymentStatus) {
        case "PENDING":    return { label: "Awaiting Confirmation", color: "text-yellow-600 dark:text-yellow-400" };
        case "PAID":       return { label: "Payment Verified",      color: "text-green-600 dark:text-green-400" };
        case "FAILED":     return { label: "Payment Failed",        color: "text-red-600 dark:text-red-400" };
        case "CANCELLED":  return { label: "Cancelled",             color: "text-red-500 dark:text-red-400" };
        default:           return { label: paymentStatus,            color: "text-text-secondary" };
      }
    }
    switch (paymentStatus) {
      case "PENDING":            return { label: "Awaiting Payment",  color: "text-yellow-600 dark:text-yellow-400" };
      case "AUTHORIZED":         return { label: "Authorised",         color: "text-blue-600 dark:text-blue-400" };
      case "PAID":               return { label: "Paid",               color: "text-green-600 dark:text-green-400" };
      case "FAILED":             return { label: "Payment Failed",     color: "text-red-600 dark:text-red-400" };
      case "REFUNDED":           return { label: "Refunded",           color: "text-purple-600 dark:text-purple-400" };
      case "PARTIALLY_REFUNDED": return { label: "Partially Refunded", color: "text-purple-500 dark:text-purple-300" };
      case "CANCELLED":          return { label: "Cancelled",          color: "text-red-500 dark:text-red-400" };
      default:                   return { label: paymentStatus,         color: "text-text-secondary" };
    }
  };

  const handleOpenReviewModal = (productId: string, productName: string) => {
    const existing = myReviews.find((r: any) => r.productId === productId);
    setReviewTarget({ productId, productName, existingReview: existing });
    if (existing) {
      setRatingInput(existing.rating || 5);
      setTitleInput(existing.title || "");
      setCommentInput(existing.body || "");
      setImagesList(existing.images || []);
    } else {
      setRatingInput(5);
      setTitleInput("");
      setCommentInput("");
      setImagesList([]);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImagesList((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;

    submitReview.mutate(
      {
        productId: reviewTarget.productId,
        rating: ratingInput,
        title: titleInput,
        body: commentInput,
        images: imagesList,
      },
      {
        onSuccess: () => {
          addToast({
            title: "Review Submitted! ✨",
            description: "Thank you for your feedback! It will appear after approval.",
            type: "success",
          });
          setReviewTarget(null);
        },
        onError: (err: any) => {
          addToast({
            title: "Could not submit review",
            description: sanitizeErrorMessage(err, "Failed to submit review. Please try again."),
            type: "error",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif text-text-primary">Order History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const orders = data?.orders || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-text-primary">Order History</h1>
        <p className="text-sm text-text-secondary font-light mt-1">
          View and track your recent purchases at Curio Wrap.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border p-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-lg text-text-primary mb-2">No orders found</h3>
          <p className="text-sm text-text-secondary font-light mb-6">
            You haven't placed any orders with this account yet.
          </p>
          <Link href="/products">
            <Button size="lg" className="rounded-full px-8">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const isExpanded = expandedOrderId === order.id;
            const items = order.items || [];
            const isDelivered = order.status === "DELIVERED" || order.status === "COMPLETED";

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden transition-all duration-normal"
              >
                {/* Order Summary Header */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-text-primary">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary font-light">
                      Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-xs text-text-secondary font-light">Total Price</p>
                      <p className="font-semibold text-text-primary">₹{Number(order.grandTotal).toLocaleString("en-IN")}</p>
                    </div>
                    <button className="text-text-secondary hover:text-text-primary transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/10 p-6 space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Order Items
                      </h4>
                      <div className="divide-y divide-border">
                        {items.map((item: any) => {
                          const itemProductId = item.productId || item.product?.id;
                          const existingReview = myReviews.find((r: any) => r.productId === itemProductId);

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4"
                            >
                              <div className="space-y-1">
                                <p className="font-medium text-text-primary text-sm">
                                  {item.productName || item.product?.name || "Handcrafted Creation"}
                                </p>
                                <p className="text-xs text-text-secondary font-light">
                                  SKU: {item.sku} | Qty: {item.quantity}
                                </p>
                                {item.customization && (
                                  <div className="mt-1.5 rounded-lg bg-muted/60 p-2 text-xs text-text-secondary border border-border max-w-md">
                                    <span className="font-semibold block mb-0.5 text-text-primary text-[10px] uppercase tracking-wider">Customization Instructions</span>
                                    <p className="whitespace-pre-wrap font-light">{item.customization}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4">
                                <p className="text-sm font-medium text-text-primary">
                                  ₹{(Number(item.unitPrice) * item.quantity).toLocaleString("en-IN")}
                                </p>

                                {/* Review Action Button for Delivered Orders */}
                                {isDelivered && itemProductId && (
                                  existingReview ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        Reviewed
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenReviewModal(itemProductId, item.productName || item.product?.name || "Creation");
                                        }}
                                        className="h-8 text-xs rounded-full"
                                      >
                                        Edit Review
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenReviewModal(itemProductId, item.productName || item.product?.name || "Creation");
                                      }}
                                      className="h-8 text-xs rounded-full shadow-sm"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                      Write Review
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border text-sm font-light">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                          Shipping Address
                        </h4>
                        <div className="text-text-primary space-y-0.5">
                          <p className="font-medium">
                            {order.shippingAddressSnapshot?.firstName}{" "}
                            {order.shippingAddressSnapshot?.lastName}
                          </p>
                          <p>{order.shippingAddressSnapshot?.line1}</p>
                          {order.shippingAddressSnapshot?.line2 && (
                            <p>{order.shippingAddressSnapshot.line2}</p>
                          )}
                          <p>
                            {order.shippingAddressSnapshot?.city},{" "}
                            {order.shippingAddressSnapshot?.postalCode}
                          </p>
                        </div>
                      </div>

                      <div className="md:text-right space-y-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 md:text-right">
                          Payment Info
                        </h4>
                        <p className="text-text-primary">
                          Method:{" "}
                          <span className="font-medium">
                            {order.paymentMethod === "UPI" ? "UPI Payment" : order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
                          </span>
                        </p>
                        {order.paymentMethod === "UPI" && (() => {
                          const upiTxId = order.payments?.find((p: any) => p.provider === "UPI" && p.providerPaymentId)?.providerPaymentId
                            || order.payments?.find((p: any) => p.provider === "UPI" && p.rawPayload?.upiTransactionId)?.rawPayload?.upiTransactionId
                            || order.payments?.[0]?.providerPaymentId
                            || null;
                          if (!upiTxId) return null;
                          return (
                            <p className="text-text-primary">
                              Transaction ID: <span className="font-mono font-medium">{upiTxId}</span>
                            </p>
                          );
                        })()}
                        <p className="text-text-primary">
                          Status:{" "}
                          {(() => {
                            const { label, color } = getPaymentStatusLabel(order.paymentStatus, order.paymentMethod);
                            return <span className={`font-medium ${color}`}>{label}</span>;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal inside Order History */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-serif text-xl text-text-primary">
                  {reviewTarget.existingReview ? "Edit Review" : "Write a Review"}
                </h3>
                <p className="text-xs text-text-secondary font-light">
                  For: <span className="font-medium text-text-primary">{reviewTarget.productName}</span>
                </p>
              </div>
              <button
                onClick={() => setReviewTarget(null)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {/* Star Rating Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Rating (1 - 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || ratingInput)
                            ? "fill-amber-400 text-amber-400"
                            : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-text-primary">
                    {hoverRating || ratingInput} Stars
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Title
                </label>
                <Input
                  placeholder="e.g. Loved the handcrafted detail!"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Comment Textarea */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Comment
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about the quality, packaging, and your overall experience..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Optional Images */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Optional Images
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddImageUrl}>
                    Add URL
                  </Button>
                </div>

                {imagesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {imagesList.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt="Review attachment"
                          className="h-16 w-16 rounded-lg object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReviewTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitReview.isPending}
                  disabled={submitReview.isPending}
                  className="px-6 rounded-full"
                >
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
