/**
 * Example: Service Submission in React Components
 * 
 * This file demonstrates how to submit services (like BLAST) from React components
 * using the new Workspace API service submission endpoint.
 */

"use client";

import { useState } from "react";
import { workspace } from "@/lib/workspace";
import { SubmitServiceResponse } from "@/types/workspace";

/**
 * Example 1: Basic Service Submission Hook
 */
export function useServiceSubmission() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitServiceResponse | null>(null);

  const submitService = async (
    appName: string,
    appParams: Record<string, any>,
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const jobResult = await workspace.services.submit({
        app_name: appName,
        app_params: appParams,
      });

      setResult(jobResult);
      return jobResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitService, loading, error, result };
}

/**
 * Example 2: BLAST Submission Component
 */
export function BlastSubmissionExample() {
  const { submitService, loading, error, result } = useServiceSubmission();

  const handleSubmitBlast = async () => {
    try {
      const jobResult = await submitService("Homology", {
        input_type: "aa",
        input_source: "fasta_data",
        db_type: "faa",
        db_source: "precomputed_database",
        blast_program: "blastp",
        output_file: "blast-example",
        output_path: "/username@bvbrc/home/Services/BLAST",
        blast_max_hits: 10,
        blast_evalue_cutoff: "0.0001",
        input_fasta_data: ">example\nMSIQHFRVALIPFFAAFCLPVFAHPETLVKVK",
        db_precomputed_database: "bacteria-archaea",
      });

      console.log("BLAST job submitted:", jobResult);
    } catch (err) {
      console.error("Failed to submit BLAST job:", err);
    }
  };

  return (
    <div>
      <button onClick={handleSubmitBlast} disabled={loading}>
        {loading ? "Submitting..." : "Submit BLAST Job"}
      </button>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {result && (
        <div>
          <h3>Job Submitted Successfully!</h3>
          <p>Job ID: {result.job[0].id}</p>
          <p>Status: {result.job[0].status}</p>
          <p>Submitted at: {result.job[0].submit_time}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Using the Convenience Method
 */
export async function submitBlastJobExample() {
  try {
    const result = await workspace.services.submitBlast({
      input_type: "aa",
      input_source: "fasta_data",
      db_type: "faa",
      db_source: "precomputed_database",
      blast_program: "blastp",
      output_file: "my-blast-job",
      output_path: "/username@bvbrc/home/Services/BLAST",
      blast_max_hits: 10,
      blast_evalue_cutoff: "0.0001",
      input_fasta_data: ">sequence\nMSIQHFRVALIPFFAAFCLPVFAHPETLVKVK",
      db_precomputed_database: "bacteria-archaea",
    });

    console.log("Job submitted:", result);
    return result;
  } catch (error) {
    console.error("Error submitting BLAST job:", error);
    throw error;
  }
}

/**
 * Example 4: Form Integration
 */
export function ServiceSubmissionForm() {
  const [formData, setFormData] = useState({
    inputType: "aa",
    blastProgram: "blastp",
    outputFile: "",
    fastaData: "",
    maxHits: 10,
    evalue: "0.0001",
  });

  const { submitService, loading, error, result } = useServiceSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitService("Homology", {
        input_type: formData.inputType,
        input_source: "fasta_data",
        db_type: formData.inputType === "aa" ? "faa" : "fna",
        db_source: "precomputed_database",
        blast_program: formData.blastProgram,
        output_file: formData.outputFile,
        output_path: "/username@bvbrc/home/Services/BLAST",
        blast_max_hits: formData.maxHits,
        blast_evalue_cutoff: formData.evalue,
        input_fasta_data: formData.fastaData,
        db_precomputed_database: "bacteria-archaea",
      });
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Input Type:
          <select
            value={formData.inputType}
            onChange={(e) =>
              setFormData({ ...formData, inputType: e.target.value })
            }
          >
            <option value="aa">Amino Acid</option>
            <option value="dna">DNA</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          BLAST Program:
          <select
            value={formData.blastProgram}
            onChange={(e) =>
              setFormData({ ...formData, blastProgram: e.target.value })
            }
          >
            <option value="blastp">blastp</option>
            <option value="blastn">blastn</option>
            <option value="blastx">blastx</option>
            <option value="tblastn">tblastn</option>
            <option value="tblastx">tblastx</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Output File Name:
          <input
            type="text"
            value={formData.outputFile}
            onChange={(e) =>
              setFormData({ ...formData, outputFile: e.target.value })
            }
            required
          />
        </label>
      </div>

      <div>
        <label>
          FASTA Data:
          <textarea
            value={formData.fastaData}
            onChange={(e) =>
              setFormData({ ...formData, fastaData: e.target.value })
            }
            required
            rows={10}
          />
        </label>
      </div>

      <div>
        <label>
          Max Hits:
          <input
            type="number"
            value={formData.maxHits}
            onChange={(e) =>
              setFormData({ ...formData, maxHits: parseInt(e.target.value) })
            }
          />
        </label>
      </div>

      <div>
        <label>
          E-value Cutoff:
          <input
            type="text"
            value={formData.evalue}
            onChange={(e) =>
              setFormData({ ...formData, evalue: e.target.value })
            }
          />
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Job"}
      </button>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}

      {result && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid green" }}>
          <h3>Success!</h3>
          <p>Job ID: {result.job[0].id}</p>
          <p>Status: {result.job[0].status}</p>
          <p>Submitted at: {result.job[0].submit_time}</p>
        </div>
      )}
    </form>
  );
}

/**
 * Example 5: Server-Side Submission (in API route or Server Component)
 */
/*
// This would be in an API route file:
import { createWorkspaceService } from "@/lib/workspace-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = // ... get token from cookies or auth
  const workspaceService = createWorkspaceService(token);
  
  const body = await request.json();
  
  const result = await workspaceService.submitService({
    app_name: "Homology",
    app_params: body.params
  });
  
  return NextResponse.json(result);
}
*/

