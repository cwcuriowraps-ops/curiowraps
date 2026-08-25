"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useForgotPassword } from "@/api/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPasswordPage() {
  const { addToast } = useToast();
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: any) => {
    forgotPassword(data.email, {
      onSuccess: () => {
        setIsSubmitted(true);
        addToast({
          title: "Request Processed",
          description: "If an account exists with this email, you'll receive a password reset link.",
          type: "success",
        });
      },
      onError: (error: any) => {
        const errorCode = error?.code || error?.data?.error?.code || "";
        const status = error?.status || 0;
        const errorMsg = (error?.message || "").toLowerCase();

        console.error("[ForgotPassword][Page] Handled Error", {
          status,
          code: errorCode,
          message: error?.message,
          data: error?.data,
          stack: error?.stack,
        });

        if (typeof navigator !== "undefined" && (!navigator.onLine || errorMsg.includes("network") || errorMsg.includes("failed to fetch"))) {
          addToast({
            title: "Connection Error 🔌",
            description: "Unable to connect to the server.",
            type: "error",
          });
        } else if (errorCode === "EMAIL_SEND_FAILED" || errorMsg.includes("email")) {
          addToast({
            title: "Email Delivery Failed",
            description: "Unable to send reset email. Please try again later.",
            type: "error",
          });
        } else if (status >= 500) {
          addToast({
            title: "Server Error",
            description: "Something went wrong. Please try again later.",
            type: "error",
          });
        } else {
          setIsSubmitted(true);
          addToast({
            title: "Request Processed",
            description: "If an account exists with this email, you'll receive a password reset link.",
            type: "success",
          });
        }
      },
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-[440px] space-y-8 bg-surface p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {!isSubmitted ? (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                {...register("email")}
                error={errors.email?.message as string}
                className="bg-background"
              />
            </div>

            <div className="pt-4 flex justify-center">
              <Button
                type="submit"
                width="auth"
                size="md"
                loading={isPending}
                loadingText="Sending reset link…"
                disabled={isPending}
                className="shadow-md hover:shadow-lg transition-all"
              >
                Send reset link
              </Button>
            </div>

            <div className="text-center mt-6">
              <Link href="/auth/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl bg-accent/5 p-6 border border-accent/10">
              <p className="text-sm text-center text-text-primary">
                If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.
              </p>
            </div>
            <div className="text-center flex justify-center">
              <Link href="/auth/login" className="w-full sm:w-fit">
                <Button variant="outline" size="lg" className="w-full sm:w-fit sm:min-w-[160px]">
                  Return to sign in
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
