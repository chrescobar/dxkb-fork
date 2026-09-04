import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FeatureViewRecord } from "@/lib/feature-view";
import type { GenomeViewRecord } from "@/lib/genome-view";
import type { CollectionState } from "@/lib/views/collection-state";
import { FeatureMember } from "@/app/(views)/feature/[featureId]/feature-member";
import { GenomeMember } from "@/app/(views)/genome/[genomeId]/genome-member";
import { ResourceChildCollection } from "../resource-child-collection";
import type { ResourceCollectionProfile } from "../resource-collection";

const { exportAll, resourceCollectionProfile } = vi.hoisted(() => ({
  exportAll: vi.fn().mockResolvedValue({ rows: [] }),
  resourceCollectionProfile: vi.fn(),
}));

vi.mock("@/lib/data-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/data-api")>()),
  DataRepository: class {
    exportAll = exportAll;
  },
}));

vi.mock("@/components/views/entity-view-shell", () => ({
  EntityViewShell: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("../resource-collection", () => ({
  ResourceCollection: ({
    profile,
    state,
    onStateChange,
    onExport,
  }: {
    profile: ResourceCollectionProfile<Record<string, unknown>>;
    state: CollectionState;
    onStateChange: (state: CollectionState) => void;
    onExport: (request: {
      format: "csv";
      fields: null;
      rql: string;
    }) => Promise<void>;
  }) => {
    resourceCollectionProfile(profile);
    return (
      <div>
        <output data-testid="collection-state">{JSON.stringify(state)}</output>
        <button
          onClick={() => {
            onStateChange({
              filters: { status: ["active"] },
              page: 4,
              sort: "custom:desc",
            });
          }}
        >
          Change collection state
        </button>
        <button
          onClick={() =>
            void onExport({ format: "csv", fields: null, rql: "" })
          }
        >
          Export all
        </button>
      </div>
    );
  },
}));

const changedState = {
  filters: { status: ["active"] },
  page: 4,
  sort: "custom:desc",
};

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => vi.unstubAllGlobals());

async function changeCollectionState() {
  await userEvent.click(
    screen.getByRole("button", { name: "Change collection state" }),
  );
  expect(screen.getByTestId("collection-state")).toHaveTextContent(
    JSON.stringify(changedState),
  );
}

describe("ResourceChildCollection scope changes", () => {
  it("keeps a filtered Bioset collection scoped to its experiment", () => {
    render(
      <ResourceChildCollection
        resource="bioset"
        label="Biosets"
        idField="bioset_id"
        rql="eq(exp_id,experiment-1)"
        defaultSort="bioset_id:asc"
      />,
    );

    const profile = resourceCollectionProfile.mock.lastCall?.[0] as
      | ResourceCollectionProfile<Record<string, unknown>>
      | undefined;
    expect(profile?.basePredicate).toBe("eq(exp_id,experiment-1)");
    expect(
      profile?.buildStructuralRql?.({
        filters: { bioset_type: ["Differential Expression"] },
        page: 1,
        sort: "bioset_id:asc",
      }),
    ).toBe(
      'and(eq(exp_id,experiment-1),eq(bioset_type,"Differential%20Expression"))',
    );
  });

  it("resets state when FeatureMember switches child tabs", async () => {
    const feature = {
      feature_id: "feature-1",
      patric_id: "fig|feature-1",
    } as FeatureViewRecord;
    const { rerender } = render(
      <FeatureMember feature={feature} activeTab="interactions" />,
    );
    await changeCollectionState();

    rerender(<FeatureMember feature={feature} activeTab="domains" />);

    expect(screen.getByTestId("collection-state")).toHaveTextContent(
      JSON.stringify({ filters: {}, page: 1, sort: "unsorted" }),
    );
  });

  it("resets state when GenomeMember switches child tabs", async () => {
    const genome = {
      genome_id: "genome-1",
      genome_name: "Genome 1",
    } as GenomeViewRecord;
    const { rerender } = render(
      <GenomeMember genome={genome} activeTab="features" />,
    );
    await changeCollectionState();

    rerender(<GenomeMember genome={genome} activeTab="proteins" />);

    expect(screen.getByTestId("collection-state")).toHaveTextContent(
      JSON.stringify({ filters: {}, page: 1, sort: "patric_id:asc" }),
    );
  });

  it("omits sorting when exporting an unsorted child collection", async () => {
    const genome = {
      genome_id: "genome-1",
      genome_name: "Genome 1",
    } as GenomeViewRecord;
    render(<GenomeMember genome={genome} activeTab="domains" />);

    await userEvent.click(screen.getByRole("button", { name: "Export all" }));

    expect(exportAll).toHaveBeenCalledWith(
      "protein_feature",
      expect.objectContaining({ sort: undefined }),
    );
  });
});
