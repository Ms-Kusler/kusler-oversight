import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import TimePeriodSelector from "@/components/TimePeriodSelector";
import MetricCard from "@/components/MetricCard";
import BillsCard from "@/components/BillsCard";
import ProfitChart from "@/components/ProfitChart";
import SystemStatus from "@/components/SystemStatus";
import ActionButtons from "@/components/ActionButtons";
import BottomNav from "@/components/BottomNav";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("home");
  const [period, setPeriod] = useState("This Month");

  //todo: remove mock functionality
  const profitData = [
    { value: 3200 },
    { value: 3800 },
    { value: 3500 },
    { value: 4200 },
    { value: 4800 },
    { value: 4300 },
    { value: 5100 }
  ];

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      <div className="relative z-10">
        <DashboardHeader companyName="Kusler Consulting" />
        
        <main className="px-4 space-y-6 pb-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Operations Hub
            </h1>
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <MetricCard 
              title="Money In & Out"
              value="$8,400"
              subtitle="$ 6,200 spent"
              progress={57}
              glowColor="hsl(var(--chart-1))"
            />
            <BillsCard invoicesDue={3} overdue={1} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <MetricCard 
              title="Available Cash"
              value="$12,560"
              subtitle="available"
              glowColor="hsl(var(--chart-2))"
            />
            <ProfitChart percentage={14} trend="up" data={profitData} />
          </div>

          <SystemStatus />

          <ActionButtons />
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    </div>
  );
}
