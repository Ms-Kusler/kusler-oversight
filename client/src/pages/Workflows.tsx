import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Integration, Automation } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNav from "@/components/BottomNav";
import DebugPanel from "@/components/DebugPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_PLATFORMS = [
  { id: 'quickbooks', name: 'QuickBooks', description: 'Accounting & invoicing' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing' },
  { id: 'paypal', name: 'PayPal', description: 'Payment processing' },
  { id: 'asana', name: 'Asana', description: 'Project management' },
  { id: 'monday', name: 'Monday.com', description: 'Project management' },
  { id: 'xero', name: 'Xero', description: 'Accounting' },
];

export default function Workflows() {
  const [activePage, setActivePage] = useState("workflows");
  const { toast } = useToast();

  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ['/api/integrations'],
  });

  const { data: automations = [] } = useQuery<Automation[]>({
    queryKey: ['/api/automations'],
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      return await apiRequest('/api/integrations', 'POST', {
        platform,
        isConnected: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration connected",
        description: "Your integration has been connected successfully.",
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/integrations/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integration disconnected",
        description: "Your integration has been disconnected.",
      });
    }
  });

  const getIntegrationStatus = (platformId: string) => {
    return integrations.find(i => i.platform.toLowerCase() === platformId.toLowerCase());
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-chart-3/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '5s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName="Kusler Consulting" />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Workflows
            </h1>
          </div>

          <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-chart-3" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-chart-3" />
                  <h3 className="font-semibold">Integration Status</h3>
                </div>
                <p className="text-2xl font-bold font-mono" data-testid="text-connected-count">{integrations.filter(i => i.isConnected).length} Connected</p>
                <p className="text-xs text-muted-foreground mt-1">{integrations.length} total integrations</p>
              </div>
            </div>
          </Card>

          {automations.length > 0 && (
            <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
              <div className="p-4 sm:p-5 border-b border-border/50">
                <h2 className="font-semibold text-lg">Active Automations</h2>
              </div>
              <div className="divide-y divide-border/30">
                {automations.map((automation) => (
                  <div key={automation.id} className="p-4 hover-elevate transition-all duration-200" data-testid={`automation-${automation.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{automation.name}</h3>
                          <Badge 
                            variant={automation.isActive ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {automation.isActive ? 'active' : 'paused'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{automation.type}</p>
                        {automation.lastRun && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Last run: {formatLastSync(automation.lastRun)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h2 className="font-semibold text-lg">Available Integrations</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect your business tools to sync data automatically</p>
            </div>
            <div className="divide-y divide-border/30">
              {AVAILABLE_PLATFORMS.map((platform) => {
                const integration = getIntegrationStatus(platform.id);
                const isConnected = integration?.isConnected || false;
                
                return (
                  <div key={platform.id} className="p-4 hover-elevate transition-all duration-200 flex items-center justify-between" data-testid={`integration-${platform.id}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${isConnected ? 'bg-chart-2/10' : 'bg-muted/50'}`}>
                        {isConnected ? (
                          <CheckCircle2 className="w-4 h-4 text-chart-2" />
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-xs text-muted-foreground">{platform.description}</p>
                        {isConnected && integration?.lastSynced && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Last sync: {formatLastSync(integration.lastSynced)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant={isConnected ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => {
                        if (isConnected && integration) {
                          disconnectMutation.mutate(integration.id);
                        } else {
                          connectMutation.mutate(platform.id);
                        }
                      }}
                      disabled={connectMutation.isPending || disconnectMutation.isPending}
                      data-testid={`button-toggle-${platform.id}`}
                    >
                      {isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
        <DebugPanel />
      </div>
    </div>
  );
}
