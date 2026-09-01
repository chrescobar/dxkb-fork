export function displaySummary(value: unknown): string {
  if (Array.isArray(value)) {
    const values = value.filter(
      (item): item is string | number | boolean | bigint =>
        item !== "" &&
        ["string", "number", "boolean", "bigint"].includes(typeof item),
    );
    return values.length > 0 ? values.map(String).join(", ") : "Not available";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value === "" ? "Not available" : String(value);
  }
  return "Not available";
}
