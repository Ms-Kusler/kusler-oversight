import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Target, Calendar, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";

interface Recommendation {
  icon: string;
  text: string;
  action: string;
  color: string;
}

const iconMap = {
  Target,
  Calendar,
  DollarSign,
  AlertTriangle,
  TrendingUp,
};

export default function AIAssistant() {
  const { data: recommendations = [], isLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/ai-recommendations'],
  });

  return (
    <Card className="p-4 sm:p-5 backdrop-blur-xl bg-gradient-to-br from-card/90 to-card/60 border-card-border/50 shadow-xl relative overflow-hidden" data-testid="card-ai-assistant">
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-20 bg-primary animate-pulse" style={{ animationDuration: '3s' }} />
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Recommended actions</p>
        </div>
      </div>

      <div className="space-y-2.5 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          recommendations.map((rec, idx) => {
            const Icon = iconMap[rec.icon as keyof typeof iconMap] || Target;
            return (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/40 backdrop-blur-sm hover-elevate active-elevate-2 transition-all duration-200 cursor-pointer group">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${rec.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90">{rec.text}</p>
                  <span className="text-xs text-primary/70 group-hover:text-primary transition-colors mt-1 inline-block">
                    → {rec.action}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
