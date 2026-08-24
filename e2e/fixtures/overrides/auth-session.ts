import type { JsonOverride } from "../../mocks/backends";

export const bvbrcCookies = [
  {
    name: "bvbrc_token",
    value: "e2e-test-token",
    path: "/",
    domain: "127.0.0.1",
    httpOnly: true,
    secure: false,
    sameSite: "Strict" as const,
    expires: 4070908800,
  },
  {
    name: "bvbrc_user_id",
    value: "e2e-test-user@patricbrc.org",
    path: "/",
    domain: "127.0.0.1",
    httpOnly: true,
    secure: false,
    sameSite: "Strict" as const,
    expires: 4070908800,
  },
  {
    name: "bvbrc_realm",
    value: "patricbrc.org",
    path: "/",
    domain: "127.0.0.1",
    httpOnly: true,
    secure: false,
    sameSite: "Strict" as const,
    expires: 4070908800,
  },
];

const mockUserProfile = {
  id: "e2e-test-user@patricbrc.org",
  username: "e2e-test-user@patricbrc.org",
  email: "e2e@example.com",
  email_verified: true,
  first_name: "E2E",
  last_name: "User",
  created_at: "2026-01-01T00:00:00Z",
};

export const authSessionOverrides: JsonOverride[] = [
  {
    url: "/api/auth/profile",
    method: "GET",
    body: mockUserProfile,
  },
  {
    url: "/api/auth/ensure-workspace",
    method: "POST",
    body: { success: true, created: [], failures: {} },
  },
];
