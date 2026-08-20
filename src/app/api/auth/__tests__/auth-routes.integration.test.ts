import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import {
  clearTestCookies,
  mockNextRequest,
  mockSessionCookies,
  testCookieStore,
} from "@/test-helpers/api-route-helpers";
import { getCurrentUser } from "@/lib/auth/server/actions";
import { POST as signIn } from "../sign-in/email/route";
import { POST as startSu } from "../su-login/route";
import { POST as exitSu } from "../su-exit/route";
import { signOutAndRedirect } from "@/app/(auth)/redirect-action";

const userAuthUrl = "https://auth.test/sign-in";
const userUrl = "https://user.test/user";
const adminToken = "un=admin@bvbrc|admin-token";
const targetToken = "un=target@bvbrc|target-token";

const adminProfile = {
  id: "admin-id",
  l_id: "admin",
  email: "admin@example.com",
  first_name: "Ada",
  last_name: "Admin",
  email_verified: true,
  roles: ["admin"],
};

const targetProfile = {
  id: "target-id",
  l_id: "target",
  email: "target@example.com",
  first_name: "Terry",
  last_name: "Target",
  email_verified: true,
  roles: [],
};

function cookie(name: string): string | undefined {
  return testCookieStore.get(name)?.value;
}

beforeEach(() => {
  process.env.USER_AUTH_URL = userAuthUrl;
  process.env.USER_URL = userUrl;

  server.use(
    http.post(
      userAuthUrl,
      () =>
        new HttpResponse(adminToken, {
          headers: { Authorization: adminToken },
        }),
    ),
    http.post(`${userAuthUrl}/sulogin`, () => new HttpResponse(targetToken)),
    http.get(`${userUrl}/:userId`, ({ params, request }) => {
      const token = request.headers.get("Authorization");
      if (params.userId === "admin-id" && token === adminToken) {
        return HttpResponse.json(adminProfile);
      }
      if (params.userId === "target-id" && token === targetToken) {
        return HttpResponse.json(targetProfile);
      }
      if (params.userId === "admin" && token === adminToken) {
        return HttpResponse.json(adminProfile);
      }
      if (params.userId === "target" && token === targetToken) {
        return HttpResponse.json(targetProfile);
      }
      return new HttpResponse(null, { status: 401 });
    }),
  );
});

afterEach(() => {
  delete process.env.USER_AUTH_URL;
  delete process.env.USER_URL;
  clearTestCookies();
});

describe("auth route lifecycle", () => {
  it("distinguishes an expired admin session from a rejected target token", async () => {
    const missingSessionResponse = await startSu(
      mockNextRequest({
        method: "POST",
        url: "http://localhost:3019/api/auth/su-login",
        body: { targetUser: "target", password: "password" },
      }),
      {},
    );
    expect(missingSessionResponse.status).toBe(401);
    await expect(missingSessionResponse.json()).resolves.toMatchObject({
      code: "session_expired",
    });

    mockSessionCookies({ token: adminToken, userId: "admin-id" });
    server.use(
      http.post(`${userAuthUrl}/sulogin`, () =>
        HttpResponse.json(
          { error: "Rejected target credentials" },
          { status: 401 },
        ),
      ),
    );
    const rejectedTargetResponse = await startSu(
      mockNextRequest({
        method: "POST",
        url: "http://localhost:3019/api/auth/su-login",
        body: { targetUser: "target", password: "password" },
      }),
      {},
    );
    expect(rejectedTargetResponse.status).toBe(401);
    await expect(rejectedTargetResponse.json()).resolves.toMatchObject({
      code: "unauthenticated",
    });
    expect(cookie("bvbrc_token")).toBe(adminToken);
  });

  it("signs in, reads the cookie session, enters and exits SU, then signs out before redirecting", async () => {
    const signInResponse = await signIn(
      mockNextRequest({
        method: "POST",
        url: "http://localhost:3019/api/auth/sign-in/email",
        body: { username: "admin", password: "password" },
      }),
      {},
    );

    expect(signInResponse.status).toBe(200);
    await expect(signInResponse.json()).resolves.toMatchObject({
      user: { id: "admin-id", username: "admin", roles: ["admin"] },
      session: { token: "", expiresAt: expect.any(String) as string },
    });
    expect(cookie("bvbrc_token")).toBe(adminToken);
    expect(cookie("bvbrc_user_id")).toBe("admin-id");
    expect(cookie("bvbrc_realm")).toBe("bvbrc");
    await expect(getCurrentUser()).resolves.toMatchObject({
      id: "admin-id",
      username: "admin",
    });

    const suResponse = await startSu(
      mockNextRequest({
        method: "POST",
        url: "http://localhost:3019/api/auth/su-login",
        body: { targetUser: "target", password: "password" },
      }),
      {},
    );

    expect(suResponse.status).toBe(200);
    await expect(suResponse.json()).resolves.toMatchObject({
      user: {
        id: "target-id",
        username: "target",
        isImpersonating: true,
        originalUsername: "admin-id",
      },
    });
    expect(cookie("bvbrc_token")).toBe(targetToken);
    expect(cookie("bvbrc_user_id")).toBe("target-id");
    expect(cookie("bvbrc_su_original_token")).toBe(adminToken);
    expect(cookie("bvbrc_su_original_user_id")).toBe("admin-id");
    await expect(getCurrentUser()).resolves.toMatchObject({
      id: "target-id",
      isImpersonating: true,
      originalUsername: "admin-id",
    });

    const exitResponse = await exitSu(
      mockNextRequest({
        method: "POST",
        url: "http://localhost:3019/api/auth/su-exit",
      }),
      {},
    );

    expect(exitResponse.status).toBe(200);
    await expect(exitResponse.json()).resolves.toMatchObject({
      user: { id: "admin-id", username: "admin" },
    });
    expect(cookie("bvbrc_token")).toBe(adminToken);
    expect(cookie("bvbrc_user_id")).toBe("admin-id");
    expect(cookie("bvbrc_su_original_token")).toBeUndefined();
    expect(cookie("bvbrc_su_original_user_id")).toBeUndefined();
    await expect(getCurrentUser()).resolves.toMatchObject({
      id: "admin-id",
      username: "admin",
    });

    testCookieStore.set.mockClear();
    const formData = new FormData();
    formData.set("redirectTo", "/sign-in");
    await expect(signOutAndRedirect(formData)).rejects.toThrow(
      "NEXT_REDIRECT: /sign-in",
    );

    expect(cookie("bvbrc_token")).toBeUndefined();
    expect(cookie("bvbrc_user_id")).toBeUndefined();
    expect(cookie("bvbrc_realm")).toBeUndefined();
    expect(testCookieStore.set.mock.calls.map(([name]) => name)).toEqual(
      expect.arrayContaining([
        "bvbrc_token",
        "bvbrc_user_id",
        "bvbrc_realm",
        "bvbrc_su_original_token",
        "bvbrc_su_original_user_id",
        "bvbrc_su_original_realm",
      ]),
    );
  });
});
