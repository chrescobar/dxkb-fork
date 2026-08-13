import { redirect } from "next/navigation";
import { redirectAfterAuth } from "./redirect-action";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

const redirectMock = vi.mocked(redirect);

describe("redirectAfterAuth", () => {
  it.each([
    ["//attacker.example/path", "/"],
    ["/..//attacker.example/path", "/"],
    ["/\\attacker.example/path", "/"],
    ["https://attacker.example/path", "/"],
    ["not-a-path", "/"],
    ["/services?tab=jobs#latest", "/services?tab=jobs#latest"],
  ])("redirects %s to %s", async (destination, expected) => {
    await expect(redirectAfterAuth(destination)).rejects.toThrow(
      `NEXT_REDIRECT: ${expected}`,
    );
    expect(redirectMock).toHaveBeenCalledWith(expected);
  });
});
