"use server";

import { redirect } from "next/navigation";
import { safePostAuthDestination } from "@/lib/auth/redirect";
import { signOut } from "@/lib/auth/server/actions";

export async function signOutAndRedirect(formData: FormData) {
  await signOut();
  const redirectTo = formData.get("redirectTo");
  redirect(
    safePostAuthDestination(typeof redirectTo === "string" ? redirectTo : "/"),
  );
}
