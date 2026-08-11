# Architecture (deep reference)

On-demand companion to `.claude/CLAUDE.md`. Read this when you need the full module map; the CLAUDE.md summary + on-pattern recipes cover most day-to-day work.

**DXKB V2** is a Next.js 16 app (App Router) serving as a Disease X Knowledge Base — a bioinformatics platform for genomics, metagenomics, and viral research.

## App Router structure (`src/app/`)

Route groups `(…)` are organizational and do NOT appear in the URL.

- `/` — Public home page (search, news, statistics)
- `(auth)/` — `sign-in`, `sign-up`, `forgot-password`
- `(footer)/` — static content pages (about, faq, news, privacy-policy, team, etc.)
- `(views)/` — BV-BRC data view pages: `genome`, `taxonomy`, `strain`, `feature`, `epitope`, `experiment`, `serology`, `surveillance`, `protein-structure`, `domains-and-motifs`. Rendered off the view registry (see **Views & organism landing**)
- `/organisms/(all|bacteria|viruses)/...` — organism landing pages (tabbed; driven by `_config.ts` + view registry)
- `/workspace/...` — workspace file browser. Route shapes: `/workspace/[username]/home/[[...path]]`, `/workspace/[username]/[folder]/[[...path]]`, `/workspace/home/[[...path]]`, `/workspace/shared/[[...path]]`, `/workspace/public/[username]/[...path]`, `/workspace/workshop`
- `/services/(genomics|metagenomics|phylogenomics|protein-tools|utilities|viral-tools)/...` — service submission forms (route groups as categories)
- `/search/` — Global search
- `/jobs/` — Job monitoring
- `/settings/` — user settings
- `/viewer/structure/` — 3D protein structure viewer
- `/api/auth/...` — Custom auth API routes
- `/api/services/...` — Proxied service API routes
- `/api/workspace/...` — Proxied workspace API routes
- `/api/taxon-view/tab-policy` — tab-visibility policy for views (see `docs/taxon-view-tab-visibility.md`)
- `/api/e2e-mock/[...path]` — loopback backend mock used only by the Playwright suite

## Auth system (`src/lib/auth/`) — port/adapter architecture

- `port.ts` — `AuthPort` interface + `Result<T>` type (all auth ops return `Result`, not throws)
- `adapters/` — `http.ts` (real backend), `memory.ts` (tests)
- `store.ts` — client-side reactive `AuthStore` (`AuthStatus = "loading" | "authed" | "guest"`)
- `provider.tsx` — `<AuthBoundary>` React provider + `useAuthStore()`
- `hooks.ts` — `useAuth()`, `useSignIn()`, etc. (consumer-facing client hooks; MUST be used inside `<AuthBoundary>`)
- `server/` — server-side handlers, envelopes, token, middleware, request-scope; backs the `/api/auth/*` routes
- `routes.ts` — `isProtectedPagePath()` / `isProtectedApiPath()` — single source of truth for what is protected
- `types.ts` — `AuthUser`, `UserProfile`, credential types

Notes:

- Built on the `better-auth` dependency. Consume client auth state via `useAuth()` from `hooks.ts`. There is NO `bvbrcAuth` client object and NO `src/contexts/auth-context.tsx` — do not reference them.
- `src/proxy.ts` middleware delegates to `isProtectedPagePath`/`isProtectedApiPath` (currently `/services/*`, `/workspace/*`, `/api/protected/*`). Checks are optimistic cookie-existence only; real validation is server-side. To change what's protected, edit `routes.ts`, not `proxy.ts`.
- `/api/auth/*` wire contract (envelope shapes, rules, endpoint table): see `docs/auth-api.md`. Every new auth route MUST use the `{error, code, details?}` envelope.

## Backend communication

- `JsonRpcClient` (`src/lib/jsonrpc-client.ts`) — all backend calls use JSON-RPC 2.0 over HTTP POST; requires `APP_SERVICE_URL` env var
- `AppService` (`src/lib/app-service.ts`) — job management: enumerate/query/kill jobs, submit services via `AppService.start_app2`
- `WorkspaceApiClient` (`src/lib/services/workspace/client.ts`) — workspace CRUD operations

## Workspace browser (`src/components/workspace/`)

