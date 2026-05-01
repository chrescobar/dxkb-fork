import { Suspense } from "react";

import Footer from "@/components/footers/footer";
import NewsCarousel from "@/components/ui/news-carousel";
import WelcomeSearch from "@/components/search/welcome-search";
import Navbar from "@/components/navbars/navbar";
import QuickViralLinks from "@/components/quick-links/quick-viral";
import ResearchUpdates from "@/components/research/research-updates";
import DBStatistics from "@/components/statistics/db-statistics";
import DBStatisticsSkeleton from "@/components/statistics/db-statistics-skeleton";

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar />

      <main className="bg-background grow">
        <WelcomeSearch />
        <NewsCarousel />
        <QuickViralLinks />
        <Suspense fallback={<DBStatisticsSkeleton />}>
          <DBStatistics />
        </Suspense>
        <ResearchUpdates />
      </main>

      <Footer />
    </div>
  );
}
