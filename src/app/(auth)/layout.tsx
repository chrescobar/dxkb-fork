import Navbar from "@/components/navbars/navbar";
import Footer from "@/components/footers/footer";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server/actions";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Navbar />
      <main className="flex grow py-8">
        <div className="auth-container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
