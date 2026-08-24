/**
 * Recorded HARs reference the host the recorder was driven against (e.g.
 * `http://127.0.0.1:3010`) but specs run against a different port (E2E_PORT,
 * default 3020). The recorder rewrites the recorded host to this stable
 * placeholder. Specs consume recorded paths through `harOverridesFor`, so the
 * live test origin does not need to match. Kept in its own module so importing
 * it from specs does not trigger the recorder's `main()` entry point.
 */
export const harReplayHostPlaceholder = "http://e2e-har-replay.local";

/**
 * Realm-qualified user id baked into the recorded HARs. The journey recorders
 * authenticate against the BV-BRC `bvbrc` realm, so every recorded
 * `Workspace.*` call keys its response against `e2e-test-user@bvbrc`. Specs
 * that drive HAR-replay journeys must navigate to this id so the workspace
 * browser's outbound calls land on the recorded entries — the spec's mocked
 * cookies use a different realm (`patricbrc.org`) but only need to satisfy
 * the middleware's existence check.
 */
export const recordedTestUserId = "e2e-test-user@bvbrc";
