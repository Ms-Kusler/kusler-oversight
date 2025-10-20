import { type User, type InsertUser, type Transaction, type InsertTransaction, type Invoice, type InsertInvoice, type Integration, type InsertIntegration, type Automation, type InsertAutomation, type AuditLog, type InsertAuditLog, type Task, type InsertTask, type FinancialReport, type InsertFinancialReport, type SupportRequest, type InsertSupportRequest } from "@shared/schema";
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
  
  // Task methods
  getTasks(userId: string, status?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // Financial report methods
  getFinancialReports(userId: string, reportType?: string): Promise<FinancialReport[]>;
  getFinancialReport(id: string): Promise<FinancialReport | undefined>;
  createFinancialReport(report: InsertFinancialReport): Promise<FinancialReport>;
  
  // Support request methods
  getSupportRequests(status?: string): Promise<SupportRequest[]>;
  getSupportRequest(id: string): Promise<SupportRequest | undefined>;
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private invoices: Map<string, Invoice>;
  private integrations: Map<string, Integration>;
  private automations: Map<string, Automation>;
  private auditLogs: Map<string, AuditLog>;
  private tasks: Map<string, Task>;
  private financialReports: Map<string, FinancialReport>;
  private supportRequests: Map<string, SupportRequest>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.invoices = new Map();
    this.integrations = new Map();
    this.automations = new Map();
    this.auditLogs = new Map();
    this.tasks = new Map();
    this.financialReports = new Map();
    this.supportRequests = new Map();
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
      paymentStatus: "current",
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

  async getTasks(userId: string, status?: string): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values()).filter(t => t.userId === userId);
    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      status: insertTask.status ?? "pending",
      priority: insertTask.priority ?? "medium",
      description: insertTask.description ?? null,
      relatedId: insertTask.relatedId ?? null,
      relatedType: insertTask.relatedType ?? null,
      dueDate: insertTask.dueDate ?? null,
      completedAt: null,
      id,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getFinancialReports(userId: string, reportType?: string): Promise<FinancialReport[]> {
    let reports = Array.from(this.financialReports.values()).filter(r => r.userId === userId);
    if (reportType) {
      reports = reports.filter(r => r.reportType === reportType);
    }
    return reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  async getFinancialReport(id: string): Promise<FinancialReport | undefined> {
    return this.financialReports.get(id);
  }

  async createFinancialReport(insertReport: InsertFinancialReport): Promise<FinancialReport> {
    const id = randomUUID();
    const report: FinancialReport = {
      ...insertReport,
      id,
      generatedAt: new Date()
    };
    this.financialReports.set(id, report);
    return report;
  }

  async getSupportRequests(status?: string): Promise<SupportRequest[]> {
    let requests = Array.from(this.supportRequests.values());
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    return requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSupportRequest(id: string): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }

  async createSupportRequest(insertRequest: InsertSupportRequest): Promise<SupportRequest> {
    const id = randomUUID();
    const request: SupportRequest = {
      ...insertRequest,
      status: insertRequest.status ?? "pending",
      resolvedAt: null,
      id,
      createdAt: new Date()
    };
    this.supportRequests.set(id, request);
    return request;
  }

  async updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined> {
    const request = this.supportRequests.get(id);
    if (!request) return undefined;
    const updated = { ...request, ...updates };
    this.supportRequests.set(id, updated);
    return updated;
  }
}

import { eq, desc, and } from 'drizzle-orm';
import * as schema from '@shared/schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

export class PostgresStorage implements IStorage {
  private db!: NeonHttpDatabase<typeof schema>;
  private initialized = false;

  private async ensureDb() {
    if (!this.initialized) {
      const { db } = await import('./db.js');
      this.db = db;
      this.initialized = true;
    }
  }
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureDb();
    return await this.db.select().from(schema.users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureDb();
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.ensureDb();
    const result = await this.db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    await this.ensureDb();
    return await this.db.select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    await this.ensureDb();
    const result = await this.db.insert(schema.transactions).values(insertTransaction).returning();
    return result[0];
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    await this.ensureDb();
    return await this.db.select()
      .from(schema.invoices)
      .where(eq(schema.invoices.userId, userId))
      .orderBy(schema.invoices.dueDate);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
    return result[0];
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    await this.ensureDb();
    const result = await this.db.insert(schema.invoices).values(insertInvoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    await this.ensureDb();
    const result = await this.db.update(schema.invoices)
      .set(updates)
      .where(eq(schema.invoices.id, id))
      .returning();
    return result[0];
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    await this.ensureDb();
    return await this.db.select()
      .from(schema.integrations)
      .where(eq(schema.integrations.userId, userId))
      .orderBy(desc(schema.integrations.createdAt));
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.integrations).where(eq(schema.integrations.id, id));
    return result[0];
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    await this.ensureDb();
    const result = await this.db.insert(schema.integrations).values(insertIntegration).returning();
    return result[0];
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    await this.ensureDb();
    const result = await this.db.update(schema.integrations)
      .set(updates)
      .where(eq(schema.integrations.id, id))
      .returning();
    return result[0];
  }

