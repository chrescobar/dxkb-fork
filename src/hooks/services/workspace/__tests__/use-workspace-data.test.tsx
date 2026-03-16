import { renderHook } from "@testing-library/react";
import type { WorkspaceBrowserItem } from "@/types/workspace-browser";
import type { PermissionEntry } from "@/lib/services/workspace/shared";

const mockHomeData: WorkspaceBrowserItem[] = [
  { name: "file1.txt", path: "/user/home/file1.txt", type: "contigs" } as WorkspaceBrowserItem,
];
const mockSharedData: WorkspaceBrowserItem[] = [
  { name: "shared-ws", path: "/other/shared-ws", type: "folder" } as WorkspaceBrowserItem,
];
const mockUserWsData: WorkspaceBrowserItem[] = [
  { name: "user-ws", path: "/user/user-ws", type: "folder" } as WorkspaceBrowserItem,
];
const mockPathData: WorkspaceBrowserItem[] = [
  { name: "deep-file.txt", path: "/other/shared-ws/deep-file.txt", type: "contigs" } as WorkspaceBrowserItem,
];

const makeDefaultHomeQuery = () => ({
  data: mockHomeData,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  isSuccess: true,
});

const makeDefaultSharedQuery = () => ({
  data: mockSharedData,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
});

const makeDefaultUserWsQuery = () => ({
  data: mockUserWsData,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
});

const makeDefaultPathQuery = () => ({
  data: mockPathData,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
});

const makeDefaultPermissionsQuery = () => ({
  data: undefined as Record<string, PermissionEntry[]> | undefined,
});

let homeQueryReturn = makeDefaultHomeQuery();
let sharedQueryReturn = makeDefaultSharedQuery();
let userWsQueryReturn = makeDefaultUserWsQuery();
let pathQueryReturn = makeDefaultPathQuery();
let permissionsQueryReturn = makeDefaultPermissionsQuery();

vi.mock("@/hooks/services/workspace/use-workspace-browser", () => ({
  useWorkspaceBrowser: vi.fn(() => homeQueryReturn),
}));

vi.mock("@/hooks/services/workspace/use-shared-with-user", () => ({
  useSharedWithUser: vi.fn(() => sharedQueryReturn),
  useUserWorkspaces: vi.fn(() => userWsQueryReturn),
  useWorkspaceListByPath: vi.fn(() => pathQueryReturn),
  useWorkspaceGet: vi.fn(() => ({ data: null })),
  useWorkspacePermissions: vi.fn(() => permissionsQueryReturn),
}));

import { useWorkspaceData, type UseWorkspaceDataOptions } from "../use-workspace-data";

const defaultOptions: UseWorkspaceDataOptions = {
  mode: "home",
  username: "testuser",
  path: "",
  fullPath: "/testuser@bvbrc/home",
  currentUser: "testuser",
  isJobResultView: false,
  isAtSharedRoot: false,
};

describe("useWorkspaceData", () => {
  beforeEach(() => {
    homeQueryReturn = makeDefaultHomeQuery();
    sharedQueryReturn = makeDefaultSharedQuery();
    userWsQueryReturn = makeDefaultUserWsQuery();
    pathQueryReturn = makeDefaultPathQuery();
    permissionsQueryReturn = makeDefaultPermissionsQuery();
  });

  it("returns homeQuery data in home mode", () => {
    const { result } = renderHook(() =>
      useWorkspaceData({ ...defaultOptions, mode: "home" }),
    );

    expect(result.current.items).toEqual(mockHomeData);
  });

  it("merges shared + userWorkspaces and deduplicates by path at shared root", () => {
    // Add a duplicate path that also exists in sharedQueryReturn
    const duplicateFromUserWs = {
      name: "shared-ws-user-copy",
      path: "/other/shared-ws",
      type: "folder",
    } as WorkspaceBrowserItem;

    userWsQueryReturn = {
      ...makeDefaultUserWsQuery(),
      data: [...mockUserWsData, duplicateFromUserWs],
    };

    const { result } = renderHook(() =>
      useWorkspaceData({
        ...defaultOptions,
        mode: "shared",
        isAtSharedRoot: true,
      }),
    );

    const paths = result.current.items.map((i) => i.path);
    // Both unique paths should be present
    expect(paths).toContain("/other/shared-ws");
    expect(paths).toContain("/user/user-ws");
    // Duplicate path should appear only once — userData is iterated first, so its entry wins
    expect(paths.filter((p) => p === "/other/shared-ws")).toHaveLength(1);
    expect(result.current.items).toHaveLength(2);
    // The winning entry for the duplicate path should be from userData (iterated first)
    const sharedWsItem = result.current.items.find((i) => i.path === "/other/shared-ws");
    expect(sharedWsItem).toBe(duplicateFromUserWs);
  });

  it("returns pathQuery data in non-home non-shared-root mode", () => {
    const { result } = renderHook(() =>
      useWorkspaceData({
        ...defaultOptions,
        mode: "shared",
        isAtSharedRoot: false,
        fullPath: "/other/shared-ws/subdir",
      }),
    );

    expect(result.current.items).toEqual(mockPathData);
  });

  it("reflects homeQuery isLoading in home mode", () => {
    homeQueryReturn = { ...makeDefaultHomeQuery(), isLoading: true };

    const { result } = renderHook(() =>
      useWorkspaceData({ ...defaultOptions, mode: "home" }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("reports loading when either shared or userWorkspaces query is loading at shared root", () => {
    sharedQueryReturn = { ...makeDefaultSharedQuery(), isLoading: true };

    const { result } = renderHook(() =>
      useWorkspaceData({
        ...defaultOptions,
        mode: "shared",
        isAtSharedRoot: true,
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("returns undefined memberCountByPath in home mode", () => {
    const { result } = renderHook(() =>
      useWorkspaceData({ ...defaultOptions, mode: "home" }),
    );

    expect(result.current.memberCountByPath).toBeUndefined();
  });

  it("computes memberCountByPath from permissions data", () => {
    const permData: Record<string, PermissionEntry[]> = {
      "/other/shared-ws/deep-file.txt": [
        ["user1", "r"],
        ["user2", "w"],
      ],
    };
    permissionsQueryReturn = { data: permData };

    const { result } = renderHook(() =>
      useWorkspaceData({
        ...defaultOptions,
        mode: "shared",
        isAtSharedRoot: false,
        fullPath: "/other/shared-ws",
      }),
    );

    expect(result.current.memberCountByPath).toEqual(
      expect.objectContaining({
        "/other/shared-ws/deep-file.txt": 2,
      }),
    );
  });

  it("returns first available error at shared root", () => {
    const testError = new Error("shared fetch failed");
    sharedQueryReturn = { ...makeDefaultSharedQuery(), error: testError };

    const { result } = renderHook(() =>
      useWorkspaceData({
        ...defaultOptions,
        mode: "shared",
        isAtSharedRoot: true,
      }),
    );

    expect(result.current.error).toBe(testError);
  });
});
