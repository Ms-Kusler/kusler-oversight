import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BillsCardProps {
  invoicesDue: number;
  overdue: number;
}

export default function BillsCard({ invoicesDue, overdue }: BillsCardProps) {
  return (
    <Card className="p-6 space-y-4" data-testid="card-bills">
      <h3 className="text-sm font-medium text-muted-foreground">Bills & Payments Due</h3>
      <div className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold font-mono">{invoicesDue}</span>
            <span className="text-base text-foreground">invoices</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">due soon</p>
        </div>
        {overdue > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs" data-testid="badge-overdue">
              {overdue} overdue
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
