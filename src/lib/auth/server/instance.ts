import { createAuth } from "./create";
import { bvbrcIdentity } from "./adapters/bvbrc-identity";
import { cookieSession } from "./adapters/cookie-session";

const authority = createAuth({
  identity: bvbrcIdentity(),
  session: cookieSession(),
});

export const auth = authority.auth;
export const authAdmin = authority.authAdmin;
// eslint-disable-next-line @typescript-eslint/unbound-method -- withAuth is always called as a standalone function, not as a method
export const withAuth = authority.auth.route;
