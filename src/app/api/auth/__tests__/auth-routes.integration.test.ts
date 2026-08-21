import { http, HttpResponse } from "msw";
import { server } from "@/test-helpers/msw-server";
import {
  clearTestCookies,
  mockNextRequest,
  setTestSession,
  testCookieStore,
} from "@/test-helpers/api-route-helpers";
import { POST as startSu } from "../su-login/route";

const userAuthUrl = "https://auth.test/sign-in";
const userUrl = "https://user.test/user";
const adminToken = "un=admin@bvbrc|admin-token";

const adminProfile = {
  id: "admin-id",
  l_id: "admin",
  email: "admin@example.com",
  first_name: "Ada",
  last_name: "Admin",
  email_verified: true,
  creation_date: "",
  last_login: "",
  organisms: "",
  reverification: false,
  source: "test",
  roles: ["admin"],
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
    http.get(`${userUrl}/:userId`, ({ params, request }) => {
      const token = request.headers.get("Authorization");
      if (
        (params.userId === "admin-id" || params.userId === "admin") &&
        token === adminToken
      ) {
        return HttpResponse.json(adminProfile);
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

    setTestSession({ token: adminToken, userId: "admin-id" });
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
});
