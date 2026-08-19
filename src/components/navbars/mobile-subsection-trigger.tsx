import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { CollapsibleTrigger } from "@/components/ui/collapsible";

export function MobileSubSectionTrigger({ children }: { children: ReactNode }) {
  return (
    <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md py-2.5 pr-1 transition-colors hover:text-secondary">
      <span className="text-left text-[13px] font-semibold text-foreground/85 transition-colors group-hover:text-secondary group-data-open:text-foreground">
        {children}
      </span>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-secondary/60 group-data-open:rotate-180" />
    </CollapsibleTrigger>
  );
}
