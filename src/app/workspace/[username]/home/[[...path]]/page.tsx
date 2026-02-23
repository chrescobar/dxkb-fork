import { use } from "react";
import { WorkspaceBrowser } from "@/components/workspace/workspace-browser";

interface WorkspaceHomePageProps {
  params: Promise<{ path?: string[] }>;
}

export default function WorkspaceHomePage({ params }: WorkspaceHomePageProps) {
  const { path: segments } = use(params);
  const decodedPath = (segments ?? [])
    .map(decodeURIComponent)
    .join("/");

  return <WorkspaceBrowser path={decodedPath} />;
}
