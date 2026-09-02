"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DomainsAndMotifsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="m-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6"
      role="alert"
    >
      <h1 className="text-lg font-semibold">
        Domains and Motifs view could not be loaded
      </h1>
      <p className="my-2 text-sm text-muted-foreground">
        An unexpected error occurred while loading this view.
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
