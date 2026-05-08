import Footer from "@/components/footers/footer";
import Navbar from "@/components/navbars/navbar";

export default function BacteriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="bg-muted/30 flex grow py-4">{children}</main>
      <Footer />
    </div>
  );
}
