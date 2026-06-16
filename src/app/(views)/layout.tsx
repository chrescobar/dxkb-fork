// src/app/(views)/layout.tsx
import type { ReactNode } from "react";

import { LegacyHashAdapter } from "@/lib/views/legacy-hash-adapter";

export default function ViewsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LegacyHashAdapter />
      {children}
    </>
  );
}
