import { act, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import {
  getCompatibleBlastDatabaseType,
  useBlastDatabaseTypes,
} from "../blast-form-utils";
import {
  defaultBlastFormValues,
  type BlastFormData,
} from "../blast-form-schema";

function BlastDatabaseTypesHarness() {
  const form = useForm({
    defaultValues: defaultBlastFormValues as BlastFormData,
  });
  const databaseTypes = useBlastDatabaseTypes(form);

  return (
    <>
      <form.Field name="db_type">
        {(field) => <output data-testid="db-type">{field.state.value}</output>}
      </form.Field>
      <output data-testid="available-types">
        {databaseTypes.map((type) => type.value).join(",")}
      </output>
      {(["blastn", "blastp", "blastx", "tblastn"] as const).map((program) => (
        <button
          key={program}
          type="button"
          onClick={() => {
            form.setFieldValue("blast_program", program);
            form.setFieldValue(
              "db_type",
              getCompatibleBlastDatabaseType(
                form.state.values.db_type,
                program,
                form.state.values.db_precomputed_database,
              ) as BlastFormData["db_type"],
            );
          }}
        >
          {program}
        </button>
      ))}
    </>
  );
}

describe("useBlastDatabaseTypes", () => {
  it("normalizes every incompatible program transition", async () => {
    const consoleError = vi.mocked(console.error);
    consoleError.mockClear();
    render(<BlastDatabaseTypesHarness />);

    expect(screen.getByTestId("db-type")).toHaveTextContent("fna");
    expect(screen.getByTestId("available-types")).toHaveTextContent("fna,ffn");

    for (const [program, expectedType, availableTypes] of [
      ["blastp", "faa", "faa"],
      ["blastn", "fna", "fna,ffn"],
      ["blastx", "faa", "faa"],
      ["tblastn", "fna", "fna,ffn"],
    ] as const) {
      act(() => {
        screen.getByRole("button", { name: program }).click();
      });
      await waitFor(() => {
        expect(screen.getByTestId("db-type")).toHaveTextContent(expectedType);
      });
      expect(screen.getByTestId("available-types")).toHaveTextContent(
        availableTypes,
      );
    }

    expect(
      consoleError.mock.calls.some((args) =>
        args.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Cannot update a component") &&
            arg.includes("while rendering a different component"),
        ),
      ),
    ).toBe(false);
  });
});
