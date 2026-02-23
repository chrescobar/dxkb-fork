"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceBreadcrumbsProps {
  path: string;
  username: string;
  itemCount?: number;
}

export function WorkspaceBreadcrumbs({
  path,
  username,
  itemCount,
}: WorkspaceBreadcrumbsProps) {
  const segments = path
    .split("/")
    .filter(Boolean);

  return (
    <nav aria-label="Workspace path" className="flex items-center gap-1 text-sm">
      <Link
        href="/workspace/home"
        className={cn(
          "flex items-center gap-1 font-medium transition-colors hover:text-foreground",
          segments.length === 0
            ? "text-foreground"
            : "text-muted-foreground",
        )}
      >
        <Home className="h-3.5 w-3.5" />
        <span>{username}</span>
      </Link>

      <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />

      <Link
        href="/workspace/home"
        className={cn(
          "font-medium transition-colors hover:text-foreground",
          segments.length === 0
            ? "text-foreground"
            : "text-muted-foreground",
        )}
      >
        home
      </Link>

      {segments.map((segment, index) => {
        const href =
          "/workspace/home/" +
          segments
            .slice(0, index + 1)
            .map(encodeURIComponent)
            .join("/");
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="text-muted-foreground h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-foreground font-medium">
                {decodeURIComponent(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground font-medium transition-colors hover:text-foreground"
              >
                {decodeURIComponent(segment)}
              </Link>
            )}
          </span>
        );
      })}

      {itemCount !== undefined && (
        <span className="text-muted-foreground ml-2 text-xs">
          ({itemCount} {itemCount === 1 ? "item" : "items"})
        </span>
      )}
    </nav>
  );
}
