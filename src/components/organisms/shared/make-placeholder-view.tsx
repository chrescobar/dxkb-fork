import type { ComponentType } from "react";

import { PlaceholderView } from "./placeholder-view";

export function makePlaceholderView(title: string, description?: string): ComponentType {
  function View() {
    return <PlaceholderView title={title} description={description} />;
  }
  View.displayName = `${title.replaceAll(" ", "")}View`;
  return View;
}
