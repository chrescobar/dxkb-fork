"use server";

import { redirect } from "next/navigation";

export async function redirectAfterAuth(destination: string) {
  const baseUrl = "https://dxkb.internal";
  let safeDestination = "/";

  try {
    const parsedDestination = new URL(destination, baseUrl);
    if (destination.startsWith("/") && parsedDestination.origin === baseUrl) {
      safeDestination = `${parsedDestination.pathname}${parsedDestination.search}${parsedDestination.hash}`;
    }
  } catch {
    // Invalid destinations fall back to the home page.
  }

  await Promise.resolve();
  redirect(safeDestination);
}
