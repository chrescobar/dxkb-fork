import { GeneraCard } from "@/components/organisms/genera-grid/genera-card";

import { virusFamilies } from "./virus-families-data";

function familyHref(taxonId: number) {
  return `https://www.bv-brc.org/view/Taxonomy/${taxonId}#view_tab=overview`;
}

export function VirusFamiliesSection() {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">
          Virus Families
        </h2>
        <p className="text-muted-foreground text-base">
          Common viral family groupings organized by genome type.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {virusFamilies.map((column, index) => (
          <div
            key={column.group ?? `mixed-${index}`}
            className="flex min-w-0 flex-col gap-3"
          >
            {column.group === null ? (
              column.subGroups.map((subGroup) => (
                <div key={subGroup.label} className="flex flex-col gap-3">
                  <h3 className="text-muted-foreground px-0.5 text-sm font-semibold">
                    {subGroup.label}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {subGroup.families.map((family) => (
                      <GeneraCard
                        key={family.name}
                        name={family.name}
                        href={familyHref(family.taxonId)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <>
                <h3 className="text-muted-foreground px-0.5 text-sm font-semibold">
                  {column.group}
                </h3>
                <div className="flex flex-col gap-2">
                  {column.families.map((family) => (
                    <GeneraCard
                      key={family.name}
                      name={family.name}
                      href={familyHref(family.taxonId)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
