import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FeatureViewRecord } from "@/lib/feature-view";
import type { GenomeViewRecord } from "@/lib/genome-view";
import type { CollectionState } from "@/lib/views/collection-state";
import { FeatureMember } from "@/app/(views)/feature/[featureId]/feature-member";
import { GenomeMember } from "@/app/(views)/genome/[genomeId]/genome-member";

const { exportAll } = vi.hoisted(() => ({
  exportAll: vi.fn().mockResolvedValue({ rows: [] }),
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
    state,
    onStateChange,
    onExport,
  }: {
    state: CollectionState;
    onStateChange: (state: CollectionState) => void;
    onExport: (request: {
      format: "csv";
      fields: null;
      rql: string;
    }) => Promise<void>;
  }) => (
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
        onClick={() => void onExport({ format: "csv", fields: null, rql: "" })}
      >
        Export all
      </button>
    </div>
  ),
}));

const changedState = {
  filters: { status: ["active"] },
  page: 4,
  sort: "custom:desc",
};

async function changeCollectionState() {
  await userEvent.click(
    screen.getByRole("button", { name: "Change collection state" }),
  );
  expect(screen.getByTestId("collection-state")).toHaveTextContent(
    JSON.stringify(changedState),
  );
}

describe("ResourceChildCollection scope changes", () => {
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
