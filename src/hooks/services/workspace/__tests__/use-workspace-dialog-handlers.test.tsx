import { renderHook, act, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import {
  getFolderPathsFromItems,
  getNonEmptyFolderPaths,
  ensureDestinationWriteAccess,
} from "@/lib/services/workspace/helpers";
import type { WorkspaceBrowserItem } from "@/types/workspace-browser";
import {
  useWorkspaceDialogHandlers,
  type UseWorkspaceDialogHandlersOptions,
} from "@/hooks/services/workspace/use-workspace-dialog-handlers";

const mockDispatch = vi.fn();
let mockActiveDialog: unknown = null;

vi.mock("@/contexts/workspace-dialog-context", () => ({
  useWorkspaceDialog: () => ({
    dispatch: mockDispatch,
    state: {
      get activeDialog() {
        return mockActiveDialog;
      },
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/services/workspace/helpers", () => ({
  getFolderPathsFromItems: vi.fn(() => []),
  getNonEmptyFolderPaths: vi.fn(() => Promise.resolve([])),
  ensureDestinationWriteAccess: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock("@/lib/services/workspace/utils", () => ({
  isFolder: vi.fn((type: string) => type === "folder"),
}));

vi.mock("@/lib/utils", () => ({
  sanitizePathSegment: vi.fn((s: string) => s),
}));

const makeItem = (
  overrides: Partial<WorkspaceBrowserItem>,
): WorkspaceBrowserItem =>
  ({
    id: "item-1",
    name: "file.txt",
    path: "/testuser/home/file.txt",
    type: "contigs",
    creation_time: "2025-01-01",
    link_reference: "",
    owner_id: "testuser",
    size: 100,
    userMeta: {},
    autoMeta: {},
    user_permission: "o",
    global_permission: "n",
    timestamp: 0,
    ...overrides,
  }) as WorkspaceBrowserItem;

function createMockOptions(
  overrides?: Partial<UseWorkspaceDialogHandlersOptions>,
): UseWorkspaceDialogHandlersOptions {
  return {
    workspaceCrud: {
      delete: vi.fn(() => Promise.resolve()),
      copyByPaths: vi.fn(() => Promise.resolve()),
      createFolderByPath: vi.fn(() => Promise.resolve()),
      updateObjectType: vi.fn(() => Promise.resolve()),
    } as unknown as UseWorkspaceDialogHandlersOptions["workspaceCrud"],
    workspaceDownload: {
      getDownloadUrls: vi.fn(),
      getArchiveUrl: vi.fn(),
    } as unknown as UseWorkspaceDialogHandlersOptions["workspaceDownload"],
    workspaceClient: {
      makeRequest: vi.fn(),
    } as unknown as UseWorkspaceDialogHandlersOptions["workspaceClient"],
    currentDirectoryPath: "/testuser/home/",
    currentUserWorkspaceRoot: "/testuser@bvbrc",
    username: "testuser",
    myWorkspaceRoot: "/testuser/",
    clearSelection: vi.fn(),
    ...overrides,
  };
}

describe("useWorkspaceDialogHandlers", () => {
  const wrapper = createQueryClientWrapper();

  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveDialog = null;
  });

  it("handleConfirmDelete calls workspaceCrud.delete with item paths", async () => {
    const item = makeItem({ name: "to-delete.txt", path: "/testuser/home/to-delete.txt" });
    mockActiveDialog = {
      type: "delete",
      items: [item],
      nonEmptyPaths: [],
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    await waitFor(() => {
      expect(options.workspaceCrud.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          objects: ["/testuser/home/to-delete.txt"],
          force: true,
          deleteDirectories: true,
        }),
      );
    });
  });

  it("handleConfirmDelete closes dialog when items array is empty", async () => {
    mockActiveDialog = {
      type: "delete",
      items: [],
      nonEmptyPaths: [],
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: "CLOSE" });
    expect(options.workspaceCrud.delete).not.toHaveBeenCalled();
  });

  it("handleConfirmDelete closes dialog when all items have no path", async () => {
    const item = makeItem({ name: "no-path", path: "" });
    mockActiveDialog = {
      type: "delete",
      items: [item],
      nonEmptyPaths: [],
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: "CLOSE" });
    expect(options.workspaceCrud.delete).not.toHaveBeenCalled();
  });

  it("handleCopyConfirm calls copyByPaths with source/dest pairs", async () => {
    const item = makeItem({
      name: "copy-me.txt",
      path: "/testuser/home/copy-me.txt",
    });
    mockActiveDialog = {
      type: "copy",
      items: [item],
      mode: "copy",
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCopyConfirm("/testuser/home/dest");
    });

    await waitFor(() => {
      expect(options.workspaceCrud.copyByPaths).toHaveBeenCalledWith(
        expect.objectContaining({
          objects: [["/testuser/home/copy-me.txt", "/testuser/home/dest/copy-me.txt"]],
          recursive: true,
          move: false,
        }),
      );
    });
  });

  it("handleCopyConfirm blocks non-folders to root workspace", async () => {
    const item = makeItem({
      name: "file.txt",
      path: "/testuser/home/file.txt",
      type: "contigs",
    });
    mockActiveDialog = {
      type: "copy",
      items: [item],
      mode: "copy",
    };

    const options = createMockOptions({
      currentUserWorkspaceRoot: "/testuser@bvbrc",
    });
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCopyConfirm("/testuser@bvbrc");
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Copying objects to the top level directory"),
    );
    expect(options.workspaceCrud.copyByPaths).not.toHaveBeenCalled();
  });

  it("handleCopyConfirm with move mode passes move: true", async () => {
    const item = makeItem({
      name: "move-me.txt",
      path: "/testuser/home/move-me.txt",
    });
    mockActiveDialog = {
      type: "copy",
      items: [item],
      mode: "move",
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCopyConfirm("/testuser/home/dest");
    });

    await waitFor(() => {
      expect(options.workspaceCrud.copyByPaths).toHaveBeenCalledWith(
        expect.objectContaining({
          move: true,
        }),
      );
    });
  });

  it("handleCopyConfirm shows error when ensureDestinationWriteAccess fails", async () => {
    vi.mocked(ensureDestinationWriteAccess).mockResolvedValueOnce({
      ok: false,
      errorMessage: "No write access",
    });

    const item = makeItem({
      name: "file.txt",
      path: "/testuser/home/file.txt",
    });
    mockActiveDialog = {
      type: "copy",
      items: [item],
      mode: "copy",
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCopyConfirm("/readonly/dest");
    });

    expect(toast.error).toHaveBeenCalledWith("No write access");
    expect(options.workspaceCrud.copyByPaths).not.toHaveBeenCalled();
  });

  it("handleCreateFolder calls createFolderByPath with parent + name", async () => {
    const options = createMockOptions({
      currentDirectoryPath: "/testuser/home/projects/",
    });
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCreateFolder("New Folder");
    });

    await waitFor(() => {
      expect(options.workspaceCrud.createFolderByPath).toHaveBeenCalledWith(
        "/testuser/home/projects/New Folder",
      );
    });
  });

  it("handleCreateFolder skips empty/whitespace names", async () => {
    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCreateFolder("   ");
    });

    expect(options.workspaceCrud.createFolderByPath).not.toHaveBeenCalled();
  });

  it("handleCreateWorkspace creates path with username", async () => {
    const options = createMockOptions({ username: "myuser" });
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleCreateWorkspace("my-ws");
    });

    await waitFor(() => {
      expect(options.workspaceCrud.createFolderByPath).toHaveBeenCalledWith(
        "/myuser/my-ws/",
      );
    });
  });

  it("handleEditTypeConfirm calls updateObjectType", async () => {
    const item = makeItem({
      name: "data.txt",
      path: "/testuser/home/data.txt",
      type: "contigs",
    });
    mockActiveDialog = {
      type: "editType",
      item,
    };

    const options = createMockOptions();
    const { result } = renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await act(async () => {
      await result.current.handleEditTypeConfirm("csv");
    });

    await waitFor(() => {
      expect(options.workspaceCrud.updateObjectType).toHaveBeenCalledWith(
        "/testuser/home/data.txt",
        "csv",
      );
    });
  });

  it("useEffect dispatches SET_DELETE_NON_EMPTY_PATHS when delete dialog opens with folders", async () => {
    const folderItem = makeItem({
      name: "my-folder",
      path: "/testuser/home/my-folder",
      type: "folder",
    });

    vi.mocked(getFolderPathsFromItems).mockReturnValue([
      "/testuser/home/my-folder",
    ]);
    vi.mocked(getNonEmptyFolderPaths).mockResolvedValue([
      "/testuser/home/my-folder",
    ]);

    mockActiveDialog = {
      type: "delete",
      items: [folderItem],
      nonEmptyPaths: [],
    };

    const options = createMockOptions();
    renderHook(
      () => useWorkspaceDialogHandlers(options),
      { wrapper },
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_DELETE_NON_EMPTY_PATHS",
        paths: ["/testuser/home/my-folder"],
      });
    });
  });
});
