import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIntegrationSchema, insertAutomationSchema } from "@shared/schema";
import { requireAuth, requireAdmin, logAdminAction, type AuthRequest } from "./middleware/auth";
import { authenticateUser, hashPassword, verifyPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      
      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      res.json({
        id: user.id,
        username: user.username,
        businessName: user.businessName,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
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
        role: user.role
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
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
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
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password" });
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

      res.json({
        moneyIn: totalIn,
        moneyOut: totalOut,
        availableCash: totalIn - totalOut,
        invoicesDue: dueSoonInvoices.length,
        invoicesOverdue: overdueInvoices.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
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
  app.post("/api/invoices", async (req, res) => {
    try {
      const invoice = await storage.createInvoice(req.body);
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
    res.json(integrations);
  });

  // Create integration
  app.post("/api/integrations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const data = insertIntegrationSchema.parse({
        ...req.body,
        userId: req.userId!
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

  // Get all automations
  app.get("/api/automations", requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const automations = await storage.getAutomations(userId);
    res.json(automations);
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

  // Webhook endpoint for Asana (project updates)
  app.post("/api/webhooks/asana", async (req, res) => {
    try {
      const event = req.body;
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
