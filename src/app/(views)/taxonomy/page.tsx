// src/app/(views)/taxonomy/page.tsx
import { makeListPage } from "@/lib/views/page-factory";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";
export default makeListPage(viewRegistry.taxonomy);
