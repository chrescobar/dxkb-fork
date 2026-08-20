import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/server/actions";
import { redirectAfterAuth, signOutAndRedirect } from "./redirect-action";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
}));

vi.mock("@/lib/auth/server/actions", () => ({
  signOut: vi.fn(),
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

  it("clears the session before redirecting sign-out", async () => {
    const formData = new FormData();
    formData.set("redirectTo", "/sign-in");

    await expect(signOutAndRedirect(formData)).rejects.toThrow(
      "NEXT_REDIRECT: /sign-in",
    );
    expect(signOut).toHaveBeenCalledOnce();
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });
});
