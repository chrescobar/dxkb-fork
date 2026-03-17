import { getRequiredEnv } from "../env";

describe("getRequiredEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the value when the env var is set", () => {
    vi.stubEnv("TEST_VAR", "hello");

    expect(getRequiredEnv("TEST_VAR")).toBe("hello");
  });

  it("throws when the env var is missing (undefined)", () => {
    vi.stubEnv("TEST_VAR", undefined as unknown as string);

    expect(() => getRequiredEnv("TEST_VAR")).toThrow(
      "Missing required environment variable: TEST_VAR",
    );
  });

  it("throws when the env var is an empty string", () => {
    vi.stubEnv("TEST_VAR", "");

    expect(() => getRequiredEnv("TEST_VAR")).toThrow(
      "Missing required environment variable: TEST_VAR",
    );
  });
});
