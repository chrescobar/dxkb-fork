import Navbar from "@/components/navbars/navbar";
import Footer from "@/components/footers/footer";
import { WorkspacePanelProvider } from "@/contexts/workspace-panel-context";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <WorkspacePanelProvider>
        <main className="flex flex-col">{children}</main>
      </WorkspacePanelProvider>
      <Footer />
    </div>
  );
}
