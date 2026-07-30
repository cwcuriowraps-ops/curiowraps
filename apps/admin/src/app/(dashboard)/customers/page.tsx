"use client";

import { Badge, Input, Skeleton, Button, Modal, useToast } from "@dashboard/ui";
import { format } from "date-fns";
import { Search, Eye, Trash2, Ban, CheckCircle, AlertTriangle, Loader2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAdminCustomers, useDeleteCustomer } from "@/api/customers";
import { useUpdateUserStatus } from "@/api/users";
import { useAuthStore } from "@/store/useAuthStore";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminCustomers({ page, limit: 15, search });
  const { mutateAsync: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateUserStatus();
  const { addToast } = useToast();
  const { user: currentUser } = useAuthStore();

  // Active Action Menu Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteModalCustomer, setDeleteModalCustomer] = useState<any | null>(null);
  const [deleteInputText, setDeleteInputText] = useState("");

  const handleOpenDeleteModal = (customer: any) => {
    if (currentUser?.id === customer.id) {
      addToast({
        title: "Action Prohibited 🚫",
        description: "You cannot delete your own active administrator account.",
        type: "error",
      });
      return;
    }
    setDeleteModalCustomer(customer);
    setDeleteInputText("");
    setActiveDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalCustomer) return;
    if (deleteInputText.trim() !== "DELETE") {
      addToast({
        title: "Validation Error",
        description: "Please type DELETE exactly to confirm deletion.",
        type: "warning",
      });
      return;
    }

    try {
      await deleteCustomer(deleteModalCustomer.id);
      addToast({
        title: "Customer Deleted",
        description: `Successfully deleted account for ${deleteModalCustomer.email}.`,
        type: "success",
      });
      setDeleteModalCustomer(null);
      setDeleteInputText("");
    } catch (err: any) {
      addToast({
        title: "Failed to delete customer",
        description: err.message || "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  const handleToggleStatus = async (customer: any) => {
    const newStatus = customer.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await updateStatus({ id: customer.id, status: newStatus });
      addToast({
        title: "Account Status Updated",
        description: `Customer account is now ${newStatus.toLowerCase()}.`,
        type: "success",
      });
      setActiveDropdownId(null);
    } catch (err: any) {
      addToast({
        title: "Failed to update status",
        description: err.message || "An error occurred",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Customers</h1>
          <p className="text-sm text-text-secondary">View and manage customer accounts</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search by name or email..."
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
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-muted text-xs uppercase text-text-primary">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Customer</th>
                <th scope="col" className="px-6 py-4 font-medium">Email</th>
                <th scope="col" className="px-6 py-4 font-medium">Role</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
                <th scope="col" className="px-6 py-4 font-medium">Joined</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No customers found</td>
                </tr>
              ) : (
                data?.data?.items?.map((customer: any) => {
                  const roleName = typeof customer.role === "object" ? (customer.role?.name || "CUSTOMER") : (customer.role || "CUSTOMER");
                  const customerName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || customer.email || "Customer";
                  const status = customer.status || (customer.isActive ? "ACTIVE" : "SUSPENDED");
                  const isDropdownOpen = activeDropdownId === customer.id;

                  return (
                    <tr key={customer.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {customerName}
                      </td>
                      <td className="px-6 py-4">{customer.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={roleName === "ADMIN" || roleName === "SUPER_ADMIN" ? "accent" : "default"}>
                          {roleName}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={status === "ACTIVE" ? "success" : status === "SUSPENDED" ? "warning" : "error"}>
                          {status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {customer.createdAt ? format(new Date(customer.createdAt), "MMM d, yyyy") : "N/A"}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon-sm" title="View Profile">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* Action Dropdown Menu */}
                          <div className="relative inline-block text-left">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setActiveDropdownId(isDropdownOpen ? null : customer.id)}
                              title="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {isDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute right-0 mt-1 z-50 w-44 rounded-xl bg-surface border border-border shadow-xl py-1 text-xs">
                                  <Link
                                    href={`/customers/${customer.id}`}
                                    onClick={() => setActiveDropdownId(null)}
                                    className="flex items-center gap-2 px-3 py-2 text-text-primary hover:bg-muted transition-colors"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-text-secondary" /> View Details
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(customer)}
                                    disabled={isUpdatingStatus}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-text-primary hover:bg-muted transition-colors"
                                  >
                                    {status === "SUSPENDED" ? (
                                      <>
                                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Enable Account
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-3.5 w-3.5 text-amber-500" /> Disable Account
                                      </>
                                    )}
                                  </button>
                                  <div className="my-1 border-t border-border" />
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteModal(customer)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Customer
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Customer Confirmation Modal */}
      {deleteModalCustomer && (
        <Modal
          open={!!deleteModalCustomer}
          onOpenChange={() => setDeleteModalCustomer(null)}
          title="Delete Customer Account"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">This action cannot be undone.</p>
                <p className="mt-0.5">
                  Deleting <strong className="font-bold">{deleteModalCustomer.email}</strong> will permanently remove their access and historical customer data.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="delete-confirm-input" className="text-xs font-medium text-text-primary">
                To confirm, type <span className="font-bold text-rose-500 font-mono select-none">DELETE</span> below:
              </label>
              <Input
                id="delete-confirm-input"
                placeholder="Type DELETE"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteModalCustomer(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteInputText.trim() !== "DELETE" || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" /> Permanently Delete
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
