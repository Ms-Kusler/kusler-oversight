import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function Workflows() {
  const [activePage, setActivePage] = useState("workflows");

  //todo: remove mock functionality
  const workflows = [
    { id: 1, name: 'Weekly Operations Brief', description: 'Email summary every Monday at 8AM', status: 'active', runs: 42 },
    { id: 2, name: 'Invoice Payment Sync', description: 'Update when payments received', status: 'active', runs: 156 },
    { id: 3, name: 'Low Cash Alert', description: 'Notify when cash below threshold', status: 'paused', runs: 3 },
    { id: 4, name: 'Expense Auto-Logger', description: 'Log expenses from connected apps', status: 'active', runs: 89 },
  ];

  const integrations = [
    { name: 'QuickBooks', status: 'connected', lastSync: '2 hours ago' },
    { name: 'Stripe', status: 'connected', lastSync: '15 minutes ago' },
    { name: 'Gmail', status: 'connected', lastSync: '1 hour ago' },
    { name: 'Google Drive', status: 'disconnected', lastSync: 'Never' },
  ];

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
                  <h3 className="font-semibold">Automation Status</h3>
                </div>
                <p className="text-2xl font-bold font-mono">{workflows.filter(w => w.status === 'active').length} Active</p>
                <p className="text-xs text-muted-foreground mt-1">{workflows.reduce((sum, w) => sum + w.runs, 0)} total runs this month</p>
              </div>
              <Button variant="default" onClick={() => console.log('Create workflow')} data-testid="button-new-workflow">
                New Workflow
              </Button>
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h2 className="font-semibold text-lg">Active Workflows</h2>
            </div>
            <div className="divide-y divide-border/30">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-4 hover-elevate transition-all duration-200" data-testid={`workflow-${workflow.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <Badge 
                          variant={workflow.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle2 className="w-3 h-3 text-chart-2" />
                        <span className="text-xs text-muted-foreground">{workflow.runs} successful runs</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => console.log(`Edit workflow ${workflow.id}`)}
                      data-testid={`button-edit-workflow-${workflow.id}`}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h2 className="font-semibold text-lg">Connected Integrations</h2>
            </div>
            <div className="divide-y divide-border/30">
              {integrations.map((integration, idx) => (
                <div key={idx} className="p-4 hover-elevate transition-all duration-200 flex items-center justify-between" data-testid={`integration-${integration.name.toLowerCase()}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${integration.status === 'connected' ? 'bg-chart-2/10' : 'bg-muted/50'}`}>
                      {integration.status === 'connected' ? (
                        <CheckCircle2 className="w-4 h-4 text-chart-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={integration.status === 'connected' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => console.log(`Toggle ${integration.name}`)}
                    data-testid={`button-toggle-${integration.name.toLowerCase()}`}
                  >
                    {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    </div>
  );
}
