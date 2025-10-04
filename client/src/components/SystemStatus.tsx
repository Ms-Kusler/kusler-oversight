import { CheckCircle2 } from "lucide-react";

export default function SystemStatus() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-card" data-testid="status-system">
      <CheckCircle2 className="w-5 h-5 text-chart-2" />
      <span className="text-sm font-medium">All systems running</span>
    </div>
  );
}
