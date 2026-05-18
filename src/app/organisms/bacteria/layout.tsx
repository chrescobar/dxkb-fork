import "./bacteria.css";

export const metadata = {
  title: "Bacteria · DXKB",
  description: "Browse the bacterial taxonomy, genome statistics, and curated AMR data in DXKB.",
};

export default function BacteriaLayout({ children }: { children: React.ReactNode }) {
  return <div className="bacteria-page flex grow flex-col">{children}</div>;
}
