"use client";

import { Badge, Input, Skeleton, Button, Modal, Select, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Edit, Trash2, AlertTriangle, Loader2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useAdminUsers, useUpdateUserStatus, useAssignUserRole, useDeleteUser } from "@/api/users";
import { useAuthStore } from "@/store/useAuthStore";

const editSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED", "INVITED"]),
  role: z.string().min(1, "Role is required"),
});
type EditFormValues = z.infer<typeof editSchema>;

export default function UsersPage() {
  const { addToast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminUsers({ page, limit: 15, search });
  
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateUserStatus();
  const { mutateAsync: updateRole, isPending: isUpdatingRole } = useAssignUserRole();
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Delete Modal State
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);
  const [deleteInputText, setDeleteInputText] = useState("");

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      status: "ACTIVE",
      role: "CUSTOMER",
    },
  });

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    form.reset({
      status: u.status || "ACTIVE",
      role: u.role || "CUSTOMER",
    });
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleOpenDeleteModal = (u: any) => {
    if (currentUser?.id === u.id) {
      addToast({
        title: "Action Prohibited 🚫",
        description: "You cannot delete your own active administrator account.",
        type: "error",
      });
      return;
    }
    setDeleteModalUser(u);
    setDeleteInputText("");
    setActiveDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    if (deleteInputText.trim() !== "DELETE") {
      addToast({
        title: "Validation Error",
        description: "Please type DELETE exactly to confirm deletion.",
        type: "warning",
      });
      return;
    }

    try {
      await deleteUser(deleteModalUser.id);
      addToast({
        title: "User Deleted",
        description: `Successfully deleted user account for ${deleteModalUser.email}.`,
        type: "success",
      });
      setDeleteModalUser(null);
      setDeleteInputText("");
    } catch (err: any) {
      addToast({
        title: "Failed to delete user",
        description: err.message || "An unexpected error occurred.",
        type: "error",
      });
    }
  };

  const onSubmit = async (values: EditFormValues) => {
    if (!selectedUser) return;
    
    try {
      if (values.status !== selectedUser.status) {
        await updateStatus({ id: selectedUser.id, status: values.status });
      }
      if (values.role !== selectedUser.role) {
        await updateRole({ id: selectedUser.id, role: values.role });
      }
      
      addToast({ title: "User updated successfully", type: "success" });
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      addToast({ title: "Failed to update user", description: error.message, type: "error" });
    }
  };

  const isUpdating = isUpdatingStatus || isUpdatingRole;

  const getDisplayStatus = (u: any) => {
    if (u.status) return u.status;
    return u.isActive ? "ACTIVE" : "SUSPENDED";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">User Management</h1>
          <p className="text-sm text-text-secondary">Manage customer accounts and staff roles</p>
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
                <th scope="col" className="px-6 py-4 font-medium">Name</th>
                <th scope="col" className="px-6 py-4 font-medium">Email</th>
                <th scope="col" className="px-6 py-4 font-medium">Role</th>
                <th scope="col" className="px-6 py-4 font-medium">Status</th>
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
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">No users found</td>
                </tr>
              ) : (
                data?.users?.map((u: any) => {
                  const displayStatus = getDisplayStatus(u);
                  const isDropdownOpen = activeDropdownId === u.id;

                  return (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{u.firstName} {u.lastName}</div>
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={
                            displayStatus === "ACTIVE" ? "success" : 
                            displayStatus === "SUSPENDED" ? "warning" : "error"
                          }
                        >
                          {displayStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon-sm"
                            onClick={() => openEditModal({...u, status: displayStatus})}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <div className="relative inline-block text-left">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setActiveDropdownId(isDropdownOpen ? null : u.id)}
                              title="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {isDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute right-0 mt-1 z-50 w-44 rounded-xl bg-surface border border-border shadow-xl py-1 text-xs text-left">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal({...u, status: displayStatus})}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-text-primary hover:bg-muted transition-colors"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-text-secondary" /> Edit Account
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteModal(u)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-500/10 transition-colors font-medium"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete User
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

      {/* Edit User Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} title="Edit User">
        {selectedUser && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4 rounded-lg bg-muted p-4">
              <div className="font-medium text-text-primary">{selectedUser.firstName} {selectedUser.lastName}</div>
              <div className="text-sm text-text-secondary">{selectedUser.email}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Role *</label>
                <Select {...form.register("role")} className="w-full">
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">Status *</label>
                <Select {...form.register("status")} className="w-full">
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DELETED">Deleted</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete User Modal */}
      {deleteModalUser && (
        <Modal
          open={!!deleteModalUser}
          onOpenChange={() => setDeleteModalUser(null)}
          title="Delete User Account"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold">This action cannot be undone.</p>
                <p className="mt-0.5">
                  Deleting <strong className="font-bold">{deleteModalUser.email}</strong> will permanently remove their access and roles.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="delete-user-confirm-input" className="text-xs font-medium text-text-primary">
                To confirm, type <span className="font-bold text-rose-500 font-mono select-none">DELETE</span> below:
              </label>
              <Input
                id="delete-user-confirm-input"
                placeholder="Type DELETE"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteModalUser(null)}>
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