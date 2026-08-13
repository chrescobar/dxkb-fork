"use server";

import { redirect } from "next/navigation";

export async function redirectAfterAuth(destination: string) {
  const baseUrl = "https://dxkb.internal";
  let safeDestination = "/";

  try {
    const parsedDestination = new URL(destination, baseUrl);
    const candidate = `${parsedDestination.pathname}${parsedDestination.search}${parsedDestination.hash}`;
    if (
      destination.startsWith("/") &&
      parsedDestination.origin === baseUrl &&
      !candidate.startsWith("//")
    ) {
      safeDestination = candidate;
    }
  } catch {
    // Invalid destinations fall back to the home page.
  }

  await Promise.resolve();
  redirect(safeDestination);
}
