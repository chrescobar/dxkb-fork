"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function OrganismsError({
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
    <section className="mx-auto flex min-h-96 w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Organisms</p>
      <h1 className="text-2xl font-bold tracking-tight">Organism data is temporarily unavailable</h1>
      <p className="max-w-xl text-muted-foreground">
        We could not load the taxonomy data needed for this page. Please try again.
      </p>
      <Button type="button" onClick={reset}>Try again</Button>
    </section>
  );
}
