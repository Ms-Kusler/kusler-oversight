import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import DebugPanel from "@/components/DebugPanel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, DollarSign, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { Transaction, Invoice } from "@shared/schema";
import { format } from "date-fns";

export default function Finances() {
  const [activePage, setActivePage] = useState("finances");
  const { user } = useAuth();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  // Calculate totals from transactions
  const totalIncome = transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = Math.abs(transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0));
  
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName={user?.businessName || "Kusler Consulting"} />
        
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
              <p className="text-3xl font-bold font-mono text-chart-2">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">All time</p>
            </Card>

            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</span>
              </div>
              <p className="text-3xl font-bold font-mono text-destructive">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">All time</p>
            </Card>

            <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Net Profit</span>
              </div>
              <p className="text-3xl font-bold font-mono text-primary">{formatCurrency(netProfit)}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">All time</p>
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
                      <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <span className={`font-mono font-semibold ${transaction.type === 'payment' ? 'text-chart-2' : 'text-destructive'}`}>
                    {transaction.type === 'payment' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
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
                        <span className="text-xs text-muted-foreground">Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-lg">{formatCurrency(invoice.amount)}</p>
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
        <DebugPanel />
      </div>
    </div>
  );
}
