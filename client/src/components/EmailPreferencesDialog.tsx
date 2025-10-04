import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail } from "lucide-react";

export default function EmailPreferencesDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [lowCashAlerts, setLowCashAlerts] = useState(true);
  const [overdueInvoices, setOverdueInvoices] = useState(true);
  const [integrationFailures, setIntegrationFailures] = useState(true);

  useEffect(() => {
    if (user && user.emailPreferences) {
      const prefs = user.emailPreferences as any;
      setWeeklyReports(prefs.weeklyReports !== false);
      setLowCashAlerts(prefs.lowCashAlerts !== false);
      setOverdueInvoices(prefs.overdueInvoices !== false);
      setIntegrationFailures(prefs.integrationFailures !== false);
    }
  }, [user]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/auth/email-preferences', {
        weeklyReports,
        lowCashAlerts,
        overdueInvoices,
        integrationFailures
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Preferences updated",
        description: "Your email preferences have been saved.",
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update email preferences.",
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-email-preferences" className="px-2 sm:px-3">
          <Mail className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Email Preferences</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Email Preferences</DialogTitle>
          <DialogDescription>
            Choose which emails you'd like to receive from Kusler Oversight.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Weekly Financial Summary</Label>
              <p className="text-sm text-muted-foreground">
                Sent every Monday at 8 AM with your financial overview
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
              data-testid="switch-weekly-reports"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-cash">Low Cash Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notifies you when cash balance falls below $5,000
              </p>
            </div>
            <Switch
              id="low-cash"
              checked={lowCashAlerts}
              onCheckedChange={setLowCashAlerts}
              data-testid="switch-low-cash"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="overdue-invoices">Overdue Invoice Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminds you about unpaid invoices past their due date
              </p>
            </div>
            <Switch
              id="overdue-invoices"
              checked={overdueInvoices}
              onCheckedChange={setOverdueInvoices}
              data-testid="switch-overdue-invoices"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="integration-failures">Integration Failures</Label>
              <p className="text-sm text-muted-foreground">
                Alerts when integrations disconnect or fail to sync
              </p>
            </div>
            <Switch
              id="integration-failures"
              checked={integrationFailures}
              onCheckedChange={setIntegrationFailures}
              data-testid="switch-integration-failures"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="button-cancel-preferences"
          >
            Cancel
          </Button>
          <Button
            onClick={() => updatePreferencesMutation.mutate()}
            disabled={updatePreferencesMutation.isPending}
            data-testid="button-save-preferences"
          >
            {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
