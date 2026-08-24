import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { WorkspaceBrowser } from "@/components/workspace/workspace-browser";
import { WorkspaceDataTable } from "@/components/workspace/workspace-file-table";
import { WorkspaceDialogProvider } from "@/contexts/workspace-dialog-context";
import { WorkspacePanelProvider } from "@/contexts/workspace-panel-context";
import { WorkspaceRepositoryProvider } from "@/contexts/workspace-repository-context";
import { InMemoryWorkspaceRepository } from "@/lib/services/workspace/adapters/in-memory-workspace-repository";

vi.mock("@/lib/auth/provider", () => ({
  useAuth: () => ({
    user: {
      id: "alice",
      username: "alice",
      realm: "bvbrc",
      email: "alice@example.test",
    },
    status: "authed",
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/services/workspace/favorites", () => ({
  loadFavorites: vi.fn().mockResolvedValue([]),
  toggleFavorite: vi.fn(),
}));

class ResizeObserverStub {
  observe() {
    return undefined;
  }

  unobserve() {
    return undefined;
  }

  disconnect() {
    return undefined;
  }
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

function makeWrapper(repository: InMemoryWorkspaceRepository) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <WorkspaceRepositoryProvider
          value={{ authenticated: repository, public: repository }}
        >
          <WorkspacePanelProvider>
            <WorkspaceDialogProvider>{children}</WorkspaceDialogProvider>
          </WorkspacePanelProvider>
        </WorkspaceRepositoryProvider>
      </QueryClientProvider>
    );
  };
}

describe("WorkspaceBrowser rendering", () => {
  it("throws when selection mode omits folder activation", () => {
    expect(() =>
      render(
        <WorkspaceDataTable
          items={[]}
          isLoading={false}
          path=""
          sort={{ field: "name", direction: "asc" }}
          onSortChange={vi.fn()}
          onSelect={vi.fn()}
        />,
      ),
    ).toThrow(
      "WorkspaceDataTable selection mode requires onItemDoubleClick so folders remain navigable",
    );
  });

  it("survives loading, filtering, selection, refresh, and repeated parent renders", async () => {
    const repository = new InMemoryWorkspaceRepository({
      directories: {
        "/alice@bvbrc/home": [
          { name: "alpha.txt", type: "txt", size: 1 },
          { name: ".hidden.txt", type: "txt", size: 2 },
        ],
      },
    });
    const Wrapper = makeWrapper(repository);
    const props = {
      mode: "home" as const,
      username: "alice@bvbrc",
      path: "",
      workspaceGuideUrl: "https://example.test/workspace-guide",
    };

    const { rerender } = render(<WorkspaceBrowser {...props} />, {
      wrapper: Wrapper,
    });

    const alphaRow = await screen.findByRole(
      "row",
      { name: /alpha\.txt/i },
      { timeout: 5_000 },
    );
    expect(screen.queryByText(".hidden.txt")).not.toBeInTheDocument();

    fireEvent.click(alphaRow);
    await waitFor(() => {
      expect(screen.getByRole("row", { name: /alpha\.txt/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
    expect(screen.getByRole("row", { name: /alpha\.txt/i })).toBe(alphaRow);

    fireEvent.change(screen.getByPlaceholderText(/search files/i), {
      target: { value: "missing" },
    });
    expect(
      screen.queryByRole("row", { name: /alpha\.txt/i }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search files/i), {
      target: { value: "" },
    });
    const restoredRow = await screen.findByRole(
      "row",
      { name: /alpha\.txt/i },
      { timeout: 5_000 },
    );
    expect(restoredRow).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: /^refresh$/i }));
    await waitFor(() => {
      expect(
        repository.calls.filter((call) => call.method === "listDirectory"),
      ).toHaveLength(2);
    });
    expect(
      await screen.findByRole(
        "row",
        { name: /alpha\.txt/i },
        { timeout: 5_000 },
      ),
    ).toHaveAttribute("aria-selected", "true");

    for (let index = 0; index < 5; index += 1) {
      rerender(<WorkspaceBrowser {...props} />);
    }

    expect(
      screen.getByRole("region", { name: /workspace items/i }),
    ).toBeVisible();
  });
});
