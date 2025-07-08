"use client";

import Navbar from "@/components/navbars/navbar";
import Footer from "@/components/footers/footer";
// import { AuthProvider, useAuth } from "@/contexts/auth-context";

interface ServiceLayoutProps {
  children: React.ReactNode;
}

export default function ServicesLayout({
  children,
}: ServiceLayoutProps) {
  // const { isAuthenticated } = useAuth();
  // console.log("isAuthenticated", isAuthenticated);
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow flex py-8">
        <div className="service-container container">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}