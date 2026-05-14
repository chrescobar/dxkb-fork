import type { FeaturedOrganismCategory } from "./featured-all-organisms-data";
import { GeneraCard } from "./genera-card";

interface FeaturedOrganismCategoriesGridProps {
  categories: FeaturedOrganismCategory[];
  title?: string;
  subtitle?: string;
}

export function FeaturedOrganismCategoriesGrid({
  categories,
  title = "Featured Organisms",
  subtitle,
}: FeaturedOrganismCategoriesGridProps) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-base">{subtitle}</p>}
      </div>
      <div className="flex flex-col gap-5">
        {categories.map((cat) => (
          <div key={cat.title} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              {cat.title}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2">
              {cat.organisms.map((org) => (
                <GeneraCard key={org.name} name={org.name} href={org.href} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
