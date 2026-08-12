export async function loadMolstar() {
  const [{ createPluginUI }, { renderReact18 }, { DefaultPluginUISpec }] =
    await Promise.all([
      import("molstar/lib/mol-plugin-ui"),
      import("molstar/lib/mol-plugin-ui/react18"),
      import("molstar/lib/mol-plugin-ui/spec"),
    ]);

  return { createPluginUI, renderReact18, DefaultPluginUISpec };
}
