import { render, screen } from "@testing-library/react";
import { InfoPanel } from "../info-panel";

// Workspace hooks are only invoked inside WorkspaceItemDetailContent (workspace variant).
// These tests only render the search variant, so no mock is needed.

describe("InfoPanel — search variant", () => {
  describe("loading state", () => {
    it("shows loading indicator when a single row is selected and data is loading", () => {
      render(
        <InfoPanel
          selectedIds={["genome-1"]}
          activeTab="genome"
          isLoading
        />,
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("does not show loading indicator when multiple rows are selected", () => {
      render(
        <InfoPanel
          selectedIds={["genome-1", "genome-2"]}
          activeTab="genome"
          isLoading
        />,
      );
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  describe("multi-selection display", () => {
    it("shows selected count when more than one row is selected", () => {
      render(
        <InfoPanel
          selectedIds={["genome-1", "genome-2"]}
          activeTab="genome"
        />,
      );
      expect(screen.getByText("2 rows selected")).toBeInTheDocument();
    });

    it("shows all-pages-selected message when isAllPagesSelected and totalItems are set", () => {
      render(
        <InfoPanel
          selectedIds={["genome-1", "genome-2"]}
          activeTab="genome"
          isAllPagesSelected
          totalItems={5000}
        />,
      );
      expect(screen.getByText("All 5,000 rows selected")).toBeInTheDocument();
    });

    it("falls back to count when isAllPagesSelected is true but totalItems is 0", () => {
      render(
        <InfoPanel
          selectedIds={["genome-1", "genome-2"]}
          activeTab="genome"
          isAllPagesSelected
          totalItems={0}
        />,
      );
      // totalItems is falsy → falls back to count
      expect(screen.getByText("2 rows selected")).toBeInTheDocument();
    });

    it("shows count for exactly one selected row without loading", () => {
      render(
        <InfoPanel
          selectedIds={["genome-1"]}
          activeTab="genome"
          isLoading={false}
          selectedRow={{ genome_id: "genome-1", genome_name: "Test Genome" }}
        />,
      );
      // Single row, not loading → renders field detail panel (not multi-select message)
      expect(screen.queryByText(/rows selected/)).not.toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });
});
