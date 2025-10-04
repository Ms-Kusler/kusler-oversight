import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, ChevronDown, ChevronUp, Copy, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  //todo: remove mock functionality
  const debugInfo = {
    environment: 'production',
    version: '1.0.0',
    uptime: '3h 42m',
    lastSync: '2 minutes ago',
    apiStatus: 'healthy',
    databaseStatus: 'connected',
    memoryUsage: '45%',
    activeConnections: 3,
    errors: [],
    warnings: ['Cache hit rate below optimal (72%)'],
    recentLogs: [
      { time: '14:23:45', level: 'info', message: 'Transaction sync completed - 12 records updated' },
      { time: '14:22:10', level: 'info', message: 'Invoice #1042 status changed to paid' },
      { time: '14:20:33', level: 'warn', message: 'Slow query detected: GET /api/transactions (1.2s)' },
      { time: '14:18:05', level: 'info', message: 'QuickBooks sync successful' },
    ]
  };

  const copyDebugInfo = () => {
    const text = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-chart-2" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-chart-3" />;
      default:
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-destructive';
      case 'warn': return 'text-chart-3';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="hidden sm:block fixed bottom-20 right-4 z-50 max-w-md" data-testid="debug-panel">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 backdrop-blur-xl bg-card/90 border-border/50 shadow-xl hover-elevate"
            data-testid="button-toggle-debug"
          >
            <Bug className="w-4 h-4" />
            Debug
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 backdrop-blur-xl bg-card/95 border-card-border/50 shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">System Debug Info</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyDebugInfo}
                data-testid="button-copy-debug"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-chart-2" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">System Status</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">API</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(debugInfo.apiStatus)}
                      <span className="text-xs">{debugInfo.apiStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Database</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(debugInfo.databaseStatus)}
                      <span className="text-xs">{debugInfo.databaseStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Memory</span>
                    <span className="text-xs font-mono">{debugInfo.memoryUsage}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="text-xs font-mono">{debugInfo.uptime}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Environment</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <Badge variant="secondary" className="text-xs font-mono">{debugInfo.version}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Environment</span>
                    <Badge variant="secondary" className="text-xs">{debugInfo.environment}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Connections</span>
                    <span className="text-xs font-mono">{debugInfo.activeConnections} active</span>
                  </div>
                </div>
              </div>

              {debugInfo.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-chart-3 uppercase tracking-wide">Warnings</h4>
                  <div className="space-y-1">
                    {debugInfo.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-chart-3/10 text-xs">
                        <AlertTriangle className="w-3 h-3 text-chart-3 mt-0.5 flex-shrink-0" />
                        <span className="text-chart-3">{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Logs</h4>
                <div className="space-y-1 font-mono text-xs">
                  {debugInfo.recentLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded bg-background/50 flex gap-2">
                      <span className="text-muted-foreground/60">{log.time}</span>
                      <span className={`uppercase font-semibold ${getLogColor(log.level)}`}>
                        [{log.level}]
                      </span>
                      <span className="text-foreground/80 flex-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
