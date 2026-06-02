import type { ReactNode } from "react";

const DBStatisticsShell = ({ children }: { children: ReactNode }) => {
  return (
    <section className="py-12 bg-primary text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">Database Statistics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {children}
        </div>
      </div>
    </section>
  );
};

export default DBStatisticsShell;
