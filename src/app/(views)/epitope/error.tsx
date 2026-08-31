"use client";

import { Button } from "@/components/ui/button";

interface EpitopeErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EpitopeError({ error, reset }: EpitopeErrorProps) {
  return (
    <div className="m-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6" role="alert">
      <h1 className="text-lg font-semibold">Epitope view could not be loaded</h1>
      <p className="my-2 text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={reset}>Try again</Button>
    </div>
  );
}
