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
    <div className="space-y-1">
      {items.map((item, index) => (
        <Button
          key={index}
          onClick={item.onClick}
          variant="ghost"
          className={cn(
            "h-10 min-w-10 justify-start p-2 transition-[width] duration-300 ease-in-out",
            item.isActive && "bg-gray-300 text-secondary hover:bg-gray-300 hover:text-secondary/50",
            !item.isActive && "text-gray-700 hover:bg-gray-200 hover:text-primary",
            isCollapsed && "w-10",
            !isCollapsed && "w-full"

          )}
          title={isCollapsed ? item.label : undefined}
        >
          <div className="flex h-full items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center">{item.icon}</span>
            <span className={`
              overflow-hidden whitespace-nowrap
              transition-[width,opacity] duration-300 ease-in-out
              ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}
            `}>
              {item.label}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );
}