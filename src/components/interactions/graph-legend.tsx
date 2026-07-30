import { colors } from "@/lib/interactions/graph-theme";

export function GraphLegend() {
  return (
    <svg width={200} height={150} className="text-sm [&_text]:fill-foreground" role="img" aria-label="Graph legend">
      <circle cx={10} cy={11} r={10} fill={colors.microbial} />
      <text x={30} y={16}>Microbial protein</text>
      <circle cx={10} cy={39} r={10} fill={colors.host} />
      <text x={30} y={44}>Host protein</text>
      <circle cx={10} cy={67} r={10} fill={colors.selected} />
      <text x={30} y={72}>Selected</text>
      <line x1={0} y1={95} x2={20} y2={95} strokeWidth={3} stroke={colors.edge} />
      <text x={30} y={100}>Predicted interaction</text>
      <line x1={0} y1={123} x2={20} y2={123} strokeWidth={3} stroke={colors.edgeExperimental} />
      <text x={30} y={128}>Experimentally verified</text>
    </svg>
  );
}
