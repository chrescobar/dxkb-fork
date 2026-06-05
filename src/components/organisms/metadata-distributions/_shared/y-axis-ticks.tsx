import { numberFormatter } from "@/lib/services/organisms/utils";

interface YAxisTicksProps {
  ticks: number[];
  yScale: (value: number) => number;
  innerWidth: number;
}

export function YAxisTicks({ ticks, yScale, innerWidth }: YAxisTicksProps) {
  return (
    <>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={0}
            x2={innerWidth}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            x={-6}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            className="fill-muted-foreground tabular-nums"
          >
            {numberFormatter.format(tick)}
          </text>
        </g>
      ))}
    </>
  );
}
