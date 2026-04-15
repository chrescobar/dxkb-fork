"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function SuBanner() {
  const { isImpersonating, user, suExit } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>
        You are impersonating{" "}
        <strong>{user?.username}</strong>.
      </span>
      <Button
        variant="outline"
        size="sm"
        className="ml-1 h-6 border-accent-foreground/30 bg-transparent px-2 text-xs hover:bg-accent-foreground/10"
        onClick={() => suExit()}
      >
        Exit SU
      </Button>
    </div>
  );
}
