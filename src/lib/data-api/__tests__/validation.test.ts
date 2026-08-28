import { describe, expect, it } from "vitest";
import { dataResources } from "../types";
import { dataQueryKeys } from "../query-options";
import { resourceRegistry } from "../resources";
import {
  genomeRecordSchema,
  serologyRecordSchema,
  surveillanceRecordSchema,
} from "../schemas";
import {
  maxExportRows,
  maxSelectedRows,
  validateDataApiRequest,
} from "../validation";

describe("data API contracts", () => {
  it("registers every required resource with an allowed stable ID", () => {
    expect(Object.keys(resourceRegistry).sort()).toEqual(
      [...dataResources].sort(),
    );
    for (const resource of dataResources) {
      const definition = resourceRegistry[resource];
      expect(definition.fields[definition.idField].selectable).toBe(true);
      expect(() => definition.schema.parse({})).toThrow();
    }
  });

  it("records compound sample field cardinality explicitly", () => {
    expect(
      resourceRegistry.surveillance.fields.pathogen_test_type.cardinality,
    ).toBe("multiple");
    expect(resourceRegistry.serology.fields.test_type.cardinality).toBe(
      "scalar",
    );
  });

  it("allows a valid collection and rejects disallowed fields and sorts", () => {
    expect(
      validateDataApiRequest("genome", {
        operation: "collection",
        fields: ["genome_id"],
        facets: ["genus"],
      }),
    ).toMatchObject({ operation: "collection" });
    expect(() =>
      validateDataApiRequest("genome", {
        operation: "collection",
        fields: ["password"],
      }),
    ).toThrow(/cannot be used/);
    expect(() =>
      validateDataApiRequest("genome", {
        operation: "collection",
        sort: { field: "password", direction: "asc" },
      }),
    ).toThrow(/cannot sort/);
  });

  it("enforces paging and bulk operation bounds", () => {
    expect(() =>
      validateDataApiRequest("genome", {
        operation: "collection",
        pageSize: 201,
      }),
    ).toThrow();
    expect(() =>
      validateDataApiRequest("genome", {
        operation: "selected",
        ids: Array.from({ length: maxSelectedRows + 1 }, (_, index) =>
          String(index),
        ),
      }),
    ).toThrow();
    expect(() =>
      validateDataApiRequest("genome", {
        operation: "export",
        fields: ["genome_id"],
        limit: maxExportRows + 1,
      }),
    ).toThrow();
    expect(() =>
      validateDataApiRequest("genome", {
        operation: "export",
        fields: ["genome_id"],
        limit: 1,
        offset: maxExportRows,
      }),
    ).toThrow("Exports are limited to 10,000 rows");
  });

  it("preserves digit-only experiment identifiers as strings", () => {
    expect(
      validateDataApiRequest("experiment", {
        operation: "member",
        id: "00042",
      }),
    ).toMatchObject({ id: "00042" });
  });

  it("validates control fields while passing through additional fields", () => {
    expect(
      genomeRecordSchema.parse({
        genome_id: "1.1",
        custom_field: { nested: true },
      }),
    ).toEqual({ genome_id: "1.1", custom_field: { nested: true } });
    expect(() => genomeRecordSchema.parse({ genome_id: 1.1 })).toThrow();
    expect(() =>
      surveillanceRecordSchema.parse({
        id: "row-1",
        pathogen_test_type: "RAT",
      }),
    ).toThrow();
    expect(() =>
      serologyRecordSchema.parse({ id: "row-2", test_type: ["RAT"] }),
    ).toThrow();
  });

  it("builds resource-independent deterministic query keys", () => {
    const request = {
      page: 2,
      rql: "eq(genome_id,1.1)",
      fields: ["genome_id"],
    };
    expect(dataQueryKeys.collection("genome", request)).toEqual([
      "data-api",
      "genome",
      "collection",
      request,
    ]);
  });
});
