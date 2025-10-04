import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  companyName?: string;
}

export default function DashboardHeader({ companyName = "Kusler Consulting" }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">K</span>
        </div>
        <span className="font-semibold text-sm" data-testid="text-company-name">{companyName}</span>
      </div>
      <Button 
        size="icon" 
        variant="ghost"
        onClick={() => console.log('Menu clicked')}
        data-testid="button-menu"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>
    </header>
  );
}
