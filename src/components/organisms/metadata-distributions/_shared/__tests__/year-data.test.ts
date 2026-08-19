import { labelStep, parseYearData } from "../year-data";

describe("parseYearData", () => {
  it("returns year/count pairs sorted ascending", () => {
    const result = parseYearData([
      { label: "2022", value: 5 },
      { label: "2020", value: 3 },
      { label: "2021", value: 8 },
    ]);
    expect(result).toEqual([
      { year: 2020, count: 3 },
      { year: 2021, count: 8 },
      { year: 2022, count: 5 },
    ]);
  });

  it("drops non-integer labels and empty strings", () => {
    const result = parseYearData([
      { label: "2020", value: 5 },
      { label: "unknown", value: 1 },
      { label: "", value: 2 },
      { label: "3.14", value: 3 },
    ]);
    expect(result).toEqual([{ year: 2020, count: 5 }]);
  });

  it("drops year 0 (unknown/missing year sentinel)", () => {
    const result = parseYearData([
      { label: "0", value: 42 },
      { label: "2020", value: 5 },
      { label: "2021", value: 8 },
    ]);
    expect(result).toEqual([
      { year: 2020, count: 5 },
      { year: 2021, count: 8 },
    ]);
  });

  it("returns [] for empty input", () => {
    expect(parseYearData([])).toEqual([]);
  });
});

describe("labelStep", () => {
  it("uses step 1 for <= 15 labels", () => {
    expect(labelStep(1)).toBe(1);
    expect(labelStep(15)).toBe(1);
  });

  it("uses step 2 for 16..30", () => {
    expect(labelStep(16)).toBe(2);
    expect(labelStep(30)).toBe(2);
  });

  it("uses step 5 for 31..60", () => {
    expect(labelStep(31)).toBe(5);
    expect(labelStep(60)).toBe(5);
  });

  it("uses step 10 for > 60", () => {
    expect(labelStep(61)).toBe(10);
    expect(labelStep(200)).toBe(10);
  });
});
