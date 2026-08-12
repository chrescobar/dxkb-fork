import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavMenuItem {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface NavMenuProps {
  items: NavMenuItem[];
  isCollapsed: boolean;
}

export function VerticalMenu({ items, isCollapsed }: NavMenuProps) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <Button
          key={item.label}
          onClick={item.onClick}
          variant="ghost"
          className={cn(
            "min-w-8 px-2 text-foreground transition-[width] duration-300 ease-in-out",
            item.isActive
              ? "bg-secondary text-white hover:bg-secondary/90 hover:text-white"
              : "hover:bg-muted",
            isCollapsed ? "w-8 justify-center" : "justify-start",
          )}
          title={isCollapsed ? item.label : undefined}
        >
          <span className="flex shrink-0 items-center">{item.icon}</span>
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </Button>
      ))}
    </div>
  );
}
