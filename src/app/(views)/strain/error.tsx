"use client";

import { Button } from "@/components/ui/button";

interface StrainErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StrainError({ error, reset }: StrainErrorProps) {
  return (
    <div
      className="border-destructive/40 bg-destructive/5 m-4 rounded-lg border p-6"
      role="alert"
    >
      <h1 className="text-lg font-semibold">Strain view could not be loaded</h1>
      <p className="text-muted-foreground my-2 text-sm">{error.message}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
