import Navbar from "@/components/navbars/navbar";
import Footer from "@/components/footers/footer";
import "./bacteria.css";

export const metadata = {
  title: "Bacteria · DXKB",
  description: "Browse the bacterial taxonomy, genome statistics, and curated AMR data in DXKB.",
};

export default function BacteriaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="bacteria-page grow flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
