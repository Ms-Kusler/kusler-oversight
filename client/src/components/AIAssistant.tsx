import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AIAssistant() {
  //todo: remove mock functionality
  const insights = [
    { type: 'success', icon: CheckCircle2, text: 'Your cash flow is healthy - 3.2 months of runway available', color: 'text-chart-2' },
    { type: 'warning', icon: AlertTriangle, text: 'Invoice #1042 is 5 days overdue - consider sending reminder', color: 'text-chart-3' },
    { type: 'insight', icon: TrendingUp, text: 'Revenue up 14% vs last month - great momentum!', color: 'text-primary' },
  ];

  return (
    <Card className="p-4 sm:p-5 backdrop-blur-xl bg-gradient-to-br from-card/90 to-card/60 border-card-border/50 shadow-xl relative overflow-hidden" data-testid="card-ai-assistant">
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-20 bg-primary animate-pulse" style={{ animationDuration: '3s' }} />
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Smart insights from your data</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/40 backdrop-blur-sm hover-elevate transition-all duration-200">
              <Icon className={`w-4 h-4 mt-0.5 ${insight.color}`} />
              <p className="text-sm text-foreground/90 flex-1">{insight.text}</p>
            </div>
          );
        })}
      </div>

      <Button 
        variant="outline" 
        className="w-full mt-4 backdrop-blur-xl bg-card/40 border-border/50"
        onClick={() => console.log('View all insights')}
        data-testid="button-view-insights"
      >
        View All Insights
      </Button>
    </Card>
  );
}
