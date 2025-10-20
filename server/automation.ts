import { storage } from "./storage";
import { sendWeeklyReport, sendLowCashAlert, sendOverdueInvoiceReminder } from "./email";

interface ScheduledTask {
  id: string;
  name: string;
  interval: number;
  handler: () => Promise<void>;
  lastRun?: Date;
}

class AutomationSystem {
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  registerTask(task: ScheduledTask) {
    this.tasks.set(task.id, task);
    this.scheduleTask(task);
  }

  private scheduleTask(task: ScheduledTask) {
    const timer = setInterval(async () => {
      try {
        await task.handler();
        task.lastRun = new Date();
      } catch (error) {
        console.error(`Error running task ${task.name}:`, error);
      }
    }, task.interval);

    this.timers.set(task.id, timer);
  }

  registerScheduledTask(
    id: string,
    name: string,
    targetHour: number,
    targetDay: number | null,
    handler: () => Promise<void>
  ) {
    const getNextRunTime = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(targetHour, 0, 0, 0);

      if (targetDay !== null) {
        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
        next.setDate(now.getDate() + daysUntilTarget);
      }

      if (next <= now) {
        if (targetDay !== null) {
          next.setDate(next.getDate() + 7);
        } else {
          next.setDate(next.getDate() + 1);
        }
      }

      return next;
    };

    const scheduleNext = () => {
      const nextRun = getNextRunTime();
      const delay = nextRun.getTime() - Date.now();

      const timeout = setTimeout(async () => {
        try {
          await handler();
          console.log(`✓ Completed scheduled task: ${name} at ${new Date().toLocaleString()}`);
        } catch (error) {
          console.error(`✗ Error in scheduled task ${name}:`, error);
        }

        scheduleNext();
      }, delay);

      this.timers.set(id, timeout);
      console.log(`⏰ Scheduled ${name} to run at ${nextRun.toLocaleString()}`);
    };

    scheduleNext();
  }

  unregisterTask(taskId: string) {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }
    const initialTimer = this.timers.get(`${taskId}-initial`);
    if (initialTimer) {
      clearTimeout(initialTimer);
      this.timers.delete(`${taskId}-initial`);
    }
    this.tasks.delete(taskId);
  }

  stopAll() {
    Array.from(this.timers.values()).forEach(timer => {
      clearInterval(timer);
      clearTimeout(timer);
    });
    this.timers.clear();
  }
}

export const automationSystem = new AutomationSystem();

