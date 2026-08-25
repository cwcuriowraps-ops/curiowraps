"use client";

import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription, useToast } from "@dashboard/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/useAuthStore";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter a valid email address." })
    .email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        addToast({
          title: "Session Expired ⚠️",
          description: "Your session has expired. Please log in again.",
          type: "warning",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [addToast]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onInvalidForm = (formErrors: typeof errors) => {
    if (formErrors.email?.message) {
      addToast({
        title: "Validation Error",
        description: formErrors.email.message,
        type: "warning",
      });
    } else if (formErrors.password?.message) {
      addToast({
        title: "Validation Error",
        description: formErrors.password.message,
        type: "warning",
      });
    }
  };

  const onSubmit = async (data: LoginForm) => {
    if (isLoading) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      addToast({
        title: "Connection Error 🔌",
        description: "Unable to connect. Please check your internet connection.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient<{ data?: { user: any; accessToken: string; refreshToken?: string }; user?: any; accessToken?: string; refreshToken?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const authData = response?.data || response;
      const user = authData?.user;
      const accessToken = authData?.accessToken;
      const refreshToken = authData?.refreshToken;

      if (!user || !accessToken) {
        throw new Error("Invalid login response from server");
      }

      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        addToast({
          title: "Access Denied",
          description: "You do not have administrative privileges.",
          type: "error",
        });
        setIsLoading(false);
        setValue("password", "");
        return;
      }

      setAuth(accessToken, user, refreshToken);
      addToast({
        title: "Welcome back!",
        description: "Successfully logged in to the dashboard.",
        type: "success",
      });

      router.push("/");
    } catch (error: any) {
      setIsLoading(false);
      // Clear password ONLY on failed authentication response, retaining email
      setValue("password", "");

      const errorCode = error?.data?.error?.code || error?.code || "";
      const errorMsg = (error?.message || error?.data?.error?.message || "").toLowerCase();
      const status = error?.status || error?.statusCode || 0;

      if (!navigator.onLine || errorMsg.includes("failed to fetch") || errorMsg.includes("network")) {
        addToast({
          title: "Connection Error 🔌",
          description: "Unable to connect. Please check your internet connection.",
          type: "error",
        });
      } else if (errorCode === "TOO_MANY_REQUESTS" || status === 429 || errorMsg.includes("too many")) {
        addToast({
          title: "Rate Limit Exceeded ⏳",
          description: "Too many login attempts. Please try again later.",
          type: "error",
        });
      } else if (status === 401 || status === 404 || errorCode === "INVALID_CREDENTIALS" || errorCode === "ACCOUNT_NOT_FOUND" || errorCode === "INCORRECT_PASSWORD") {
        addToast({
          title: "Authentication Failed",
          description: "Invalid email or password.",
          type: "error",
        });
      } else if (status >= 500) {
        addToast({
          title: "Server Error ⚠️",
          description: "Something went wrong. Please try again later.",
          type: "error",
        });
      } else {
        addToast({
          title: "Login Failed",
          description: error.message || "Invalid email or password.",
          type: "error",
        });
      }
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center bg-background px-4 ${isLoading ? "cursor-wait" : ""}`}>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-xl shadow-accent/20 ring-4 ring-accent/10 mb-2 transition-transform hover:scale-105">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div className="flex flex-col space-y-1.5 text-center mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              Curio Wrap Admin
            </h1>
            <p className="text-sm text-text-secondary">
              Enter your email and password to access the dashboard
            </p>
          </div>
        </div>

        <Card className="border-border/80 bg-surface/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-xl font-bold text-text-primary">Welcome back</CardTitle>
            <CardDescription className="text-xs text-text-secondary">Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit, onInvalidForm)}
              className="space-y-5"
              aria-busy={isLoading}
              noValidate
            >
              <div className="space-y-4">
                <div>
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="admin@curiowrap.com"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                    {...register("email")}
                    error={errors.email?.message}
                    aria-invalid={Boolean(errors.email)}
                  />
                </div>
                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...register("password")}
                    error={errors.password?.message}
                    aria-invalid={Boolean(errors.password)}
                  />
                </div>
              </div>

              {/* Clean Sign In Button */}
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  width="auth"
                  loading={isLoading}
                  loadingText="Signing in…"
                  disabled={isLoading}
                  className="shadow-md shadow-accent/20 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  aria-disabled={isLoading}
                >
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
