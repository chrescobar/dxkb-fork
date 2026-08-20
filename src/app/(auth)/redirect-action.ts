"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/server/actions";

function safeRedirect(destination: string): string {
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

export async function safePostAuthDestination(destination: string) {
  await Promise.resolve();
  return safeRedirect(destination);
}

export async function signOutAndRedirect(formData: FormData) {
  await signOut();
  const redirectTo = formData.get("redirectTo");
  redirect(safeRedirect(typeof redirectTo === "string" ? redirectTo : "/"));
}
