"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useAuthActions } from "@/lib/auth/provider";
import { toast } from "sonner";

export function SuBanner() {
  const { isImpersonating, user } = useAuth();
  const { exitImpersonation } = useAuthActions();
  const suExit = async () => {
    try {
      await exitImpersonation();
      toast.success("Returned to your account");
    } catch {
      toast.error("Failed to exit impersonation");
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="bg-accent text-accent-foreground flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium">
      <ShieldAlert className="size-4 shrink-0" />
      <span>
        You are impersonating <strong>{user?.username}</strong>.
      </span>
      <Button
        variant="outline"
        size="sm"
        className="border-accent-foreground/30 hover:bg-accent-foreground/10 ml-1 h-6 bg-transparent px-2 text-xs"
        onClick={() => void suExit()}
      >
        Exit SU
      </Button>
    </div>
  );
}
