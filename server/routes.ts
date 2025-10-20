import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertIntegrationSchema, insertAutomationSchema, insertTaskSchema, insertFinancialReportSchema } from "@shared/schema";
import { requireAuth, requireAdmin, logAdminAction, type AuthRequest } from "./middleware/auth";
import { authenticateUser, hashPassword, verifyPassword } from "./auth";
import { createSmartTasks, autoReconcileTransactions, generateFinancialReports } from "./automation";
import { encryptCredentials, decryptCredentials } from "./encryption";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Rate limiter specifically for /api/admin/reset-demo (5 requests per hour per IP)
  const resetDemoRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 reset demo requests per hour
    message: { error: "Too many demo resets from this IP, please try again later." }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Regenerate session ID for security and to ensure fresh session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        
        req.session.userId = user.id;
        req.session.userRole = user.role;
        
        // Explicitly save the session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }
          
          res.json({
            id: user.id,
            username: user.username,
            businessName: user.businessName,
            email: user.email,
            role: user.role,
            emailPreferences: user.emailPreferences
          });
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        // Still clear the session on the client side even if destroy fails
        res.clearCookie('sessionId');
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('sessionId');
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        businessName: user.businessName,
        email: user.email,
        role: user.role,
        emailPreferences: user.emailPreferences
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password required" });
      }
      
      // Enhanced password validation
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
      }
      
      // Check password complexity
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      if (!(hasUpperCase && hasLowerCase && (hasNumber || hasSpecialChar))) {
        return res.status(400).json({ 
          error: "Password must contain uppercase, lowercase, and either a number or special character" 
        });
      }
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const isValidPassword = await verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(req.userId!, { password: hashedNewPassword });
      
      // Regenerate session for security
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
        }
        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
          }
          res.json({ success: true, message: "Password changed successfully" });
        });
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.patch("/api/auth/email-preferences", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { weeklyReports, lowCashAlerts, overdueInvoices, integrationFailures } = req.body;
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const currentPrefs = (user.emailPreferences as any) || {
        weeklyReports: true,
        lowCashAlerts: true,
        overdueInvoices: true,
        integrationFailures: true,
      };
      
      const emailPreferences = {
        weeklyReports: weeklyReports !== undefined ? weeklyReports : currentPrefs.weeklyReports,
        lowCashAlerts: lowCashAlerts !== undefined ? lowCashAlerts : currentPrefs.lowCashAlerts,
        overdueInvoices: overdueInvoices !== undefined ? overdueInvoices : currentPrefs.overdueInvoices,
        integrationFailures: integrationFailures !== undefined ? integrationFailures : currentPrefs.integrationFailures,
      };
      
      await storage.updateUser(req.userId!, { emailPreferences });
      
      res.json({ success: true, emailPreferences });
    } catch (error) {
      res.status(500).json({ error: "Failed to update email preferences" });
    }
  });

  // Admin impersonation - view client dashboard as admin
  app.post("/api/admin/impersonate/:clientId", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getUser(clientId);

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      if (client.role !== 'client') {
        return res.status(400).json({ error: "Can only impersonate client accounts" });
      }

      // Store original admin ID in session before impersonating
      req.session.originalAdminId = req.userId;
      req.session.userId = clientId;
      req.session.userRole = 'client';

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, client: { id: client.id, username: client.username, businessName: client.businessName } });
    } catch (error) {
      res.status(500).json({ error: "Failed to impersonate client" });
    }
  });

  // Exit impersonation mode
  app.post("/api/admin/exit-impersonation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const originalAdminId = req.session.originalAdminId;
      
      if (!originalAdminId) {
        return res.status(400).json({ error: "Not in impersonation mode" });
      }

      const admin = await storage.getUser(originalAdminId);
      if (!admin) {
        return res.status(404).json({ error: "Original admin account not found" });
      }

      req.session.userId = originalAdminId;
      req.session.userRole = 'admin';
      delete req.session.originalAdminId;

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to exit impersonation" });
    }
  });

  // Get audit logs (admin only)
  app.get("/api/admin/audit-logs", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { db } = await import("./db");
      const { auditLogs } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");

      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

      res.json(logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Get all support requests (admin only)
  app.get("/api/admin/support-requests", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { status } = req.query;
      const requests = await storage.getSupportRequests(status as string | undefined);
      
      // Enrich with user information
      const enriched = await Promise.all(requests.map(async (request) => {
        const user = await storage.getUser(request.userId);
        return {
          ...request,
          user: user ? {
            username: user.username,
            email: user.email,
            businessName: user.businessName
          } : null
        };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error('Get support requests error:', error);
      res.status(500).json({ error: "Failed to fetch support requests" });
    }
  });

  // Resolve support request (admin only)
  app.patch("/api/admin/support-requests/:id/resolve", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const updated = await storage.updateSupportRequest(id, {
        status: 'resolved',
        resolvedAt: new Date()
      });

      if (!updated) {
        return res.status(404).json({ error: "Support request not found" });
      }

      res.json({ success: true, request: updated });
    } catch (error) {
      console.error('Resolve support request error:', error);
      res.status(500).json({ error: "Failed to resolve support request" });
    }
  });

  // Developer assistance request
  app.post("/api/support/request-assistance", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { message, category } = req.body;
      const user = await storage.getUser(req.userId!);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Save to database
      const supportRequest = await storage.createSupportRequest({
        userId: req.userId!,
        category,
        description: message,
        ticketId,
        status: 'pending'
      });

      // Log for monitoring
      console.log('📞 Developer Assistance Request:');
      console.log(`  Ticket ID: ${ticketId}`);
      console.log(`  User: ${user.username} (${user.email})`);
      console.log(`  Business: ${user.businessName}`);
      console.log(`  Category: ${category}`);
      console.log(`  Message: ${message}`);

      // Could integrate with email or ticketing system here
      res.json({ 
        success: true, 
        ticketId,
        message: "Your request has been received. Our team will contact you within 24 hours."
      });
    } catch (error) {
      console.error('Request assistance error:', error);
      res.status(500).json({ error: "Failed to submit assistance request" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const clientUsers = users.filter(u => u.role === 'client');
      
      await logAdminAction(
        req.userId!,
        'view_all_users',
        undefined,
        { count: clientUsers.length },
        req.ip
      );
      
      const usersWithHealth = await Promise.all(clientUsers.map(async (user) => {
        const integrations = await storage.getIntegrations(user.id);
        const connectedCount = integrations.filter(i => i.isConnected).length;
        
        return {
          id: user.id,
          businessName: user.businessName,
          email: user.email,
          username: user.username,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          integrationsCount: connectedCount,
          health: connectedCount > 0 ? 'healthy' : 'needs_setup'
        };
      }));
      
      res.json(usersWithHealth);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await logAdminAction(
        req.userId!,
        'view_user',
        id,
        { username: user.username },
        req.ip
      );
      
      const [integrations, transactions, invoices] = await Promise.all([
        storage.getIntegrations(id),
        storage.getTransactions(id),
        storage.getInvoices(id)
      ]);
      
      res.json({
        user: {
          id: user.id,
          businessName: user.businessName,
          email: user.email,
          username: user.username,
          lastLogin: user.lastLogin,
          isActive: user.isActive
        },
        integrations,
        stats: {
          transactionsCount: transactions.length,
          invoicesCount: invoices.length,
          integrationsCount: integrations.filter(i => i.isConnected).length
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  });

  app.get("/api/admin/audit-logs", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs.slice(0, 100));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/admin/users/:id/toggle-active", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updated = await storage.updateUser(id, { isActive: !user.isActive });
      
      await logAdminAction(
        req.userId!,
        user.isActive ? 'deactivate_user' : 'activate_user',
        id,
        { username: user.username },
        req.ip
      );
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { businessName, email, username, password } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        businessName,
        email,
        username,
        password: hashedPassword,
        role: 'client'
      });
      
      await logAdminAction(
        req.userId!,
        'create_client',
        newUser.id,
        { username, businessName, email },
        req.ip
      );
      
      res.json({
        id: newUser.id,
        businessName: newUser.businessName,
        email: newUser.email,
        username: newUser.username
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create client account" });
    }
  });

  app.post("/api/admin/reset-demo", requireAdmin, resetDemoRateLimiter, async (req: AuthRequest, res) => {
    try {
      const demoUser = await storage.getUserByUsername('demo');
      
      if (!demoUser) {
        return res.status(404).json({ error: "Demo user not found" });
      }
      
      // Delete all demo user data using the available delete methods
      const tasks = await storage.getTasks(demoUser.id);
      for (const task of tasks) {
        await storage.deleteTask(task.id);
      }
      
      const integrations = await storage.getIntegrations(demoUser.id);
      for (const integration of integrations) {
        await storage.deleteIntegration(integration.id);
      }
      
      // Import database to manually delete remaining data
      const { db } = await import('./db');
      const { transactions, invoices, financialReports } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.delete(financialReports).where(eq(financialReports.userId, demoUser.id));
      await db.delete(invoices).where(eq(invoices.userId, demoUser.id));
      await db.delete(transactions).where(eq(transactions.userId, demoUser.id));
      
      // Reset demo user password
      const demoPassword = await hashPassword('demo123');
      await storage.updateUser(demoUser.id, { 
        password: demoPassword,
        emailPreferences: {
          weeklyReports: true,
          lowCashAlerts: true,
          overdueInvoices: true,
          integrationFailures: true,
        }
      });
      
      // Reseed demo data only (not the user)
      const { seedDemoData } = await import('./seed');
      await seedDemoData(demoUser.id);
      
      await logAdminAction(
        req.userId!,
        'reset_demo',
        demoUser.id,
        { username: 'demo' },
        req.ip
      );
      
      res.json({ success: true, message: "Demo data reset successfully" });
    } catch (error) {
      console.error('Reset demo error:', error);
      res.status(500).json({ error: "Failed to reset demo data" });
    }
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const transactions = await storage.getTransactions(userId);
      const invoices = await storage.getInvoices(userId);
      
      // Calculate metrics
      const payments = transactions.filter(t => t.type === 'payment');
      const expenses = transactions.filter(t => t.type === 'expense');
      
      const totalIn = payments.reduce((sum, t) => sum + t.amount, 0);
      const totalOut = expenses.reduce((sum, t) => sum + t.amount, 0);
      
      const overdueInvoices = invoices.filter(inv => 
        inv.status !== 'paid' && new Date(inv.dueDate) < new Date()
      );
      
      const dueSoonInvoices = invoices.filter(inv => 
        inv.status !== 'paid' && new Date(inv.dueDate) >= new Date()
      );

      // Calculate profit trend (last 7 days) - convert cents to dollars with precision
      const now = new Date();
      const profitTrend: Array<{ value: number }> = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayPayments = transactions.filter(t => 
          t.type === 'payment' && 
          new Date(t.date) >= date && 
          new Date(t.date) < nextDate
        ).reduce((sum, t) => sum + t.amount, 0);
        
        const dayExpenses = transactions.filter(t => 
          t.type === 'expense' && 
          new Date(t.date) >= date && 
          new Date(t.date) < nextDate
        ).reduce((sum, t) => sum + t.amount, 0);
        
        const profitInDollars = parseFloat(((dayPayments - dayExpenses) / 100).toFixed(2));
        profitTrend.push({ value: profitInDollars });
      }

      res.json({
        moneyIn: totalIn,
        moneyOut: totalOut,
        availableCash: totalIn - totalOut,
        invoicesDue: dueSoonInvoices.length,
        invoicesOverdue: overdueInvoices.length,
        profitTrend,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // AI Recommendations endpoint
  app.get("/api/ai-recommendations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [transactions, invoices, tasks, financialReports] = await Promise.all([
        storage.getTransactions(userId),
        storage.getInvoices(userId),
        storage.getTasks(userId),
        storage.getFinancialReports(userId, 'profit_loss')
      ]);

      const recommendations: Array<{
        icon: string;
        text: string;
        action: string;
        color: string;
      }> = [];

      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Analyze overdue invoices
      const overdueInvoices = invoices.filter(inv => 
        inv.status !== 'paid' && new Date(inv.dueDate) < now
      );
      
      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const oldestOverdue = overdueInvoices.reduce((oldest, inv) => 
          new Date(inv.dueDate) < new Date(oldest.dueDate) ? inv : oldest
        );
        const daysOverdue = Math.floor((now.getTime() - new Date(oldestOverdue.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        
        recommendations.push({
          icon: 'AlertTriangle',
          text: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue (${daysOverdue} days) - total $${(totalOverdue / 100).toFixed(0)}`,
          action: 'Send Reminders',
          color: 'text-chart-3'
        });
      }

      // Analyze pending invoices
      const pendingInvoices = invoices.filter(inv => 
        inv.status === 'due' && new Date(inv.dueDate) >= now && new Date(inv.dueDate) <= oneWeekFromNow
      );
      
      if (pendingInvoices.length > 0) {
        recommendations.push({
          icon: 'Calendar',
          text: `${pendingInvoices.length} invoice${pendingInvoices.length > 1 ? 's' : ''} due in next 7 days - follow up to ensure timely payment`,
          action: 'Review Invoices',
          color: 'text-chart-1'
        });
      }

      // Analyze revenue for tax planning
      const recentPayments = transactions.filter(t => 
        t.type === 'payment' && new Date(t.date) >= thirtyDaysAgo
      );
      const recentRevenue = recentPayments.reduce((sum, t) => sum + t.amount, 0);
      
      if (recentRevenue > 0) {
        const estimatedQuarterlyTax = Math.floor(recentRevenue * 3 * 0.25);
        
        recommendations.push({
          icon: 'DollarSign',
          text: `Based on current revenue, set aside ~$${(estimatedQuarterlyTax / 100).toFixed(0)} for quarterly taxes`,
          action: 'Create Task',
          color: 'text-primary'
        });
      }

      // Analyze upcoming tasks
      const upcomingTasks = tasks.filter(t => 
        t.status === 'pending' && t.dueDate && new Date(t.dueDate) <= oneWeekFromNow
      );
      
      if (upcomingTasks.length > 0) {
        const highPriorityTasks = upcomingTasks.filter(t => t.priority === 'high');
        if (highPriorityTasks.length > 0) {
          recommendations.push({
            icon: 'Target',
            text: `${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''} due this week - review and prioritize`,
            action: 'View Tasks',
            color: 'text-chart-2'
          });
        }
      }

      // If no recommendations, provide general guidance
      if (recommendations.length === 0) {
        recommendations.push({
          icon: 'TrendingUp',
          text: 'No urgent items - consider reviewing financial reports for insights',
          action: 'View Reports',
          color: 'text-chart-2'
        });
        
        recommendations.push({
          icon: 'Target',
          text: 'Set up automated invoice reminders to improve cash flow',
          action: 'Configure Automation',
          color: 'text-primary'
        });
      }

      res.json(recommendations.slice(0, 3));
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Recent Activity endpoint
  app.get("/api/recent-activity", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const [tasks, transactions, invoices, reports] = await Promise.all([
        storage.getTasks(userId),
        storage.getTransactions(userId),
        storage.getInvoices(userId),
        storage.getFinancialReports(userId)
      ]);

      const activities: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        timestamp: Date;
        icon: string;
        category: string;
      }> = [];

      // Add recent tasks (especially automation-created ones)
      const recentTasks = tasks
        .filter(task => task.createdAt) // Filter out tasks without createdAt
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 5);
      
      recentTasks.forEach(task => {
        let icon = 'CheckCircle';
        let category = 'task';
        if (task.type === 'overdue_invoice' || task.type === 'invoice_reminder') {
          icon = 'FileText';
          category = 'automation';
        } else if (task.type === 'low_cash') {
          icon = 'DollarSign';
          category = 'automation';
        }

        activities.push({
          id: task.id,
          type: task.type,
          title: task.title,
          description: task.description || '',
          timestamp: task.createdAt!,
          icon,
          category
        });
      });

      // Add recent transactions
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      
      recentTransactions.forEach(txn => {
        activities.push({
          id: txn.id,
          type: txn.type,
          title: txn.type === 'payment' ? 'Payment Received' : 'Expense Recorded',
          description: `${txn.category} - $${(txn.amount / 100).toFixed(2)}`,
          timestamp: txn.date,
          icon: txn.type === 'payment' ? 'TrendingUp' : 'TrendingDown',
          category: 'transaction'
        });
      });

      // Add recent invoices (sort by due date as proxy for creation)
      const recentInvoices = invoices
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
        .slice(0, 2);
      
      recentInvoices.forEach(inv => {
        activities.push({
          id: inv.id,
          type: 'invoice',
          title: `Invoice ${inv.status === 'paid' ? 'Paid' : 'Created'}`,
          description: `${inv.client || 'Client'} - $${(inv.amount / 100).toFixed(2)}`,
          timestamp: inv.dueDate,
          icon: 'FileText',
          category: 'invoice'
        });
      });

      // Add recent reports
      const recentReports = reports
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
        .slice(0, 2);
      
      recentReports.forEach(report => {
        activities.push({
          id: report.id,
          type: report.reportType,
          title: `${report.reportType === 'profit_loss' ? 'P&L' : report.reportType === 'balance_sheet' ? 'Balance Sheet' : 'Cash Flow'} Report`,
          description: `${report.period} generated`,
          timestamp: report.generatedAt,
          icon: 'BarChart',
          category: 'report'
        });
      });

      // Sort all activities by timestamp and return top 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      res.json(sortedActivities);
    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Get all transactions
  app.get("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  // Create transaction
  app.post("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const transaction = await storage.createTransaction({
        ...req.body,
        userId: req.userId!
      });
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Get all invoices
  app.get("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const invoices = await storage.getInvoices(userId);
    res.json(invoices);
  });

  // Create invoice
  app.post("/api/invoices", requireAuth, async (req: AuthRequest, res) => {
    try {
      const invoiceData = {
        ...req.body,
        userId: req.userId!,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate + 'T00:00:00.000Z') : new Date()
      };
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    const { id } = req.params;
    const invoice = await storage.updateInvoice(id, req.body);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });

  // Get all integrations
  app.get("/api/integrations", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const integrations = await storage.getIntegrations(userId);
    
    const sanitized = integrations.map(int => ({
      ...int,
      hasCredentials: !!int.credentials,
      credentials: undefined
    }));
    
    res.json(sanitized);
  });

  // Update client payment status (admin only)
  app.patch("/api/admin/users/:id/payment-status", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      if (!['current', 'overdue', 'paused'].includes(paymentStatus)) {
        return res.status(400).json({ error: "Invalid payment status" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ error: "Cannot change admin payment status" });
      }

      await storage.updateUser(id, { paymentStatus });

      await logAdminAction(
        req.userId!,
        'update_payment_status',
        id,
        { paymentStatus, username: user.username },
        req.ip
      );

      res.json({ success: true, paymentStatus });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  // Get single integration
  app.get("/api/integrations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const integration = await storage.getIntegration(id);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Verify ownership
      if (integration.userId !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }

      // Don't send credentials to frontend
      const { credentials, ...rest } = integration;
      res.json({ ...rest, hasCredentials: !!credentials });
    } catch (error) {
      console.error('Get integration error:', error);
      res.status(500).json({ error: "Failed to fetch integration" });
    }
  });

  // Create integration
  app.post("/api/integrations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { credentials, ...rest } = req.body;
      
      const data = insertIntegrationSchema.parse({
        ...rest,
        userId: req.userId!,
        credentials: credentials ? encryptCredentials(credentials) : null
      });
      
      const integration = await storage.createIntegration(data);
      res.json(integration);
    } catch (error) {
      res.status(400).json({ error: "Invalid integration data" });
    }
  });

  // Update integration
  app.patch("/api/integrations/:id", async (req, res) => {
    const { id } = req.params;
    const integration = await storage.updateIntegration(id, req.body);
    if (!integration) {
      return res.status(404).json({ error: "Integration not found" });
    }
    res.json(integration);
  });

  // Delete integration
  app.delete("/api/integrations/:id", async (req, res) => {
    const { id } = req.params;
    const success = await storage.deleteIntegration(id);
    if (!success) {
      return res.status(404).json({ error: "Integration not found" });
    }
    res.json({ success: true });
  });

  // Get all automations (system + user automations)
  app.get("/api/automations", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    
    // Get user-specific automations from database
    const userAutomations = await storage.getAutomations(userId);
    
    // Add system-level automations that run for all clients
    const systemAutomations = [
      {
        id: 'system-smart-tasks',
        userId,
        name: 'Smart Task Creation',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Automatically creates actionable tasks for overdue invoices, low cash alerts, and upcoming payment reminders', frequency: 'Every hour' },
        lastRun: null,
        createdAt: new Date()
      },
      {
        id: 'system-auto-reconcile',
        userId,
        name: 'Auto-Reconciliation',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Automatically matches payments to invoices and marks them as paid', frequency: 'Every 30 minutes' },
        lastRun: null,
        createdAt: new Date()
      },
      {
        id: 'system-weekly-reports',
        userId,
        name: 'Weekly Financial Summary',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Sends comprehensive financial summary emails every Monday at 8 AM', frequency: 'Mondays at 8 AM' },
        lastRun: null,
        createdAt: new Date()
      },
      {
        id: 'system-monthly-reports',
        userId,
        name: 'Monthly Financial Reports',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Generates P&L, Balance Sheet, and Cash Flow statements automatically', frequency: 'Monthly on the 1st' },
        lastRun: null,
        createdAt: new Date()
      },
      {
        id: 'system-low-cash',
        userId,
        name: 'Low Cash Monitoring',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Monitors cash balance and sends alerts when below $5,000 threshold', frequency: 'Every hour' },
        lastRun: null,
        createdAt: new Date()
      },
      {
        id: 'system-overdue-check',
        userId,
        name: 'Overdue Invoice Alerts',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Checks for overdue invoices and sends reminder emails', frequency: 'Daily at 9 AM' },
        lastRun: null,
        createdAt: new Date()
      },
      {
        id: 'system-integration-sync',
        userId,
        name: 'Integration Data Sync',
        type: 'System Automation',
        isActive: true,
        config: { description: 'Syncs data from connected integrations (QuickBooks, Stripe, etc.)', frequency: 'Every 15 minutes' },
        lastRun: null,
        createdAt: new Date()
      }
    ];
    
    // Combine system and user automations
    res.json([...systemAutomations, ...userAutomations]);
  });

  // Create automation
  app.post("/api/automations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = insertAutomationSchema.parse({
        ...req.body,
        userId: req.userId!
      });
      const automation = await storage.createAutomation(data);
      res.json(automation);
    } catch (error) {
      res.status(400).json({ error: "Invalid automation data" });
    }
  });

  // Update automation
  app.patch("/api/automations/:id", async (req, res) => {
    const { id } = req.params;
    const automation = await storage.updateAutomation(id, req.body);
    if (!automation) {
      return res.status(404).json({ error: "Automation not found" });
    }
    res.json(automation);
  });

  // Delete automation
  app.delete("/api/automations/:id", async (req, res) => {
    const { id } = req.params;
    const success = await storage.deleteAutomation(id);
    if (!success) {
      return res.status(404).json({ error: "Automation not found" });
    }
    res.json({ success: true });
  });

  // Get all tasks for user
  app.get("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const status = req.query.status as string | undefined;
      const tasks = await storage.getTasks(userId, status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get specific task
  app.get("/api/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Ensure user can only access their own tasks
      if (task.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  // Create task
  app.post("/api/tasks", requireAuth, async (req: AuthRequest, res) => {
    try {
      // Validate and strip userId from client input for security
      const validatedData = insertTaskSchema.omit({ userId: true }).parse(req.body);
      const task = await storage.createTask({
        ...validatedData,
        userId: req.userId! // Always use authenticated user's ID
      });
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const existingTask = await storage.getTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Ensure user can only update their own tasks
      if (existingTask.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const existingTask = await storage.getTask(id);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Ensure user can only delete their own tasks
      if (existingTask.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const success = await storage.deleteTask(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Get all financial reports for user
  app.get("/api/financial-reports", requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const reportType = req.query.reportType as string | undefined;
      const reports = await storage.getFinancialReports(userId, reportType);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch financial reports" });
    }
  });

  // Get specific financial report
  app.get("/api/financial-reports/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getFinancialReport(id);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Ensure user can only access their own reports
      if (report.userId !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Test endpoint to manually trigger Smart Task Creation (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/test/trigger-smart-tasks", async (req, res) => {
      try {
        console.log('🧪 Test endpoint: triggering Smart Task Creation');
        await createSmartTasks();
        res.json({ success: true, message: "Smart Task Creation triggered" });
      } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: "Failed to trigger automation" });
      }
    });

    app.post("/api/test/trigger-reconciliation", async (req, res) => {
      try {
        console.log('🧪 Test endpoint: triggering Auto-Reconciliation');
        await autoReconcileTransactions();
        res.json({ success: true, message: "Auto-Reconciliation triggered" });
      } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: "Failed to trigger automation" });
      }
    });

    app.post("/api/test/trigger-financial-reports", async (req, res) => {
      try {
        console.log('🧪 Test endpoint: triggering Financial Reports');
        await generateFinancialReports();
        res.json({ success: true, message: "Financial Reports generation triggered" });
      } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: "Failed to trigger automation" });
      }
    });

    app.post("/api/test/reseed-demo", async (req, res) => {
      try {
        console.log('🧪 Test endpoint: reseeding demo data with current dates');
        const demoUser = await storage.getUserByUsername('demo');
        if (!demoUser) {
          return res.status(404).json({ error: "Demo user not found" });
        }
        
        const { seedDemoData } = await import("./seed");
        const { db } = await import("./db");
        const { transactions, invoices, tasks } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.delete(transactions).where(eq(transactions.userId, demoUser.id));
        await db.delete(invoices).where(eq(invoices.userId, demoUser.id));
        await db.delete(tasks).where(eq(tasks.userId, demoUser.id));
        
        await seedDemoData(demoUser.id);
        res.json({ success: true, message: "Demo data reseeded with current dates" });
      } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: "Failed to reseed demo data" });
      }
    });
  }

  // Webhook endpoint for Stripe
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const payment = event.data.object;
        const userId = payment.metadata?.userId;
        
        if (userId) {
          await storage.createTransaction({
            userId,
            type: 'payment',
            amount: payment.amount,
            description: `Stripe payment from ${payment.customer}`,
            category: 'payment',
            source: 'stripe'
          });
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // Webhook endpoint for QuickBooks
  app.post("/api/webhooks/quickbooks", async (req, res) => {
    try {
      const event = req.body;
      const userId = event.userId;
      
      if (event.eventNotifications && userId) {
        for (const notification of event.eventNotifications) {
          for (const entity of notification.dataChangeEvent?.entities || []) {
            if (entity.name === 'Invoice') {
              await storage.createInvoice({
                userId,
                amount: entity.amount || 0,
                dueDate: new Date(entity.dueDate),
                status: entity.status?.toLowerCase() || 'due',
                client: entity.customerName,
                description: entity.description,
                source: 'quickbooks'
              });
            }
          }
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // Webhook endpoint for PayPal
  app.post("/api/webhooks/paypal", async (req, res) => {
    try {
      const event = req.body;
      const eventType = event.event_type;

      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const resource = event.resource;
        const userId = resource.custom_id; // Assuming custom_id contains userId

        if (userId) {
          await storage.createTransaction({
            userId,
            type: 'payment',
            amount: Math.round(parseFloat(resource.amount.value) * 100),
            description: `PayPal payment ${resource.id}`,
            category: 'payment',
            source: 'paypal'
          });
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // Webhook endpoint for Asana (project updates)
  app.post("/api/webhooks/asana", async (req, res) => {
    try {
      const event = req.body;
      const events = event.events || [];

      for (const asanaEvent of events) {
        if (asanaEvent.resource && asanaEvent.action === 'added') {
          const taskId = asanaEvent.resource.gid;
          // In production, fetch task details and create in system
          // For now, just acknowledge
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  // Generic webhook endpoint for Zapier
  app.post("/api/webhooks/zapier", async (req, res) => {
    try {
      const { type, data, userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required in webhook payload" });
      }
      
      switch (type) {
        case 'transaction':
          await storage.createTransaction({
            userId,
            ...data
          });
          break;
        case 'invoice':
          await storage.createInvoice({
            userId,
            ...data
          });
          break;
        default:
          break;
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
