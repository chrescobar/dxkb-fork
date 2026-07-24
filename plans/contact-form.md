# Contact Page: Popup → Inline Working Form

## Goal

Replace the legacy site's **Report Problem** popup dialog with a functional
**inline contact form** on the `/contact` page.

## Background

- The old site (`ArgonneBRC-Mono/apps/dxkb-web`) exposed contact via a Dojo
  popup widget (`p3/widget/ReportProblem.js` + `templates/ReportProblem.html`).
  Fields: **email** (required when logged out), **subject**, **message**,
  optional **file attachment**. It POSTed `multipart/form-data` to a
  `/reportProblem` Express route that emailed the report over SMTP
  (`nodemailer`), auto-attaching metadata (URL, app version, user id, jira label).
- The React app already had an inline `contact-form.tsx`, but it was **fully
  static**: no state, no validation, no submit, placeholder `virusdb.org`
  contact details and a fabricated phone number.

## Decisions

- **Submit target:** a real Next.js API route (`/api/contact`) that emails the
  submission via SMTP, mirroring the old `/reportProblem` behavior.
- **Field set:** trimmed rich form — `inquiryType`, `name`, `email`, `subject`,
  `message`. Dropped the fake phone entry, institution field, and the
  non-functional privacy-consent checkbox.
- **Mailer:** `nodemailer` + SMTP (same library the old route used).

## Changes

| File | Change |
|---|---|
| `package.json` | Added `nodemailer` + `@types/nodemailer`. |
| `src/app/(footer)/contact/components/contact-form-utils.ts` | New — zod schema, inquiry-type options, defaults, shared types (`ContactFormData`). |
| `src/app/api/contact/route.ts` | New — `POST` validates with the shared schema and sends email via nodemailer SMTP. Preserves original error messages. |
| `src/app/(footer)/contact/components/contact-form.tsx` | Rewritten as a client TanStack Form: validation, submit to `/api/contact`, sonner toasts, loading spinner. Fixed placeholder contact info. |
| `.example.env` | Documented `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM`. |

## Configuration

All email env vars are **optional** — the route mirrors BV-BRC, whose
`config.js`/`reportProblem.js` send through the deployment server's **local mail
relay** (`localhost:25`, unauthenticated). BV-BRC stores no SMTP host or
credentials anywhere; it relies on the server's own MTA. Defaults:

| Var | Default |
|---|---|
| `SMTP_HOST` | `localhost` |
| `SMTP_PORT` | `25` |
| `SMTP_USER` / `SMTP_PASSWORD` | unset (no auth) |
| `CONTACT_EMAIL_TO` | `help@dxkb.org` |
| `CONTACT_EMAIL_FROM` | `DXKB <do-not-reply@dxkb.org>` |

Override only when using a remote authenticated SMTP server. Values reused from
BV-BRC config: recipient pattern `help@bv-brc.org`, from pattern
`BV-BRC <do-not-reply@bv-brc.org>`.

## Testing locally

The `/api/contact` route defaults to `localhost:25` (see Configuration). A plain
dev machine has no mail server there, so **submitting the form will show an
error toast** — the form and route work, but the SMTP hand-off fails to connect.
That is expected locally, not a bug. To watch a submission actually land, run a
local SMTP catcher such as [Mailpit](https://github.com/axllent/mailpit)
(single static binary, no install) or MailHog:

1. Start the catcher (Mailpit defaults: SMTP `1025`, web UI `8025`):

   ```bash
   mailpit --smtp 0.0.0.0:1025 --listen 0.0.0.0:8025
   ```

2. Point the app at it in `.env.local` (both lines):

   ```bash
   SMTP_HOST=localhost
   SMTP_PORT=1025
   ```

3. **Restart `pnpm dev`** — env vars are read at server startup, not per request.
4. Submit the form at `http://localhost:3019/contact`, then view the captured
   message at `http://localhost:8025`.

Remove those two `.env.local` lines to return to the production default
(`localhost:25`). Note `.env` / `.env.local` are gitignored, so each developer
needs their own — start from `.example.env` and get real service values
(`BETTER_AUTH_SECRET`, service URLs, etc.) out-of-band.

## Onboarding notes (pulling this branch)

- Run `pnpm install` after pulling — `package.json` / `pnpm-lock.yaml` changed
  (nodemailer added). Use Node 24 (`nvm use 24`).
- `public/images/websites/spillover.png` (Related Resources logo) must be
  committed with the branch, or that card 404s.

## Not carried over / follow-ups

- **File attachment** from the old dialog is not included (form is JSON, not
  multipart). Add back if needed.
- No automated test yet for `/api/contact` (would use MSW per testing rules).
