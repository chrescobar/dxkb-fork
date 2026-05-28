# Auth API Contract

This document defines the wire contract for all `/api/auth/*` routes. Every new auth endpoint must follow these rules. Consolidated under [DXKBCORE-153].

---

## Error envelope

Every `/api/auth/*` route returns exactly one error shape:

```json
{ "error": "<message>", "code": "<ApiErrorCode>" }
```

HTTP status is canonical. `code` is a machine-readable category. This matches the project-wide `{error, code, details?}` shape used by `errorResponse` on non-auth routes. Auth routes omit `details` because `Result.error` has no upstream data field.

---

## Success envelopes

Auth routes have two success envelope families:

| Family | Success body | Routes |
|---|---|---|
| **Session** | `{user, session}` | sign-in, sign-up, get-session, su-login, su-exit |
| **Ack** | `{success: true}` | sign-out, forget-password, send-verification-email, verify-email-token, change-password, profile (POST) |

Two routes are documented exceptions (see [Exceptions](#exceptions) below).

---

## Status-code mapping

All status mapping flows through `statusFor()` in `src/lib/auth/server/errors.ts`:

| Error code | HTTP status |
|---|---|
| `invalid_credentials`, `unauthorized` | 401 |
| `forbidden` | 403 |
| `not_found` | 404 |
| `conflict` | 409 |
| `validation` | 400 |
| `service_unavailable` | 503 |
| `network` | **502** (not 503) |
| anything else | 500 |

`code` in the error body is derived from the HTTP status via `statusToErrorCode()` in `src/lib/api/types.ts`:

| HTTP status | `code` |
|---|---|
| 401 | `unauthenticated` |
| 403 | `forbidden` |
| 404 | `not_found` |
| 4xx | `validation` |
| 5xx | `upstream` |

---

## Endpoint table

| Method | Path | Envelope | Request body | Success body | Auth required |
|---|---|---|---|---|---|
| POST | `/api/auth/sign-in/email` | Session | `{username, password}` | `{user, session}` | No |
| POST | `/api/auth/sign-up/email` | Session | `SignupCredentials` | `{user, session}` | No |
| GET | `/api/auth/get-session` | Session | — | `{user, session}` | No |
| POST | `/api/auth/sign-out` | Ack | — | `{success: true}` | No |
| POST | `/api/auth/forget-password` | Ack | `{usernameOrEmail}` or `{email}` | `{success: true}` | No |
| POST | `/api/auth/send-verification-email` | Ack | — | `{success: true}` | Yes (cookie) |
| GET | `/api/auth/verify-email-token` | Ack | `?token=&username=` | `{success: true}` | No |
| POST | `/api/auth/change-password` | Ack | `{currentPassword, newPassword}` | `{success: true}` | Yes (cookie) |
| GET | `/api/auth/profile` | Passthrough | — | upstream profile JSON | Yes (cookie) |
| POST | `/api/auth/profile` | Ack | JSON Patch array | `{success: true}` | Yes (cookie) |
| POST | `/api/auth/su-login` | Session | `{targetUser, password}` | `{user, session}` | No |
| POST | `/api/auth/su-exit` | Session | — | `{user, session}` | Yes (cookie) |
| POST | `/api/auth/ensure-workspace` | Exception | — | `{success: true, created, failures}` | Yes (cookie) |

---

## Nine rules

1. **Every auth route returns a `Result<T>` from `authAdmin` or an upstream-proxied response, never a hand-built envelope.**
   New behavior belongs as a method on `authAdmin`. The route file is 1–5 lines of dispatch.

2. **The two envelope helpers are the only path to a response.**
   `respondWithSession` for routes that return a user. `respondWithAck` for routes that return no payload. Adding a third requires updating this document.

3. **All validation lives in `authAdmin`, not the route.**
   The service layer already returns `{error: {code: "validation", ...}}` for bad inputs. Routes do not re-check, re-message, or re-map. Body parsing uses `await request.json().catch(() => ({}))` so malformed JSON flows to `authAdmin` as an empty object and gets a clean 400 validation response.

4. **All status-code mapping flows through `statusFor()`.**
   Routes do not map error codes to status codes themselves. New error codes go in `AuthErrorCode` + `statusFor()`.

5. **One error envelope on auth routes.**
   `{error, code}` with HTTP status from `statusFor()`. No route emits `{message}` as the error field.

6. **No route emits `success: false`. No route emits a non-empty success message string in the body.**
   HTTP status carries success/failure. The browser caller branches on `response.ok`.

7. **No route catches an error and re-throws it as a different error.**
   Either let the throw propagate (the wrapper formats it) or convert to a `Result.error` at the `authAdmin` layer.

8. **Tests assert on `response.status` and the typed body shape, not on string contents of success messages.**

9. **Adding a new auth endpoint follows this checklist:**
   - Add a method to `authAdmin` (and `AuthAdmin` interface, and both adapters).
   - Add the route file: 1–5 lines, dispatches to the helper.
   - Add unit tests for the `authAdmin` method and a thin route test.
   - If browser-callable, add to `AuthPort` and both adapters.
   - Update this document's endpoint table.

---

## Exceptions

Two routes don't fit the ack/session pattern cleanly, but both share the `{error, code}` error envelope:

- **`GET /api/auth/profile`** — Returns upstream profile JSON unchanged on success (not `{success: true}`). Useful because callers need the profile fields directly.
- **`POST /api/auth/ensure-workspace`** — Returns `{success: true, created, failures}` because the caller needs the failure list for logging. Uses `auth.route()` and lets the outer catch handle errors via `errorResponse`.

New exceptions require adding a row to this section.

---

## Adding a new endpoint

```ts
// 1. Add method to authAdmin in src/lib/auth/server/admin.ts
async function myAction(arg: string): Promise<Result<void>> {
  // validation...
  const result = await identity.myAction(arg);
  if (result.error) return forwardError(result.error);
  return ok(undefined);
}

// 2. Add the route file (1-5 lines)
import { NextRequest } from "next/server";
import { authAdmin } from "@/lib/auth/server/instance";
import { respondWithAck } from "@/lib/auth/server/respond";
import { withErrorHandling } from "@/lib/auth/server/errors";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));
  return respondWithAck(await authAdmin.myAction(body.arg ?? ""));
});
```

---

## What this consolidation prevents

Before DXKBCORE-153, the auth surface had four different response envelope shapes and three different error shapes. Key problems:

1. **Unknowable contract**: Every auth route had its own implicit error shape. Shared error handling required reading each route's source.
2. **Status-code disagreements**: `forget-password` mapped `network` errors to 503; `errors.ts` mapped the same code to 502. One failure mode appeared as two different signals.
3. **Split error envelopes**: The `profile` route could emit either `{message}` (handler-controlled) or `{error, code, details}` (uncaught-throw path), forcing clients to check both fields.

After DXKBCORE-153: every `/api/auth/*` route emits `{error, code}` on failure — the same shape the rest of the project already uses.
