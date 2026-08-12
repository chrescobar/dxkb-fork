import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { encodeWorkspaceSegment } from "@/lib/services/workspace/path-utils";

export default async function WorkspacePage() {
  const { userId } = await getSession();
  if (userId) {
    redirect(`/workspace/${encodeWorkspaceSegment(userId)}/home`);
  }

  return null;
}
