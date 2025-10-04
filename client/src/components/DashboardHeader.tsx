import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, MessageSquare, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import ChangePasswordDialog from "./ChangePasswordDialog";
import EmailPreferencesDialog from "./EmailPreferencesDialog";

interface DashboardHeaderProps {
  companyName?: string;
}

export default function DashboardHeader({ companyName = "Kusler Consulting" }: DashboardHeaderProps) {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 backdrop-blur-sm sticky top-0 z-40 bg-background/80">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/70 rounded flex items-center justify-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-primary-foreground font-bold text-xs relative z-10">K</span>
        </div>
        <span className="font-medium text-xs text-muted-foreground" data-testid="text-company-name">
          {companyName}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {user?.role === 'client' && <EmailPreferencesDialog />}
        <ChangePasswordDialog />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost"
              data-testid="button-menu"
              className="hover-elevate active-elevate-2 h-8 w-8"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="backdrop-blur-xl bg-popover/95 border-popover-border/50">
            <DropdownMenuItem onClick={() => setLocation('/faq')} data-testid="menu-faq">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & FAQ
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Request assistance')} data-testid="menu-request-assistance">
              <MessageSquare className="w-4 h-4 mr-2" />
              Request Developer Assistance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user?.role === 'admin' && (
              <>
                <DropdownMenuItem onClick={() => setLocation('/admin')} data-testid="menu-admin">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
