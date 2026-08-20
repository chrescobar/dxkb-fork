export interface AuthUser {
  id: string;
  username: string;
  email: string;
  realm?: string;
  un?: string;
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
  roles?: string[];
  isImpersonating?: boolean;
  originalUsername?: string;
}

export interface UserProfile {
  affiliation?: string;
  created_by?: string;
  creation_date: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  middle_name?: string;
  last_name: string;
  id: string;
  interests?: string;
  l_id: string;
  last_login: string;
  organisms: string;
  reverification: boolean;
  roles?: string[];
  source: string;
  update_date?: string;
  updated_by?: string;
  verification_code?: string;
  verification_date?: string;
  verification_error?: string;
  verification_send_date?: string;
  settings?: {
    default_job_folder?: string;
  };
}

export interface SigninCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  affiliation?: string;
  organisms?: string;
  interests?: string;
  password: string;
  password_repeat: string;
}

export interface PasswordResetRequest {
  usernameOrEmail: string;
}

export interface PasswordResetResponse {
  message: string;
  success: boolean;
  code?: string;
}

export type AuthErrorCode =
  | "invalid_credentials"
  | "unauthorized"
  | "network"
  | "service_unavailable"
  | "rate_limited"
  | "validation"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unknown";

export interface AuthError {
  message: string;
  code: AuthErrorCode;
  status?: number;
  sessionExpired?: boolean;
}

export type Result<T> =
  { data: T; error: null } | { data: null; error: AuthError };

export interface SessionIdentity {
  token: string;
  userId: string;
  realm?: string;
}

export interface AuthSessionMutation {
  user: AuthUser;
  expiresAt: number;
}
