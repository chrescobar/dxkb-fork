import Navbar from "@/components/navbars/navbar";
import Footer from "@/components/footers/footer";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex grow py-8">
        <div className="container mx-auto max-w-2xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
