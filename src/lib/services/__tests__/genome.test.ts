import {
  fetchGenomeSuggestions,
  fetchGenomesByIds,
  fetchAllGenomeIds,
  getGenomeIdsFromGroup,
  validateViralGenomes,
  fetchGenomeGroupMembers,
} from "@/lib/services/genome";

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe("genome service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchGenomeSuggestions", () => {
    it("returns results on successful fetch", async () => {
      const mockResults = [
        { genome_id: "g1", genome_name: "Genome 1" },
        { genome_id: "g2", genome_name: "Genome 2" },
      ];
      vi.stubGlobal("fetch", mockFetchResponse({ results: mockResults }));

      const result = await fetchGenomeSuggestions("test query");

      expect(result).toEqual(mockResults);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/services/genome/search?q=test+query&limit=25"),
        expect.objectContaining({ method: "GET", credentials: "include" }),
      );
    });

    it("throws on HTTP error", async () => {
      vi.stubGlobal("fetch", mockFetchResponse(
        { error: "Server error" },
        false,
        500,
      ));

      await expect(fetchGenomeSuggestions("fail")).rejects.toThrow("Server error");
    });

    it("returns empty array on AbortError", async () => {
      const abortError = new DOMException("The operation was aborted.", "AbortError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

      const result = await fetchGenomeSuggestions("aborted");

      expect(result).toEqual([]);
    });
  });

  describe("fetchGenomesByIds", () => {
    it("returns empty array when given empty ids", async () => {
      vi.stubGlobal("fetch", vi.fn());

      const result = await fetchGenomesByIds([]);

      expect(result).toEqual([]);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("deduplicates ids before sending", async () => {
      const mockResults = [{ genome_id: "g1", genome_name: "Genome 1" }];
      vi.stubGlobal("fetch", mockFetchResponse({ results: mockResults }));

      await fetchGenomesByIds(["g1", "g1", "g2", "g2"]);

      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody.genome_ids).toEqual(["g1", "g2"]);
    });

    it("returns results on success", async () => {
      const mockResults = [
        { genome_id: "g1", genome_name: "Genome 1" },
        { genome_id: "g2", genome_name: "Genome 2" },
      ];
      vi.stubGlobal("fetch", mockFetchResponse({ results: mockResults }));

      const result = await fetchGenomesByIds(["g1", "g2"]);

      expect(result).toEqual(mockResults);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/services/genome/by-ids",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
    });

    it("throws on HTTP error", async () => {
      vi.stubGlobal("fetch", mockFetchResponse(
        { error: "Not found" },
        false,
        404,
      ));

      await expect(fetchGenomesByIds(["g1"])).rejects.toThrow("Not found");
    });
  });

  describe("fetchAllGenomeIds", () => {
    it("returns results on success", async () => {
      const mockResults = [
        { genome_id: "g1", genome_name: "Genome 1" },
        { genome_id: "g2", genome_name: "Genome 2" },
      ];
      vi.stubGlobal("fetch", mockFetchResponse({ results: mockResults }));

      const result = await fetchAllGenomeIds();

      expect(result).toEqual(mockResults);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/services/genome/get-all-ids",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
    });

    it("throws on HTTP error", async () => {
      vi.stubGlobal("fetch", mockFetchResponse(
        { error: "Service unavailable" },
        false,
        503,
      ));

      await expect(fetchAllGenomeIds()).rejects.toThrow("Service unavailable");
    });
  });

  describe("getGenomeIdsFromGroup", () => {
    it("returns empty array for empty path", async () => {
      vi.stubGlobal("fetch", vi.fn());

      const result = await getGenomeIdsFromGroup("");

      expect(result).toEqual([]);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("decodes JSON string data and returns genome ids", async () => {
      const groupData = JSON.stringify({
        id_list: { genome_id: ["g1", "g2", "g3"] },
      });
      const workspaceResponse = {
        result: [
          [
            ["metadata-placeholder", groupData],
          ],
        ],
      };
      vi.stubGlobal("fetch", mockFetchResponse(workspaceResponse));

      const result = await getGenomeIdsFromGroup("/user/mygroup");

      expect(result).toEqual(["g1", "g2", "g3"]);
      const callBody = JSON.parse(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(callBody.method).toBe("Workspace.get");
      expect(callBody.params[0].objects).toEqual(["/user/mygroup"]);
    });

    it("returns genome ids from base64 encoded data", async () => {
      const groupJson = JSON.stringify({
        id_list: { genome_id: ["b64-g1", "b64-g2"] },
      });
      const base64Data = Buffer.from(groupJson).toString("base64");
      const workspaceResponse = {
        result: [
          [
            ["metadata-placeholder", base64Data],
          ],
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/encoded-group");

      expect(result).toEqual(["b64-g1", "b64-g2"]);
    });

    it("passes object data through as-is", async () => {
      const workspaceResponse = {
        result: [
          [
            ["metadata", { id_list: { genome_id: ["obj-g1"] } }],
          ],
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/obj-group");

      expect(result).toEqual(["obj-g1"]);
    });

    it("returns empty array when decoded data has no id_list", async () => {
      const groupData = JSON.stringify({ some_other_field: "value" });
      const workspaceResponse = {
        result: [
          [
            ["metadata", groupData],
          ],
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/empty-group");

      expect(result).toEqual([]);
    });

    it("returns empty array when id_list has no genome_id", async () => {
      const groupData = JSON.stringify({ id_list: { feature_id: ["f1"] } });
      const workspaceResponse = {
        result: [
          [
            ["metadata", groupData],
          ],
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/no-genomes");

      expect(result).toEqual([]);
    });

    it("filters non-string entries from genome_id array", async () => {
      const groupData = JSON.stringify({
        id_list: { genome_id: ["g1", 123, null, "g2", undefined] },
      });
      const workspaceResponse = {
        result: [
          [
            ["metadata", groupData],
          ],
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/mixed-group");

      expect(result).toEqual(["g1", "g2"]);
    });

    it("throws on HTTP error", async () => {
      global.fetch = mockFetchResponse({ error: "Server error" }, false, 500);

      await expect(getGenomeIdsFromGroup("/user/fail")).rejects.toThrow("Server error");
    });

    it("throws when workspace response entry is null", async () => {
      const workspaceResponse = { result: [null] };
      global.fetch = mockFetchResponse(workspaceResponse);

      await expect(getGenomeIdsFromGroup("/user/bad-response")).rejects.toThrow(
        "Invalid workspace response for genome group",
      );
    });

    it("returns empty array on AbortError", async () => {
      const abortError = new DOMException("The operation was aborted.", "AbortError");
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await getGenomeIdsFromGroup("/user/aborted");

      expect(result).toEqual([]);
    });

    it("handles container-as-object with metadata/data format", async () => {
      const workspaceResponse = {
        result: [
          [
            { metadata: "meta-info", data: JSON.stringify({ id_list: { genome_id: ["md-g1"] } }) },
          ],
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/md-format");

      expect(result).toEqual(["md-g1"]);
    });

    it("handles first-value-in-object format", async () => {
      const workspaceResponse = {
        result: [
          {
            "/user/group": [
              ["metadata", JSON.stringify({ id_list: { genome_id: ["fv-g1"] } })],
            ],
          },
        ],
      };
      global.fetch = mockFetchResponse(workspaceResponse);

      const result = await getGenomeIdsFromGroup("/user/fv-format");

      expect(result).toEqual(["fv-g1"]);
    });
  });

  describe("fetchGenomeGroupMembers", () => {
    it("returns empty array for empty path", async () => {
      global.fetch = vi.fn();

      const result = await fetchGenomeGroupMembers("");

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("fetches workspace data then genome metadata", async () => {
      const groupData = JSON.stringify({
        id_list: { genome_id: ["g1", "g2"] },
      });
      const wsResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: [[["metadata", groupData]]],
        }),
      };
      const genomeResponse = {
        ok: true,
        json: () => Promise.resolve({
          results: [
            { genome_id: "g1", genome_name: "Genome 1" },
            { genome_id: "g2", genome_name: "Genome 2" },
          ],
        }),
      };
      global.fetch = vi.fn()
        .mockResolvedValueOnce(wsResponse)
        .mockResolvedValueOnce(genomeResponse);

      const result = await fetchGenomeGroupMembers("/user/group");

      expect(result).toEqual([
        { genome_id: "g1", genome_name: "Genome 1" },
        { genome_id: "g2", genome_name: "Genome 2" },
      ]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("decodes base64 encoded workspace data", async () => {
      const groupJson = JSON.stringify({
        id_list: { genome_id: ["b64-g1"] },
      });
      const base64Data = Buffer.from(groupJson).toString("base64");
      const wsResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: [[["metadata", base64Data]]],
        }),
      };
      const genomeResponse = {
        ok: true,
        json: () => Promise.resolve({
          results: [{ genome_id: "b64-g1", genome_name: "B64 Genome" }],
        }),
      };
      global.fetch = vi.fn()
        .mockResolvedValueOnce(wsResponse)
        .mockResolvedValueOnce(genomeResponse);

      const result = await fetchGenomeGroupMembers("/user/b64-group");

      expect(result).toEqual([{ genome_id: "b64-g1", genome_name: "B64 Genome" }]);
    });

    it("throws when workspace response entry is null", async () => {
      global.fetch = mockFetchResponse({ result: [null] });

      await expect(fetchGenomeGroupMembers("/user/bad")).rejects.toThrow(
        "Invalid workspace response for genome group",
      );
    });

    it("returns empty array on AbortError", async () => {
      const abortError = new DOMException("The operation was aborted.", "AbortError");
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const result = await fetchGenomeGroupMembers("/user/aborted");

      expect(result).toEqual([]);
    });
  });

  describe("validateViralGenomes", () => {
    it("returns allValid true for empty ids", async () => {
      global.fetch = vi.fn();

      const result = await validateViralGenomes([]);

      expect(result).toEqual({ allValid: true, errors: {}, results: [] });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("detects kingdom_error for non-Viruses superkingdom", async () => {
      const mockResults = [
        { genome_id: "g1", superkingdom: "Bacteria", contigs: 1, genome_length: 1000 },
      ];
      global.fetch = mockFetchResponse({ results: mockResults });

      const result = await validateViralGenomes(["g1"]);

      expect(result.allValid).toBe(false);
      expect(result.errors.kingdom_error).toContain("Invalid Superkingdom");
      expect(result.errors.kingdom_error).toContain("g1");
    });

    it("detects contigs_error for multi-contig genomes", async () => {
      const mockResults = [
        { genome_id: "g1", superkingdom: "Viruses", contigs: 5, genome_length: 1000 },
      ];
      global.fetch = mockFetchResponse({ results: mockResults });

      const result = await validateViralGenomes(["g1"]);

      expect(result.allValid).toBe(false);
      expect(result.errors.contigs_error).toContain("only 1 contig is permitted");
      expect(result.errors.contigs_error).toContain("g1");
    });

    it("detects genomelength_error for genomes exceeding max length", async () => {
      const mockResults = [
        { genome_id: "g1", superkingdom: "Viruses", contigs: 1, genome_length: 500000 },
      ];
      global.fetch = mockFetchResponse({ results: mockResults });

      const result = await validateViralGenomes(["g1"]);

      expect(result.allValid).toBe(false);
      expect(result.errors.genomelength_error).toContain("exceeds maximum length");
      expect(result.errors.genomelength_error).toContain("g1");
    });

    it("detects missing_superkingdom when superkingdom is absent", async () => {
      const mockResults = [
        { genome_id: "g1", contigs: 1, genome_length: 1000 },
      ];
      global.fetch = mockFetchResponse({ results: mockResults });

      const result = await validateViralGenomes(["g1"]);

      expect(result.allValid).toBe(false);
      expect(result.errors.missing_superkingdom).toContain("Missing superkingdom");
      expect(result.errors.missing_superkingdom).toContain("g1");
    });
  });
});
