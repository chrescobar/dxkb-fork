"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";

interface SerologyErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function SerologyErrorContent({ error, reset }: SerologyErrorProps) {
  return (
    <div
      className="m-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6"
      role="alert"
    >
      <h1 className="text-lg font-semibold">
        Serology view could not be loaded
      </h1>
      <p className="my-2 text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}

export default function SerologyError(props: SerologyErrorProps) {
  return (
    <Suspense fallback={<SerologyErrorContent {...props} />}>
      <SerologyErrorContent {...props} />
    </Suspense>
  );
}
