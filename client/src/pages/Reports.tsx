import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { useAuth } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import DebugPanel from "@/components/DebugPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { FinancialReport } from "@shared/schema";
import { Download, FileText, TrendingUp, DollarSign, PieChart as PieChartIcon, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

interface ProfitLossData {
  revenue: number;
  expenses: number;
  netIncome: number;
  profitMargin: number;
  expensesByCategory: Record<string, number>;
}

interface BalanceSheetData {
  cash: number;
  accountsReceivable: number;
  totalAssets: number;
  liabilities: number;
  equity: number;
}

interface CashFlowData {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export default function Reports() {
  const [activePage, setActivePage] = useState("reports");
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const { data: reports = [], isLoading } = useQuery<FinancialReport[]>({
    queryKey: ['/api/financial-reports'],
  });

  const availablePeriods = Array.from(new Set(reports.map(r => r.period))).sort().reverse();
  
  const currentPeriod = selectedPeriod || availablePeriods[0] || format(new Date(), 'yyyy-MM');
  
  const plReport = reports.find(r => r.reportType === 'profit_loss' && r.period === currentPeriod);
  const bsReport = reports.find(r => r.reportType === 'balance_sheet' && r.period === currentPeriod);
  const cfReport = reports.find(r => r.reportType === 'cash_flow' && r.period === currentPeriod);

  const plData = plReport?.data as ProfitLossData | undefined;
  const bsData = bsReport?.data as BalanceSheetData | undefined;
  const cfData = cfReport?.data as CashFlowData | undefined;

  const handleExportReport = (reportType: 'all' | 'profit_loss' | 'balance_sheet' | 'cash_flow') => {
    const companyName = user?.businessName || "Kusler Consulting";
    const period = currentPeriod;
    
    const csvRows: string[][] = [
      [`${companyName} - Financial Reports`],
      [`Period: ${period}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
    ];

    if ((reportType === 'all' || reportType === 'profit_loss') && plData) {
      csvRows.push(
        ['PROFIT & LOSS STATEMENT'],
        ['Revenue', `$${(plData.revenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Expenses', `($${(plData.expenses / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })})`],
        ['Net Income', `$${(plData.netIncome / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Profit Margin', `${(Number(plData.profitMargin) || 0).toFixed(1)}%`],
        [],
        ['Expenses by Category'],
        ...Object.entries(plData.expensesByCategory || {}).map(([cat, amt]) => 
          [cat, `$${(amt / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
        ),
        []
      );
    }

    if ((reportType === 'all' || reportType === 'balance_sheet') && bsData) {
      csvRows.push(
        ['BALANCE SHEET'],
        ['ASSETS'],
        ['Cash', `$${(bsData.cash / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Accounts Receivable', `$${(bsData.accountsReceivable / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Total Assets', `$${(bsData.totalAssets / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        [],
        ['LIABILITIES & EQUITY'],
        ['Liabilities', `$${(bsData.liabilities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Equity', `$${(bsData.equity / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        []
      );
    }

    if ((reportType === 'all' || reportType === 'cash_flow') && cfData) {
      csvRows.push(
        ['CASH FLOW STATEMENT'],
        ['Operating Activities', `$${(cfData.operatingActivities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Investing Activities', `$${(cfData.investingActivities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Financing Activities', `$${(cfData.financingActivities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Net Cash Flow', `$${(cfData.netCashFlow / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        [],
        ['Beginning Cash', `$${(cfData.beginningCash / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Ending Cash', `$${(cfData.endingCash / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      );
    }

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const filename = reportType === 'all' 
      ? `${companyName.replace(/\s+/g, '_')}_All_Reports_${period}.csv`
      : `${companyName.replace(/\s+/g, '_')}_${reportType}_${period}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <DashboardHeader companyName={user?.businessName || "Kusler Consulting"} />
        <main className="px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </main>
        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen pb-20 bg-background">
        <DashboardHeader companyName={user?.businessName || "Kusler Consulting"} />
        <main className="px-4 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90 mb-6">
            Financial Reports
          </h1>
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
            <p className="text-muted-foreground text-sm">
              Financial reports are automatically generated on the 1st of each month.
              Check back soon!
            </p>
          </Card>
        </main>
        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-1/3 w-64 sm:w-96 h-64 sm:h-96 bg-chart-1/10 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <DashboardHeader companyName={user?.businessName || "Kusler Consulting"} />
        
        <main className="px-4 space-y-5 pb-6 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Financial Reports
            </h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={currentPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-40 backdrop-blur-xl bg-card/60" data-testid="select-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.map(period => (
                    <SelectItem key={period} value={period}>
                      {format(new Date(period + '-01'), 'MMMM yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="gap-2 backdrop-blur-xl bg-card/60 border-border/50"
                onClick={() => handleExportReport('all')}
                data-testid="button-export-all"
              >
                <Download className="w-4 h-4" />
                Export All
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profit_loss" className="w-full">
            <TabsList className="grid w-full grid-cols-3 backdrop-blur-xl bg-card/60">
              <TabsTrigger value="profit_loss" data-testid="tab-pl">
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">P&L</span>
              </TabsTrigger>
              <TabsTrigger value="balance_sheet" data-testid="tab-bs">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Balance Sheet</span>
              </TabsTrigger>
              <TabsTrigger value="cash_flow" data-testid="tab-cf">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Cash Flow</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profit_loss" className="space-y-4 mt-4">
              {plData ? (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Profit & Loss Statement</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExportReport('profit_loss')}
                      data-testid="button-export-pl"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                    <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-chart-2" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Revenue</span>
                      </div>
                      <p className="text-3xl font-bold font-mono text-chart-2" data-testid="text-revenue">
                        ${(plData.revenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </Card>

                    <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Expenses</span>
                      </div>
                      <p className="text-3xl font-bold font-mono text-destructive" data-testid="text-expenses">
                        ${(plData.expenses / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </Card>

                    <Card className="p-4 sm:p-5 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl hover-elevate transition-all duration-300">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-chart-1" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Net Income</span>
                      </div>
                      <p className={`text-3xl font-bold font-mono ${plData.netIncome >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-net-income">
                        ${(plData.netIncome / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </Card>
                  </div>

                  <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4" />
                      Expenses by Category
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(plData.expensesByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground capitalize">{category}</span>
                          <span className="font-mono font-semibold" data-testid={`text-expense-${category}`}>
                            ${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Profit Margin</span>
                        <span className={`font-mono font-bold text-lg ${(Number(plData.profitMargin) || 0) >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-profit-margin">
                          {(Number(plData.profitMargin) || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No P&L statement available for this period</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="balance_sheet" className="space-y-4 mt-4">
              {bsData ? (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Balance Sheet</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExportReport('balance_sheet')}
                      data-testid="button-export-bs"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
                      <h3 className="font-semibold mb-4 text-chart-2">Assets</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Cash</span>
                          <span className="font-mono font-semibold" data-testid="text-cash">
                            ${(bsData.cash / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Accounts Receivable</span>
                          <span className="font-mono font-semibold" data-testid="text-ar">
                            ${(bsData.accountsReceivable / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="pt-3 mt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Total Assets</span>
                            <span className="font-mono font-bold text-lg text-chart-2" data-testid="text-total-assets">
                              ${(bsData.totalAssets / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
                      <h3 className="font-semibold mb-4 text-chart-1">Liabilities & Equity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Liabilities</span>
                          <span className="font-mono font-semibold" data-testid="text-liabilities">
                            ${(bsData.liabilities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Equity</span>
                          <span className="font-mono font-semibold" data-testid="text-equity">
                            ${(bsData.equity / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="pt-3 mt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Total</span>
                            <span className="font-mono font-bold text-lg text-chart-1" data-testid="text-total-liabilities-equity">
                              ${((bsData.liabilities + bsData.equity) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Accounting Equation</h3>
                        <p className="text-xs text-muted-foreground mt-1">Assets = Liabilities + Equity</p>
                      </div>
                      <div className={`text-sm font-semibold ${
                        Math.abs(bsData.totalAssets - (bsData.liabilities + bsData.equity)) < 100 
                          ? 'text-chart-2' 
                          : 'text-destructive'
                      }`}>
                        {Math.abs(bsData.totalAssets - (bsData.liabilities + bsData.equity)) < 100 
                          ? '✓ Balanced' 
                          : '⚠ Imbalanced'}
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No balance sheet available for this period</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cash_flow" className="space-y-4 mt-4">
              {cfData ? (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Cash Flow Statement</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExportReport('cash_flow')}
                      data-testid="button-export-cf"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
                    <h3 className="font-semibold mb-4">Cash Flow Activities</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Operating Activities</span>
                        <span className={`font-mono font-semibold ${cfData.operatingActivities >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-operating">
                          ${(cfData.operatingActivities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Investing Activities</span>
                        <span className={`font-mono font-semibold ${cfData.investingActivities >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-investing">
                          ${(cfData.investingActivities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Financing Activities</span>
                        <span className={`font-mono font-semibold ${cfData.financingActivities >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-financing">
                          ${(cfData.financingActivities / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Net Cash Flow</span>
                          <span className={`font-mono font-bold text-lg ${cfData.netCashFlow >= 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-net-cash-flow">
                            ${(cfData.netCashFlow / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-card-border/50 shadow-xl">
                    <h3 className="font-semibold mb-4">Cash Reconciliation</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Beginning Cash</span>
                        <span className="font-mono font-semibold" data-testid="text-beginning-cash">
                          ${(cfData.beginningCash / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Net Cash Flow</span>
                        <span className={`font-mono font-semibold ${cfData.netCashFlow >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                          {cfData.netCashFlow >= 0 ? '+' : ''}${(cfData.netCashFlow / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Ending Cash</span>
                          <span className="font-mono font-bold text-lg text-chart-1" data-testid="text-ending-cash">
                            ${(cfData.endingCash / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No cash flow statement available for this period</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <BottomNav active={activePage} onNavigate={setActivePage} />
        <DebugPanel />
      </div>
    </div>
  );
}
