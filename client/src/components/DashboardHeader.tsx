import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  companyName?: string;
}

export default function DashboardHeader({ companyName = "Kusler Consulting" }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 backdrop-blur-sm sticky top-0 z-40 bg-background/80">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/70 rounded flex items-center justify-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-primary-foreground font-bold text-xs relative z-10">K</span>
        </div>
        <span className="font-medium text-xs text-muted-foreground" data-testid="text-company-name">
          {companyName}
        </span>
      </div>
      
      <Button 
        size="icon" 
        variant="ghost"
        onClick={() => console.log('Menu clicked')}
        data-testid="button-menu"
        className="hover-elevate active-elevate-2 h-8 w-8"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
    </header>
  );
}
