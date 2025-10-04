import { storage } from "./storage";

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

  unregisterTask(taskId: string) {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }
    this.tasks.delete(taskId);
  }

  stopAll() {
    Array.from(this.timers.values()).forEach(timer => {
      clearInterval(timer);
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

  automationSystem.registerTask({
    id: 'generate-weekly-reports',
    name: 'Generate and send weekly reports',
    interval: 24 * 60 * 60 * 1000,
    handler: async () => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 9) {
        console.log('Generating weekly reports...');
      }
    }
  });

  automationSystem.registerTask({
    id: 'check-low-cash',
    name: 'Check for low cash alerts',
    interval: 60 * 60 * 1000,
    handler: async () => {
      console.log('Checking cash balances...');
    }
  });

  console.log('Automation system started');
}
