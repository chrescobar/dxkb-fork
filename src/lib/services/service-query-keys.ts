export const serviceQueryKeys = {
  genomeGroupMembers: (groupPath: string) =>
    ["service", "genome-group", groupPath] as const,
  featureGroupMembers: (groupPath: string) =>
    ["service", "feature-group", groupPath] as const,
};
