import {
  getWorkspaceMetadata,
} from "@/lib/services/workspace/shared";
import { workspaceApi } from "@/lib/services/workspace/client";

vi.mock("@/lib/services/workspace/client", () => ({
  workspaceApi: { makeRequest: vi.fn() },
}));

const mockMakeRequest = workspaceApi.makeRequest as ReturnType<typeof vi.fn>;

describe("shared workspace functions", () => {
  describe("getWorkspaceMetadata", () => {
    it("returns empty array for empty array of paths", async () => {
      const result = await getWorkspaceMetadata([]);

      expect(result).toEqual([]);
      expect(mockMakeRequest).not.toHaveBeenCalled();
    });

    it("sends metadata_only: true with decoded paths", async () => {
      const metadata = [["some-metadata"]];
      mockMakeRequest.mockResolvedValue(metadata);

      const result = await getWorkspaceMetadata(["/owner%40bvbrc/file.txt"]);

      expect(mockMakeRequest).toHaveBeenCalledWith("Workspace.get", [
        { objects: ["/owner@bvbrc/file.txt"], metadata_only: true },
      ], undefined);
      expect(result).toEqual(metadata);
    });

    it("decodes multiple paths and includes metadata_only", async () => {
      mockMakeRequest.mockResolvedValue([]);

      await getWorkspaceMetadata([
        "/user%40bvbrc/file1",
        "/user%40bvbrc/file2",
      ]);

      expect(mockMakeRequest).toHaveBeenCalledWith("Workspace.get", [
        {
          objects: ["/user@bvbrc/file1", "/user@bvbrc/file2"],
          metadata_only: true,
        },
      ], undefined);
    });
  });
});
