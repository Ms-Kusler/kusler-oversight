import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  progress?: number;
  className?: string;
  glowColor?: string;
}

export default function MetricCard({ title, value, subtitle, progress, className, glowColor }: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "p-6 space-y-3 relative overflow-hidden backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl transition-all duration-300 hover-elevate",
        className
      )} 
      data-testid={`card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {glowColor && (
        <div 
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity duration-700"
          style={{ background: glowColor }}
        />
      )}
      
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
      
      {progress !== undefined && (
        <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-gradient-to-r from-chart-1 to-chart-1/60 rounded-full transition-all duration-700 ease-out shadow-lg"
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 20px hsl(var(--chart-1) / 0.5)'
            }}
          />
        </div>
      )}
      
      <div className="space-y-1 relative z-10">
        <p 
          className="text-5xl font-bold font-mono tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
          data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground/80" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-subtitle`}>
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
