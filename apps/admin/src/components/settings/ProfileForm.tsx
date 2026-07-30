"use client";

import { Button, Input, Card, CardHeader, CardTitle, CardContent, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Mail, KeyRound, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { apiClient } from "../../lib/api-client";
import { useAuthStore } from "../../store/useAuthStore";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ["currentPassword"],
});

const changeEmailSchema = z.object({
  newEmail: z.string().email("A valid email address is required."),
  currentPassword: z.string().min(1, "Current password is required to verify email change."),
});

type ProfileValues = z.infer<typeof profileSchema>;
type ChangeEmailValues = z.infer<typeof changeEmailSchema>;

export function ProfileForm() {
  const { user, token, setAuth, refreshToken } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["admin-me"],
    queryFn: async () => {
      const response = await apiClient<{ data: { user: any } }>("/admin/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    },
    enabled: !!token,
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<ChangeEmailValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  useEffect(() => {
    if (me) {
      form.reset({
        firstName: me.firstName || "",
        lastName: me.lastName || "",
        phone: me.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [me, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileValues) => {
      const response = await apiClient<{ data: { user: any } }>("/admin/users/me", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return response.data.user;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-me"], data);
      addToast({ title: "Profile Updated", description: "Your profile has been updated successfully.", type: "success" });
      form.setValue("currentPassword", "");
      form.setValue("newPassword", "");
      form.setValue("confirmPassword", "");
      form.reset({}, { keepValues: true });
    },
    onError: (error: any) => {
      addToast({ title: "Failed to update profile", description: error.message || "An unexpected error occurred.", type: "error" });
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (data: ChangeEmailValues) => {
      const response = await apiClient<{ data: { user: any; accessToken?: string; message?: string } }>("/users/change-email", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (resData) => {
      const updatedUser = resData.user;
      const newToken = resData.accessToken || token || "";

      // Update global auth store and query cache
      setAuth(newToken, updatedUser, refreshToken);
      queryClient.setQueryData(["admin-me"], updatedUser);

      addToast({
        title: "Email Address Updated",
        description: resData.message || `Your account email has been updated to ${updatedUser.email}.`,
        type: "success",
      });

      emailForm.reset({
        newEmail: "",
        currentPassword: "",
      });
    },
    onError: (error: any) => {
      addToast({
        title: "Email Change Failed",
        description: error.message || "Failed to update email address.",
        type: "error",
      });
    },
  });

  const onSubmitProfile = (data: ProfileValues) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitEmail = (data: ChangeEmailValues) => {
    changeEmailMutation.mutate(data);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white shadow-sm uppercase">
              {me?.firstName?.[0] || user?.firstName?.[0] || "A"}
            </div>
            <div>
              <h4 className="font-medium text-text-primary capitalize text-lg">{me?.firstName} {me?.lastName}</h4>
              <p className="text-sm text-text-secondary">{me?.email || user?.email}</p>
              <div className="mt-1.5 inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-600">
                <Shield className="mr-1 h-3 w-3" />
                {me?.role?.name || me?.role || "Admin"}
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" {...form.register("firstName")} error={form.formState.errors.firstName?.message} />
              <Input label="Last Name" {...form.register("lastName")} error={form.formState.errors.lastName?.message} />
            </div>
            <Input label="Phone Number" {...form.register("phone")} error={form.formState.errors.phone?.message} />

            <div className="pt-6 border-t border-border">
              <h4 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-accent" />
                Change Password
              </h4>
              <div className="space-y-4">
                <Input label="Current Password" type="password" {...form.register("currentPassword")} error={form.formState.errors.currentPassword?.message} />
                <Input label="New Password" type="password" {...form.register("newPassword")} error={form.formState.errors.newPassword?.message} />
                <Input label="Confirm New Password" type="password" {...form.register("confirmPassword")} error={form.formState.errors.confirmPassword?.message} />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" disabled={updateProfileMutation.isPending || !form.formState.isDirty}>
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security: Change Account Email Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-accent" />
            Change Account Email
          </CardTitle>
          <p className="text-xs text-text-secondary mt-1">
            Update the email address associated with your admin account. Requires current password verification for security.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-5 max-w-xl">
            {/* Current Email Display */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Current Email Address</label>
              <Input value={me?.email || user?.email || ""} disabled className="bg-muted/50 text-text-secondary cursor-not-allowed" />
            </div>

            {/* New Email Input */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">
                New Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="Enter new email address"
                {...emailForm.register("newEmail")}
                error={emailForm.formState.errors.newEmail?.message}
              />
              <p className="text-xs text-text-secondary">
                You will use this new email address to log in to the admin panel.
              </p>
            </div>

            {/* Password Security Verification */}
            <div className="space-y-1 pt-2">
              <label className="text-sm font-medium text-text-primary">
                Current Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="Enter current password to authorize change"
                {...emailForm.register("currentPassword")}
                error={emailForm.formState.errors.currentPassword?.message}
              />
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 pt-1">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                Password verification is required to prevent unauthorized email modification.
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="submit"
                disabled={changeEmailMutation.isPending || !emailForm.formState.isDirty}
                className="min-w-[140px]"
              >
                {changeEmailMutation.isPending ? "Updating Email..." : "Update Email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
