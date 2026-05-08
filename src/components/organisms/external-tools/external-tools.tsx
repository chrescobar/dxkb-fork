import { ExternalLink } from "lucide-react";
import Link from "next/link";

import type { ExternalToolResource } from "@/components/organisms/types";
import { Card } from "@/components/ui/card";

export function ExternalTools({
  resources,
}: {
  resources: readonly ExternalToolResource[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">
          External Tools
        </h2>
        <p className="text-muted-foreground text-sm">
          Related organism resources.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2">
        {resources.map((resource) => (
          <Card
            key={resource.href}
            className="gap-0 rounded-md py-0 shadow-none"
          >
            <Link
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted/40 flex min-h-16 items-start gap-3 px-3 py-3 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="line-clamp-3 text-sm leading-tight font-semibold">
                  {resource.label}
                </h3>
                {resource.description && (
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-tight">
                    {resource.description}
                  </p>
                )}
              </div>
              <ExternalLink
                size={14}
                className="text-muted-foreground/50 mt-0.5 shrink-0"
                aria-hidden="true"
              />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
