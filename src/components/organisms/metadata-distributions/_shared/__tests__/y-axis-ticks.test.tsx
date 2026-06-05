import { render } from "@testing-library/react";

import { YAxisTicks } from "../y-axis-ticks";

describe("YAxisTicks", () => {
  it("renders one gridline and one label per tick", () => {
    const { container } = render(
      <svg>
        <YAxisTicks ticks={[0, 50, 100]} yScale={(v) => 200 - v} innerWidth={400} />
      </svg>,
    );

    expect(container.querySelectorAll("line")).toHaveLength(3);
    expect(container.querySelectorAll("text")).toHaveLength(3);
    expect(container.querySelectorAll("text")[0].textContent).toBe("0");
    expect(container.querySelectorAll("text")[2].textContent).toBe("100");
  });

  it("formats tick numbers with numberFormatter (thousands separator)", () => {
    const { container } = render(
      <svg>
        <YAxisTicks ticks={[1000]} yScale={(v) => v} innerWidth={400} />
      </svg>,
    );
    expect(container.querySelector("text")?.textContent).toBe("1,000");
  });

  it("renders empty when ticks is empty", () => {
    const { container } = render(
      <svg>
        <YAxisTicks ticks={[]} yScale={(v) => v} innerWidth={400} />
      </svg>,
    );
    expect(container.querySelectorAll("line")).toHaveLength(0);
  });
});
