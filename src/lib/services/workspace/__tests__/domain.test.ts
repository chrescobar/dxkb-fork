import {
  WorkspaceApiError,
  isWorkspaceFolder,
  isWorkspaceFolderLike,
  normalizeWorkspaceType,
  toWorkspaceObject,
} from "@/lib/services/workspace/domain";
import type { WorkspaceItem } from "@/lib/services/workspace/domain";

function makeItem(overrides: Partial<WorkspaceItem> = {}): WorkspaceItem {
  return {
    id: "abc",
    path: "/user@bvbrc/home/file.fa",
    name: "file.fa",
    type: "contigs",
    createdAt: "2026-04-01T12:00:00Z",
    ownerId: "user@bvbrc",
    size: 123,
    permissions: { user: "o", global: "n" },
    timestamp: 1712000000000,
    ...overrides,
  };
}

describe("workspace domain", () => {
  describe("toWorkspaceObject", () => {
    it("preserves raw type string (not narrowed)", () => {
      const item = makeItem({ type: "genome_group" });
      const obj = toWorkspaceObject(item);
      expect(obj.type).toBe("genome_group");
      expect(obj.isDirectory).toBe(true);
    });

    it("marks plain files as non-directory", () => {
      const item = makeItem({ type: "contigs" });
      const obj = toWorkspaceObject(item);
      expect(obj.isDirectory).toBe(false);
    });
  });

  describe("folder-type helpers", () => {
    it("isWorkspaceFolder is true only for folder/directory/modelfolder", () => {
      expect(isWorkspaceFolder({ type: "folder" })).toBe(true);
      expect(isWorkspaceFolder({ type: "directory" })).toBe(true);
      expect(isWorkspaceFolder({ type: "modelfolder" })).toBe(true);
      expect(isWorkspaceFolder({ type: "job_result" })).toBe(false);
      expect(isWorkspaceFolder({ type: "genome_group" })).toBe(false);
      expect(isWorkspaceFolder({ type: "contigs" })).toBe(false);
    });

    it("isWorkspaceFolderLike includes job_result and groups", () => {
      expect(isWorkspaceFolderLike({ type: "folder" })).toBe(true);
      expect(isWorkspaceFolderLike({ type: "job_result" })).toBe(true);
      expect(isWorkspaceFolderLike({ type: "genome_group" })).toBe(true);
      expect(isWorkspaceFolderLike({ type: "feature_group" })).toBe(true);
      expect(isWorkspaceFolderLike({ type: "experiment_group" })).toBe(true);
      expect(isWorkspaceFolderLike({ type: "contigs" })).toBe(false);
    });

    it("normalizeWorkspaceType lowercases the input", () => {
      expect(normalizeWorkspaceType("Folder")).toBe("folder");
      expect(normalizeWorkspaceType("")).toBe("");
    });
  });

  describe("WorkspaceApiError", () => {
    it("extracts JSON-RPC error code from apiResponse.error.code", () => {
      const err = new WorkspaceApiError("oops", "Workspace.copy", { error: { code: -32603 } });
      expect(err.code).toBe(-32603);
      expect(err.method).toBe("Workspace.copy");
    });

    it("extracts a top-level code when error wrapper is absent", () => {
      const err = new WorkspaceApiError("oops", "Workspace.delete", { code: 42 });
      expect(err.code).toBe(42);
    });

    it("returns undefined when apiResponse has no code", () => {
      const err = new WorkspaceApiError("oops", "Workspace.ls", { message: "nope" });
      expect(err.code).toBeUndefined();
    });
  });
});
