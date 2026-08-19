/**
 * User-Agent sent on server-side calls to BV-BRC/PATRIC backends.
 *
 * Node's fetch defaults to `User-Agent: node`, which Cloudflare in front of
 * those services answers with a 403 bot challenge ("Just a moment...") instead
 * of the API response. Any conventional UA passes. Symptoms when this is
 * missing: sign-in succeeds (POST /authenticate is not challenged) but the
 * profile lookup 403s, so the user appears unverified and the session cannot
 * be revalidated on refresh.
 */
export const serverUserAgent = "DXKB-V2/1.0 (+https://www.bv-brc.org)";
