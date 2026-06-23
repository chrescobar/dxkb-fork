import { expect, describe, it, afterEach } from "vitest";
import { cleanup } from "vitest-browser-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  allThemes,
  applyTheme,
  renderWithTheme,
  runAxeOnContainer,
  formatBlockingViolations,
} from "@/test-helpers/render-with-theme";

// The isolated a11y vitest harness renders without Tailwind/globals.css, and
// sonner self-injects its own (gray) CSS — so color-contrast reports a false
// positive here. Real toast contrast in light + dark is covered by the e2e
// a11y sweep against compiled CSS (baselined under DXKBCORE-174). We keep every
// other rule (aria-live region, role, accessible name) active.
const axeOptions = { rules: { "color-contrast": { enabled: false } } } as const;

// Poll document.body for the rendered toast element. vitest-browser-react does
// not auto-flush sonner's enqueue→render tick, so we wait for the portal node.
async function waitForToast(timeoutMs = 2000): Promise<void> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (document.querySelector("[data-sonner-toast]")) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("toast did not render within timeout");
}

describe("Toaster (sonner) — a11y primitive", () => {
  // Dismiss queued toasts, then cleanup() to unmount the root and remove the
  // portal host so the next render starts clean.
  afterEach(async () => {
    toast.dismiss();
    await cleanup();
  });

  for (const theme of allThemes) {
    it(`success toast / ${theme} has no blocking violations`, async () => {
      await renderWithTheme(<Toaster />, theme);
      applyTheme(theme);
      toast.success("Upload complete", {
        description: "3 files uploaded to /home.",
      });
      await waitForToast();
      const { blocking, warnings } = await runAxeOnContainer(document.body, axeOptions);
      if (warnings.length > 0) {
        console.warn(`[a11y] Toaster/success/${theme}: ${String(warnings.length)} warn-tier`);
      }
      expect(
        blocking,
        blocking.length === 0 ? undefined : formatBlockingViolations(blocking, `Toaster/success/${theme}`),
      ).toEqual([]);
    });

    it(`error toast / ${theme} has no blocking violations`, async () => {
      await renderWithTheme(<Toaster />, theme);
      applyTheme(theme);
      toast.error("Upload failed", {
        description: "Network error — please retry.",
      });
      await waitForToast();
      const { blocking, warnings } = await runAxeOnContainer(document.body, axeOptions);
      if (warnings.length > 0) {
        console.warn(`[a11y] Toaster/error/${theme}: ${String(warnings.length)} warn-tier`);
      }
      expect(
        blocking,
        blocking.length === 0 ? undefined : formatBlockingViolations(blocking, `Toaster/error/${theme}`),
      ).toEqual([]);
    });
  }
});
