import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ExternalLink } from "lucide-react";

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: {
    id: string;
    name: string;
    description: string;
  } | null;
  onConnect: (credentials: Record<string, string>) => void;
  isPending: boolean;
}

const INTEGRATION_CONFIGS: Record<string, {
  fields: Array<{ key: string; label: string; type: string; placeholder: string }>;
  helpUrl: string;
  instructions: string;
}> = {
  quickbooks: {
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter QuickBooks Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter QuickBooks Client Secret' },
      { key: 'realmId', label: 'Company ID', type: 'text', placeholder: 'Enter Company ID' },
    ],
    helpUrl: 'https://developer.intuit.com/app/developer/qbo/docs/get-started',
    instructions: 'Get your API credentials from QuickBooks Developer Portal'
  },
  stripe: {
    fields: [
      { key: 'apiKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
    ],
    helpUrl: 'https://dashboard.stripe.com/apikeys',
    instructions: 'Find your secret key in the Stripe Dashboard under Developers > API Keys'
  },
  paypal: {
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter PayPal Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter PayPal Secret' },
    ],
    helpUrl: 'https://developer.paypal.com/dashboard/applications',
    instructions: 'Get your API credentials from PayPal Developer Dashboard'
  },
  zapier: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter Zapier API Key' },
    ],
    helpUrl: 'https://zapier.com/app/settings/api-keys',
    instructions: 'Create an API key in Zapier Settings under API & Services'
  },
  asana: {
    fields: [
      { key: 'accessToken', label: 'Personal Access Token', type: 'password', placeholder: 'Enter Asana Personal Access Token' },
    ],
    helpUrl: 'https://app.asana.com/0/my-apps',
    instructions: 'Generate a Personal Access Token in Asana Settings > Apps > Developer Apps'
  },
  monday: {
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter Monday.com API Key' },
    ],
    helpUrl: 'https://support.monday.com/hc/en-us/articles/360005144659-Does-monday-com-have-an-API-',
    instructions: 'Get your API key from Monday.com Admin > API section'
  },
  xero: {
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Xero Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter Xero Client Secret' },
    ],
    helpUrl: 'https://developer.xero.com/myapps',
    instructions: 'Create an app in Xero Developer Portal to get credentials'
  },
};

export default function IntegrationDialog({
  open,
  onOpenChange,
  platform,
  onConnect,
  isPending
}: IntegrationDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const config = platform ? INTEGRATION_CONFIGS[platform.id] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (config && Object.keys(credentials).length === config.fields.length) {
      onConnect(credentials);
      setCredentials({});
    }
  };

  if (!platform || !config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect {platform.name}</DialogTitle>
          <DialogDescription>
            {config.instructions}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-primary">
              Your credentials are encrypted and stored securely. We never share your API keys.
            </p>
          </div>

          {config.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type}
                placeholder={field.placeholder}
                value={credentials[field.key] || ''}
                onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                required
                data-testid={`input-${field.key}`}
              />
            </div>
          ))}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => window.open(config.helpUrl, '_blank')}
              data-testid="button-help"
            >
              <ExternalLink className="w-3 h-3" />
              Get Credentials
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setCredentials({});
              }}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || Object.keys(credentials).length !== config.fields.length}
              data-testid="button-connect"
            >
              {isPending ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
