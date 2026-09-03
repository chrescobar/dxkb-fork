import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CollectionState } from "@/lib/views/collection-state";
import { ProteinStructureResourceCollection } from "../protein-structure-resource-collection";

const { setUrlState } = vi.hoisted(() => ({ setUrlState: vi.fn() }));

const urlState: CollectionState = {
  filters: {},
  page: 1,
  sort: "unsorted",
};
const changedState: CollectionState = {
  filters: {},
  keyword: "kinase",
  page: 3,
  sort: "pdb_id:asc",
};

vi.mock("@/hooks/views/use-collection-url-state", () => ({
  useCollectionUrlState: () => [urlState, setUrlState],
}));

vi.mock("../resource-collection", () => ({
  ResourceCollection: ({
    state,
    onStateChange,
  }: {
    state: CollectionState;
    onStateChange: (state: CollectionState) => void;
  }) => (
    <div>
      <output data-testid="collection-state">{JSON.stringify(state)}</output>
      <button
        onClick={() => {
          onStateChange(changedState);
        }}
      >
        Change state
      </button>
    </div>
  ),
}));

describe("ProteinStructureResourceCollection", () => {
  it("keeps URL-backed state handling when initialized with collection state", async () => {
    const initialState: CollectionState = {
      filters: {},
      page: 1,
      refine: "initial",
      sort: "unsorted",
    };
    render(<ProteinStructureResourceCollection initialState={initialState} />);

    await userEvent.click(screen.getByRole("button", { name: "Change state" }));

    expect(screen.getByTestId("collection-state")).toHaveTextContent(
      JSON.stringify(initialState),
    );
    expect(setUrlState).toHaveBeenCalledWith(changedState);
  });

  it("keeps URL-backed state handling without initial state", async () => {
    render(<ProteinStructureResourceCollection />);

    await userEvent.click(screen.getByRole("button", { name: "Change state" }));

    expect(setUrlState).toHaveBeenCalledWith(changedState);
  });
});
