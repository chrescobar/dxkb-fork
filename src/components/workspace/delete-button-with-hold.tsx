"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface DeleteButtonWithHoldProps {
  isDeleting: boolean;
  holdProgress: number;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

export function DeleteButtonWithHold({
  isDeleting,
  holdProgress,
  onHoldStart,
  onHoldEnd,
}: DeleteButtonWithHoldProps) {
  return (
    <Button
      variant="destructive"
      disabled={isDeleting}
      className="relative overflow-hidden"
      onMouseDown={(e) => {
        if (isDeleting) return;
        e.preventDefault();
        onHoldStart();
      }}
      onMouseUp={onHoldEnd}
      onMouseLeave={onHoldEnd}
      onTouchStart={(e) => {
        if (isDeleting) return;
        e.preventDefault();
        onHoldStart();
      }}
      onTouchEnd={onHoldEnd}
    >
      <span
        className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-75 ease-linear"
        style={{ width: `${holdProgress}%` }}
        aria-hidden
      />
      <span className="relative z-10 flex flex-row items-center gap-1">
        {isDeleting ? (
          <>
            <Spinner className="mr-2 h-3.5 w-3.5 shrink-0" />
            Deleting…
          </>
        ) : (
          "Hold to delete"
        )}
      </span>
    </Button>
  );
}
