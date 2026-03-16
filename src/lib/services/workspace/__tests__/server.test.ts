import {
  listSharedWithUserServer,
  listByFullPathServer,
  listPermissionsServer,
} from "@/lib/services/workspace/server";

vi.mock("@/lib/auth", () => ({
  getBvbrcAuthToken: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getRequiredEnv: vi.fn(() => "https://workspace-api.example.com"),
}));

vi.mock("@/lib/services/workspace/helpers", () => ({
  metaListToObj: vi.fn((list: unknown[]) => ({
    id: list[4],
    path: String(list[2] ?? "") + String(list[0] ?? ""),
    name: list[0],
    type: list[1],
    creation_time: list[3],
    link_reference: list[11],
    owner_id: list[5],
    size: list[6],
    userMeta: list[7],
    autoMeta: list[8],
    user_permission: list[9],
    global_permission: list[10],
    timestamp: Date.parse(String(list[3])),
  })),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("server workspace functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setupAuth(token: string | null) {
    const { getBvbrcAuthToken } = await import("@/lib/auth");
    (getBvbrcAuthToken as ReturnType<typeof vi.fn>).mockResolvedValue(token);
  }

  function mockFetchResponse(data: unknown, ok = true, status = 200) {
    mockFetch.mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Internal Server Error",
      json: () => Promise.resolve(data),
    });
  }

  describe("workspaceRequest (tested via exported functions)", () => {
    it("throws when unauthenticated", async () => {
      await setupAuth(null);

      await expect(listSharedWithUserServer()).rejects.toThrow(
        "Authentication required",
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sends correct JSON-RPC envelope", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({
        result: [{ "/": [] }],
      });

      await listSharedWithUserServer();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://workspace-api.example.com",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/jsonrpc+json",
            Authorization: "auth-token-123",
          }),
        }),
      );

      // Verify the body is valid JSON-RPC
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toEqual(
        expect.objectContaining({
          id: 1,
          method: "Workspace.ls",
          jsonrpc: "2.0",
        }),
      );
    });

    it("throws on non-ok response", async () => {
      await setupAuth("auth-token-123");
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.resolve({}),
      });

      await expect(listSharedWithUserServer()).rejects.toThrow(
        "Workspace API error: 500 Internal Server Error",
      );
    });

    it("throws on API error response", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({
        error: { message: "Object not found" },
      });

      await expect(listByFullPathServer("/some/path")).rejects.toThrow(
        "Object not found",
      );
    });

    it("uses default error message when API error has no message", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({
        error: {},
      });

      await expect(listByFullPathServer("/some/path")).rejects.toThrow(
        "Workspace API error",
      );
    });
  });

  describe("listSharedWithUserServer", () => {
    it("returns filtered shared items", async () => {
      await setupAuth("auth-token-123");

      // Build raw tuples that metaListToObj will transform
      // [name, type, parentPath, creation_time, id, owner_id, size, userMeta, autoMeta, user_perm, global_perm, link_ref]
      const sharedTuple = [
        "shared-folder", "folder", "/other@bvbrc/", "2024-01-01",
        "id1", "other", 0, {}, {}, "r", "n", null,
      ];
      const ownedTuple = [
        "my-folder", "folder", "/me@bvbrc/", "2024-01-01",
        "id2", "me", 0, {}, {}, "o", "n", null,
      ];
      const publicTuple = [
        "public-folder", "folder", "/pub@bvbrc/", "2024-01-01",
        "id3", "pub", 0, {}, {}, "r", "r", null,
      ];

      mockFetchResponse({
        result: [
          { "/": [sharedTuple, ownedTuple, publicTuple] },
        ],
      });

      const result = await listSharedWithUserServer();

      // "shared-folder" has global_permission "n" and user_permission "r" (not "o") => included
      // "my-folder" has global_permission "n" and user_permission "o" => excluded (owned)
      // "public-folder" has global_permission "r" (not "n") => excluded (public)
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "shared-folder",
          global_permission: "n",
          user_permission: "r",
        }),
      );
    });

    it("returns empty when no result data", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({ result: [] });

      const result = await listSharedWithUserServer();

      expect(result).toEqual([]);
    });
  });

  describe("listByFullPathServer", () => {
    it("normalizes path by adding leading slash", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({
        result: [
          { "/owner@bvbrc/folder": [] },
        ],
      });

      await listByFullPathServer("owner@bvbrc/folder");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.params).toEqual([
        expect.objectContaining({
          paths: ["/owner@bvbrc/folder"],
        }),
      ]);
    });

    it("returns empty array when no data in result", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({ result: [] });

      const result = await listByFullPathServer("/owner@bvbrc/folder");

      expect(result).toEqual([]);
    });

    it("returns items from the response", async () => {
      await setupAuth("auth-token-123");

      const fileTuple = [
        "file.txt", "file", "/owner@bvbrc/folder/", "2024-01-01",
        "id1", "owner", 1024, {}, {}, "o", "n", null,
      ];

      mockFetchResponse({
        result: [
          { "/owner@bvbrc/folder": [fileTuple] },
        ],
      });

      const result = await listByFullPathServer("/owner@bvbrc/folder");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          name: "file.txt",
          type: "file",
        }),
      );
    });
  });

  describe("listPermissionsServer", () => {
    it("returns empty object for empty paths array", async () => {
      await setupAuth("auth-token-123");

      const result = await listPermissionsServer([]);

      expect(result).toEqual({});
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns permissions from the response", async () => {
      await setupAuth("auth-token-123");

      const permissionsData = {
        "/owner@bvbrc/folder": [
          ["user1", "r"],
          ["user2", "w"],
        ],
      };
      mockFetchResponse({
        result: [permissionsData],
      });

      const result = await listPermissionsServer(["/owner@bvbrc/folder"]);

      expect(result).toEqual(permissionsData);
    });

    it("returns empty object when result has no data", async () => {
      await setupAuth("auth-token-123");
      mockFetchResponse({ result: [] });

      const result = await listPermissionsServer(["/some/path"]);

      expect(result).toEqual({});
    });
  });
});
