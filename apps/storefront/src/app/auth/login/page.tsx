"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useLogin, useOAuthLogin } from "@/api/auth";
import { GoogleAuthIndicator } from "@/components/auth/google-auth-indicator";
import { sanitizeErrorMessage } from "@/lib/toast-utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const { mutate: oauthLogin, isPending: isOAuthPending } = useOAuthLogin();
  const { addToast } = useToast();
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);

  const isAuthOverlayOpen = isOAuthPending || isGoogleAuthenticating;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: any) => {
    login(data, {
      onError: (error: any) => {
        addToast({
          title: "Login Failed",
          description: sanitizeErrorMessage(error, "Invalid email or password."),
          type: "error",
        });
      },
    });
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy"}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-[440px] space-y-8 bg-surface p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border relative">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium text-accent hover:text-accent/80 transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <div className="flex flex-col space-y-3 mt-8">
          <div 
            className={`w-full flex justify-center [&>div]:w-full [&>div>div]:w-full transition-opacity duration-200 ${
              isAuthOverlayOpen ? "opacity-50 pointer-events-none cursor-not-allowed select-none" : ""
            }`}
            onClickCapture={() => {
              if (!isAuthOverlayOpen) {
                setIsGoogleAuthenticating(true);
              }
            }}
          >
            <GoogleLogin
              click_listener={() => {
                if (!isAuthOverlayOpen) {
                  setIsGoogleAuthenticating(true);
                }
              }}
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  oauthLogin(
                    { provider: "GOOGLE", idToken: credentialResponse.credential },
                    {
                      onError: (error: any) => {
                        setIsGoogleAuthenticating(false);
                        addToast({
                          title: "Google Login Failed",
                          description: sanitizeErrorMessage(error, "Could not sign in with Google. Please try again."),
                          type: "error",
                        });
                      },
                      onSuccess: () => {
                        setIsGoogleAuthenticating(false);
                      },
                    }
                  );
                } else {
                  setIsGoogleAuthenticating(false);
                }
              }}
              onError={() => {
                setIsGoogleAuthenticating(false);
                addToast({ title: "Google Login Failed", description: "Could not connect to Google", type: "error" });
              }}
              width="100%"
              theme="outline"
              size="large"
              shape="rectangular"
            />
          </div>

          <GoogleAuthIndicator
            isLoading={isAuthOverlayOpen}
            onCancel={() => setIsGoogleAuthenticating(false)}
          />
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
                autoComplete="current-password"
                {...register("password")}
                error={errors.password?.message as string}
                className="bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-background"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-accent hover:text-accent/80 transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <Button type="submit" width="auth" size="md" loading={isPending} loadingText="Signing in…" disabled={isPending} className="shadow-md hover:shadow-lg transition-all">
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
    </GoogleOAuthProvider>
  );
}
