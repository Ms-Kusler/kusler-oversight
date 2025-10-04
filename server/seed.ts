import { storage } from './storage';
import { hashPassword } from './auth';

export async function seedAdminUser() {
  const adminUsername = 'admin';
  
  const existingAdmin = await storage.getUserByUsername(adminUsername);
  
  if (existingAdmin) {
    console.log('✓ Admin user already exists');
    return existingAdmin;
  }
  
  const adminPassword = await hashPassword('admin123');
  
  const admin = await storage.createUser({
    username: adminUsername,
    password: adminPassword,
    email: 'admin@kuslerconsulting.com',
    businessName: 'Kusler Consulting',
    role: 'admin'
  });
  
  console.log('✓ Admin user created');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  ⚠️  IMPORTANT: Change this password immediately in production!');
  
  return admin;
}

export async function seedDemoClient() {
  const demoUsername = 'demo';
  
  const existingDemo = await storage.getUserByUsername(demoUsername);
  
  if (existingDemo) {
    console.log('✓ Demo client already exists');
    return existingDemo;
  }
  
  const demoPassword = await hashPassword('demo123');
  
  const demoClient = await storage.createUser({
    username: demoUsername,
    password: demoPassword,
    email: 'demo@example.com',
    businessName: 'Acme Plumbing LLC',
    role: 'client'
  });
  
  console.log('✓ Demo client created');
  console.log('  Username: demo');
  console.log('  Password: demo123');
  console.log('  Business: Acme Plumbing LLC');
  
  // Seed sample data for demo account
  await seedDemoData(demoClient.id);
  
  return demoClient;
}

async function seedDemoData(userId: string) {
  // Create sample transactions
  const transactions = [
    {
      userId,
      type: 'payment' as const,
      amount: 2500,
      description: 'Client payment - Johnson Residence',
      category: 'payment',
      source: 'stripe',
      date: new Date('2024-01-15')
    },
    {
      userId,
      type: 'payment' as const,
      amount: 1800,
      description: 'Client payment - Smith Commercial',
      category: 'payment',
      source: 'quickbooks',
      date: new Date('2024-01-18')
    },
    {
      userId,
      type: 'expense' as const,
      amount: 450,
      description: 'Plumbing supplies - Home Depot',
      category: 'supplies',
      source: 'manual',
      date: new Date('2024-01-12')
    },
    {
      userId,
      type: 'expense' as const,
      amount: 1200,
      description: 'Contractor wages - January',
      category: 'payroll',
      source: 'manual',
      date: new Date('2024-01-20')
    },
    {
      userId,
      type: 'payment' as const,
      amount: 3200,
      description: 'Client payment - Downtown Office',
      category: 'payment',
      source: 'stripe',
      date: new Date('2024-01-22')
    }
  ];
  
  for (const transaction of transactions) {
    await storage.createTransaction(transaction);
  }
  
  // Create sample invoices
  const invoices = [
    {
      userId,
      amount: 2800,
      dueDate: new Date('2024-02-01'),
      status: 'due' as const,
      client: 'Wilson Manufacturing',
      description: 'Emergency pipe repair - Factory floor',
      source: 'quickbooks'
    },
    {
      userId,
      amount: 1500,
      dueDate: new Date('2024-01-28'),
      status: 'overdue' as const,
      client: 'Green Valley Apartments',
      description: 'Monthly maintenance - Building A',
      source: 'quickbooks'
    },
    {
      userId,
      amount: 4200,
      dueDate: new Date('2024-02-10'),
      status: 'due' as const,
      client: 'City Hall Renovation',
      description: 'Complete bathroom remodel',
      source: 'manual'
    }
  ];
  
  for (const invoice of invoices) {
    await storage.createInvoice(invoice);
  }
  
  // Create sample integrations
  const integrations = [
    {
      userId,
      platform: 'QuickBooks',
      isConnected: true,
      lastSync: new Date()
    },
    {
      userId,
      platform: 'Stripe',
      isConnected: true,
      lastSync: new Date()
    },
    {
      userId,
      platform: 'Asana',
      isConnected: false,
      lastSync: null
    }
  ];
  
  for (const integration of integrations) {
    await storage.createIntegration(integration);
  }
  
  console.log('✓ Demo data seeded (transactions, invoices, integrations)');
}
