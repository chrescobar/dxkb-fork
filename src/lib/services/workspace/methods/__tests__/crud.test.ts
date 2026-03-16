import { WorkspaceCrudMethods } from "@/lib/services/workspace/methods/crud";

const mockClient = { makeRequest: vi.fn() };
const crud = new WorkspaceCrudMethods(mockClient as never);

describe("WorkspaceCrudMethods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("delegates to Workspace.create with given params", async () => {
      const params = { objects: [{ workspace: "ws1", id: "file.txt", type: "file" }] };
      mockClient.makeRequest.mockResolvedValue([["created"]]);

      const result = await crud.create(params);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.create", [params]);
      expect(result).toEqual([["created"]]);
    });
  });

  describe("createFolderByPath", () => {
    it("sends path-based Workspace.create with Directory type", async () => {
      mockClient.makeRequest.mockResolvedValue([["folder-created"]]);

      const result = await crud.createFolderByPath("/user@bvbrc/home/Testing/newfolder");

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.create", [
        { objects: [["/user@bvbrc/home/Testing/newfolder", "Directory"]] },
      ]);
      expect(result).toEqual([["folder-created"]]);
    });
  });

  describe("createUploadNode", () => {
    it("returns link_reference on success", async () => {
      const shockUrl = "https://shock.example.com/node/abc123";
      // result[0][0] is the tuple, index 11 is link_reference
      const tuple = [
        "file.txt", "file", "/user@bvbrc/home/", "2024-01-01",
        "id1", "owner", 0, {}, {}, "r", "n", shockUrl,
      ];
      mockClient.makeRequest.mockResolvedValue([[tuple]]);

      const result = await crud.createUploadNode("/user@bvbrc/home/", "file.txt", "contigs");

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.create", [
        {
          objects: [["/user@bvbrc/home/file.txt", "contigs", {}, ""]],
          createUploadNodes: true,
        },
      ]);
      expect(result).toEqual({ link_reference: shockUrl });
    });

    it("appends trailing slash to directoryPath when missing", async () => {
      const tuple = [
        "file.txt", "file", "/user@bvbrc/home/", "2024-01-01",
        "id1", "owner", 0, {}, {}, "r", "n", "https://shock.example.com/node/xyz",
      ];
      mockClient.makeRequest.mockResolvedValue([[tuple]]);

      await crud.createUploadNode("/user@bvbrc/home", "file.txt", "contigs");

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.create", [
        {
          objects: [["/user@bvbrc/home/file.txt", "contigs", {}, ""]],
          createUploadNodes: true,
        },
      ]);
    });

    it("throws when no link_reference in result", async () => {
      // tuple[11] is undefined (no link_reference)
      const tuple = [
        "file.txt", "file", "/user@bvbrc/home/", "2024-01-01",
        "id1", "owner", 0, {}, {}, "r", "n",
      ];
      mockClient.makeRequest.mockResolvedValue([[tuple]]);

      await expect(
        crud.createUploadNode("/user@bvbrc/home/", "file.txt", "contigs"),
      ).rejects.toThrow("Workspace.create did not return a Shock URL (link_reference)");
    });
  });

  describe("delete", () => {
    it("delegates to Workspace.delete with given params", async () => {
      const params = { objects: ["/user@bvbrc/home/file.txt"] };
      mockClient.makeRequest.mockResolvedValue([["deleted"]]);

      const result = await crud.delete(params);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.delete", [params]);
      expect(result).toEqual([["deleted"]]);
    });
  });

  describe("deleteObject", () => {
    it("wraps single path in objects array", async () => {
      mockClient.makeRequest.mockResolvedValue([["deleted"]]);

      await crud.deleteObject("/user@bvbrc/home/file.txt");

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.delete", [
        { objects: ["/user@bvbrc/home/file.txt"] },
      ]);
    });
  });

  describe("copyByPaths", () => {
    it("delegates to Workspace.copy with silent option", async () => {
      const params = { objects: [["/src/path", "/dest/path"]] };
      mockClient.makeRequest.mockResolvedValue([["copied"]]);

      const result = await crud.copyByPaths(params as never);

      expect(mockClient.makeRequest).toHaveBeenCalledWith(
        "Workspace.copy",
        [params],
        { silent: true },
      );
      expect(result).toEqual([["copied"]]);
    });
  });

  describe("move", () => {
    it("delegates to Workspace.move with given params", async () => {
      const params = {
        objects: [{ workspace: "ws1", id: "old.txt" }],
        new_workspace: "ws2",
        new_id: "new.txt",
      };
      mockClient.makeRequest.mockResolvedValue([["moved"]]);

      const result = await crud.move(params);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.move", [params]);
      expect(result).toEqual([["moved"]]);
    });
  });

  describe("rename", () => {
    it("delegates to Workspace.rename with given params", async () => {
      const params = {
        objects: [{ workspace: "ws1", id: "old.txt" }],
        new_name: "new.txt",
      };
      mockClient.makeRequest.mockResolvedValue([["renamed"]]);

      const result = await crud.rename(params);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.rename", [params]);
      expect(result).toEqual([["renamed"]]);
    });
  });

  describe("get", () => {
    it("delegates to Workspace.get with given params", async () => {
      const params = {
        objects: [{ workspace: "ws1", id: "file.txt" }],
        infos: [{ workspace: "ws1", id: "file.txt", metadata_only: true }],
      };
      mockClient.makeRequest.mockResolvedValue([["got"]]);

      const result = await crud.get(params);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.get", [params]);
      expect(result).toEqual([["got"]]);
    });
  });

  describe("updateObjectType", () => {
    it("delegates to Workspace.update_metadata with objects tuple", async () => {
      mockClient.makeRequest.mockResolvedValue([["updated"]]);

      const result = await crud.updateObjectType("/user@bvbrc/home/file.txt", "contigs");

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.update_metadata", [
        { objects: [["/user@bvbrc/home/file.txt", {}, "contigs"]] },
      ]);
      expect(result).toEqual([["updated"]]);
    });
  });

  describe("updateAutoMetadata", () => {
    it("delegates to Workspace.update_auto_meta with paths", async () => {
      mockClient.makeRequest.mockResolvedValue([["auto-meta"]]);

      const result = await crud.updateAutoMetadata(["/user@bvbrc/home/file.txt"]);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.update_auto_meta", [
        { objects: ["/user@bvbrc/home/file.txt"] },
      ]);
      expect(result).toEqual([["auto-meta"]]);
    });
  });

  describe("save", () => {
    it("delegates to Workspace.save with given params", async () => {
      const params = {
        objects: [{ workspace: "ws1", id: "file.txt", type: "file", meta: {} }],
      };
      mockClient.makeRequest.mockResolvedValue([["saved"]]);

      const result = await crud.save(params);

      expect(mockClient.makeRequest).toHaveBeenCalledWith("Workspace.save", [params]);
      expect(result).toEqual([["saved"]]);
    });
  });
});
