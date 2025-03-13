"use client";

import React from "react";

import Footer from "@/components/footers/footer";
import News from "@/components/ui/news";
import QuickLinks from "@/components/ui/quick-links";
import Hero from "@/components/ui/hero";
import NavbarNoSearch from "@/components/navbars/navbar-no-search";

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarNoSearch />

      <main className="grow">
        <Hero />
        {/* <QuickLinks /> */}
        <News />
      </main>

      <Footer />
    </div>
  );
}