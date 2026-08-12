"use server";

import { redirect } from "next/navigation";

export async function redirectAfterAuth(destination: string) {
  const safeDestination = destination.startsWith("/") ? destination : "/";
  await Promise.resolve();
  redirect(safeDestination);
}
