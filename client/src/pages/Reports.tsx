import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import DebugPanel from "@/components/DebugPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, TrendingUp, Calendar } from "lucide-react";

export default function Reports() {
  const [activePage, setActivePage] = useState("reports");
  const { user } = useAuth();

  //todo: remove mock functionality
  const monthlyData = [
    { month: 'Sep', income: 7200, expenses: 5100 },
    { month: 'Oct', income: 8400, expenses: 6200 },
    { month: 'Nov', income: 9100, expenses: 5800 },
    { month: 'Dec', income: 8800, expenses: 6500 },
    { month: 'Jan', income: 10200, expenses: 7100 },
  ];

  const categoryData = [
    { name: 'Consulting', value: 6200 },
    { name: 'Retainer', value: 2200 },
    { name: 'Projects', value: 3800 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  const handleExportReport = () => {
    const companyName = user?.businessName || "Kusler Consulting";
    const today = new Date().toISOString().split('T')[0];
    
    const csvContent = [
      [`${companyName} - Financial Report`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Monthly Cash Flow'],
      ['Month', 'Income', 'Expenses', 'Net Profit'],
      ...monthlyData.map(row => [row.month, row.income, row.expenses, row.income - row.expenses]),
      [],
      ['Income by Category'],
      ['Category', 'Amount'],
      ...categoryData.map(row => [row.name, row.value]),
      [],
      ['Summary Metrics'],
      ['Metric', 'Value'],
      ['Revenue Growth', '+21%'],
      ['Avg. Payment Time', '12 days'],
      ['Profit Margin', '26%'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${companyName.replace(/\s+/g, '_')}_Report_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-chart-1/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName={user?.businessName || "Kusler Consulting"} />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Reports
            </h1>
            <Button 
              variant="outline" 
              className="gap-2 backdrop-blur-xl bg-card/60 border-border/50"
              onClick={handleExportReport}
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-chart-2" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Revenue Growth</span>
              </div>
              <p className="text-3xl font-bold font-mono text-chart-2">+21%</p>
              <p className="text-xs text-muted-foreground/70 mt-1">vs. last quarter</p>
            </Card>

            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg. Payment Time</span>
              </div>
              <p className="text-3xl font-bold font-mono">12 days</p>
              <p className="text-xs text-muted-foreground/70 mt-1">improved by 3 days</p>
            </Card>

            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Profit Margin</span>
              </div>
              <p className="text-3xl font-bold font-mono text-chart-1">26%</p>
              <p className="text-xs text-muted-foreground/70 mt-1">target: 30%</p>
            </Card>
          </div>

          <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
            <h3 className="font-semibold mb-4">Monthly Cash Flow</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
              <h3 className="font-semibold mb-4">Income by Category</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
              <h3 className="font-semibold mb-4">Revenue Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
        <DebugPanel />
      </div>
    </div>
  );
}
