import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchActionBar, notReady } from "../search-action-bar";

describe("SearchActionBar (taxonomy)", () => {
  describe("maxSelection", () => {
    it("shows single-select-only actions when exactly one row is selected", () => {
      render(<SearchActionBar selectedCount={1} searchType="taxonomy" />);
      expect(screen.queryByRole("button", { name: /taxon\s*overview/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /features/i })).toBeInTheDocument();
    });

    it("hides single-select-only actions when more than one row is selected", () => {
      render(<SearchActionBar selectedCount={2} searchType="taxonomy" />);
      // taxonOverview + features are maxSelection:1 → hidden on multi
      expect(screen.queryByRole("button", { name: /taxon\s*overview/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /features/i })).not.toBeInTheDocument();
      // genomes has no maxSelection → still visible on multi
      expect(screen.queryByRole("button", { name: /genomes/i })).toBeInTheDocument();
    });

    it("hides selection-dependent actions when nothing is selected", () => {
      render(<SearchActionBar selectedCount={0} searchType="taxonomy" />);
      expect(screen.queryByRole("button", { name: /genomes/i })).not.toBeInTheDocument();
      // Guide is always shown (no selection required)
      expect(screen.queryByRole("button", { name: /guide/i })).toBeInTheDocument();
    });
  });

  describe("disabledActions", () => {
    it("disables an action when the consumer passes a reason for it", () => {
      render(
        <SearchActionBar
          selectedCount={1}
          searchType="taxonomy"
          disabledActions={{ taxonOverview: notReady }}
        />,
      );
      expect(screen.getByRole("button", { name: /taxon\s*overview/i })).toBeDisabled();
    });

    it("leaves an action enabled when no reason is passed for it", () => {
      render(<SearchActionBar selectedCount={1} searchType="taxonomy" />);
      // taxonOverview has no module-level disable and no consumer disable → enabled
      expect(screen.getByRole("button", { name: /taxon\s*overview/i })).not.toBeDisabled();
    });
  });

  describe("callbacks", () => {
    afterEach(() => vi.restoreAllMocks());

    it("opens the guide URL in a new tab on Guide click", async () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      render(
        <SearchActionBar
          selectedCount={1}
          searchType="taxonomy"
          guideUrl="https://example.test/guide"
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: /guide/i }));
      expect(openSpy).toHaveBeenCalledWith(
        "https://example.test/guide",
        "_blank",
        "noopener,noreferrer",
      );
    });

    it("fires onAction with the action id for an enabled action", async () => {
      const onAction = vi.fn();
      render(
        <SearchActionBar selectedCount={1} searchType="taxonomy" onAction={onAction} />,
      );
      await userEvent.click(screen.getByRole("button", { name: /taxon\s*overview/i }));
      expect(onAction).toHaveBeenCalledWith("taxonOverview");
    });
  });
});
