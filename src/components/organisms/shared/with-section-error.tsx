import type { ReactElement } from "react";

import { SectionError } from "./section-error";

export async function withSectionError(
  load: () => Promise<ReactElement>,
): Promise<ReactElement> {
  try {
    return await load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return <SectionError message={message} />;
  }
}
