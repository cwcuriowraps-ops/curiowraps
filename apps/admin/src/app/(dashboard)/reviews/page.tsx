"use client";

import { Badge, Button, Input, Skeleton, useToast } from "@dashboard/ui";
import { format } from "date-fns";
import { CheckCircle2, Eye, Filter, Search, Star, Trash2, X, XCircle } from "lucide-react";
import { useState } from "react";

import { useAdminReviews, useDeleteReview, useUpdateReviewStatus } from "@/api/reviews";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [inspectReview, setInspectReview] = useState<any | null>(null);

  const { data, isLoading } = useAdminReviews({
    page,
    limit: 10,
    search,
    productId: selectedProduct,
    rating: selectedRating,
    status: selectedStatus,
  });

  const updateStatus = useUpdateReviewStatus();
  const deleteReview = useDeleteReview();
  const { addToast } = useToast();

  const handleToggleApproval = (id: string, currentStatus: boolean) => {
    updateStatus.mutate(
      { id, isApproved: !currentStatus },
      {
        onSuccess: () => {
          addToast({
            title: `Review ${!currentStatus ? "approved" : "hidden"} successfully`,
            type: "success",
          });
          if (inspectReview && inspectReview.id === id) {
            setInspectReview((prev: any) => (prev ? { ...prev, isApproved: !currentStatus } : null));
          }
        },
        onError: (err: any) => {
          addToast({
            title: "Failed to update review status",
            description: err.message,
            type: "error",
          });
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteReview.mutate(id, {
      onSuccess: () => {
        addToast({ title: "Review deleted successfully", type: "success" });
        if (inspectReview && inspectReview.id === id) {
          setInspectReview(null);
        }
      },
      onError: (err: any) => {
        addToast({ title: "Failed to delete review", description: err.message, type: "error" });
      },
    });
  };

  const reviewsList = data?.reviews || [];
  const productsList = data?.products || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Customer Reviews</h1>
          <p className="text-sm text-text-secondary">Moderate and manage product reviews submitted by customers</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <Filter className="h-3.5 w-3.5" />
            Filters:
          </div>

          {/* Product Filter */}
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="all">All Products</option>
            {productsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => {
              setSelectedRating(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-border bg-background px-3 text-xs text-text-primary focus:border-accent focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-muted text-xs uppercase text-text-primary">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Customer & Product</th>
                <th scope="col" className="px-6 py-4 font-medium">Rating</th>
                <th scope="col" className="px-6 py-4 font-medium">Review Content</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-64" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : reviewsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No reviews found matching criteria
                  </td>
                </tr>
              ) : (
                reviewsList.map((review: any) => (
                  <tr key={review.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">
                        {review.user?.firstName} {review.user?.lastName || ""}
                      </div>
                      <div className="text-xs text-text-secondary">{review.user?.email}</div>
                      <div className="text-xs text-accent font-light truncate max-w-[180px] mt-0.5">
                        {review.product?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`h-4 w-4 ${idx < review.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-text-secondary font-light">
                        {format(new Date(review.createdAt), "MMM dd, yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-text-primary text-xs">{review.title || "No Title"}</div>
                      <div className="text-xs text-text-secondary line-clamp-2 mt-0.5 font-light">
                        {review.body || review.comment || "No comment content."}
                      </div>
                      {review.images && review.images.length > 0 && (
                        <div className="text-[10px] text-accent font-medium mt-1">
                          📷 {review.images.length} attachment(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={review.isApproved ? "success" : "warning"}>
                        {review.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-text-secondary hover:text-text-primary"
                          onClick={() => setInspectReview(review)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className={review.isApproved ? "text-amber-500 hover:text-amber-600" : "text-green-600 hover:text-green-700"}
                          onClick={() => handleToggleApproval(review.id, review.isApproved)}
                          disabled={updateStatus.isPending}
                          title={review.isApproved ? "Reject / Unapprove" : "Approve Review"}
                        >
                          {review.isApproved ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(review.id)}
                          disabled={deleteReview.isPending}
                          title="Delete Review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20 text-xs">
            <span className="text-text-secondary font-light">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Review Detail Modal */}
      {inspectReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-lg text-text-primary">Review Details</h3>
              <button
                onClick={() => setInspectReview(null)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-start bg-muted/40 p-4 rounded-xl">
                <div>
                  <p className="font-semibold text-text-primary">
                    {inspectReview.user?.firstName} {inspectReview.user?.lastName}
                  </p>
                  <p className="text-xs text-text-secondary">{inspectReview.user?.email}</p>
                </div>
                <Badge variant={inspectReview.isApproved ? "success" : "warning"}>
                  {inspectReview.isApproved ? "Approved" : "Pending"}
                </Badge>
              </div>

              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block font-semibold mb-1">
                  Product
                </span>
                <p className="font-medium text-text-primary">{inspectReview.product?.name}</p>
              </div>

              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block font-semibold mb-1">
                  Rating
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-5 w-5 ${idx < inspectReview.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                    />
                  ))}
                  <span className="ml-2 font-semibold text-text-primary text-xs">{inspectReview.rating} / 5</span>
                </div>
              </div>

              {inspectReview.title && (
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider block font-semibold mb-1">
                    Title
                  </span>
                  <p className="font-semibold text-text-primary">{inspectReview.title}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block font-semibold mb-1">
                  Comment
                </span>
                <p className="text-text-secondary font-light bg-background p-3 rounded-xl border border-border leading-relaxed">
                  {inspectReview.body || "No comment provided."}
                </p>
              </div>

              {inspectReview.images && inspectReview.images.length > 0 && (
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-wider block font-semibold mb-2">
                    Review Images ({inspectReview.images.length})
                  </span>
                  <div className="flex gap-3 overflow-x-auto">
                    {inspectReview.images.map((img: string, idx: number) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer">
                        <img
                          src={img}
                          alt="Review attachment"
                          className="h-24 w-24 rounded-xl object-cover border border-border hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-text-secondary pt-2">
                Submitted on {format(new Date(inspectReview.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant="danger"
                onClick={() => handleDelete(inspectReview.id)}
                disabled={deleteReview.isPending}
              >
                Delete Review
              </Button>

              <div className="flex gap-2">
                <Button
                  variant={inspectReview.isApproved ? "outline" : "primary"}
                  onClick={() => handleToggleApproval(inspectReview.id, inspectReview.isApproved)}
                  disabled={updateStatus.isPending}
                >
                  {inspectReview.isApproved ? "Reject / Hide" : "Approve Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
