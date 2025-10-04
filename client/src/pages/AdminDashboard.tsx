import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Activity, Users, Clock } from "lucide-react";
import AddClientDialog from "@/components/AddClientDialog";
import OffboardClientDialog from "@/components/OffboardClientDialog";

interface ClientUser {
  id: string;
  businessName: string | null;
  email: string | null;
  username: string;
  lastLogin: Date | null;
  isActive: boolean;
  integrationsCount: number;
  health: 'healthy' | 'needs_setup';
}

export default function AdminDashboard() {
  const { toast } = useToast();
  
  const { data: clients = [], isLoading } = useQuery<ClientUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const reactivateMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest(`/api/admin/users/${clientId}/toggle-active`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Client reactivated",
        description: "Client account has been reactivated successfully.",
      });
    }
  });

  const activeClients = clients.filter(c => c.isActive).length;
  const healthyClients = clients.filter(c => c.health === 'healthy').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Kusler Oversight</p>
          </div>
          <div className="flex items-center gap-3">
            <AddClientDialog />
            <Badge variant="outline" className="gap-2" data-testid="badge-admin">
              <Activity className="w-3 h-3" />
              Admin Access
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold" data-testid="text-total-clients">{clients.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-2/10">
                <CheckCircle2 className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold" data-testid="text-active-clients">{activeClients}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-1/10">
                <Activity className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Healthy Setups</p>
                <p className="text-2xl font-bold" data-testid="text-healthy-clients">{healthyClients}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Client Accounts</h2>
          
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No clients found</div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 hover-elevate"
                  data-testid={`card-client-${client.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground" data-testid={`text-business-name-${client.id}`}>
                          {client.businessName || client.username}
                        </h3>
                        {client.isActive ? (
                          <Badge variant="outline" className="gap-1 text-xs" data-testid={`badge-status-${client.id}`}>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 text-xs" data-testid={`badge-status-${client.id}`}>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{client.email}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {client.lastLogin
                            ? new Date(client.lastLogin).toLocaleDateString()
                            : 'Never logged in'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Integrations</p>
                        <p className="text-lg font-semibold" data-testid={`text-integrations-${client.id}`}>
                          {client.integrationsCount}
                        </p>
                      </div>
                      
                      {client.health === 'healthy' ? (
                        <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30" data-testid={`badge-health-${client.id}`}>
                          Healthy
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`badge-health-${client.id}`}>
                          Needs Setup
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!client.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => reactivateMutation.mutate(client.id)}
                        disabled={reactivateMutation.isPending}
                        data-testid={`button-reactivate-${client.id}`}
                      >
                        Reactivate
                      </Button>
                    )}
                    <Button variant="outline" size="sm" data-testid={`button-view-${client.id}`}>
                      View Dashboard
                    </Button>
                    {client.isActive && (
                      <OffboardClientDialog 
                        clientId={client.id} 
                        businessName={client.businessName || client.username}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Security & Compliance</h2>
          <p className="text-sm text-muted-foreground mb-4">
            All admin actions are logged and can be audited. Client data is isolated per account.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" data-testid="button-audit-logs">
              View Audit Logs
            </Button>
            <Button variant="outline" size="sm" data-testid="button-security-settings">
              Security Settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
