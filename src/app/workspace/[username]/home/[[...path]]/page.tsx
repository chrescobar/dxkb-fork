import { redirect } from "next/navigation";
import { WorkspaceBrowser } from "@/components/workspace/workspace-browser";
import { getRequiredEnv } from "@/lib/env";

interface WorkspaceHomePageProps {
  params: Promise<{ username?: string; path?: string[] }>;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function WorkspaceHomePage({ params }: WorkspaceHomePageProps) {
  const resolved = await params;
  const username = safeDecode(resolved.username ?? "");
  const segments = resolved.path ?? [];
  const decodedPath = segments.map((s) => safeDecode(s)).join("/");

  if (!username) {
    redirect("/workspace/home");
  }

  const workspaceGuideUrl = getRequiredEnv("WORKSPACE_GUIDE_URL");
  return (
    <WorkspaceBrowser
      mode="home"
      username={username}
      path={decodedPath}
      workspaceGuideUrl={workspaceGuideUrl}
    />
  );
}
