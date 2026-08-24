import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/server/route";
import { ensureUserWorkspace } from "@/lib/services/workspace/setup";
import { createServerWorkspaceRpc } from "@/lib/services/workspace/server-rpc";
import { getDefaultRealm } from "@/lib/services/workspace/realm";

export const POST = withAuth(async (_request, { token, userId, realm }) => {
  const result = await ensureUserWorkspace({
    rpc: createServerWorkspaceRpc(token),
    userId,
    realm: realm ?? getDefaultRealm(),
  });
  return NextResponse.json({ success: true, ...result });
});
