import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function ProjectUpdates() {
  //todo: remove mock functionality
  const projects = [
    { id: 1, name: 'Website Redesign', status: 'in-progress', tasks: 8, completed: 5, tool: 'Asana', updated: '2 hours ago' },
    { id: 2, name: 'Q1 Marketing Campaign', status: 'completed', tasks: 12, completed: 12, tool: 'Monday.com', updated: '1 day ago' },
    { id: 3, name: 'Client Onboarding Flow', status: 'pending', tasks: 6, completed: 1, tool: 'Trello', updated: '3 hours ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-chart-2';
      case 'in-progress': return 'text-chart-3';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return Clock;
      default: return Circle;
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl" data-testid="card-project-updates">
      <div className="p-4 sm:p-5 border-b border-border/50">
        <h2 className="font-semibold text-lg">Project Updates</h2>
        <p className="text-xs text-muted-foreground mt-1">Synced from your project management tools</p>
      </div>
      <div className="divide-y divide-border/30">
        {projects.map((project) => {
          const StatusIcon = getStatusIcon(project.status);
          const progress = (project.completed / project.tasks) * 100;
          
          return (
            <div key={project.id} className="p-4 hover-elevate transition-all duration-200" data-testid={`project-${project.id}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{project.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {project.tool}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Updated {project.updated}</p>
                </div>
                <StatusIcon className={`w-5 h-5 ${getStatusColor(project.status)}`} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{project.completed} of {project.tasks} tasks complete</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
