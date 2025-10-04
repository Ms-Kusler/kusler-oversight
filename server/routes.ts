import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIntegrationSchema, insertAutomationSchema } from "@shared/schema";
import { requireAdmin, logAdminAction, type AuthRequest } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const MOCK_USER_ID = "demo-user";

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

  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const userId = req.query.userId as string || MOCK_USER_ID;
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
  app.get("/api/transactions", async (req, res) => {
    const userId = req.query.userId as string || MOCK_USER_ID;
    const transactions = await storage.getTransactions(userId);
    res.json(transactions);
  });

  // Create transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const transaction = await storage.createTransaction(req.body);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    const userId = req.query.userId as string || MOCK_USER_ID;
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
  app.get("/api/integrations", async (req, res) => {
    const userId = req.query.userId as string || MOCK_USER_ID;
    const integrations = await storage.getIntegrations(userId);
    res.json(integrations);
  });

  // Create integration
  app.post("/api/integrations", async (req, res) => {
    try {
      const data = insertIntegrationSchema.parse(req.body);
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
  app.get("/api/automations", async (req, res) => {
    const userId = req.query.userId as string || MOCK_USER_ID;
    const automations = await storage.getAutomations(userId);
    res.json(automations);
  });

  // Create automation
  app.post("/api/automations", async (req, res) => {
    try {
      const data = insertAutomationSchema.parse(req.body);
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
        await storage.createTransaction({
          userId: payment.metadata?.userId || MOCK_USER_ID,
          type: 'payment',
          amount: payment.amount,
          description: `Stripe payment from ${payment.customer}`,
          category: 'payment',
          source: 'stripe'
        });
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
      
      if (event.eventNotifications) {
        for (const notification of event.eventNotifications) {
          for (const entity of notification.dataChangeEvent?.entities || []) {
            if (entity.name === 'Invoice') {
              await storage.createInvoice({
                userId: MOCK_USER_ID,
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
      const targetUserId = userId || MOCK_USER_ID;
      
      switch (type) {
        case 'transaction':
          await storage.createTransaction({
            userId: targetUserId,
            ...data
          });
          break;
        case 'invoice':
          await storage.createInvoice({
            userId: targetUserId,
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
