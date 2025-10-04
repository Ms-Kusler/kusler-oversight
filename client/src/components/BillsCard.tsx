import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface BillsCardProps {
  invoicesDue: number;
  overdue: number;
}

export default function BillsCard({ invoicesDue, overdue }: BillsCardProps) {
  return (
    <Card 
      className="p-6 space-y-4 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl relative overflow-hidden hover-elevate transition-all duration-300" 
      data-testid="card-bills"
    >
      {overdue > 0 && (
        <div 
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity duration-700"
          style={{ background: 'hsl(var(--destructive))' }}
        />
      )}
      
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Bills & Payments Due
      </h3>
      
      <div className="space-y-3 relative z-10">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold font-mono bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {invoicesDue}
            </span>
            <span className="text-base text-foreground/80">invoices</span>
          </div>
          <p className="text-sm text-muted-foreground/80 mt-1">due soon</p>
        </div>
        
        {overdue > 0 && (
          <div className="flex items-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <Badge 
              variant="destructive" 
              className="text-xs shadow-lg" 
              data-testid="badge-overdue"
              style={{ boxShadow: '0 0 20px hsl(var(--destructive) / 0.3)' }}
            >
              {overdue} overdue
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
