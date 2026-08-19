import type { ReactNode } from "react";

export function MobileSubSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center py-2.5">
      <span className="flex flex-1 items-center gap-1.5 text-sm font-semibold text-foreground/85">
        {children}
      </span>
    </div>
  );
}
