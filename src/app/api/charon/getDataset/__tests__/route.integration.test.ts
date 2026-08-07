vi.mock("server-only", () => ({}));

import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";

import { GET } from "../route";

const main = "{\"version\":\"v2\",\"meta\":{\"title\":\"H3N2\"},\"tree\":{}}";
let root: string;
let datasetDir: string;

function request(prefix: string, type?: string) {
  const url = new URL("http://localhost/api/charon/getDataset");
  url.searchParams.set("prefix", prefix);
  if (type !== undefined) url.searchParams.set("type", type);
  return new NextRequest(url);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "charon-route-"));
  datasetDir = join(root, "datasets");
  await mkdir(datasetDir);
  process.env.NEXTSTRAIN_DATASET_DIR = datasetDir;
});

afterEach(async () => {
  delete process.env.NEXTSTRAIN_DATASET_DIR;
  await rm(root, { recursive: true, force: true });
});

describe("GET /api/charon/getDataset with the real store", () => {
  it.each([undefined, "tree"])("returns exact unmodified main content for type %j", async type => {
    await writeFile(join(datasetDir, "Influenza-A-Virus_H3N2_HA.json"), main);

    const response = await GET(
      request("nextstrain-viewer/Influenza-A-Virus/H3N2/HA", type),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, stale-while-revalidate=3600",
    );
    await expect(response.text()).resolves.toBe(main);
  });

  it.each(["tip-frequencies", "root-sequence", "measurements"])(
    "returns an exact %s sidecar and 404 when absent",
    async type => {
      const body = JSON.stringify({ type });
      await writeFile(
        join(datasetDir, `Influenza-A-Virus_H3N2_HA_${type}.json`),
        body,
      );

      const hit = await GET(
        request("/nextstrain-viewer/Influenza-A-Virus/H3N2/HA/", type),
      );
      expect(hit.status).toBe(200);
      await expect(hit.text()).resolves.toBe(body);

      const miss = await GET(
        request("nextstrain-viewer/Influenza-A-Virus/H3N2/NA", type),
      );
      expect(miss.status).toBe(404);
      expect(miss.headers.get("location")).toBeNull();
    },
  );

  it("never substitutes H3N2 for the H5N1 near miss", async () => {
    await writeFile(join(datasetDir, "Influenza-A-Virus_H3N2_HA.json"), main);

    const response = await GET(
      request("nextstrain-viewer/Influenza-A-Virus/H5N1/HA"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
    expect(await response.text()).not.toContain("H3N2");
  });

  it("rejects an escaping symlink without exposing its content", async () => {
    const outside = join(root, "outside.json");
    await writeFile(outside, "secret");
    await symlink(outside, join(datasetDir, "Orthoebolavirus_100.json"));

    const response = await GET(
      request("nextstrain-viewer/Orthoebolavirus/100"),
    );

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("secret");
  });

  it.each(["unset", "missing", "not-a-directory"])(
    "returns 500 when the store is %s",
    async state => {
      if (state === "unset") delete process.env.NEXTSTRAIN_DATASET_DIR;
      if (state === "missing") process.env.NEXTSTRAIN_DATASET_DIR = join(root, "missing");
      if (state === "not-a-directory") {
        const file = join(root, "file");
        await writeFile(file, "not a directory");
        process.env.NEXTSTRAIN_DATASET_DIR = file;
      }

      const response = await GET(
        request("nextstrain-viewer/Influenza-A-Virus/H3N2/HA"),
      );
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "dataset store unavailable",
      });
    },
  );
});
