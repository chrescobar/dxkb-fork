import { Star, Layers, Clock, Activity, TrendingUp, type LucideIcon } from "lucide-react";
import { featuredWorkflows, type FeaturedWorkflow } from "../_data/sidebars";

const iconMap: Record<FeaturedWorkflow["iconType"], LucideIcon> = {
  layers: Layers,
  clock: Clock,
  activity: Activity,
  trend: TrendingUp,
};

export function FeaturedWorkflowsCard() {
  return (
    <div className="bacteria-card p-5">
      <h2 className="text-[16px] font-semibold flex items-center gap-2 mb-4">
        <Star className="size-4" style={{ color: "var(--primary)" }} />
        Featured Workflows
      </h2>
      <ul className="space-y-2 text-[13.5px]">
        {featuredWorkflows.map((workflow) => {
          const Icon = iconMap[workflow.iconType];
          return (
            <li key={workflow.title}>
              <a
                href="#"
                className="flex items-start gap-2 py-1.5 px-2 rounded-md hover:bg-[var(--muted)] transition-colors"
              >
                <Icon className="size-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--secondary)" }} />
                <span>
                  <span className="font-medium block">{workflow.title}</span>
                  <span className="text-[11.5px] text-muted-foreground">{workflow.description}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
