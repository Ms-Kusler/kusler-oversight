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

export async function startAutomations() {
  automationSystem.registerTask({
    id: 'sync-integrations',
    name: 'Sync data from connected integrations',
    interval: 15 * 60 * 1000,
    handler: async () => {
      console.log('Running integration sync...');
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
      
      const LOW_CASH_THRESHOLD = 5000;
      
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
