import { colors } from "@/lib/interactions/graph-theme";

export function GraphLegend() {
  return (
    <svg width={170} height={140} style={{ fontSize: 10 }} role="img" aria-label="Graph legend">
      <circle cx={10} cy={10} r={10} fill={colors.microbial} />
      <text x={30} y={15}>Microbial protein</text>
      <circle cx={10} cy={35} r={10} fill={colors.host} />
      <text x={30} y={40}>Host protein</text>
      <circle cx={10} cy={60} r={10} fill={colors.selected} />
      <text x={30} y={65}>Selected</text>
      <line x1={0} y1={85} x2={20} y2={85} strokeWidth={3} stroke={colors.edge} />
      <text x={30} y={90}>Predicted interaction</text>
      <line x1={0} y1={110} x2={20} y2={110} strokeWidth={3} stroke={colors.edgeExperimental} />
      <text x={30} y={115}>Experimentally verified</text>
    </svg>
  );
}
