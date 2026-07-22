import { makeSingularPage } from "@/lib/views/page-factory";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";
export default makeSingularPage(viewRegistry.epitope, "epitopeId");
