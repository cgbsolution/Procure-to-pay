"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth";
import type { LoginResponse } from "@/types/api";

const loginSchema = z.object({
  // Lenient (not .email()) so internal/dev accounts like *.local can sign in;
  // the backend authenticates by identifier lookup.
  email: z.string().min(3, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    try {
      // Hit the BFF, which sets the httpOnly refresh cookie and returns access + user.
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        json: values,
        skipAuth: true,
      });

      login(data.access_token, data.user);

      // Route groups don't add URL segments, so the two portals use distinct
      // path prefixes: client at /dashboard, vendor at /vendor/dashboard.
      const dest =
        data.user.user_type === "vendor"
          ? "/vendor/dashboard"
          : "/dashboard";
      router.replace(dest);
    } catch (err) {
      if (err instanceof ApiError) {
        // Map field-level details onto the form when present.
        for (const d of err.details) {
          if (d.field === "email" || d.field === "password") {
            setError(d.field, { message: d.message });
          }
        }
        toast.error("Sign in failed", { description: err.message });
      } else {
        toast.error("Something went wrong", {
          description: "Please try again.",
        });
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LogIn className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Sign in to ProcureFlow</CardTitle>
          <CardDescription>
            Enter your credentials to access your portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-danger-foreground">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                {...register("password")}
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="text-xs text-danger-foreground"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="navy"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
