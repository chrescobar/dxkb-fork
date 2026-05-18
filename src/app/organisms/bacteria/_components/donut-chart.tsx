import type { DonutSlice } from "../_data/metadata-distributions";

const colorVar: Record<DonutSlice["color"], string> = {
  c1: "var(--bacteria-c1)",
  c2: "var(--bacteria-c2)",
  c3: "var(--bacteria-c3)",
  c4: "var(--bacteria-c4)",
  c5: "var(--bacteria-c5)",
  muted: "var(--muted)",
};

interface DonutChartProps {
  slices: DonutSlice[];
  total: string;
}

export function DonutChart({ slices, total }: DonutChartProps) {
  const segments = slices.reduce<{ slice: DonutSlice; offset: number }[]>((acc, slice) => {
    const previous = acc[acc.length - 1];
    const offset = previous ? previous.offset + previous.slice.pct : 0;
    return [...acc, { slice, offset }];
  }, []);

  return (
    <svg viewBox="-110 -110 220 220" className="w-[160px] h-[160px]" aria-label="Distribution donut chart">
      {segments.map(({ slice, offset }) => (
        <circle
          key={slice.label}
          r={80}
          fill="none"
          stroke={colorVar[slice.color]}
          strokeWidth={22}
          pathLength={100}
          strokeDasharray={`${slice.pct} 100`}
          strokeDashoffset={-offset}
        />
      ))}
      <text textAnchor="middle" y={2} fontSize={11} fill="var(--muted-foreground)">
        total
      </text>
      <text
        textAnchor="middle"
        y={22}
        fontSize={20}
        fontWeight={600}
        fill="var(--foreground)"
        fontFamily="var(--font-geist-mono), monospace"
      >
        {total}
      </text>
    </svg>
  );
}

export const donutColorVar = colorVar;
