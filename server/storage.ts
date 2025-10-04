import { type User, type InsertUser, type Transaction, type InsertTransaction, type Invoice, type InsertInvoice, type Integration, type InsertIntegration, type Automation, type InsertAutomation, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
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
  
  // Audit log methods
  getAuditLogs(adminId?: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private invoices: Map<string, Invoice>;
  private integrations: Map<string, Integration>;
  private automations: Map<string, Automation>;
  private auditLogs: Map<string, AuditLog>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.invoices = new Map();
    this.integrations = new Map();
    this.automations = new Map();
    this.auditLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      businessName: insertUser.businessName ?? null,
      email: insertUser.email ?? null,
      emailPreferences: insertUser.emailPreferences ?? {
        weeklyReports: true,
        lowCashAlerts: true,
        overdueInvoices: true,
        integrationFailures: true,
      },
      role: insertUser.role ?? "client",
      isActive: true,
      lastLogin: null,
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

  async getAuditLogs(adminId?: string): Promise<AuditLog[]> {
    const logs = Array.from(this.auditLogs.values());
    if (adminId) {
      return logs.filter(log => log.adminId === adminId);
    }
    return logs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = {
      ...insertLog,
      targetUserId: insertLog.targetUserId ?? null,
      details: insertLog.details ?? null,
      ipAddress: insertLog.ipAddress ?? null,
      id,
      createdAt: new Date()
    };
    this.auditLogs.set(id, log);
    return log;
  }
}

import { db } from './db';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '@shared/schema';

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return await db.select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(schema.transactions).values(insertTransaction).returning();
    return result[0];
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    return await db.select()
      .from(schema.invoices)
      .where(eq(schema.invoices.userId, userId))
      .orderBy(schema.invoices.dueDate);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
    return result[0];
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(schema.invoices).values(insertInvoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await db.update(schema.invoices)
      .set(updates)
      .where(eq(schema.invoices.id, id))
      .returning();
    return result[0];
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    return await db.select()
      .from(schema.integrations)
      .where(eq(schema.integrations.userId, userId))
      .orderBy(desc(schema.integrations.createdAt));
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    const result = await db.select().from(schema.integrations).where(eq(schema.integrations.id, id));
    return result[0];
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const result = await db.insert(schema.integrations).values(insertIntegration).returning();
    return result[0];
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    const result = await db.update(schema.integrations)
      .set(updates)
      .where(eq(schema.integrations.id, id))
      .returning();
    return result[0];
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const result = await db.delete(schema.integrations).where(eq(schema.integrations.id, id)).returning();
    return result.length > 0;
  }

  async getAutomations(userId: string): Promise<Automation[]> {
    return await db.select()
      .from(schema.automations)
      .where(eq(schema.automations.userId, userId))
      .orderBy(desc(schema.automations.createdAt));
  }

  async getAutomation(id: string): Promise<Automation | undefined> {
    const result = await db.select().from(schema.automations).where(eq(schema.automations.id, id));
    return result[0];
  }

  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    const result = await db.insert(schema.automations).values(insertAutomation).returning();
    return result[0];
  }

  async updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | undefined> {
    const result = await db.update(schema.automations)
      .set(updates)
      .where(eq(schema.automations.id, id))
      .returning();
    return result[0];
  }

  async deleteAutomation(id: string): Promise<boolean> {
    const result = await db.delete(schema.automations).where(eq(schema.automations.id, id)).returning();
    return result.length > 0;
  }

  async getAuditLogs(adminId?: string): Promise<AuditLog[]> {
    if (adminId) {
      return await db.select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.adminId, adminId))
        .orderBy(desc(schema.auditLogs.createdAt));
    }
    return await db.select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt));
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(schema.auditLogs).values(insertLog).returning();
    return result[0];
  }
}

// Use PostgreSQL in production (Vercel), MemStorage in development (Replit)
export const storage = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
