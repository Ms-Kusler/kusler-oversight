import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  className?: string;
}

export default function MetricCard({ title, value, subtitle, progress, className }: MetricCardProps) {
  return (
    <Card className={cn("p-6 space-y-3", className)} data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {progress !== undefined && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-chart-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-4xl font-bold font-mono tracking-tight" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-subtitle`}>
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
