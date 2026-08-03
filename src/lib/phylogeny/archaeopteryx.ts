export interface ArchaeopteryxProperty {
  ref?: string;
  value?: string | number;
  applies_to?: string;
  unit?: string;
}

export interface ArchaeopteryxNode {
  name?: string;
  branch_length?: number;
  confidences?: { value?: number; type?: string }[];
  taxonomies?: { scientific_name?: string }[];
  properties?: ArchaeopteryxProperty[];
  children?: ArchaeopteryxNode[];
  _children?: ArchaeopteryxNode[];
  parent?: ArchaeopteryxNode;
}

interface Forester {
  collectPropertyRefs(
    tree: ArchaeopteryxNode,
    appliesTo: string,
    externalOnly: boolean,
  ): Set<string>;
}

interface ArchaeopteryxApi {
  parsePhyloXML(xml: string): ArchaeopteryxNode;
  launch(
    selector: string,
    tree: ArchaeopteryxNode,
    options: Record<string, unknown>,
    settings: Record<string, unknown>,
    nodeVisualizations: Record<string, unknown>,
    nodeLabels?: Record<string, unknown>,
  ): void;
  getSelectedNodes(): ArchaeopteryxNode[];
  destroy(): void;
}

interface ArchaeopteryxGlobals extends Window {
  d3?: unknown;
  jQuery?: unknown;
  $?: unknown;
  forester?: unknown;
  phyloXml?: unknown;
}

let loader: Promise<{
  archaeopteryx: ArchaeopteryxApi;
  forester: Forester;
}> | null = null;

export function loadArchaeopteryx(): Promise<{
  archaeopteryx: ArchaeopteryxApi;
  forester: Forester;
}> {
  loader ??= loadDependencies();
  return loader;
}

async function loadDependencies(): Promise<{
  archaeopteryx: ArchaeopteryxApi;
  forester: Forester;
}> {
  const globals = window as ArchaeopteryxGlobals;
  const [d3Module, jqueryModule, foresterModule, phyloXmlModule] =
    await Promise.all([
      import("d3"),
      import("jquery"),
      import("archaeopteryx/forester"),
      import("phyloxml"),
    ]);

  globals.d3 = d3Module.default ?? d3Module;
  globals.jQuery = jqueryModule.default ?? jqueryModule;
  globals.$ = globals.jQuery;
  globals.forester = foresterModule.forester;
  globals.phyloXml = phyloXmlModule.phyloXml;

  await import("jquery-ui-dist/jquery-ui");

  const archaeopteryxModule = await import("archaeopteryx");
  return {
    archaeopteryx: archaeopteryxModule.archaeopteryx as ArchaeopteryxApi,
    forester: foresterModule.forester as Forester,
  };
}
