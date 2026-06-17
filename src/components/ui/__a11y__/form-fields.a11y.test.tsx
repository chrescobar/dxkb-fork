import { expect, describe, it } from "vitest";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  allThemes,
  applyTheme,
  renderWithTheme,
  runAxeOnContainer,
  formatBlockingViolations,
} from "@/test-helpers/render-with-theme";

describe("Input — a11y primitive", () => {
  const states: { label: string; ui: React.ReactNode }[] = [
    {
      label: "labeled default",
      ui: (
        <div>
          <Label htmlFor="test-input">Email address</Label>
          <Input id="test-input" type="email" placeholder="you@example.com" />
        </div>
      ),
    },
    {
      label: "labeled disabled",
      ui: (
        <div>
          <Label htmlFor="test-input-disabled">Username</Label>
          <Input id="test-input-disabled" disabled value="readonly" readOnly />
        </div>
      ),
    },
    {
      label: "labeled error state",
      ui: (
        <div>
          <Label htmlFor="test-input-error">Password</Label>
          <Input id="test-input-error" type="password" aria-invalid="true" aria-describedby="err-msg" />
          <span id="err-msg" role="alert">Password is required</span>
        </div>
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
          console.warn(`[a11y] Input/${state.label}/${theme}: ${String(warnings.length)} warn-tier`);
        }
        expect(
          blocking,
          blocking.length === 0 ? undefined : formatBlockingViolations(blocking, `Input/${state.label}/${theme}`),
        ).toEqual([]);
      });
    }
  }
});

describe("Checkbox — a11y primitive", () => {
  const states: { label: string; ui: React.ReactNode }[] = [
    {
      label: "unchecked with label",
      ui: (
        <div className="flex items-center gap-2">
          <Checkbox id="chk-default" />
          <Label htmlFor="chk-default">Accept terms</Label>
        </div>
      ),
    },
    {
      label: "checked with label",
      ui: (
        <div className="flex items-center gap-2">
          <Checkbox id="chk-checked" defaultChecked />
          <Label htmlFor="chk-checked">Subscribe to newsletter</Label>
        </div>
      ),
    },
    {
      label: "disabled with label",
      ui: (
        <div className="flex items-center gap-2">
          <Checkbox id="chk-disabled" disabled />
          <Label htmlFor="chk-disabled">Unavailable option</Label>
        </div>
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
          console.warn(`[a11y] Checkbox/${state.label}/${theme}: ${String(warnings.length)} warn-tier`);
        }
        expect(
          blocking,
          blocking.length === 0 ? undefined : formatBlockingViolations(blocking, `Checkbox/${state.label}/${theme}`),
        ).toEqual([]);
      });
    }
  }
});
