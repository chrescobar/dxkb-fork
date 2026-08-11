import Navbar from "@/components/navbars/navbar";

export default function OrganismsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <main className="flex min-h-0 grow flex-col bg-muted/30 pt-4">{children}</main>
    </div>
  );
}
