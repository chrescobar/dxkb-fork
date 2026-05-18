# Service Authoring Guide

This document covers the conventions, modules, and patterns used when building bioinformatics service forms in DXKB V2.

---

## Required file structure

Every service lives under `src/app/services/(route-group)/<service-name>/` and contains four required files:

| File | Purpose |
|---|---|
| `*-form-schema.ts` | Zod schema, TypeScript types, default values, and constants used across files |
| `*-form-utils.ts` | Pure helper functions: transforms, validators, display utilities |
| `*-service.ts` | `ServiceDefinition` object consumed by `useServiceRuntime` |
| `page.tsx` | Client component — the orchestrator |

Card components extracted from large pages live alongside `page.tsx` (e.g. `blast-search-program-card.tsx`).

---

## page.tsx — the orchestrator

`page.tsx` owns:

- `useForm` with schema validation and submit handler
- `useServiceRuntime` (rerun, submit, reset wiring)
- All `useState` and `useRef` for local workflow state
- All callbacks passed down to cards
- `useStore` subscriptions for derived view state
- Top-level form layout and form controls

`page.tsx` does **not** own card-level JSX for complex sections; those are extracted to card files.

---

## useServiceRuntime

```ts
const runtime = useServiceRuntime({
  definition: myService,   // ServiceDefinition from *-service.ts
  form,
  onSuccess: handleReset,  // optional: called after successful job submission
  rerun: { ... },          // optional: rerun support
});
const { isSubmitting, jobParamsDialogProps } = runtime;
```

`useServiceRuntime` wires submit, debug-mode preview (`ServiceDebuggingProvider`), rerun pre-fill, and job params dialog. Always render `<JobParamsDialog {...jobParamsDialogProps} />` at the bottom of the page.

---

## OutputLocationFields

`OutputLocationFields` renders the output folder + output name fields with built-in async validation (checks for name conflicts in the workspace) and revalidates the output name when the folder changes.

```tsx
<OutputLocationFields form={form} required />
```

No `isOutputNameValid` state is needed; TanStack Form's `canSubmit` already accounts for async validation errors.

Accepted props:

| Prop | Type | Default |
|---|---|---|
| `form` | form instance | required |
| `required` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `outputPathName` | `string` | `"output_path"` |
| `outputNameName` | `string` | `"output_file"` |

---

## Group loading

Two loading patterns are available depending on whether loading is reactive (driven by a form field) or event-driven (triggered by a button).

### Reactive — `useGenomeGroupMembers` / `useFeatureGroupMembers`

Use when the UI needs to show options as a form field changes:

```ts
const { data: members, isLoading } = useGenomeGroupMembers(groupPath, enabled);
```

Backed by TanStack Query with a 5-minute stale time. Repeated reads of the same path return cached data.

### Event-driven — `useCachedGenomeGroupLoader` / `useCachedFeatureGroupLoader`

Use when loading is triggered by a user action (e.g. clicking "Add"):

```ts
const genomeLoader = useCachedGenomeGroupLoader();
// Inside a callback:
const genomes = await genomeLoader.load(groupPath);
```

Uses `queryClient.ensureQueryData` under the hood — not a mutation. Repeated loads of the same path reuse the cache.

---

## Workflow hook decision rules

Extract a workflow hook when:

1. The logic runs across multiple form fields and involves async work.
2. The logic has its own state that is independent of other form sections.
3. The same logic would be needed in more than one page.

Do **not** extract a hook just to reduce page line count. Callbacks that only set form fields or local state belong in `page.tsx`.

### Available workflow hooks

| Hook | What it owns |
|---|---|
| `useGenomeSelection` | Adding/removing genomes, max-count enforcement, group loading, optional form sync |
| `useMsaReferenceOptions` | MSA reference type switching, feature/genome option loading, reset |
| `useMetaCatsYearRanges` | Year-range input state and validation |
| `useMetaCatsAutoGrouping` | Feature group → auto-group workflow (fetch, build, delete, regroup) |

---

## Card extraction rules

Extract a card when the section is **purely presentational** (renders `form.Field` with no cross-field behavior) or when the behavior in it has already been moved to a hook.

**Good** — card receives a focused workflow object:

```tsx
<MsaReferenceSequenceCard
  form={form}
  referenceOptions={referenceOptions}
/>
```

**Weak** — card owns behavior it should not:

```tsx
// Bad: card owns query-key construction or fetch logic
<MsaReferenceSequenceCard form={form} />
```

Cards may render `form.Field`, but cards must **not** own:

- Service submission or `useServiceRuntime`
- Rerun application logic
- Query-key construction or fetch/cache behavior
- Cross-card reset logic
- Service parameter transforms

State and callbacks always live in `page.tsx`. Cards receive them as props.

---

## Rerun support

`useServiceRuntime` accepts a `rerun` object. The simplest form uses declarative library restoration:

```ts
rerun: {
  libraries: ["paired", "single", "sra"],
  syncLibraries: setLibraries,
}
```

For custom field restoration use `onApply`:

```ts
rerun: {
  onApply: (rerunData, form) => {
    if (typeof rerunData.p_value === "number") {
      form.setFieldValue("p_value", rerunData.p_value as never);
    }
    // ...
  },
}
```

The `rerun_key` query parameter triggers pre-fill on mount. The session storage entry is intentionally kept (not consumed on read) because `AuthBoundary`'s Suspense fallback can mount the form twice during hydration.

---

## Verification checklist

Run before committing any service change:

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
pnpm test        # vitest run
pnpm build       # next build (when touching route modules or shared client code)
```

For service behavior changes, also run targeted e2e smoke:

```bash
pnpm e2e -- e2e/tests/services
```

---

## Why similar-genome-finder is out of scope

`similar-genome-finder` deliberately does not use `OutputLocationFields` or the standard output-name flow. It has no `OutputFolder` UI and uses a custom MinHash result flow where the output is determined server-side. It will be revisited only when a broader "custom-result service" pattern is introduced or a product decision requires output naming there.
