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
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 z-50 shadow-2xl">
      <div className="flex items-center justify-around h-16 max-w-7xl mx-auto relative">
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
                "flex flex-col items-center justify-center gap-1 flex-1 h-full hover-elevate active-elevate-2 transition-all duration-300 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              data-testid={`button-nav-${item.id}`}
            >
              {isActive && (
                <div 
                  className="absolute inset-0 bg-primary/10 backdrop-blur-sm"
                  style={{
                    boxShadow: '0 -2px 20px hsl(var(--primary) / 0.2)'
                  }}
                />
              )}
              
              <Icon className={cn(
                "w-6 h-6 transition-all duration-300 relative z-10",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium transition-all duration-300 relative z-10",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
