import { type User, type InsertUser, type Transaction, type InsertTransaction, type Invoice, type InsertInvoice, type Integration, type InsertIntegration, type Automation, type InsertAutomation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Transaction methods
  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Invoice methods
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined>;
  
  // Integration methods
  getIntegrations(userId: string): Promise<Integration[]>;
  getIntegration(id: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined>;
  deleteIntegration(id: string): Promise<boolean>;
  
  // Automation methods
  getAutomations(userId: string): Promise<Automation[]>;
  getAutomation(id: string): Promise<Automation | undefined>;
  createAutomation(automation: InsertAutomation): Promise<Automation>;
  updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | undefined>;
  deleteAutomation(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private invoices: Map<string, Invoice>;
  private integrations: Map<string, Integration>;
  private automations: Map<string, Automation>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.invoices = new Map();
    this.integrations = new Map();
    this.automations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      businessName: insertUser.businessName ?? null,
      email: insertUser.email ?? null,
      id 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction,
      description: insertTransaction.description ?? null,
      category: insertTransaction.category ?? null,
      source: insertTransaction.source ?? null,
      id,
      date: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(i => i.userId === userId)
      .sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = { 
      ...insertInvoice,
      status: insertInvoice.status ?? "due",
      description: insertInvoice.description ?? null,
      client: insertInvoice.client ?? null,
      source: insertInvoice.source ?? null,
      id 
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    const updated = { ...invoice, ...updates };
    this.invoices.set(id, updated);
    return updated;
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    return Array.from(this.integrations.values())
      .filter(i => i.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    return this.integrations.get(id);
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const id = randomUUID();
    const integration: Integration = {
      ...insertIntegration,
      isConnected: insertIntegration.isConnected ?? false,
      credentials: insertIntegration.credentials ?? null,
      lastSynced: null,
      id,
      createdAt: new Date()
    };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;
    const updated = { ...integration, ...updates };
    this.integrations.set(id, updated);
    return updated;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    return this.integrations.delete(id);
  }

  async getAutomations(userId: string): Promise<Automation[]> {
    return Array.from(this.automations.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getAutomation(id: string): Promise<Automation | undefined> {
    return this.automations.get(id);
  }

  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    const id = randomUUID();
    const automation: Automation = {
      ...insertAutomation,
      isActive: insertAutomation.isActive ?? true,
      config: insertAutomation.config ?? null,
      lastRun: null,
      id,
      createdAt: new Date()
    };
    this.automations.set(id, automation);
    return automation;
  }

  async updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | undefined> {
    const automation = this.automations.get(id);
    if (!automation) return undefined;
    const updated = { ...automation, ...updates };
    this.automations.set(id, updated);
    return updated;
  }

  async deleteAutomation(id: string): Promise<boolean> {
    return this.automations.delete(id);
  }
}

export const storage = new MemStorage();
