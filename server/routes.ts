import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const invoices = await storage.getInvoices();
      
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
    const transactions = await storage.getTransactions();
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
    const invoices = await storage.getInvoices();
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

  const httpServer = createServer(app);

  return httpServer;
}
