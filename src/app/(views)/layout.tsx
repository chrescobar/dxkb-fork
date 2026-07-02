import type { ReactNode } from "react";

import Navbar from "@/components/navbars/navbar";
import { LegacyHashAdapter } from "@/lib/views/legacy-hash-adapter";

export default function ViewsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <LegacyHashAdapter />
      <Navbar />
      <main className="flex min-h-0 grow flex-col bg-muted/30 pt-4">{children}</main>
    </div>
  );
}
