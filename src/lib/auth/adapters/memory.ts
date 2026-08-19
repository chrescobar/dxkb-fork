import type { AuthPort, AuthErrorCode, Result } from "@/lib/auth/port";
import type {
  AuthUser,
  SigninCredentials,
  SignupCredentials,
} from "@/lib/auth/types";

interface MemoryAccount {
  user: AuthUser;
  password: string;
}

export interface MemoryAdapterOptions {
  accounts?: MemoryAccount[];
  initialSession?: AuthUser | null;
  onRequest?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface MemoryAuthAdapter extends AuthPort {
  setSession(user: AuthUser | null): void;
  addAccount(account: MemoryAccount): void;
}

export function memoryAuthAdapter(
  options: MemoryAdapterOptions = {},
): MemoryAuthAdapter {
  const accounts = new Map<string, MemoryAccount>();
  for (const account of options.accounts ?? []) {
    accounts.set(account.user.username, account);
  }

  let session: AuthUser | null = options.initialSession ?? null;
  let impersonationBackup: AuthUser | null = null;

  const fail = <T>(message: string, code: AuthErrorCode): Result<T> => ({
    data: null,
    error: { message, code },
  });

  return {
    setSession(user) {
      session = user;
    },
    addAccount(account) {
      accounts.set(account.user.username, account);
    },

    getSession() {
      return Promise.resolve({ data: session, error: null });
    },

    signIn({ username, password }: SigninCredentials) {
      const account = accounts.get(username);
      if (!account || account.password !== password) {
        return Promise.resolve(fail("Invalid credentials", "invalid_credentials"));
      }
      session = account.user;
      return Promise.resolve({ data: session, error: null });
    },

    signUp(input: SignupCredentials) {
      if (accounts.has(input.username)) {
        return Promise.resolve(fail("Username already exists", "conflict"));
      }
      const user: AuthUser = {
        username: input.username,
        email: input.email,
        token: "memory-token",
        first_name: input.first_name,
        last_name: input.last_name,
        email_verified: false,
      };
      accounts.set(input.username, { user, password: input.password });
      session = user;
      return Promise.resolve({ data: user, error: null });
    },

    signOut() {
      session = null;
      impersonationBackup = null;
      return Promise.resolve({ data: undefined, error: null });
    },

    impersonate(targetUser, password) {
      if (!session) {
        return Promise.resolve(fail("Not authenticated", "unauthorized"));
      }
      const target = accounts.get(targetUser);
      if (!target || target.password !== password) {
        return Promise.resolve(fail("Invalid credentials", "invalid_credentials"));
      }
      impersonationBackup = session;
      session = {
        ...target.user,
        isImpersonating: true,
        originalUsername: impersonationBackup.username,
      };
      return Promise.resolve({ data: session, error: null });
    },

    exitImpersonation() {
      if (!impersonationBackup) {
        return Promise.resolve(fail("No active impersonation session", "validation"));
      }
      session = impersonationBackup;
      impersonationBackup = null;
      return Promise.resolve({ data: session, error: null });
    },

    requestPasswordReset() {
      return Promise.resolve({ data: undefined, error: null });
    },

    sendVerificationEmail() {
      return Promise.resolve({ data: undefined, error: null });
    },

    request(input, init) {
      if (options.onRequest) return options.onRequest(input, init);
      return Promise.resolve(
        new Response(null, { status: session ? 200 : 401 }),
      );
    },
  };
}
