import { FeaturedGeneraCard } from "./featured-genera-card";
import { featuredGenera } from "./featured-genera-data";

export function FeaturedGeneraGrid() {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">
          Featured Genera
        </h2>
        <p className="text-muted-foreground text-base">
          Curated genera of biodefense and infectious disease relevance.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
        {featuredGenera.map((genus) => (
          <FeaturedGeneraCard
            key={genus.name}
            name={genus.name}
            taxonId={genus.taxonId}
          />
        ))}
      </div>
    </section>
  );
}
