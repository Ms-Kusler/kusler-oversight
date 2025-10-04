import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, DollarSign, Calendar } from "lucide-react";

export default function Finances() {
  const [activePage, setActivePage] = useState("finances");

  //todo: remove mock functionality
  const transactions = [
    { id: 1, type: 'payment', description: 'Client Payment - Acme Corp', amount: 5000, date: '2025-01-03' },
    { id: 2, type: 'expense', description: 'Office Supplies', amount: -450, date: '2025-01-02' },
    { id: 3, type: 'payment', description: 'Consulting Fee - Tech Co', amount: 3400, date: '2025-01-01' },
    { id: 4, type: 'expense', description: 'Software Subscription', amount: -99, date: '2024-12-30' },
  ];

  const invoices = [
    { id: 1, client: 'Acme Corp', amount: 5000, due: '2025-01-15', status: 'paid' },
    { id: 2, client: 'Tech Startup', amount: 3200, due: '2025-01-10', status: 'overdue' },
    { id: 3, client: 'Local Business', amount: 1800, due: '2025-01-20', status: 'due' },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName="Kusler Consulting" />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Finances
            </h1>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <ArrowUpRight className="w-5 h-5 text-chart-2" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</span>
              </div>
              <p className="text-3xl font-bold font-mono text-chart-2">$8,400</p>
              <p className="text-xs text-muted-foreground/70 mt-1">This month</p>
            </Card>

            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</span>
              </div>
              <p className="text-3xl font-bold font-mono text-destructive">$6,200</p>
              <p className="text-xs text-muted-foreground/70 mt-1">This month</p>
            </Card>

            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Net Profit</span>
              </div>
              <p className="text-3xl font-bold font-mono text-primary">$2,200</p>
              <p className="text-xs text-muted-foreground/70 mt-1">This month</p>
            </Card>
          </div>

          <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h2 className="font-semibold text-lg">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-border/30">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover-elevate transition-all duration-200 flex items-center justify-between" data-testid={`transaction-${transaction.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${transaction.type === 'payment' ? 'bg-chart-2/10' : 'bg-destructive/10'}`}>
                      {transaction.type === 'payment' ? (
                        <ArrowUpRight className="w-4 h-4 text-chart-2" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-semibold ${transaction.amount > 0 ? 'text-chart-2' : 'text-destructive'}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-border/50">
              <h2 className="font-semibold text-lg">Invoices</h2>
            </div>
            <div className="divide-y divide-border/30">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover-elevate transition-all duration-200" data-testid={`invoice-${invoice.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{invoice.client}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Due {invoice.due}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-lg">${invoice.amount.toLocaleString()}</p>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    </div>
  );
}
