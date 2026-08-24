import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import { submitSimilarGenomes } from "./actions";

vi.mock("@/lib/auth/server/route", () => ({
  requireAuthSession: vi.fn(() =>
    Promise.resolve({
      token: "test-token",
      userId: "test-user",
      realm: "test-realm",
    }),
  ),
}));

const formData = {
  selectedGenomeId: "83332.12",
  fasta_file: "",
  output_path: "",
  output_file: "",
  max_pvalue: 1,
  max_distance: 1,
  max_hits: 50,
  include_bacterial: true,
  include_viral: false,
  scope: "reference" as const,
};

it("uses the configured internal origin and forwards authentication", async () => {
  process.env.INTERNAL_API_ORIGIN = "http://127.0.0.1:4999/internal/path";
  const requests: string[] = [];

  server.use(
    http.post("http://127.0.0.1:4999/api/services/minhash", ({ request }) => {
      requests.push(
        `${request.url}:${request.headers.get("Authorization") ?? ""}`,
      );
      return HttpResponse.json({
        result: [{ genome_id: "83332.12", distance: 0, pvalue: 0 }],
      });
    }),
    http.post(
      "http://127.0.0.1:4999/api/services/genome/website-query",
      ({ request }) => {
        requests.push(
        `${request.url}:${request.headers.get("Authorization") ?? ""}`,
      );
        return HttpResponse.json({
          results: [
            {
              genome_id: "83332.12",
              genome_name: "Escherichia coli",
              organism_name: "Escherichia coli",
            },
          ],
        });
      },
    ),
  );

  await expect(submitSimilarGenomes(formData)).resolves.toMatchObject({
    success: true,
    rows: [{ genome_id: "83332.12", genome_name: "Escherichia coli" }],
  });
  expect(requests).toEqual([
    "http://127.0.0.1:4999/api/services/minhash:test-token",
    "http://127.0.0.1:4999/api/services/genome/website-query:test-token",
  ]);
});
