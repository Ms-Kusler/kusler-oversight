import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Clock } from "lucide-react";

export default function SecurityStatus() {
  //todo: remove mock functionality
  const lastScan = '15 minutes ago';
  const vulnerabilities = 0;
  const isScanning = false;

  return (
    <Card className="p-4 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl relative overflow-hidden hover-elevate transition-all duration-300" data-testid="card-security">
      {vulnerabilities === 0 && (
        <div 
          className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-20 bg-chart-2 animate-pulse"
          style={{ animationDuration: '2s' }}
        />
      )}
      
      <div className="flex items-center gap-3 relative z-10">
        <div className={`p-2 rounded-lg ${vulnerabilities === 0 ? 'bg-chart-2/10' : 'bg-destructive/10'}`}>
          <Shield className={`w-5 h-5 ${vulnerabilities === 0 ? 'text-chart-2' : 'text-destructive'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm">Security Scan</h3>
            {isScanning ? (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Scanning...
              </Badge>
            ) : (
              <Badge variant={vulnerabilities === 0 ? 'default' : 'destructive'} className="text-xs">
                {vulnerabilities === 0 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Secure
                  </>
                ) : (
                  `${vulnerabilities} Issues`
                )}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Last scan: {lastScan}</p>
        </div>
      </div>
    </Card>
  );
}
