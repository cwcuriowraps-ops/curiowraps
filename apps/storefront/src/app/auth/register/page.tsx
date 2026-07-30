"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useRegister, useOAuthLogin } from "@/api/auth";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const { mutate: registerUser, isPending } = useRegister();
  const { mutate: oauthLogin } = useOAuthLogin();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: any) => {
    registerUser(data, {
      onSuccess: () => {
        addToast({
          title: "Account Created! ✨",
          description: "Welcome to Curio Wrap.",
          type: "success",
        });
      },
      onError: (error: any) => {
        addToast({
          title: "Registration Failed",
          description: error.message,
          type: "error",
        });
      },
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-[440px] space-y-8 bg-surface p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-accent hover:text-accent/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <div className="flex flex-col space-y-3 mt-8">
          <div className="w-full flex justify-center [&>div]:w-full [&>div>div]:w-full">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  oauthLogin(
                    { provider: "GOOGLE", idToken: credentialResponse.credential },
                    {
                      onSuccess: () => {
                        addToast({
                          title: "Account Created! ✨",
                          description: "Welcome to Curio Wrap.",
                          type: "success",
                        });
                      },
                      onError: (error: any) => {
                        addToast({ title: "Google Signup Failed", description: error.message, type: "error" });
                      },
                    }
                  );
                }
              }}
              onError={() => {
                addToast({ title: "Google Signup Failed", description: "Could not connect to Google", type: "error" });
              }}
              width="100%"
              theme="outline"
              size="large"
              shape="pill"
            />
          </div>
        </div>

        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[13px] font-medium">
            <span className="bg-surface px-4 text-text-secondary">Or continue with email</span>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                {...register("firstName")}
                error={errors.firstName?.message as string}
                className="bg-background"
              />
              <Input
                label="Last Name"
                {...register("lastName")}
                error={errors.lastName?.message as string}
                className="bg-background"
              />
            </div>
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
            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                error={errors.password?.message as string}
                className="bg-background"
              />
            </div>
            <div>
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message as string}
                className="bg-background"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <Button type="submit" width="auth" size="md" loading={isPending} disabled={isPending} className="shadow-md hover:shadow-lg transition-all">
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
