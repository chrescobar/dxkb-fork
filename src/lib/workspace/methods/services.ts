import { SubmitServiceParams, SubmitServiceResponse } from "../../../types/workspace";

/**
 * Service submission methods
 * Note: This uses our backend API endpoint instead of direct workspace client
 * because service submission requires special handling via AppService.start_app2
 */
export class WorkspaceServiceMethods {
  /**
   * Submit a service job to the AppService
   */
  async submit(params: SubmitServiceParams): Promise<SubmitServiceResponse> {
    try {
      console.log("Submitting service:", params);

      const response = await fetch("/api/workspace/services/submit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      console.log("Service submission response:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Failed to submit service:", error);
      throw error;
    }
  }

  /**
   * Submit a BLAST job
   * Convenience method for BLAST service submission
   */
  async submitBlast(params: {
    input_type: "aa" | "dna";
    input_source: "fasta_data" | "workspace";
    db_type: string;
    db_source: "precomputed_database" | "workspace";
    blast_program: string;
    output_file: string;
    output_path: string;
    blast_max_hits?: number;
    blast_evalue_cutoff?: string;
    input_fasta_data?: string;
    db_precomputed_database?: string;
    [key: string]: any;
  }): Promise<SubmitServiceResponse> {
    return this.submit({
      app_name: "Homology",
      app_params: params,
    });
  }
}

export function createWorkspaceServiceMethods(): WorkspaceServiceMethods {
  return new WorkspaceServiceMethods();
}

