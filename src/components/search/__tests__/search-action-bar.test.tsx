import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchActionBar, notReady } from "../search-action-bar";

describe("SearchActionBar (taxonomy)", () => {
  describe("maxSelection", () => {
    it("shows single-select-only actions when exactly one row is selected", () => {
      render(<SearchActionBar selectedCount={1} searchType="taxonomy" />);
      expect(
        screen.queryByRole("button", { name: /taxon\s*overview/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /features/i }),
      ).toBeInTheDocument();
    });

    it("hides single-select-only actions when more than one row is selected", () => {
      render(<SearchActionBar selectedCount={2} searchType="taxonomy" />);
      // taxonOverview + features are maxSelection:1 → hidden on multi
      expect(
        screen.queryByRole("button", { name: /taxon\s*overview/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /features/i }),
      ).not.toBeInTheDocument();
      // genomes has no maxSelection → still visible on multi
      expect(
        screen.queryByRole("button", { name: /genomes/i }),
      ).toBeInTheDocument();
    });

    it("hides selection-dependent actions when nothing is selected", () => {
      render(
        <SearchActionBar
          selectedCount={0}
          searchType="taxonomy"
          guideUrl="https://example.test/guide"
        />,
      );
      expect(
        screen.queryByRole("button", { name: /genomes/i }),
      ).not.toBeInTheDocument();
      // Guide is always shown (no selection required)
      expect(
        screen.queryByRole("button", { name: /guide/i }),
      ).toBeInTheDocument();
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
      expect(
        screen.getByRole("button", { name: /taxon\s*overview/i }),
      ).toBeDisabled();
    });

    it("leaves an action enabled when no reason is passed for it", () => {
      render(<SearchActionBar selectedCount={1} searchType="taxonomy" />);
      // taxonOverview has no module-level disable and no consumer disable → enabled
      expect(
        screen.getByRole("button", { name: /taxon\s*overview/i }),
      ).not.toBeDisabled();
    });
  });

  describe("ppi (interactions)", () => {
    it("shows COPY, SERVICES, FEATURES, FASTA, and GROUP disabled with the not-ready tooltip", () => {
      render(<SearchActionBar selectedCount={2} searchType="ppi" />);
      for (const name of [
        /copy/i,
        /services/i,
        /features/i,
        /fasta/i,
        /group/i,
      ]) {
        expect(screen.getByRole("button", { name })).toBeDisabled();
      }
    });

    it("does not fire onAction when clicking a disabled ppi action", async () => {
      const onAction = vi.fn();
      render(
        <SearchActionBar
          selectedCount={1}
          searchType="ppi"
          onAction={onAction}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: /fasta/i }));
      expect(onAction).not.toHaveBeenCalled();
    });

    it("shows the not-ready tooltip text on hover for the new ppi actions", async () => {
      const user = userEvent.setup();
      render(<SearchActionBar selectedCount={1} searchType="ppi" />);
      await user.hover(screen.getByRole("button", { name: /fasta/i }));
      expect(await screen.findAllByText(notReady)).not.toHaveLength(0);
    });

    it("does not leak ppi-only actions (FASTA, GROUP, ppiFeatures) into unrelated search types", () => {
      render(<SearchActionBar selectedCount={1} searchType="epitope" />);
      expect(
        screen.queryByRole("button", { name: /fasta/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /group/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^features$/i }),
      ).not.toBeInTheDocument();
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
        <SearchActionBar
          selectedCount={1}
          searchType="taxonomy"
          onAction={onAction}
        />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: /taxon\s*overview/i }),
      );
      expect(onAction).toHaveBeenCalledWith("taxonOverview");
    });

    it("enables the Genome action for one selected genome", async () => {
      const onAction = vi.fn();
      render(
        <SearchActionBar
          selectedCount={1}
          searchType="genome"
          onAction={onAction}
        />,
      );

      const button = screen.getByRole("button", { name: /^ggenome$/i });
      expect(button).not.toBeDisabled();
      await userEvent.click(button);
      expect(onAction).toHaveBeenCalledWith("genome");
    });

    it("hides the single-row Genome action for multiple selections", () => {
      render(<SearchActionBar selectedCount={2} searchType="genome" />);
      expect(
        screen.queryByRole("button", { name: /^ggenome$/i }),
      ).not.toBeInTheDocument();
    });
  });
});
