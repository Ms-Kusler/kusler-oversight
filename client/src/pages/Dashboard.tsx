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
    <div className="min-h-screen pb-20 bg-background">
      <DashboardHeader companyName="Kusler Consulting" />
      
      <main className="px-4 space-y-6 pb-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">Operations Hub</h1>
          <TimePeriodSelector value={period} onChange={setPeriod} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <MetricCard 
            title="Money In & Out"
            value="$8,400"
            subtitle="$ 6,200 spent"
            progress={57}
          />
          <BillsCard invoicesDue={3} overdue={1} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <MetricCard 
            title="Available Cash"
            value="$12,560"
            subtitle="available"
          />
          <ProfitChart percentage={14} trend="up" data={profitData} />
        </div>

        <SystemStatus />

        <ActionButtons />
      </main>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
