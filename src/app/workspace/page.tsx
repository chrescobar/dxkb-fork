import { redirect } from "next/navigation";
import { requireAuthSessionOrRedirect } from "@/lib/auth/server/route";
import { encodeWorkspaceSegment } from "@/lib/services/workspace/path-utils";

export default async function WorkspacePage() {
  const { userId } = await requireAuthSessionOrRedirect("/workspace");
  redirect(`/workspace/${encodeWorkspaceSegment(userId)}/home`);
}