- `workspace-shell.tsx` — top-level orchestrator mounted by the workspace route pages
- `workspace-browser.tsx` — combines file listing, sorting, breadcrumbs, toolbar, dialogs, resizable panels
- `workspace-file-table.tsx` — TanStack Table-based file listing with virtual scrolling
- Details panel uses `react-resizable-panels` with state in `WorkspacePanelContext`
- Favorites stored in `favorites.json` workspace file (see `src/lib/services/workspace/favorites.ts`)
- **Repository pattern**: workspace data access goes through `WorkspaceRepositorySet` (`src/lib/services/workspace/workspace-repository.ts`), provided via `WorkspaceRepositoryProvider`, consumed with `useWorkspaceRepository()`. Prefer this over calling the client directly. Path helpers in `path-utils.ts`; RQ keys in `workspace-query-keys.ts`.

## Views & organism landing

`src/lib/views/`, `src/components/organisms/`, `src/app/(views)`, `src/app/organisms/`

- `src/lib/views/view-registry.ts` — central registry mapping BV-BRC view types to render config. Add a new view here, not by hand-wiring a page.
- `(views)/*` pages are thin — resolve config from the registry and render list/singular via `render-list.tsx` / `render-singular.tsx` / `page-factory.tsx`.
- Organism landing pages (`src/app/organisms/(all|bacteria|viruses)`) are tabbed, driven by a per-organism `_config.ts` (`OrganismLandingConfig` in `src/components/organisms/types.ts`) + shared components in `src/components/organisms/`.
- URL schema (view types → URL params, legacy hash redirects) documented in `docs/url-schema/`. Legacy `#`-URL support: `legacy-hash-adapter.tsx` / `legacy-redirect.ts`.
- Tab visibility policy: `src/app/api/taxon-view/tab-policy` + `docs/taxon-view-tab-visibility.md`.
- Phylogeny renderers, local Nextstrain datasets, deployment, and licensing: `docs/phylogeny-integration.md`.

## Services pattern

- Each bioinformatics service is a form page under `/services/`
- Forms use TanStack Form (`@tanstack/react-form`) + zod validation
- Submission: `useServiceFormSubmission` hook → `submitServiceJob()` → `AppService.start_app2`
- `ServiceDebuggingProvider` wraps service layouts; enables a debug mode that shows params instead of submitting

## Rerun pre-fill pattern

- `useRerunForm<T>()` reads job params from `sessionStorage` (keyed by `?rerun_key=`) and returns `{ rerunData }`
- Pre-fill is auto-applied via the hook's declarative options (`fields`, `libraries`, `syncLibraries`, `onApply`); the hook self-manages one-shot application internally
- The sessionStorage entry is intentionally NOT consumed on read — `<AuthBoundary>`'s Suspense fallback can mount the form twice during hydration, so a consume-on-read would null out the second mount
- Library reconstruction helpers in `src/lib/rerun-utility.ts`:
  - `buildPairedLibraries(rerunData, getExtra?)` — paired-end libs from `paired_end_libs`
  - `buildSingleLibraries(rerunData, getExtra?)` — single-end libs from `single_end_libs`
  - `buildSraLibraries(rerunData)` — SRA libs from `srr_libs` with `srr_ids` fallback
  - Pass a `getExtra` callback to merge service-specific fields (e.g. `platform`, `interleaved`)

## Data fetching

- TanStack Query for all async state (client-side)
- Custom hooks in `src/hooks/services/workspace/` wrap workspace API calls
- `useAuthenticatedFetch` wraps fetch with cookie credentials and 401 refresh logic

## UI

- shadcn/ui (New York style, slate base) in `src/components/ui/`, built on `@base-ui` primitives (e.g. https://ui.shadcn.com/docs/components/base/accordion)
- Tailwind CSS v4 with CSS variable theming; multiple named themes in `src/app/globals.css`
- SVG via `@svgr/webpack` (`import Icon from './file.svg'` or `'./file.svg?url'` for raw URL)
- `sonner` for toasts; `lucide-react` for icons

## Key type files

- `src/types/workspace.ts` — Job/RPC types
- `src/types/workspace-browser.ts` — `WorkspaceBrowserItem`, `SortField`, etc.
- `src/types/services.ts`, `src/types/filters.ts` — service form + filter types
- `src/lib/auth/types.ts` — `AuthUser`, `UserProfile`, credential types
- `src/lib/views/view-types.ts`, `src/components/organisms/types.ts` — view + organism landing config types