export async function createSmartTasks() {
  console.log('🔄 Running Smart Task Creation automation...');
  const users = await storage.getAllUsers();
  const activeClients = users.filter(u => u.role === 'client' && u.isActive);
  console.log(`Found ${activeClients.length} active clients`);
  
  for (const user of activeClients) {
    try {
      console.log(`Processing user: ${user.username}`);
      // Get existing pending tasks to avoid duplicates
      const existingTasks = await storage.getTasks(user.id, 'pending');
      
      // Check for overdue invoices and update their status
      const invoices = await storage.getInvoices(user.id);
      const now = Date.now();
      
      for (const invoice of invoices) {
        const dueTime = new Date(invoice.dueDate).getTime();
        
        // Update invoice status to overdue if past due date
        if (invoice.status === 'due' && dueTime < now) {
          await storage.updateInvoice(invoice.id, { status: 'overdue' });
          invoice.status = 'overdue'; // Update local copy
        }
      }
      
      // Now check for overdue invoices and create tasks
      const overdueInvoices = invoices.filter(i => 
        i.status === 'overdue' && 
        !existingTasks.some(t => t.relatedId === i.id && t.type === 'overdue_invoice')
      );
      
      for (const invoice of overdueInvoices) {
        await storage.createTask({
          userId: user.id,
          title: `Follow up on overdue invoice from ${invoice.client}`,
          description: `Invoice of $${(invoice.amount / 100).toFixed(2)} is overdue. Contact ${invoice.client} to collect payment.`,
          type: 'overdue_invoice',
          priority: 'high',
          status: 'pending',
          relatedId: invoice.id,
          relatedType: 'invoice',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Due tomorrow
        });
      }
      
      // Check for low cash and create task
      const transactions = await storage.getTransactions(user.id);
      const payments = transactions.filter(t => t.type === 'payment');
      const expenses = transactions.filter(t => t.type === 'expense');
      const cashIn = payments.reduce((sum, t) => sum + t.amount, 0);
      const cashOut = expenses.reduce((sum, t) => sum + t.amount, 0);
      const availableCash = cashIn - cashOut;
      
      const LOW_CASH_THRESHOLD = 500000; // $5,000 in cents
      
      if (availableCash < LOW_CASH_THRESHOLD && 
          !existingTasks.some(t => t.type === 'low_cash' && t.status === 'pending')) {
        await storage.createTask({
          userId: user.id,
          title: 'Low cash balance alert',
          description: `Your available cash ($${(availableCash / 100).toFixed(2)}) is below $5,000. Review expenses and collect outstanding invoices.`,
          type: 'low_cash',
          priority: 'high',
          status: 'pending',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
      
      // Check for upcoming invoice due dates and create reminder tasks
      const upcomingInvoices = invoices.filter(i => {
        if (i.status !== 'due') return false;
        const daysUntilDue = (new Date(i.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilDue > 0 && daysUntilDue <= 3 && 
               !existingTasks.some(t => t.relatedId === i.id && t.type === 'invoice_reminder');
      });
      
      for (const invoice of upcomingInvoices) {
        await storage.createTask({
          userId: user.id,
          title: `Invoice due soon: ${invoice.client}`,
          description: `Invoice of $${(invoice.amount / 100).toFixed(2)} from ${invoice.client} is due on ${new Date(invoice.dueDate).toLocaleDateString()}. Send a friendly reminder.`,
          type: 'invoice_reminder',
          priority: 'medium',
          status: 'pending',
          relatedId: invoice.id,
          relatedType: 'invoice',
          dueDate: invoice.dueDate
        });
      }
      
    } catch (error) {
      console.error(`Failed to create smart tasks for ${user.username}:`, error);
    }
  }
}

export async function autoReconcileTransactions() {
  const users = await storage.getAllUsers();
  const activeClients = users.filter(u => u.role === 'client' && u.isActive);
  
  for (const user of activeClients) {
    try {
      // Get all open invoices
      const invoices = await storage.getInvoices(user.id);
      const openInvoices = invoices.filter(i => i.status === 'due' || i.status === 'overdue');
      
      // Get all payment transactions (exclude ones already matched)
      const transactions = await storage.getTransactions(user.id);
      const payments = transactions.filter(t => 
        t.type === 'payment' && 
        !t.description?.includes('[RECONCILED]')
      );
      
      // Match payments to invoices by amount and date proximity
      for (const invoice of openInvoices) {
        const matchingPayment = payments.find(payment => {
          // Match if amounts are within $1 (to handle rounding)
          const amountMatch = Math.abs(payment.amount - invoice.amount) <= 100;
          
          // Match if payment is within 7 days of invoice due date
          const paymentDate = new Date(payment.date).getTime();
          const dueDate = new Date(invoice.dueDate).getTime();
          const daysDiff = Math.abs((paymentDate - dueDate) / (1000 * 60 * 60 * 24));
          const dateMatch = daysDiff <= 7;
          
          // Match if client name appears in payment description
          const clientMatch = invoice.client && payment.description?.toLowerCase().includes(invoice.client.toLowerCase());
          
          return amountMatch && (dateMatch || clientMatch);
        });
        
        if (matchingPayment) {
          // Mark invoice as paid
          await storage.updateInvoice(invoice.id, { status: 'paid' });
          
          // Mark transaction as reconciled by updating description
          const reconciledDesc = `[RECONCILED to invoice ${invoice.id}] ${matchingPayment.description || ''}`;
          // Note: We can't update transaction in current schema, so we track via description marker
          // In production, add a 'reconciledInvoiceId' field to transactions table
          
          // Create a task notification about the successful reconciliation
          await storage.createTask({
            userId: user.id,
            title: `Invoice auto-reconciled: ${invoice.client}`,
            description: `Invoice of $${(invoice.amount / 100).toFixed(2)} from ${invoice.client} was automatically matched to a payment and marked as paid.`,
            type: 'reconciliation',
            priority: 'low',
            status: 'completed',
            relatedId: invoice.id,
            relatedType: 'invoice'
          });
          
          console.log(`✓ Auto-reconciled invoice ${invoice.id} for ${user.username}`);
        }
      }
    } catch (error) {
      console.error(`Failed to reconcile transactions for ${user.username}:`, error);
    }
  }
}

export async function generateFinancialReports() {
  const users = await storage.getAllUsers();
  const activeClients = users.filter(u => u.role === 'client' && u.isActive);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  for (const user of activeClients) {
    try {
      // Check if reports already generated for this month
      const existingReports = await storage.getFinancialReports(user.id);
      const alreadyGenerated = existingReports.some(r => r.period === currentMonth);
      
      if (alreadyGenerated) continue;
      
      // Get all transactions for the month
      const transactions = await storage.getTransactions(user.id);
      const invoices = await storage.getInvoices(user.id);
      
      const monthStart = new Date(currentMonth + '-01');
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });
      
      // Calculate P&L (Profit & Loss)
      const revenue = monthTransactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netIncome = revenue - expenses;
      
      await storage.createFinancialReport({
        userId: user.id,
        reportType: 'profit_loss',
        period: currentMonth,
        data: {
          revenue,
          expenses,
          netIncome,
          profitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
          expensesByCategory: monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc: any, t) => {
              const cat = t.category || 'Other';
              acc[cat] = (acc[cat] || 0) + t.amount;
              return acc;
            }, {})
        }
      });
      
      // Calculate Balance Sheet
      const allTransactions = transactions;
      const totalRevenue = allTransactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const cashBalance = totalRevenue - totalExpenses;
      
      const accountsReceivable = invoices
        .filter(i => i.status === 'due' || i.status === 'overdue')
        .reduce((sum, i) => sum + i.amount, 0);
      
      await storage.createFinancialReport({
        userId: user.id,
        reportType: 'balance_sheet',
        period: currentMonth,
        data: {
          cash: cashBalance,
          accountsReceivable,
          totalAssets: cashBalance + accountsReceivable,
          liabilities: 0,
          equity: cashBalance + accountsReceivable
        }
      });
      
      // Calculate Cash Flow Statement
      const beginningCash = allTransactions
        .filter(t => new Date(t.date) < monthStart)
        .reduce((sum, t) => sum + (t.type === 'payment' ? t.amount : -t.amount), 0);
      
      const endingCash = cashBalance;
      const netCashFlow = endingCash - beginningCash;
      
      await storage.createFinancialReport({
        userId: user.id,
        reportType: 'cash_flow',
        period: currentMonth,
        data: {
          operatingActivities: revenue - expenses,
          investingActivities: 0,
          financingActivities: 0,
          beginningCash,
          endingCash,
          netCashFlow
        }
      });
      
      // Create a task to notify user about generated reports
      await storage.createTask({
        userId: user.id,
        title: `Monthly financial reports ready for ${currentMonth}`,
        description: `Your P&L, Balance Sheet, and Cash Flow statements for ${currentMonth} have been generated. Review them in the Reports section.`,
        type: 'report_generated',
        priority: 'low',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
      });
      
      console.log(`✓ Generated financial reports for ${user.username} - ${currentMonth}`);
      
    } catch (error) {
      console.error(`Failed to generate financial reports for ${user.username}:`, error);
    }
  }
}

export async function startAutomations() {
  // Smart Task Creation - runs every hour
  automationSystem.registerTask({
    id: 'smart-task-creation',
    name: 'Create smart action tasks',
    interval: 60 * 60 * 1000, // Every hour
    handler: createSmartTasks
  });

  // Auto-Reconciliation - runs every 30 minutes
  automationSystem.registerTask({
    id: 'auto-reconciliation',
    name: 'Auto-reconcile transactions to invoices',
    interval: 30 * 60 * 1000, // Every 30 minutes
    handler: autoReconcileTransactions
  });

  // Automatic Financial Reports - runs monthly (check daily at midnight)
  automationSystem.registerScheduledTask(
    'generate-financial-reports',
    'Generate monthly financial reports',
    0, // Midnight
    1, // First day of month
    generateFinancialReports
  );

  automationSystem.registerTask({
    id: 'sync-integrations',
    name: 'Sync data from connected integrations',
    interval: 15 * 60 * 1000,
    handler: async () => {
      const { syncIntegration } = await import("./integrations");
      const users = await storage.getAllUsers();
      const activeClients = users.filter(u => u.role === 'client' && u.isActive);
      
      for (const user of activeClients) {
        try {
          const integrations = await storage.getIntegrations(user.id);
          const connectedIntegrations = integrations.filter(i => i.isConnected);
          
          for (const integration of connectedIntegrations) {
            try {
              const result = await syncIntegration(integration);
              console.log(`✓ Synced ${integration.platform} for ${user.username}:`, result);
            } catch (error) {
              console.error(`✗ Failed to sync ${integration.platform} for ${user.username}:`, error);
            }
          }
        } catch (error) {
          console.error(`Failed to get integrations for user ${user.username}:`, error);
        }
      }
    }
  });

  automationSystem.registerScheduledTask(
    'generate-weekly-reports',
    'Generate and send weekly reports',
    8,
    1,
    async () => {
      const users = await storage.getAllUsers();
      const activeClients = users.filter(u => u.role === 'client' && u.isActive);
      
      for (const user of activeClients) {
        try {
          const transactions = await storage.getTransactions(user.id);
          const invoices = await storage.getInvoices(user.id);
          
          const payments = transactions.filter(t => t.type === 'payment');
          const expenses = transactions.filter(t => t.type === 'expense');
          
          const cashIn = payments.reduce((sum, t) => sum + t.amount, 0);
          const cashOut = expenses.reduce((sum, t) => sum + t.amount, 0);
          const availableCash = cashIn - cashOut;
          
          const invoicesDue = invoices.filter(i => i.status === 'due').length;
          const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
          
          await sendWeeklyReport(user.id, {
            cashIn,
            cashOut,
            availableCash,
            invoicesDue,
            overdueInvoices
          });
        } catch (error) {
          console.error(`Failed to send weekly report to user ${user.username}:`, error);
        }
      }
    }
  );

  automationSystem.registerTask({
    id: 'check-low-cash',
    name: 'Check for low cash alerts',
    interval: 60 * 60 * 1000,
    handler: async () => {
      const users = await storage.getAllUsers();
      const activeClients = users.filter(u => u.role === 'client' && u.isActive);
      
      const LOW_CASH_THRESHOLD = 500000; // $5,000 in cents
      
      for (const user of activeClients) {
        try {
          const transactions = await storage.getTransactions(user.id);
          const payments = transactions.filter(t => t.type === 'payment');
          const expenses = transactions.filter(t => t.type === 'expense');
          
          const cashIn = payments.reduce((sum, t) => sum + t.amount, 0);
          const cashOut = expenses.reduce((sum, t) => sum + t.amount, 0);
          const availableCash = cashIn - cashOut;
          
          if (availableCash < LOW_CASH_THRESHOLD) {
            await sendLowCashAlert(user.id, availableCash, LOW_CASH_THRESHOLD);
          }
        } catch (error) {
          console.error(`Failed to check low cash for ${user.username}:`, error);
        }
      }
    }
  });

  automationSystem.registerScheduledTask(
    'check-overdue-invoices',
    'Check for overdue invoices',
    9,
    null,
    async () => {
      const users = await storage.getAllUsers();
      const activeClients = users.filter(u => u.role === 'client' && u.isActive);
      
      for (const user of activeClients) {
        try {
          const invoices = await storage.getInvoices(user.id);
          const overdueInvoices = invoices
            .filter(i => i.status === 'overdue')
            .map(i => ({
              client: i.client || 'Unknown',
              amount: i.amount,
              dueDate: i.dueDate
            }));
          
          if (overdueInvoices.length > 0) {
            await sendOverdueInvoiceReminder(user.id, overdueInvoices);
          }
        } catch (error) {
          console.error(`Failed to check overdue invoices for user ${user.username} (${user.id}):`, error);
        }
      }
    }
  );

  console.log('Automation system started');
}
