"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/hooks";
import { authAccount } from "@/lib/auth/advanced";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { redirectAfterAuth } from "../redirect-action";
import { AlertCircle, Loader2 } from "lucide-react";
import { SignupPasswordFields, SignupProfileFields } from "./sign-up-fields";
import { useSignupForm } from "./use-signup-form";

function SignupForm() {
  const [error, setError] = useState("");
  const { status } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = status === "loading" || isSubmitting;
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const form = useSignupForm(async (value) => {
    setIsSubmitting(true);
    const { error: signUpError } = await authAccount
      .signUp(value)
      .finally(() => {
        setIsSubmitting(false);
      });
    if (signUpError) {
      setError(signUpError.message || "Sign up failed. Please try again.");
      return;
    }
    toast.success("Account created successfully. Welcome to DXKB!", {
      closeButton: true,
    });
    await redirectAfterAuth(redirectTo);
  });

  return (
    <div className="flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={() => {
              void form.handleSubmit();
            }}
            className="space-y-4"
          >
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <SignupProfileFields form={form} disabled={isLoading} />
            <SignupPasswordFields form={form} />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-center text-2xl font-bold">
                Create an account
              </CardTitle>
              <CardDescription className="text-center">
                Loading...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
