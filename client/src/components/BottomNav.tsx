import { Home, DollarSign, Workflow, FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  active?: string;
  onNavigate?: (tab: string) => void;
}

export default function BottomNav({ active = "home", onNavigate }: BottomNavProps) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "finances", label: "Finances", icon: DollarSign },
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "reports", label: "Reports", icon: FileBarChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                console.log(`Navigating to ${item.id}`);
                onNavigate?.(item.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full hover-elevate active-elevate-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={`button-nav-${item.id}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
