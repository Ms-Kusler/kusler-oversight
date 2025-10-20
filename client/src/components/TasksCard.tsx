import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";

export default function TasksCard() {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });

  const allPendingTasks = tasks.filter(t => t.status === 'pending');
  const totalPendingCount = allPendingTasks.length;
  
  const pendingTasks = allPendingTasks
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    })
    .slice(0, 5);

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  const handleCompleteTask = (taskId: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { status: 'completed', completedAt: new Date() }
    });
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertTriangle className="h-4 w-4" />;
    if (priority === 'medium') return <Clock className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const getPriorityBadgeVariant = (priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <Card className="p-6 hover-elevate">
        <div className="space-y-4">
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (pendingTasks.length === 0) {
    return (
      <Card className="p-6 hover-elevate" data-testid="card-tasks">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Action Items</h3>
          <Badge variant="outline" data-testid="badge-completed-count">
            {completedTasksCount} completed
          </Badge>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No pending action items</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover-elevate" data-testid="card-tasks">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Action Items</h3>
        <Badge variant="outline" data-testid="badge-pending-count">
          {totalPendingCount} pending
        </Badge>
      </div>

      <div className="space-y-3">
        {pendingTasks.map(task => (
          <div
            key={task.id}
            className="p-3 rounded-md border border-border bg-card hover-elevate active-elevate-2"
            data-testid={`task-${task.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={getPriorityBadgeVariant(task.priority)}
                    className="text-xs"
                    data-testid={`badge-priority-${task.id}`}
                  >
                    <span className="flex items-center gap-1">
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </span>
                  </Badge>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="font-medium text-sm mb-1" data-testid={`text-task-title-${task.id}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCompleteTask(task.id)}
                disabled={updateTaskMutation.isPending}
                data-testid={`button-complete-${task.id}`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalPendingCount > 5 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing 5 of {totalPendingCount} pending tasks
        </div>
      )}
    </Card>
  );
}
