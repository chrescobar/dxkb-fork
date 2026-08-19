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

export interface ArchaeopteryxApi {
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
  setTheme(backgroundColor: string, labelColor: string): void;
  destroy(selector?: string): void;
}

interface ArchaeopteryxDependencies {
  archaeopteryx: ArchaeopteryxApi;
  forester: Forester;
}

interface CanvgModule {
  Canvg: {
    fromString(
      context: CanvasRenderingContext2D,
      svg: string,
    ): { render(): Promise<void> };
  };
}

interface ArchaeopteryxGlobals extends Window {
  d3?: unknown;
  jQuery?: unknown;
  $?: unknown;
  forester?: unknown;
  phyloXml?: unknown;
  canvg?: unknown;
  saveAs?: unknown;
}

let loader: Promise<ArchaeopteryxDependencies> | null = null;

export function loadArchaeopteryx(): Promise<ArchaeopteryxDependencies> {
  loader ??= loadDependencies().catch((cause: unknown) => {
    loader = null;
    throw cause;
  });
  return loader;
}

async function loadDependencies(): Promise<ArchaeopteryxDependencies> {
  const globals = window as ArchaeopteryxGlobals;
  const [
    d3Module,
    jqueryModule,
    foresterModule,
    phyloXmlModule,
    canvgModule,
    fileSaverModule,
  ] = await Promise.all([
    import("d3"),
    import("jquery"),
    import("archaeopteryx/forester"),
    import("phyloxml"),
    import("canvg") as Promise<unknown>,
    import("file-saver") as Promise<{ default: unknown }>,
  ]);

  globals.d3 = d3Module.default ?? d3Module;
  globals.jQuery = jqueryModule.default ?? jqueryModule;
  globals.$ = globals.jQuery;
  globals.forester = foresterModule.forester;
  globals.phyloXml = phyloXmlModule.phyloXml;
  globals.canvg = async (canvas: HTMLCanvasElement, svg: string) => {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is unavailable");
    const { Canvg } = canvgModule as CanvgModule;
    await Canvg.fromString(context, svg).render();
  };
  globals.saveAs = fileSaverModule.default;

  await import("jquery-ui-dist/jquery-ui");

  const archaeopteryxModule = await import("archaeopteryx");
  return {
    archaeopteryx: archaeopteryxModule.archaeopteryx as ArchaeopteryxApi,
    forester: foresterModule.forester as Forester,
  };
}
