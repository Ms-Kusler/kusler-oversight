import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, DollarSign, TrendingUp, TrendingDown, BarChart, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  category: string;
}

const iconMap = {
  CheckCircle,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart,
  Clock,
};

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/recent-activity'],
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'automation': return 'bg-primary/10 text-primary';
      case 'task': return 'bg-chart-2/10 text-chart-2';
      case 'transaction': return 'bg-chart-3/10 text-chart-3';
      case 'invoice': return 'bg-chart-1/10 text-chart-1';
      case 'report': return 'bg-chart-4/10 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'automation': return 'Auto';
      case 'task': return 'Task';
      case 'transaction': return 'Transaction';
      case 'invoice': return 'Invoice';
      case 'report': return 'Report';
      default: return category;
    }
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl" data-testid="card-recent-activity">
        <div className="p-4 sm:p-5 border-b border-border/50">
          <h2 className="font-semibold text-lg">Recent Activity</h2>
          <p className="text-xs text-muted-foreground mt-1">Latest updates and automations</p>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted/50 animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl" data-testid="card-recent-activity">
      <div className="p-4 sm:p-5 border-b border-border/50">
        <h2 className="font-semibold text-lg">Recent Activity</h2>
        <p className="text-xs text-muted-foreground mt-1">Latest updates and automations</p>
      </div>
      <div className="divide-y divide-border/30">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = iconMap[activity.icon as keyof typeof iconMap] || CheckCircle;
            
            return (
              <div key={activity.id} className="p-4 hover-elevate transition-all duration-200" data-testid={`activity-${activity.id}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(activity.category)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{activity.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryBadge(activity.category)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
