import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/lib/auth";
import TimePeriodSelector from "@/components/TimePeriodSelector";
import MetricCard from "@/components/MetricCard";
import BillsCard from "@/components/BillsCard";
import ProfitChart from "@/components/ProfitChart";
import SystemStatus from "@/components/SystemStatus";
import ActionButtons from "@/components/ActionButtons";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import AIAssistant from "@/components/AIAssistant";
import RecentActivity from "@/components/RecentActivity";
import DebugPanel from "@/components/DebugPanel";
import TasksCard from "@/components/TasksCard";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("home");
  const [period, setPeriod] = useState("This Month");
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery<{
    moneyIn: number;
    moneyOut: number;
    availableCash: number;
    invoicesDue: number;
    invoicesOverdue: number;
    profitTrend: Array<{ value: number }>;
  }>({
    queryKey: ['/api/dashboard'],
  });

  const moneyIn = dashboardData?.moneyIn ? (dashboardData.moneyIn / 100).toFixed(0) : '0';
  const moneyOut = dashboardData?.moneyOut ? (dashboardData.moneyOut / 100).toFixed(0) : '0';
  const availableCash = dashboardData?.availableCash ? (dashboardData.availableCash / 100).toFixed(0) : '0';
  const invoicesDue = dashboardData?.invoicesDue ?? 0;
  const invoicesOverdue = dashboardData?.invoicesOverdue ?? 0;
  
  const totalMoney = dashboardData?.moneyIn ?? 0;
  const moneyInNum = dashboardData?.moneyIn ?? 1;
  const moneyOutNum = dashboardData?.moneyOut ?? 0;
  const progressPercent = totalMoney > 0 ? Math.round((moneyOutNum / moneyInNum) * 100) : 0;
  
  const profitMargin = moneyInNum > 0 ? Math.round(((moneyInNum - moneyOutNum) / moneyInNum) * 100) : 0;
  const profitTrend = profitMargin >= 0 ? 'up' : 'down';

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-chart-2/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName={user?.businessName || "Kusler Consulting"} />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90 text-center sm:text-left flex-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Kusler Oversight
            </h1>
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <MetricCard 
              title="Money In & Out"
              value={isLoading ? '...' : `$${moneyIn}`}
              subtitle={isLoading ? '...' : `$ ${moneyOut} spent`}
              progress={progressPercent}
              glowColor="hsl(var(--chart-1))"
            />
            <BillsCard invoicesDue={invoicesDue} overdue={invoicesOverdue} />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <MetricCard 
              title="Available Cash"
              value={isLoading ? '...' : `$${availableCash}`}
              subtitle="available"
              glowColor="hsl(var(--chart-2))"
            />
            <ProfitChart percentage={Math.abs(profitMargin)} trend={profitTrend} data={dashboardData?.profitTrend ?? []} />
          </div>

          <TasksCard />

          <div className="grid gap-3 sm:gap-4">
            <AIAssistant />
            <RecentActivity />
          </div>
          
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
