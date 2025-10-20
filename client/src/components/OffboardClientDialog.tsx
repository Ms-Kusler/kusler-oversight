import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";

interface OffboardClientDialogProps {
  clientId: string;
  businessName: string;
}

export default function OffboardClientDialog({ clientId, businessName }: OffboardClientDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/admin/users/${clientId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Client deactivated",
        description: `${businessName} has been deactivated. Their data is preserved but they cannot log in.`,
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate client",
        variant: "destructive",
      });
    }
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" data-testid={`button-offboard-${clientId}`}>
          <UserMinus className="w-4 h-4 mr-2" />
          Offboard
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Offboard Client?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to offboard <strong>{businessName}</strong>. This will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Deactivate their account (they cannot log in)</li>
              <li>Preserve all their data and audit logs</li>
              <li>Stop all automated workflows for this client</li>
              <li>Disconnect all integrations</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              You can reactivate this client later if needed. Their data will not be deleted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-offboard">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deactivateMutation.mutate()}
            disabled={deactivateMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-offboard"
          >
            {deactivateMutation.isPending ? "Deactivating..." : "Deactivate Client"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
