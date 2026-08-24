export function safePostAuthDestination(destination: string): string {
  const baseUrl = "https://dxkb.internal";
  try {
    const parsedDestination = new URL(destination, baseUrl);
    const candidate = `${parsedDestination.pathname}${parsedDestination.search}${parsedDestination.hash}`;
    if (
      destination.startsWith("/") &&
      parsedDestination.origin === baseUrl &&
      !candidate.startsWith("//")
    ) {
      return candidate;
    }
  } catch {
    // Invalid destinations fall back to the home page.
  }
  return "/";
}
