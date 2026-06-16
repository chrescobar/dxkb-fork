import type { ReactNode } from "react";

import Footer from "@/components/footers/footer";
import Navbar from "@/components/navbars/navbar";
import { LegacyHashAdapter } from "@/lib/views/legacy-hash-adapter";

export default function ViewsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LegacyHashAdapter />
      <Navbar />
      <main className="flex grow bg-muted/30 py-4">{children}</main>
      <Footer />
    </div>
  );
}
