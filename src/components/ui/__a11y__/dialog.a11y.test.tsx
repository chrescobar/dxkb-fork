import { expect, describe, it, afterEach } from "vitest";
import { cleanup } from "vitest-browser-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  allThemes,
  applyTheme,
  renderWithTheme,
  runAxeOnContainer,
  formatBlockingViolations,
} from "@/test-helpers/render-with-theme";

describe("Dialog — a11y primitive", () => {
  // Dialog content is portalled to document.body. cleanup() unmounts the React
  // root AND removes the portal node — a manual innerHTML reset would orphan the
  // root and leak portals into the next scan.
  afterEach(() => cleanup());

  const states: { label: string; ui: React.ReactNode }[] = [
    {
      label: "open with title and description",
      ui: (
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The file will be permanently removed.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      label: "open title-only",
      ui: (
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Upload</DialogTitle>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  for (const state of states) {
    for (const theme of allThemes) {
      it(`${state.label} / ${theme} has no blocking violations`, async () => {
        await renderWithTheme(state.ui, theme);
        applyTheme(theme);
        // Scan the whole document: the dialog is portalled outside the render container.
        const { blocking, warnings } = await runAxeOnContainer(document.body);
        if (warnings.length > 0) {
          console.warn(`[a11y] Dialog/${state.label}/${theme}: ${String(warnings.length)} warn-tier`);
        }
        expect(
          blocking,
          blocking.length === 0 ? undefined : formatBlockingViolations(blocking, `Dialog/${state.label}/${theme}`),
        ).toEqual([]);
      });
    }
  }
});
