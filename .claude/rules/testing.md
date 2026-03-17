# Testing Rules

## Node Version

Tests require **Node.js >= 22** (vitest 4.x / rolldown needs `node:util#styleText`). The project targets **Node v24**. Use `nvm use 24` (or the `.nvmrc` if present) before running any commands.

## Test Runner

The project uses **Vitest 4** with jsdom environment. Config lives in `vitest.config.mts`, setup in `vitest.setup.ts`.

```bash
pnpm test             # Run all tests once (vitest run)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Run with V8 coverage
```

## CI / GitHub Actions

Three workflows run automatically on every PR targeting `main`:

| Workflow | File | Command |
|---|---|---|
| Lint | `.github/workflows/pnpm-lint.yml` | `pnpm lint` |
| Build | `.github/workflows/pnpm-build.yml` | `pnpm build` |
| Test | `.github/workflows/pnpm-test.yml` | `pnpm test` |

All three must pass before merging.

## Test Before Committing

Before committing any changes, run the following commands locally to catch errors before CI does:

```bash
pnpm lint
pnpm build
pnpm test
```

## Test Conventions

- Test files live in `__tests__/` directories next to the source they cover (e.g. `src/lib/__tests__/utils.test.ts`).
- Use `vi.mock()` for module mocks. Do not reference variables declared with `const`/`let` inside a `vi.mock` factory — vitest hoists the factory above all imports, so the variable will not be initialized yet. Instead, import the mocked module inside the test and access its mock there.
- Prefer `expect.objectContaining()` over non-null assertions (`!`) to satisfy the `@typescript-eslint/no-non-null-assertion` rule.
- Globals (`describe`, `it`, `expect`, `vi`) are available without importing (configured via `globals: true`).

## Linting Rules

- All variables and constants use `camelCase` — including module-level `const` exports. Do not use `SCREAMING_SNAKE_CASE` for constants (that is a C/Java convention, not TypeScript/JavaScript).
- The only exceptions are environment variable names (OS convention) and zod schema objects which conventionally use camelCase anyway.
- Do not use `//eslint-disable` comments, fix the code instead. If you absolutely must use them, add a comment explaining why.
