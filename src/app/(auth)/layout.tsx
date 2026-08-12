import Navbar from "@/components/navbars/navbar";
import Footer from "@/components/footers/footer";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await getSession();
  if (userId) redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex grow py-8">
        <div className="auth-container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
