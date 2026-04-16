import type {
  AuthUser,
  SigninCredentials,
  SignupCredentials,
} from "@/lib/auth/types";

export type AuthErrorCode =
  | "invalid_credentials"
  | "unauthorized"
  | "network"
  | "service_unavailable"
  | "validation"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unknown";

export interface AuthError {
  message: string;
  code: AuthErrorCode;
  status?: number;
}

export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: AuthError };

export interface AuthPort {
  getSession(): Promise<Result<AuthUser | null>>;
  signIn(credentials: SigninCredentials): Promise<Result<AuthUser>>;
  signUp(input: SignupCredentials): Promise<Result<AuthUser>>;
  signOut(): Promise<Result<void>>;
  impersonate(targetUser: string, password: string): Promise<Result<AuthUser>>;
  exitImpersonation(): Promise<Result<AuthUser>>;
  requestPasswordReset(usernameOrEmail: string): Promise<Result<void>>;
  sendVerificationEmail(): Promise<Result<void>>;
  request(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
