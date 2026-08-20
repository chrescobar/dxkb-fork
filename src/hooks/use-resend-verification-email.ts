"use client";

import { toast } from "sonner";
import { useAuthActions } from "@/lib/auth/provider";

export function useResendVerificationEmail(): () => Promise<void> {
  const { sendVerificationEmail } = useAuthActions();

  return async () => {
    try {
      await sendVerificationEmail();
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to send verification email");
    }
  };
}
