import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Activity, Users, Clock, LogOut, ArrowLeft, RefreshCw, Shield, Lock, Eye, FileText, DollarSign, AlertTriangle, MessageSquare } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddClientDialog from "@/components/AddClientDialog";
import OffboardClientDialog from "@/components/OffboardClientDialog";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

interface ClientUser {
  id: string;
  businessName: string | null;
  email: string | null;
  username: string;
  lastLogin: Date | null;
  isActive: boolean;
  paymentStatus: 'current' | 'overdue' | 'paused';
  integrationsCount: number;
  health: 'healthy' | 'needs_setup';
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  
  interface SupportRequest {
    id: string;
    ticketId: string;
    category: string;
    description: string;
    status: string;
    createdAt: Date;
    user: {
      username: string;
      email: string | null;
      businessName: string | null;
    } | null;
  }

  const { data: clients = [], isLoading } = useQuery<ClientUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: supportRequests = [] } = useQuery<SupportRequest[]>({
    queryKey: ['/api/admin/support-requests'],
    select: (data) => data.filter((r: SupportRequest) => r.status === 'pending')
  });

  const resolveSupportRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest('PATCH', `/api/admin/support-requests/${requestId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-requests'] });
      toast({
        title: "Request Resolved",
        description: "Support request has been marked as resolved.",
      });
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return await apiRequest('POST', `/api/admin/users/${clientId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Client reactivated",
        description: "Client account has been reactivated successfully.",
      });
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ clientId, paymentStatus }: { clientId: string; paymentStatus: string }) => {
      return await apiRequest('PATCH', `/api/admin/users/${clientId}/payment-status`, { paymentStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      const statusLabels = { current: 'Current', overdue: 'Overdue', paused: 'Paused' };
      toast({
        title: "Payment Status Updated",
        description: `Account marked as ${statusLabels[variables.paymentStatus as keyof typeof statusLabels]}.`,
      });
    }
  });

  const resetDemoMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/reset-demo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Demo Reset Complete",
        description: "Demo account has been reset with fresh sample data.",
      });
    },
    onError: () => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset demo data. Please try again.",
        variant: "destructive"
      });
    }
  });

  const activeClients = clients.filter(c => c.isActive).length;
  const healthyClients = clients.filter(c => c.health === 'healthy').length;

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleViewDashboard = (clientId: string) => {
    toast({
      title: "View Client Dashboard",
      description: "Feature coming soon - admin can impersonate client view",
    });
  };

  const handleViewAuditLogs = () => {
    toast({
      title: "Audit Logs",
      description: "Audit log viewer coming soon",
    });
  };

  const handleSecuritySettings = () => {
    toast({
      title: "Security Settings",
      description: "Security settings panel coming soon",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Kusler Oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetDemoMutation.mutate()}
                disabled={resetDemoMutation.isPending}
                data-testid="button-reset-demo"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${resetDemoMutation.isPending ? 'animate-spin' : ''}`} />
                Reset Demo
              </Button>
              <AddClientDialog />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Security Settings</h2>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/30">
                <div className="p-2 rounded bg-chart-2/10">
                  <Lock className="w-4 h-4 text-chart-2" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Password Policies</h3>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                    <li>• Minimum 8 characters</li>
                    <li>• Upper & lowercase required</li>
                    <li>• Number or special character required</li>
                  </ul>
                </div>
                <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0" />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/30">
                <div className="p-2 rounded bg-chart-2/10">
                  <Activity className="w-4 h-4 text-chart-2" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Rate Limiting</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    5 login attempts per 15 minutes
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/30">
                <div className="p-2 rounded bg-chart-2/10">
                  <Lock className="w-4 h-4 text-chart-2" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Credential Encryption</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    AES-256-CBC encryption for all API keys
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0" />
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/30">
                <div className="p-2 rounded bg-chart-2/10">
                  <FileText className="w-4 h-4 text-chart-2" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">Audit Logging</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    All admin actions tracked & logged
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-chart-2 flex-shrink-0" />
              </div>
            </div>
          </div>
        </Card>

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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="cursor-pointer" data-testid={`button-payment-status-${client.id}`}>
                            {client.paymentStatus === 'current' ? (
                              <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30 gap-1">
                                <DollarSign className="w-3 h-3" />
                                Current
                              </Badge>
                            ) : client.paymentStatus === 'overdue' ? (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                Paused
                              </Badge>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem 
                            onClick={() => updatePaymentStatusMutation.mutate({ clientId: client.id, paymentStatus: 'current' })}
                            disabled={client.paymentStatus === 'current'}
                          >
                            Mark as Current
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updatePaymentStatusMutation.mutate({ clientId: client.id, paymentStatus: 'overdue' })}
                            disabled={client.paymentStatus === 'overdue'}
                          >
                            Mark as Overdue
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updatePaymentStatusMutation.mutate({ clientId: client.id, paymentStatus: 'paused' })}
                            disabled={client.paymentStatus === 'paused'}
                          >
                            Pause Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDashboard(client.id)}
                      data-testid={`button-view-${client.id}`}
                    >
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Support Requests</h2>
            {supportRequests.length > 0 && (
              <Badge variant="secondary">{supportRequests.length} Pending</Badge>
            )}
          </div>
          
          {supportRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending support requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supportRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg border border-border/50 bg-card/50 hover-elevate"
                  data-testid={`card-support-request-${request.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {request.ticketId}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {request.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {request.user?.businessName || request.user?.username}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {request.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.user?.email} • {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveSupportRequestMutation.mutate(request.id)}
                      disabled={resolveSupportRequestMutation.isPending}
                      data-testid={`button-resolve-${request.id}`}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewAuditLogs}
              data-testid="button-audit-logs"
            >
              View Audit Logs
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSecuritySettings}
              data-testid="button-security-settings"
            >
              Security Settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
