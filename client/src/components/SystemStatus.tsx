import { CheckCircle2 } from "lucide-react";

export default function SystemStatus() {
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-card/90 to-card/60 backdrop-blur-xl border border-card-border/50 shadow-lg relative overflow-hidden group transition-all duration-300 hover-elevate" 
      data-testid="status-system"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-chart-2/10 via-chart-2/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative">
        <CheckCircle2 className="w-5 h-5 text-chart-2 animate-pulse" />
        <div 
          className="absolute inset-0 rounded-full blur-md bg-chart-2/50 animate-pulse"
          style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
      </div>
      
      <span className="text-sm font-medium text-foreground/90 relative z-10">
        All systems running
      </span>
    </div>
  );
}
