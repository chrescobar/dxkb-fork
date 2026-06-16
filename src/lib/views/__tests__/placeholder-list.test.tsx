import { render, screen } from "@testing-library/react";
import { PlaceholderList } from "../placeholder-list";

describe("PlaceholderList", () => {
  it("shows the label and the resolved RQL", () => {
    render(<PlaceholderList label="Genome" rql="keyword(flu)" />);
    expect(screen.getByText(/Genome list/i)).toBeInTheDocument();
    expect(screen.getByText("keyword(flu)")).toBeInTheDocument();
  });
  it("shows an all-records hint when rql is empty", () => {
    render(<PlaceholderList label="Genome" rql="" />);
    expect(screen.getByText(/all records/i)).toBeInTheDocument();
  });
});
