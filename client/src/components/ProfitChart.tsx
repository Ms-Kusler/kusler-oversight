import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from "recharts";

interface ProfitChartProps {
  percentage: number;
  trend: "up" | "down";
  data: { value: number }[];
}

export default function ProfitChart({ percentage, trend, data }: ProfitChartProps) {
  return (
    <Card 
      className="p-6 space-y-4 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl relative overflow-hidden hover-elevate transition-all duration-300" 
      data-testid="card-profit"
    >
      <div 
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity duration-700"
        style={{ background: trend === 'up' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))' }}
      />
      
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide relative z-10">
        Profit Snapshot
      </h3>
      
      <div className="h-24 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              fill="url(#profitGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center gap-3 relative z-10">
        {trend === 'up' ? (
          <TrendingUp className="w-6 h-6 text-chart-2" />
        ) : (
          <TrendingDown className="w-6 h-6 text-chart-5" />
        )}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono ${trend === 'up' ? 'text-chart-2' : 'text-chart-5'}`}>
            {trend === 'up' ? 'Up' : 'Down'} {percentage}%
          </span>
          <span className="text-sm text-muted-foreground/70">Vs. month</span>
        </div>
      </div>
    </Card>
  );
}
