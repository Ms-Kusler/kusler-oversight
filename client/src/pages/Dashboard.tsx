import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Integration } from "@shared/schema";
import DashboardHeader from "@/components/DashboardHeader";
import TimePeriodSelector from "@/components/TimePeriodSelector";
import MetricCard from "@/components/MetricCard";
import BillsCard from "@/components/BillsCard";
import ProfitChart from "@/components/ProfitChart";
import SystemStatus from "@/components/SystemStatus";
import ActionButtons from "@/components/ActionButtons";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import AIAssistant from "@/components/AIAssistant";
import ProjectUpdates from "@/components/ProjectUpdates";
import SecurityStatus from "@/components/SecurityStatus";
import DebugPanel from "@/components/DebugPanel";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("home");
  const [period, setPeriod] = useState("This Month");

  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ['/api/integrations'],
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
  });

  const profitData = [
    { value: 3200 },
    { value: 3800 },
    { value: 3500 },
    { value: 4200 },
    { value: 4800 },
    { value: 4300 },
    { value: 5100 }
  ];

  const connectedIntegrations = integrations.filter(i => i.isConnected);
  const hasFinancialTools = connectedIntegrations.some(i => 
    ['stripe', 'paypal', 'quickbooks', 'xero'].includes(i.platform.toLowerCase())
  );
  const hasProjectManagement = connectedIntegrations.some(i => 
    ['asana', 'monday', 'trello', 'clickup'].includes(i.platform.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-chart-2/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName="Kusler Consulting" />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Operations Hub
            </h1>
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <MetricCard 
              title="Money In & Out"
              value="$8,400"
              subtitle="$ 6,200 spent"
              progress={57}
              glowColor="hsl(var(--chart-1))"
            />
            <BillsCard invoicesDue={3} overdue={1} />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <MetricCard 
              title="Available Cash"
              value="$12,560"
              subtitle="available"
              glowColor="hsl(var(--chart-2))"
            />
            <ProfitChart percentage={14} trend="up" data={profitData} />
          </div>

          <div className="grid gap-3 sm:gap-4">
            <AIAssistant />
            <ProjectUpdates />
          </div>

          <SecurityStatus />
          
          <SystemStatus />

          <ActionButtons />
          
          <Footer />
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
        <DebugPanel />
      </div>
    </div>
  );
}
