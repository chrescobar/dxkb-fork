"use client";

import React from "react";
import { useTheme } from "next-themes";
import { getThemeContent, type ContentType } from "@/styles/theme-content";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMounted } from "@/hooks/use-is-mounted";

interface ThemeContentProps {
  type: ContentType;
  className?: string;
  as?: React.ElementType;
}

export function ThemeContent({
  type,
  className,
  as: Component = "span",
}: ThemeContentProps) {
  const mounted = useIsMounted();
  const { theme } = useTheme();

  // During SSR and initial render, always use the default theme
  // This prevents hydration mismatch
  const currentTheme = mounted ? theme : "dxkb-light";
  const content = getThemeContent(currentTheme || "dxkb-light", type);

  if (!mounted) {
    return (
      <Skeleton className="w-3xl h-8 mx-auto justify-center items-center" aria-label="Content loading" />
    );
  }

  return (
    <Component className={className}>
      {content}
    </Component>
  );
}

export default ThemeContent;