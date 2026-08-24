import { redirect } from "next/navigation";
import { requireAuthSessionOrRedirect } from "@/lib/auth/server/route";
import { encodeWorkspaceSegment } from "@/lib/services/workspace/path-utils";

export default async function WorkspaceHomeRedirect({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const encodedPath = path.map(encodeWorkspaceSegment).join("/");
  const pathPart = encodedPath ? `/${encodedPath}` : "";
  const requestedPath = `/workspace/home${pathPart}`;
  const { userId } = await requireAuthSessionOrRedirect(requestedPath);
  redirect(`/workspace/${encodeWorkspaceSegment(userId)}/home${pathPart}`);
}
