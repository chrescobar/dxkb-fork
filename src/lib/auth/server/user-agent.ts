/**
 * User-Agent sent on server-side calls to BV-BRC/PATRIC backends.
 *
 * Node's fetch defaults to `User-Agent: node`, which Cloudflare in front of
 * those services answers with a 403 bot challenge ("Just a moment...") instead
 * of the API response. Cloudflare also challenges browser-like and unknown
 * application agents on API routes, so use a recognized non-browser client
 * signature. Symptoms when this is blocked: sign-in authentication succeeds,
 * but the profile lookup 403s and the session is never created.
 */
export const serverUserAgent = "curl/8.7.1 DXKB-V2/1.0";
export const requestTimeoutMs = 15_000;
// export const serverUserAgent = "DXKB-V2/1.0 (+https://www.bv-brc.org)";
