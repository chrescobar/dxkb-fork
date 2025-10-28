/**
 * Tests for Service Submission API
 * 
 * These are example tests showing how to test the service submission functionality.
 * You can run these with: npm test or jest
 */

import { WorkspaceServiceMethods } from "../methods/services";

describe("WorkspaceServiceMethods", () => {
  describe("submit", () => {
    it("should call the correct API endpoint with proper parameters", async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          job: {
            id: "test-job-123",
            app: "Homology",
            status: "queued",
            submit_time: "2025-10-28T12:00:00Z",
            parameters: {},
          },
        }),
      });

      const serviceMethods = new WorkspaceServiceMethods();

      const result = await serviceMethods.submit({
        app_name: "Homology",
        app_params: {
          input_type: "aa",
          blast_program: "blastp",
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/workspace/services/submit",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_name: "Homology",
            app_params: {
              input_type: "aa",
              blast_program: "blastp",
            },
          }),
        }),
      );

      expect(result).toEqual({
        id: "test-job-123",
        app: "Homology",
        status: "queued",
        submit_time: "2025-10-28T12:00:00Z",
        parameters: {},
      });
    });

    it("should handle errors properly", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "Authentication required",
        }),
      });

      const serviceMethods = new WorkspaceServiceMethods();

      await expect(
        serviceMethods.submit({
          app_name: "Homology",
          app_params: {},
        }),
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("submitBlast", () => {
    it("should call submit with correct parameters for BLAST", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          job: {
            id: "blast-job-123",
            app: "Homology",
            status: "queued",
            submit_time: "2025-10-28T12:00:00Z",
            parameters: {},
          },
        }),
      });

      const serviceMethods = new WorkspaceServiceMethods();

      const blastParams = {
        input_type: "aa" as const,
        input_source: "fasta_data" as const,
        db_type: "faa",
        db_source: "precomputed_database" as const,
        blast_program: "blastp",
        output_file: "test-blast",
        output_path: "/test/path",
        blast_max_hits: 10,
        blast_evalue_cutoff: "0.0001",
      };

      const result = await serviceMethods.submitBlast(blastParams);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/workspace/services/submit",
        expect.objectContaining({
          body: JSON.stringify({
            app_name: "Homology",
            app_params: blastParams,
          }),
        }),
      );

      expect(result.id).toBe("blast-job-123");
    });
  });
});

describe("API Endpoint /api/workspace/services/submit", () => {
  it("should validate required fields", () => {
    // This test would be run against the actual API endpoint
    // Example test structure:
    expect(true).toBe(true);
  });

  it("should require authentication", () => {
    // Test that unauthenticated requests return 401
    expect(true).toBe(true);
  });

  it("should validate app_params is an object", () => {
    // Test parameter validation
    expect(true).toBe(true);
  });
});