  async deleteIntegration(id: string): Promise<boolean> {
    await this.ensureDb();
    const result = await this.db.delete(schema.integrations).where(eq(schema.integrations.id, id)).returning();
    return result.length > 0;
  }

  async getAutomations(userId: string): Promise<Automation[]> {
    await this.ensureDb();
    return await this.db.select()
      .from(schema.automations)
      .where(eq(schema.automations.userId, userId))
      .orderBy(desc(schema.automations.createdAt));
  }

  async getAutomation(id: string): Promise<Automation | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.automations).where(eq(schema.automations.id, id));
    return result[0];
  }

  async createAutomation(insertAutomation: InsertAutomation): Promise<Automation> {
    await this.ensureDb();
    const result = await this.db.insert(schema.automations).values(insertAutomation).returning();
    return result[0];
  }

  async updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation | undefined> {
    await this.ensureDb();
    const result = await this.db.update(schema.automations)
      .set(updates)
      .where(eq(schema.automations.id, id))
      .returning();
    return result[0];
  }

  async deleteAutomation(id: string): Promise<boolean> {
    await this.ensureDb();
    const result = await this.db.delete(schema.automations).where(eq(schema.automations.id, id)).returning();
    return result.length > 0;
  }

  async getAuditLogs(adminId?: string): Promise<AuditLog[]> {
    await this.ensureDb();
    if (adminId) {
      return await this.db.select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.adminId, adminId))
        .orderBy(desc(schema.auditLogs.createdAt));
    }
    return await this.db.select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt));
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    await this.ensureDb();
    const result = await this.db.insert(schema.auditLogs).values(insertLog).returning();
    return result[0];
  }

  async getTasks(userId: string, status?: string): Promise<Task[]> {
    await this.ensureDb();
    const conditions = status 
      ? and(eq(schema.tasks.userId, userId), eq(schema.tasks.status, status))
      : eq(schema.tasks.userId, userId);
    return await this.db.select()
      .from(schema.tasks)
      .where(conditions)
      .orderBy(desc(schema.tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return result[0];
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    await this.ensureDb();
    const result = await this.db.insert(schema.tasks).values(insertTask).returning();
    return result[0];
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    await this.ensureDb();
    const result = await this.db.update(schema.tasks)
      .set(updates)
      .where(eq(schema.tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.ensureDb();
    const result = await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id)).returning();
    return result.length > 0;
  }

  async getFinancialReports(userId: string, reportType?: string): Promise<FinancialReport[]> {
    await this.ensureDb();
    const conditions = reportType 
      ? and(eq(schema.financialReports.userId, userId), eq(schema.financialReports.reportType, reportType))
      : eq(schema.financialReports.userId, userId);
    return await this.db.select()
      .from(schema.financialReports)
      .where(conditions)
      .orderBy(desc(schema.financialReports.generatedAt));
  }

  async getFinancialReport(id: string): Promise<FinancialReport | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.financialReports).where(eq(schema.financialReports.id, id));
    return result[0];
  }

  async createFinancialReport(insertReport: InsertFinancialReport): Promise<FinancialReport> {
    await this.ensureDb();
    const result = await this.db.insert(schema.financialReports).values(insertReport).returning();
    return result[0];
  }

  async getSupportRequests(status?: string): Promise<SupportRequest[]> {
    await this.ensureDb();
    return await this.db.select()
      .from(schema.supportRequests)
      .where(status ? eq(schema.supportRequests.status, status) : undefined)
      .orderBy(desc(schema.supportRequests.createdAt));
  }

  async getSupportRequest(id: string): Promise<SupportRequest | undefined> {
    await this.ensureDb();
    const result = await this.db.select().from(schema.supportRequests).where(eq(schema.supportRequests.id, id));
    return result[0];
  }

  async createSupportRequest(insertRequest: InsertSupportRequest): Promise<SupportRequest> {
    await this.ensureDb();
    const result = await this.db.insert(schema.supportRequests).values(insertRequest).returning();
    return result[0];
  }

  async updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined> {
    await this.ensureDb();
    const result = await this.db.update(schema.supportRequests)
      .set(updates)
      .where(eq(schema.supportRequests.id, id))
      .returning();
    return result[0];
  }
}

// Use PostgreSQL storage (persistent across restarts)
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
