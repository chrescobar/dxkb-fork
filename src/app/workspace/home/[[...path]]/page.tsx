import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/server/route";
import { encodeWorkspaceSegment } from "@/lib/services/workspace/path-utils";

export default async function WorkspaceHomeRedirect({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const [{ userId }, { path = [] }] = await Promise.all([
    requireAuthSession(),
    params,
  ]);
  if (userId) {
    const encodedPath = path.map(encodeWorkspaceSegment).join("/");
    const pathPart = encodedPath ? `/${encodedPath}` : "";
    redirect(`/workspace/${encodeWorkspaceSegment(userId)}/home${pathPart}`);
  }

  return null;
}
