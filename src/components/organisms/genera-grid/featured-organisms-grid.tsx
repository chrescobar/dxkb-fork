import { GeneraCard } from "./genera-card";

interface FeaturedOrganism {
  name: string;
  href: string;
}

interface FeaturedOrganismsGridProps {
  data: readonly FeaturedOrganism[];
  title?: string;
  subtitle?: string;
}

export function FeaturedOrganismsGrid({
  data,
  title = "Featured Organisms",
  subtitle = "Curated organisms of biodefense and infectious disease relevance.",
}: FeaturedOrganismsGridProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
        {subtitle && (
          <p className="text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
        {data.map((item) => (
          <GeneraCard key={item.name} name={item.name} href={item.href} />
        ))}
      </div>
    </section>
  );
}
