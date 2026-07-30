"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useResetPassword } from "@/api/auth";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function ResetPasswordForm() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: any) => {
    if (!token) {
      addToast({
        title: "Missing token",
        description: "Password reset token is missing from the URL.",
        type: "error",
      });
      return;
    }

    resetPassword(
      { token, newPassword: data.password },
      {
        onSuccess: () => {
          addToast({
            title: "Password reset successful",
            description: "You can now sign in with your new password.",
            type: "success",
          });
          router.push("/auth/login");
        },
        onError: (error: any) => {
          addToast({
            title: "Password reset failed",
            description: error.message || "The token may be invalid or expired.",
            type: "error",
          });
        },
      }
    );
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-text-secondary">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password">
          <Button variant="outline" className="w-full">
            Request new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div>
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message as string}
            className="bg-background"
          />
        </div>
        <div>
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message as string}
            className="bg-background"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-center">
        <Button
          type="submit"
          width="auth"
          size="md"
          loading={isPending}
          disabled={isPending}
          className="shadow-md hover:shadow-lg transition-all"
        >
          Reset password
        </Button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-[440px] space-y-8 bg-surface p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Set new password</h2>
          <p className="mt-2 text-sm text-text-secondary">Enter your new password below.</p>
        </div>

        <Suspense fallback={<div className="text-center text-text-secondary text-sm">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
