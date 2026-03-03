# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack on port 3019
pnpm build        # Production build
pnpm lint         # ESLint
```

No test runner is currently configured (jest types are present but no test scripts).

## Architecture Overview

**DXKB V2** is a Next.js 16 app (App Router) serving as a Disease X Knowledge Base — a bioinformatics platform for genomics, metagenomics, and viral research.

### Key architectural layers

**App Router structure (`src/app/`)**
- `/` — Public home page (search, news, statistics)
- `/workspace/[username]/home/[[...path]]` — File browser for user workspaces
- `/services/(genomics|metagenomics|phylogenomics|protein-tools|utilities|viral-tools)/...` — Bioinformatics service submission forms (route groups as categories)
- `/search/` — Global search
- `/jobs/` — Job monitoring
- `/api/auth/...` — Custom auth API routes (sign-in, sign-up, sign-out, session, etc.)
- `/api/services/...` — Proxied service API routes
- `/api/workspace/...` — Proxied workspace API routes

**Auth system (`src/lib/auth-client.ts`, `src/contexts/auth-context.tsx`)**
- Custom BV-BRC auth (not better-auth library), exposes a `bvbrcAuth` object with a better-auth-style API
- Auth state lives in `AuthContext`, hydrated from `user_profile` and `user_id` cookies on the server
- Protected routes: `/services/*` and `/workspace/*` — middleware in `src/proxy.ts` checks for `bvbrc_token` + `bvbrc_user_id` cookies
- When applicable, use the better-auth stateless functions for auth operations

**Backend communication**
- `JsonRpcClient` (`src/lib/jsonrpc-client.ts`) — All backend calls use JSON-RPC 2.0 over HTTP POST; requires `APP_SERVICE_URL` env var
- `AppService` (`src/lib/app-service.ts`) — Job management: enumerate/query/kill jobs, submit services via `AppService.start_app2`
- `WorkspaceApiClient` (`src/lib/services/workspace/client.ts`) — Workspace CRUD operations

**Workspace browser (`src/components/workspace/`)**
- `workspace-browser.tsx` — Main orchestrator; combines file listing, sorting, breadcrumbs, toolbar, dialogs, and resizable panels
- `workspace-data-table.tsx` — TanStack Table-based file listing with virtual scrolling
- Details panel uses `react-resizable-panels` with state in `WorkspacePanelContext`
- Favorites stored in `favorites.json` workspace file, loaded via `loadFavorites()`

**Services pattern**
- Each bioinformatics service is a form page under `/services/`
- Forms use react-hook-form + zod validation
- Submission goes through `useServiceFormSubmission` hook → `submitServiceJob()` → `AppService.start_app2`
- `ServiceDebuggingProvider` wraps service layouts; enables a debug mode that shows params instead of submitting

**Data fetching**
- TanStack Query for all async state (client-side)
- Custom hooks in `src/hooks/services/workspace/` wrap workspace API calls
- `useAuthenticatedFetch` hook wraps fetch with cookie credentials and 401 refresh logic

**UI**
- shadcn/ui (New York style, slate base) in `src/components/ui/`
- Tailwind CSS v4 with CSS variable theming; multiple named themes in `src/app/globals.css`
- SVG imports handled via `@svgr/webpack` (use `import Icon from './file.svg'` or `'./file.svg?url'` for raw URL)
- `sonner` for toast notifications; `lucide-react` for icons

### Path aliases
- Imports to `src/` should use the `@/` alias.
- Imports to `public/` should use the `@public/` alias.

### Key type files
- `src/types/workspace.ts` — Job/RPC types
- `src/types/workspace-browser.ts` — `WorkspaceBrowserItem`, `SortField`, etc.
- `src/app/api/auth/types.ts` — `AuthUser`, `UserProfile`, credential types
