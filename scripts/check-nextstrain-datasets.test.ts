import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  familyReferences,
  manifestTaxonIds,
  reconcileDatasets,
} from "./check-nextstrain-datasets";

const validDataset = '{"version":"v2","meta":{},"tree":{}}';
let root: string;
let directory: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "nextstrain-reconcile-"));
  directory = join(root, "datasets");
  await mkdir(directory);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("Nextstrain dataset reconciliation", () => {
  it("accepts wrapped and flat manifests but rejects invalid taxon IDs", () => {
    expect(manifestTaxonIds({ trees: { "2955291": "influenza" } })).toEqual([
      "2955291",
    ]);
    expect(manifestTaxonIds({ "11266": "filoviridae" })).toEqual(["11266"]);
    expect(() => manifestTaxonIds([])).toThrow("invalid shape");
    expect(() => manifestTaxonIds({ bad: true })).toThrow("invalid taxon");
  });

  it("canonicalizes and aggregates duplicate family references", () => {
    const first = familyReferences(
      {
        groups: [
          {
            title: "First",
            nextstrain: [{ path: "/Orthoebolavirus/100/" }],
          },
        ],
      },
      "11266",
    );
    const second = familyReferences(
      {
        groups: [
          {
            title: "Second",
            nextstrain: [{ path: "Orthoebolavirus/100" }],
          },
        ],
      },
      "3044781",
    );

    expect(first.get("Orthoebolavirus/100")).toEqual([
      { taxonId: "11266", group: "First" },
    ]);
    expect(second.get("Orthoebolavirus/100")).toEqual([
      { taxonId: "3044781", group: "Second" },
    ]);
  });

  it.each([
    [{}, "invalid shape"],
    [{ groups: [{ title: "Bad", nextstrain: {} }] }, "invalid nextstrain"],
    [
      { groups: [{ title: "Bad", nextstrain: [{}] }] },
      "invalid nextstrain record",
    ],
    [
      { groups: [{ title: "Bad", nextstrain: [{ path: "//host/tree" }] }] },
      "invalid advertised",
    ],
  ])("rejects malformed family data", (family, message) => {
    expect(() => familyReferences(family, "1")).toThrow(message);
  });

  it("reports missing and unadvertised IDs and consolidates duplicate diagnostics", async () => {
    await Promise.all([
      writeFile(
        join(directory, "Influenza-A-Virus_H3N2_HA.json"),
        validDataset,
      ),
      writeFile(join(directory, "Local_Only.json"), validDataset),
    ]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = await reconcileDatasets({
      directory,
      manifest: { trees: { "1": true, "2": true } },
      fetchFamily: (taxonId) =>
        Promise.resolve({
          groups: [
            {
              title: `Group ${taxonId}`,
              nextstrain: [
                { path: "Influenza-A-Virus/H3N2/HA" },
                { path: "/Orthoebolavirus/100/" },
              ],
            },
          ],
        }),
    });

    expect(result).toEqual({
      advertised: 2,
      available: 2,
      missing: ["Orthoebolavirus/100"],
      unadvertised: ["Local/Only"],
    });
    expect(warn).toHaveBeenCalledWith(
      "missing: Orthoebolavirus/100 (1/Group 1, 2/Group 2)",
    );
    expect(warn).toHaveBeenCalledWith("unadvertised: Local/Only");
  });

  it.each([
    ["malformed JSON", "{"],
    ["wrong version", '{"version":"v1","meta":{},"tree":{}}'],
    ["missing meta", '{"version":"v2","tree":{}}'],
    ["missing tree", '{"version":"v2","meta":{}}'],
  ])(
    "reports an advertised dataset with %s as missing",
    async (_name, body) => {
      await writeFile(join(directory, "Dataset_One.json"), body);

      await expect(
        reconcileDatasets({
          directory,
          manifest: { "1": true },
          fetchFamily: () =>
            Promise.resolve({
              groups: [
                { title: "Group", nextstrain: [{ path: "Dataset/One" }] },
              ],
            }),
        }),
      ).resolves.toMatchObject({ available: 0, missing: ["Dataset/One"] });
    },
  );

  it("reports an escaping dataset symlink as missing", async () => {
    const outside = join(root, "outside.json");
    await writeFile(outside, validDataset);
    await symlink(outside, join(directory, "Dataset_One.json"));

    await expect(
      reconcileDatasets({
        directory,
        manifest: { "1": true },
        fetchFamily: () =>
          Promise.resolve({
            groups: [{ title: "Group", nextstrain: [{ path: "Dataset/One" }] }],
          }),
      }),
    ).resolves.toMatchObject({ available: 0, missing: ["Dataset/One"] });
  });
});
