import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface ProfitChartProps {
  percentage: number;
  trend: "up" | "down";
  data: { value: number }[];
}

export default function ProfitChart({ percentage, trend, data }: ProfitChartProps) {
  return (
    <Card className="p-6 space-y-4" data-testid="card-profit">
      <h3 className="text-sm font-medium text-muted-foreground">Profit Snapshot</h3>
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-baseline gap-2">
        <TrendingUp className={`w-5 h-5 ${trend === 'up' ? 'text-chart-2' : 'text-chart-5'}`} />
        <span className="text-2xl font-bold font-mono">{trend === 'up' ? 'Up' : 'Down'} {percentage}%</span>
        <span className="text-sm text-muted-foreground">Vs. month</span>
      </div>
    </Card>
  );
}
