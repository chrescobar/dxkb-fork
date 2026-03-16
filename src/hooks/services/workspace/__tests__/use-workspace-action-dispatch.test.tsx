import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import type { WorkspaceBrowserItem } from "@/types/workspace-browser";
import { useWorkspaceActionDispatch } from "@/hooks/services/workspace/use-workspace-action-dispatch";

const mockDispatch = vi.fn();
vi.mock("@/contexts/workspace-dialog-context", () => ({
  useWorkspaceDialog: () => ({ dispatch: mockDispatch }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/services/workspace/favorites", () => ({
  toggleFavorite: vi.fn(),
}));

vi.mock("@/lib/services/workspace/helpers", () => ({
  expandDownloadPaths: vi.fn(
    (downloadable: WorkspaceBrowserItem[]) =>
      downloadable.map((item) => item.path),
  ),
  getSiblingJobResultPathForDotFolder: vi.fn(() => null),
}));

vi.mock("@/lib/services/workspace/utils", () => ({
  isFolderType: vi.fn((type: string) =>
    ["folder", "directory", "job_result", "modelfolder", "genome_group", "feature_group", "experiment_group"].includes(
      type.toLowerCase(),
    ),
  ),
}));

const makeItem = (
  overrides: Partial<WorkspaceBrowserItem>,
): WorkspaceBrowserItem =>
  ({
    id: "test-id",
    name: "file.txt",
    path: "/user@bvbrc/home/file.txt",
    type: "contigs",
    creation_time: "2025-01-01T00:00:00Z",
    link_reference: "",
    owner_id: "user@bvbrc",
    size: 100,
    userMeta: {},
    autoMeta: {},
    user_permission: "rw",
    global_permission: "n",
    timestamp: 0,
    ...overrides,
  }) as WorkspaceBrowserItem;

describe("useWorkspaceActionDispatch", () => {
  const mockGetDownloadUrls = vi.fn();
  const mockGetArchiveUrl = vi.fn();
  const mockMakeRequest = vi.fn();

  function createDefaultOptions() {
    return {
      currentUser: "user@bvbrc",
      myWorkspaceRoot: "/user@bvbrc/home",
      queryClient: new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
      workspaceDownload: {
        getDownloadUrls: mockGetDownloadUrls,
        getArchiveUrl: mockGetArchiveUrl,
      },
      workspaceClient: {
        makeRequest: mockMakeRequest,
      },
      items: [] as WorkspaceBrowserItem[],
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dispatches OPEN_DELETE for delete action", async () => {
    const options = createDefaultOptions();
    const selection = [makeItem({ name: "toDelete.txt", path: "/user@bvbrc/home/toDelete.txt" })];

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("delete", selection);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "OPEN_DELETE",
      items: selection,
    });
  });

  it("dispatches OPEN_COPY with mode copy for copy action", async () => {
    const options = createDefaultOptions();
    const selection = [makeItem({ name: "toCopy.txt" })];

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("copy", selection);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "OPEN_COPY",
      items: selection,
      mode: "copy",
    });
  });

  it("dispatches OPEN_COPY with mode move for move action", async () => {
    const options = createDefaultOptions();
    const selection = [makeItem({ name: "toMove.txt" })];

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("move", selection);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "OPEN_COPY",
      items: selection,
      mode: "move",
    });
  });

  it("dispatches OPEN_EDIT_TYPE for editType action with valid item", async () => {
    const options = createDefaultOptions();
    const item = makeItem({ name: "data.csv", path: "/user@bvbrc/home/data.csv", type: "csv" });

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("editType", [item]);
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "OPEN_EDIT_TYPE",
      item,
    });
  });

  it("does not dispatch for editType when selection[0] has no path", async () => {
    const options = createDefaultOptions();
    const item = makeItem({ name: "nopath.txt", path: "" });

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("editType", [item]);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("calls toggleFavorite for folder items on favorite action", async () => {
    const { toggleFavorite } = await import("@/lib/services/workspace/favorites");
    const mockedToggleFavorite = vi.mocked(toggleFavorite);
    mockedToggleFavorite.mockResolvedValue(true);

    const options = createDefaultOptions();
    const folderItem = makeItem({ name: "myFolder", path: "/user@bvbrc/home/myFolder", type: "folder" });

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("favorite", [folderItem]);
    });

    await waitFor(() => {
      expect(mockedToggleFavorite).toHaveBeenCalledWith(
        "/user@bvbrc/home",
        "/user@bvbrc/home/myFolder",
      );
    });
  });

  it("skips favorite action for non-folder items", async () => {
    const { toggleFavorite } = await import("@/lib/services/workspace/favorites");
    const mockedToggleFavorite = vi.mocked(toggleFavorite);

    const options = createDefaultOptions();
    const fileItem = makeItem({ name: "file.txt", path: "/user@bvbrc/home/file.txt", type: "contigs" });

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("favorite", [fileItem]);
    });

    expect(mockedToggleFavorite).not.toHaveBeenCalled();
  });

  it("shows error toast when all selected items are forbidden download types", async () => {
    const { toast } = await import("sonner");

    const options = createDefaultOptions();
    const forbiddenItem = makeItem({ name: "genomes", path: "/user@bvbrc/home/genomes", type: "genome_group" });

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("download", [forbiddenItem]);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Nothing to download for this selection.",
      expect.objectContaining({
        description: expect.stringContaining("not downloadable"),
      }),
    );
  });

  it("triggers download mutation for single downloadable file", async () => {
    mockGetDownloadUrls.mockResolvedValue([["https://example.com/download/file.txt"]]);

    const fileItem = makeItem({ name: "data.txt", path: "/user@bvbrc/home/data.txt", type: "txt" });
    const options = createDefaultOptions();
    options.items = [fileItem];

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("download", [fileItem]);
    });

    await waitFor(() => {
      expect(mockGetDownloadUrls).toHaveBeenCalledWith([fileItem.path]);
    });
  });

  it("ignores unknown action ids", async () => {
    const options = createDefaultOptions();
    const selection = [makeItem({})];

    const { result } = renderHook(
      () => useWorkspaceActionDispatch(options as never),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.handleAction("unknownAction", selection);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockGetDownloadUrls).not.toHaveBeenCalled();
  });
});
