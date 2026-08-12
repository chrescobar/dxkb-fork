import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface MobileNavLinkProps {
  href: string;
  target?: string;
  children: ReactNode;
}

export function MobileNavLink({ href, target, children }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      className="group/link flex items-center gap-2 rounded-md p-2 text-sm text-foreground/75 transition-colors hover:bg-secondary/8 hover:text-foreground"
    >
      {children}
      {target === "_blank" && (
        <ExternalLink className="size-3 text-muted-foreground transition-colors group-hover/link:text-secondary" />
      )}
    </Link>
  );
}
