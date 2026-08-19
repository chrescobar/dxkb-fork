import type {
  SigninCredentials,
  SignupCredentials,
  UserProfile,
} from "@/lib/auth/types";
import { ok, fail } from "../result";
import type {
  IdentityProviderPort,
  SessionIdentity,
  SessionStoragePort,
} from "../ports";

export interface InMemoryAccount {
  username: string;
  password: string;
  token: string;
  profile: UserProfile;
}

export interface InMemoryIdentityOptions {
  accounts?: InMemoryAccount[];
  suPassword?: string;
  clockMs?: () => number;
}

export interface InMemoryIdentityAdapter extends IdentityProviderPort {
  addAccount(account: InMemoryAccount): void;
  getAccount(username: string): InMemoryAccount | undefined;
  resetPasswordRequests(): string[];
  verificationEmailRequests(): { userId: string; token: string }[];
}

export function inMemoryIdentity(
  options: InMemoryIdentityOptions = {},
): InMemoryIdentityAdapter {
  const accounts = new Map<string, InMemoryAccount>();
  for (const account of options.accounts ?? []) {
    accounts.set(account.username, account);
  }
  const resetRequests: string[] = [];
  const verifyRequests: { userId: string; token: string }[] = [];
  const now = () =>
    new Date(options.clockMs ? options.clockMs() : Date.now()).toISOString();

  function findByToken(token: string): InMemoryAccount | undefined {
    for (const account of accounts.values()) {
      if (account.token === token) return account;
    }
    return undefined;
  }

  return {
    addAccount(account) {
      accounts.set(account.username, account);
    },
    getAccount(username) {
      return accounts.get(username);
    },
    resetPasswordRequests() {
      return [...resetRequests];
    },
    verificationEmailRequests() {
      return [...verifyRequests];
    },

    authenticate({ username, password }: SigninCredentials) {
      const account = accounts.get(username);
      if (!account || account.password !== password) {
        return Promise.resolve(fail("invalid_credentials", "Invalid credentials", 401));
      }
      return Promise.resolve(ok({ token: account.token }));
    },

    signUp(input: SignupCredentials) {
      if (accounts.has(input.username)) {
        return Promise.resolve(fail("conflict", "Username already exists", 409));
      }
      const account: InMemoryAccount = {
        username: input.username,
        password: input.password,
        token: `memory-token:${input.username}`,
        profile: {
          id: input.username,
          email: input.email,
          email_verified: false,
          first_name: input.first_name,
          last_name: input.last_name,
          creation_date: now(),
          last_login: now(),
          organisms: input.organisms ?? "",
          reverification: false,
          source: "memory",
          l_id: input.username,
        },
      };
      accounts.set(input.username, account);
      return Promise.resolve(ok({ token: account.token }));
    },

    impersonate(_actingUserId: string, targetUser: string, password: string) {
      if (options.suPassword !== undefined && password !== options.suPassword) {
        return Promise.resolve(fail("invalid_credentials", "Invalid credentials", 401));
      }
      const target = accounts.get(targetUser);
      if (!target) {
        return Promise.resolve(fail("not_found", "Target user not found", 404));
      }
      return Promise.resolve(ok({ token: target.token }));
    },

    validateToken(userId: string, token: string) {
      const account = accounts.get(userId) ?? findByToken(token);
      if (!account || account.token !== token) {
        return Promise.resolve(fail("unauthorized", "Token validation failed", 401));
      }
      return Promise.resolve(ok(account.profile));
    },

    fetchProfile(userId: string) {
      return Promise.resolve(accounts.get(userId)?.profile ?? null);
    },

    requestPasswordReset(usernameOrEmail: string) {
      resetRequests.push(usernameOrEmail);
      return Promise.resolve(ok(undefined));
    },

    sendVerificationEmail(userId: string, token: string) {
      verifyRequests.push({ userId, token });
      return Promise.resolve(ok(undefined));
    },

    verifyEmailToken(_verificationToken: string, username: string) {
      const account = accounts.get(username);
      if (!account) return Promise.resolve(fail("not_found", "User not found", 404));
      accounts.set(username, {
        ...account,
        profile: { ...account.profile, email_verified: true },
      });
      return Promise.resolve(ok(undefined));
    },

    changePassword(userId: string, token: string, currentPassword: string, newPassword: string) {
      const account = accounts.get(userId);
      if (!account || account.token !== token) {
        return Promise.resolve(fail("unauthorized", "Unauthorized", 401));
      }
      if (account.password !== currentPassword) {
        return Promise.resolve(fail("validation", "Current password is incorrect", 400));
      }
      accounts.set(userId, { ...account, password: newPassword });
      return Promise.resolve(ok(undefined));
    },
  };
}

export interface InMemorySessionOptions {
  initial?: SessionIdentity | null;
  initialBackup?: SessionIdentity | null;
}

export interface InMemorySessionAdapter extends SessionStoragePort {
  inspect(): { current: SessionIdentity | null; backup: SessionIdentity | null };
}

export function inMemorySession(
  options: InMemorySessionOptions = {},
): InMemorySessionAdapter {
  let current: SessionIdentity | null = options.initial ?? null;
  let backup: SessionIdentity | null = options.initialBackup ?? null;

  return {
    inspect() {
      return { current, backup };
    },

    read() {
      return Promise.resolve(current);
    },
    write(identity: SessionIdentity) {
      current = identity;
      return Promise.resolve();
    },
    clear() {
      current = null;
      backup = null;
      return Promise.resolve();
    },
    readBackup() {
      return Promise.resolve(backup);
    },
    writeBackup(identity: SessionIdentity) {
      backup = identity;
      return Promise.resolve();
    },
    clearBackup() {
      backup = null;
      return Promise.resolve();
    },
  };
}
