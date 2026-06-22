import { expect, describe, it } from "vitest";
import { Button } from "@/components/ui/button";
import {
  allThemes,
  applyTheme,
  renderWithTheme,
  runAxeOnContainer,
  formatBlockingViolations,
} from "@/test-helpers/render-with-theme";

describe("Button — a11y primitive", () => {
  const states: { label: string; ui: React.ReactNode }[] = [
    {
      label: "default",
      ui: <Button>Submit</Button>,
    },
    {
      label: "disabled",
      ui: <Button disabled>Submit</Button>,
    },
    {
      label: "destructive",
      ui: <Button variant="destructive">Delete</Button>,
    },
    {
      label: "ghost",
      ui: <Button variant="ghost">Cancel</Button>,
    },
    {
      label: "icon with aria-label",
      ui: (
        <Button size="icon" aria-label="Close dialog">
          ×
        </Button>
      ),
    },
  ];

  for (const state of states) {
    for (const theme of allThemes) {
      it(`${state.label} / ${theme} has no blocking violations`, async () => {
        const screen = await renderWithTheme(state.ui, theme);
        applyTheme(theme);
        const { blocking, warnings } = await runAxeOnContainer(screen.container);
        if (warnings.length > 0) {
          console.warn(`[a11y] Button/${state.label}/${theme}: ${String(warnings.length)} warn-tier`);
        }
        expect(
          blocking,
          blocking.length === 0 ? undefined : formatBlockingViolations(blocking, `Button/${state.label}/${theme}`),
        ).toEqual([]);
      });
    }
  }
});
