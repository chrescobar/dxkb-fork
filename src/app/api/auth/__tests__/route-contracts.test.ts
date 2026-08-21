const actions = vi.hoisted(() => ({
  changePassword: vi.fn(),
  exitImpersonation: vi.fn(),
  requestPasswordReset: vi.fn(),
  sendVerificationEmail: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  startImpersonation: vi.fn(),
  verifyEmailToken: vi.fn(),
}));

vi.mock("@/lib/auth/server/actions", () => actions);

import { mockNextRequest } from "@/test-helpers/api-route-helpers";
import { POST as changePassword } from "../change-password/route";
import { POST as forgetPassword } from "../forget-password/route";
import { POST as sendVerificationEmail } from "../send-verification-email/route";
import { POST as signIn } from "../sign-in/email/route";
import { POST as signUp } from "../sign-up/email/route";
import { POST as exitSu } from "../su-exit/route";
import { POST as startSu } from "../su-login/route";
import { GET as verifyEmailToken } from "../verify-email-token/route";

const user = { id: "alice-id", username: "alice", email: "alice@example.com" };
const sessionResult = {
  data: { user, expiresAt: 1_800_000_000_000 },
  error: null,
};
const success = { data: undefined, error: null };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth route contracts", () => {
  it("passes sign-in credentials and returns a redacted session envelope", async () => {
    actions.signIn.mockResolvedValue(sessionResult);
    const credentials = { username: "alice", password: "password1234" };

    const response = await signIn(
      mockNextRequest({ method: "POST", body: credentials }),
      {},
    );

    expect(actions.signIn).toHaveBeenCalledWith(credentials);
    await expect(response.json()).resolves.toEqual({
      user,
      session: {
        token: "",
        expiresAt: new Date(sessionResult.data.expiresAt).toISOString(),
      },
    });
  });

  it("passes sign-up fields and returns a redacted session envelope", async () => {
    actions.signUp.mockResolvedValue(sessionResult);
    const credentials = {
      username: "alice",
      email: "alice@example.com",
      first_name: "Alice",
      last_name: "User",
      password: "password1234",
      password_repeat: "password1234",
    };

    const response = await signUp(
      mockNextRequest({ method: "POST", body: credentials }),
      {},
    );

    expect(actions.signUp).toHaveBeenCalledWith(credentials);
    expect(response.status).toBe(200);
  });

  it("passes an empty object to action validation for malformed JSON", async () => {
    actions.signIn.mockResolvedValue({
      data: null,
      error: {
        code: "validation",
        message: "Credentials are required",
        status: 400,
      },
    });
    const request = new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const response = await signIn(request as never, {});

    expect(actions.signIn).toHaveBeenCalledWith({});
    expect(response.status).toBe(400);
  });

  it("normalizes change-password fields and marks unauthorized sessions expired", async () => {
    actions.changePassword.mockResolvedValue({
      data: null,
      error: {
        code: "unauthorized",
        message: "Authentication required",
        status: 401,
      },
    });

    const response = await changePassword(
      mockNextRequest({
        method: "POST",
        body: { currentPassword: 1, newPassword: null },
      }),
      {},
    );

    expect(actions.changePassword).toHaveBeenCalledWith("", "");
    await expect(response.json()).resolves.toMatchObject({
      code: "session_expired",
    });
  });

  it("passes only the password-reset identifier", async () => {
    actions.requestPasswordReset.mockResolvedValue(success);

    const response = await forgetPassword(
      mockNextRequest({
        method: "POST",
        body: { usernameOrEmail: "alice@example.com", ignored: true },
      }),
      {},
    );

    expect(actions.requestPasswordReset).toHaveBeenCalledWith(
      "alice@example.com",
    );
    expect(response.status).toBe(200);
  });

  it("marks unauthorized verification-email requests as expired sessions", async () => {
    actions.sendVerificationEmail.mockResolvedValue({
      data: null,
      error: {
        code: "unauthorized",
        message: "Authentication required",
        status: 401,
      },
    });

    const response = await sendVerificationEmail(
      mockNextRequest({ method: "POST" }),
      {},
    );

    await expect(response.json()).resolves.toMatchObject({
      code: "session_expired",
    });
  });

  it("passes verification query parameters", async () => {
    actions.verifyEmailToken.mockResolvedValue(success);

    const response = await verifyEmailToken(
      mockNextRequest({
        url: "http://localhost/api/auth/verify-email-token?token=t&username=alice",
      }),
      {},
    );

    expect(actions.verifyEmailToken).toHaveBeenCalledWith("t", "alice");
    expect(response.status).toBe(200);
  });

  it("passes SU credentials and preserves session-expired metadata", async () => {
    actions.startImpersonation.mockResolvedValue({
      data: null,
      error: {
        code: "unauthorized",
        message: "Authentication required",
        status: 401,
        sessionExpired: true,
      },
    });

    const response = await startSu(
      mockNextRequest({
        method: "POST",
        body: { targetUser: "target", password: "password1234" },
      }),
      {},
    );

    expect(actions.startImpersonation).toHaveBeenCalledWith(
      "target",
      "password1234",
    );
    await expect(response.json()).resolves.toMatchObject({
      code: "session_expired",
    });
  });

  it("returns the restored session when exiting SU", async () => {
    actions.exitImpersonation.mockResolvedValue(sessionResult);

    const response = await exitSu(mockNextRequest({ method: "POST" }), {});

    expect(actions.exitImpersonation).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({ user });
  });
});
