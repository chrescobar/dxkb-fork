import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";

import { SarsCov2StartWithCard } from "@/app/services/(viral-tools)/sars-cov2-genome-analysis/sars-cov2-start-with-card";

function TestWrapper({
  initialInputType = "reads" as const,
}: {
  initialInputType?: "reads" | "contigs";
}) {
  const form = useForm({
    defaultValues: { input_type: initialInputType },
  });
  return <SarsCov2StartWithCard form={form as never} />;
}

describe("SarsCov2StartWithCard", () => {

  it("renders Read File and Assembled Contigs radio options", () => {
    render(<TestWrapper />);

    expect(screen.getByRole("radio", { name: /read file/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /assembled contigs/i })).toBeInTheDocument();
  });

  it("defaults to the form's current input_type value", () => {
    render(<TestWrapper initialInputType="reads" />);

    expect(screen.getByRole("radio", { name: /read file/i })).toBeChecked();
  });

  it("clicking Assembled Contigs updates the form field", async () => {
    const user = userEvent.setup();
    render(<TestWrapper initialInputType="reads" />);

    await user.click(screen.getByRole("radio", { name: /assembled contigs/i }));

    expect(screen.getByRole("radio", { name: /assembled contigs/i })).toBeChecked();
  });

  it("clicking Read File updates the form field", async () => {
    const user = userEvent.setup();
    render(<TestWrapper initialInputType="contigs" />);

    await user.click(screen.getByRole("radio", { name: /read file/i }));

    expect(screen.getByRole("radio", { name: /read file/i })).toBeChecked();
  });
});
