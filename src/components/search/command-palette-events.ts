export const COMMAND_PALETTE_OPEN_EVENT = "dxkb:open-command-palette";

/** Imperatively opens the mounted global command palette. */
export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
}
