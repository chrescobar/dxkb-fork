import type { EditorView as EditorViewType } from "@codemirror/view";

import { getLanguageExtension } from "./codemirror-languages";

interface CodeMirrorRuntime {
  createEditor: (
    extensions: import("@codemirror/state").Extension[],
    parent: HTMLDivElement,
  ) => EditorViewType;
  foldAll: (view: EditorViewType) => boolean;
  highlightCompartment: import("@codemirror/state").Compartment;
  highlightExtension: (dark: boolean) => import("@codemirror/state").Extension;
  readOnlyExtensions: import("@codemirror/state").Extension[];
  foldExtensions: import("@codemirror/state").Extension[];
}

let runtime: CodeMirrorRuntime | null = null;
let runtimePromise: Promise<CodeMirrorRuntime> | null = null;

function isDarkTheme() {
  return (document.documentElement.getAttribute("data-theme") ?? "").endsWith(
    "-dark",
  );
}

async function loadRuntime() {
  if (runtime) return runtime;
  runtimePromise ??= Promise.all([
    import("@codemirror/state"),
    import("@codemirror/language"),
    import("@codemirror/view"),
    import("@lezer/highlight"),
  ]).then(([stateModule, languageModule, viewModule, highlightModule]) => {
    const { Compartment, EditorState } = stateModule;
    const {
      foldAll,
      foldGutter,
      foldKeymap,
      HighlightStyle,
      syntaxHighlighting,
    } = languageModule;
    const { EditorView, keymap } = viewModule;
    const { tags } = highlightModule;

    const baseTheme = EditorView.theme({
      "&": { height: "100%", fontSize: "13px" },
      ".cm-scroller": {
        fontFamily: "var(--font-mono, ui-monospace, monospace)",
        overflow: "auto",
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
        borderRight: "1px solid var(--border)",
        color: "var(--muted-foreground)",
      },
      ".cm-activeLineGutter": { backgroundColor: "transparent" },
      ".cm-activeLine": {
        backgroundColor: "color-mix(in oklch, var(--muted) 50%, transparent)",
      },
      ".cm-cursor": { display: "none" },
      ".cm-content": { padding: "8px 0" },
      ".cm-line": { padding: "0 16px 0 8px" },
      ".cm-foldGutter .cm-gutterElement": {
        cursor: "pointer",
        padding: "0 4px",
        color: "var(--muted-foreground)",
        fontSize: "12px",
        lineHeight: "inherit",
        transition: "color 0.15s",
      },
      ".cm-foldGutter .cm-gutterElement:hover": {
        color: "var(--foreground)",
      },
    });

    const githubColors = {
      keyword: ["#ff7b72", "#cf222e"],
      name: ["#c9d1d9", "#24292f"],
      function: ["#d2a8ff", "#8250df"],
      constant: ["#79c0ff", "#0550ae"],
      type: ["#ffa657", "#953800"],
      number: ["#79c0ff", "#0550ae"],
      string: ["#a5d6ff", "#0a3069"],
      comment: ["#8b949e", "#6e7781"],
      property: ["#7ee787", "#116329"],
      punctuation: ["#8b949e", "#6e7781"],
    } as const;

    function buildHighlightStyle(mode: 0 | 1) {
      const color = (key: keyof typeof githubColors) => githubColors[key][mode];

      return HighlightStyle.define([
        { tag: tags.keyword, color: color("keyword") },
        {
          tag: [tags.name, tags.deleted, tags.character, tags.macroName],
          color: color("name"),
        },
        {
          tag: [tags.function(tags.variableName), tags.labelName],
          color: color("function"),
        },
        {
          tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
          color: color("constant"),
        },
        {
          tag: [tags.definition(tags.name), tags.separator],
          color: color("name"),
        },
        {
          tag: [
            tags.typeName,
            tags.className,
            tags.changed,
            tags.annotation,
            tags.modifier,
            tags.self,
            tags.namespace,
          ],
          color: color("type"),
        },
        { tag: [tags.number, tags.bool], color: color("number") },
        {
          tag: [tags.string, tags.special(tags.brace)],
          color: color("string"),
        },
        { tag: tags.operator, color: color("keyword") },
        {
          tag: tags.comment,
          color: color("comment"),
          fontStyle: "italic",
        },
        { tag: tags.meta, color: color("constant") },
        { tag: tags.strong, fontWeight: "bold" },
        { tag: tags.emphasis, fontStyle: "italic" },
        {
          tag: tags.link,
          color: color("string"),
          textDecoration: "underline",
        },
        { tag: tags.propertyName, color: color("property") },
        { tag: tags.atom, color: color("constant") },
        { tag: tags.punctuation, color: color("punctuation") },
      ]);
    }

    const githubDarkStyle = buildHighlightStyle(0);
    const githubLightStyle = buildHighlightStyle(1);
    const highlightCompartment = new Compartment();
    const highlightExtension = (dark: boolean) =>
      syntaxHighlighting(dark ? githubDarkStyle : githubLightStyle, {
        fallback: true,
      });

    return {
      createEditor: (extensions, parent) => {
        const editorState = EditorState.create({ doc: "", extensions });
        return new EditorView({ state: editorState, parent });
      },
      foldAll,
      highlightCompartment,
      highlightExtension,
      readOnlyExtensions: [
        EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        baseTheme,
        highlightCompartment.of(highlightExtension(isDarkTheme())),
      ],
      foldExtensions: [
        foldGutter({ openText: "▼", closedText: "▶" }),
        keymap.of(foldKeymap),
      ],
    };
  });
  runtime = await runtimePromise;
  return runtime;
}

export interface CachedEntry {
  view: EditorViewType | null;
  wrapper: HTMLDivElement;
  status: "loading" | "streaming" | "done" | "error";
  abort: AbortController;
  truncated: boolean;
}

export const viewCache = new Map<string, CachedEntry>();
const maxCacheSize = 5;
let lastDark: boolean | null = null;

export function evictOldest() {
  if (viewCache.size <= maxCacheSize) return;

  for (const [key, entry] of viewCache) {
    if (!entry.wrapper.isConnected) {
      entry.abort.abort();
      entry.view?.destroy();
      viewCache.delete(key);
      if (viewCache.size <= maxCacheSize) return;
    }
  }
}

export function startThemeObserver() {
  if (lastDark !== null || !runtime) return;
  lastDark = isDarkTheme();

  new MutationObserver(() => {
    if (!runtime) return;
    const dark = isDarkTheme();
    if (dark === lastDark) return;
    lastDark = dark;
    const extension = runtime.highlightExtension(dark);
    for (const entry of viewCache.values()) {
      entry.view?.dispatch({
        effects: runtime.highlightCompartment.reconfigure(extension),
      });
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}

export async function createEditor(
  fileName: string,
  foldable: boolean,
  parent: HTMLDivElement,
) {
  const [codeMirror, languageExtension] = await Promise.all([
    loadRuntime(),
    getLanguageExtension(fileName),
  ]);
  const extensions = [...codeMirror.readOnlyExtensions];
  if (foldable) extensions.push(...codeMirror.foldExtensions);
  if (languageExtension) extensions.push(languageExtension);
  return codeMirror.createEditor(extensions, parent);
}

export function foldAll(view: EditorViewType) {
  return runtime?.foldAll(view) ?? false;
}
