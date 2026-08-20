import { cache } from "react";
import type {
  AuthSessionMutation,
  AuthUser,
  Result,
  SessionIdentity,
  SigninCredentials,
  SignupCredentials,
  UserProfile,
} from "@/lib/auth/types";
import { ensureUserWorkspace } from "@/lib/services/workspace/setup";
import { createServerWorkspaceRpc } from "@/lib/services/workspace/server-rpc";
import { getDefaultRealm } from "@/lib/services/workspace/realm";
import {
  authenticate,
  changePassword as changeIdentityPassword,
  extractRealmFromToken,
  getProfile,
  impersonateUser,
  registerUser,
  requestPasswordReset as requestIdentityPasswordReset,
  sendVerificationEmail as sendIdentityVerificationEmail,
  verifyEmailToken as verifyIdentityEmailToken,
} from "./adapters/bvbrc-identity";
import { fail, ok } from "./result";
import {
  clearCurrentSession,
  clearImpersonationBackup,
  clearSession,
  readImpersonationBackup,
  readSession,
  restoreImpersonationBackup,
  writeImpersonationBackup,
  writeSession,
} from "./session";

function buildUser(
  profile: UserProfile,
  session: SessionIdentity,
  backup?: SessionIdentity | null,
): AuthUser {
  return {
    id: profile.id,
    username: profile.l_id || profile.id,
    email: profile.email,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email_verified: profile.email_verified,
    realm: session.realm,
    roles: profile.roles ?? [],
    ...(backup
      ? { isImpersonating: true, originalUsername: backup.userId }
      : {}),
  };
}

function returnError<T>(result: Result<unknown>): Result<T> {
  if (!result.error) throw new Error("Expected an auth error");
  return { data: null, error: result.error };
}

export async function signIn(
  credentials: SigninCredentials,
): Promise<Result<AuthSessionMutation>> {
  if (!credentials.username || !credentials.password) {
    return fail("validation", "Username and password are required", 400);
  }
  const authenticated = await authenticate(credentials);
  if (authenticated.error) return returnError(authenticated);
  const profile = await getProfile(
    credentials.username,
    authenticated.data.token,
  );
  if (profile.error) return returnError(profile);
  const identity = {
    token: authenticated.data.token,
    userId: profile.data.id,
    realm: extractRealmFromToken(authenticated.data.token),
  };
  const expiresAt = await writeSession(identity);
  return ok({ user: buildUser(profile.data, identity), expiresAt });
}

export async function signUp(
  input: SignupCredentials,
): Promise<Result<AuthSessionMutation>> {
  if (!input.username || !input.email || !input.password) {
    return fail(
      "validation",
      "Username, email, and password are required",
      400,
    );
  }
  if (input.password !== input.password_repeat) {
    return fail("validation", "Passwords do not match", 400);
  }
  const registered = await registerUser(input);
  if (registered.error) return returnError(registered);
  const profile = await getProfile(input.username, registered.data.token);
  if (profile.error) return returnError(profile);
  const identity = {
    token: registered.data.token,
    userId: profile.data.id,
    realm: extractRealmFromToken(registered.data.token),
  };
  const expiresAt = await writeSession(identity);
  try {
    await ensureUserWorkspace({
      rpc: createServerWorkspaceRpc(identity.token),
      userId: identity.userId,
      realm: identity.realm ?? getDefaultRealm(),
    });
  } catch (cause) {
    console.error("Failed to provision workspace for new user", {
      userId: identity.userId,
      cause,
    });
  }
  return ok({ user: buildUser(profile.data, identity), expiresAt });
}

export async function signOut(): Promise<Result<void>> {
  await clearSession();
  return ok(undefined);
}

export async function startImpersonation(
  targetUser: string,
  password: string,
): Promise<Result<AuthSessionMutation>> {
  if (!targetUser || !password) {
    return fail("validation", "Target user and password are required", 400);
  }
  if (await readImpersonationBackup()) {
    return fail("conflict", "Nested impersonation is not allowed", 409);
  }
  const current = await readSession();
  if (!current) {
    const result = fail<AuthSessionMutation>(
      "unauthorized",
      "Authentication required",
      401,
    );
    if (result.error) result.error.sessionExpired = true;
    return result;
  }

  const adminProfile = await getProfile(current.userId, current.token);
  if (adminProfile.error) {
    if (adminProfile.error.code === "unauthorized") {
      await clearCurrentSession();
      adminProfile.error.sessionExpired = true;
    }
    return returnError(adminProfile);
  }
  if (!adminProfile.data.roles?.includes("admin")) {
    return fail("forbidden", "Admin role required", 403);
  }

  const impersonated = await impersonateUser(
    current.userId,
    targetUser,
    password,
  );
  if (impersonated.error) return returnError(impersonated);
  const targetProfile = await getProfile(targetUser, impersonated.data.token);
  if (targetProfile.error) return returnError(targetProfile);

  const targetIdentity = {
    token: impersonated.data.token,
    userId: targetProfile.data.id,
    realm: extractRealmFromToken(impersonated.data.token),
  };
  await writeImpersonationBackup(current);
  let expiresAt: number;
  try {
    expiresAt = await writeSession(targetIdentity);
  } catch (error) {
    await clearImpersonationBackup();
    throw error;
  }
  return ok({
    user: buildUser(targetProfile.data, targetIdentity, current),
    expiresAt,
  });
}

export async function exitImpersonation(): Promise<
  Result<AuthSessionMutation>
> {
  const backup = await readImpersonationBackup();
  if (!backup) {
    return fail("validation", "No active impersonation session", 400);
  }
  const profile = await getProfile(backup.userId, backup.token);
  if (profile.error) return returnError(profile);
  const expiresAt = await restoreImpersonationBackup();
  if (expiresAt === null) {
    return fail("validation", "No active impersonation session", 400);
  }
  return ok({ user: buildUser(profile.data, backup), expiresAt });
}

export async function requestPasswordReset(
  usernameOrEmail: string,
): Promise<Result<void>> {
  if (!usernameOrEmail) {
    return fail("validation", "Email or username is required", 400);
  }
  return requestIdentityPasswordReset(usernameOrEmail);
}

export async function sendVerificationEmail(): Promise<Result<void>> {
  const current = await readSession();
  if (!current) return fail("unauthorized", "Authentication required", 401);
  const result = await sendIdentityVerificationEmail(
    current.userId,
    current.token,
  );
  if (result.error?.code === "unauthorized") await clearCurrentSession();
  return result;
}

export async function verifyEmailToken(
  verificationToken: string,
  username: string,
): Promise<Result<void>> {
  if (!verificationToken || !username) {
    return fail(
      "validation",
      "Verification token and username are required",
      400,
    );
  }
  return verifyIdentityEmailToken(verificationToken, username);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<Result<void>> {
  if (!currentPassword || !newPassword) {
    return fail(
      "validation",
      "Current password and new password are required",
      400,
    );
  }
  const current = await readSession();
  if (!current) return fail("unauthorized", "Authentication required", 401);
  const result = await changeIdentityPassword(
    current.userId,
    current.token,
    currentPassword,
    newPassword,
  );
  if (result.error?.code === "unauthorized") await clearCurrentSession();
  return result;
}

async function readCurrentUser(): Promise<AuthUser | null> {
  const current = await readSession();
  if (!current) return null;
  const profile = await getProfile(current.userId, current.token);
  if (profile.error) return null;
  return buildUser(profile.data, current, await readImpersonationBackup());
}

export const getCurrentUser = cache(readCurrentUser);
