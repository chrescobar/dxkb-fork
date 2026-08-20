import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/server/route";
import { encodeWorkspaceSegment } from "@/lib/services/workspace/path-utils";

export default async function WorkspacePage() {
  const { userId } = await requireAuthSession();
  if (userId) {
    redirect(`/workspace/${encodeWorkspaceSegment(userId)}/home`);
  }

  return null;
}
