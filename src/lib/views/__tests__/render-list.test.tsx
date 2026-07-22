import { render, screen } from "@testing-library/react";
import { renderListShell } from "../render-list";
import { viewRegistry } from "../view-registry";

describe("renderListShell", () => {
  it("renders the placeholder with the resolved rql from friendly params", () => {
    render(renderListShell(viewRegistry.genome, { keyword: "influenza" }));
    expect(screen.getByText("keyword(influenza)")).toBeInTheDocument();
  });
  it("honors the rql escape hatch", () => {
    render(renderListShell(viewRegistry.genome, { rql: "eq(public,false)" }));
    expect(screen.getByText("eq(public,false)")).toBeInTheDocument();
  });
});
