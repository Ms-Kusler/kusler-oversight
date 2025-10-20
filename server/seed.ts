import { storage } from './storage';
import { hashPassword } from './auth';

export async function seedAdminUser() {
  try {
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
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
    throw error;
  }
}

export async function seedDemoClient() {
  try {
    const demoUsername = 'demo';
    
    const existingDemo = await storage.getUserByUsername(demoUsername);
    
    if (existingDemo) {
      console.log('✓ Demo client already exists');
      
      // Check if demo has any transactions - if not, reseed
      const transactions = await storage.getTransactions(existingDemo.id);
      if (transactions.length === 0) {
        console.log('  ↻ Reseeding demo data with current dates...');
        await seedDemoData(existingDemo.id);
      }
      
      return existingDemo;
    }
    
    const demoPassword = await hashPassword('demo123');
    
    const demoClient = await storage.createUser({
      username: demoUsername,
      password: demoPassword,
      email: 'contact@acmeplumbing.com',
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
  } catch (error) {
    console.error('❌ Failed to seed demo client:', error);
    throw error;
  }
}

export async function seedDemoData(userId: string) {
  // Create sample transactions (amounts in cents) - More realistic variety
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  const transactions = [
    // Last 7 days transactions for profit chart
    {
      userId,
      type: 'payment' as const,
      amount: 180000,
      description: 'Consulting payment - Tech Solutions Inc',
      category: 'payment',
      source: 'stripe',
      date: new Date(currentYear, currentMonth, currentDay)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 35000,
      description: 'Cloud hosting - AWS',
      category: 'software',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 225000,
      description: 'Project milestone - Acme Corp',
      category: 'payment',
      source: 'quickbooks',
      date: new Date(currentYear, currentMonth, currentDay - 1)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 45000,
      description: 'Contractor payment - Design work',
      category: 'payroll',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay - 1)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 195000,
      description: 'Retainer payment - Local Business Co',
      category: 'payment',
      source: 'stripe',
      date: new Date(currentYear, currentMonth, currentDay - 2)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 28000,
      description: 'Marketing - Google Ads',
      category: 'marketing',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay - 2)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 310000,
      description: 'Development services - Downtown Properties',
      category: 'payment',
      source: 'quickbooks',
      date: new Date(currentYear, currentMonth, currentDay - 3)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 52000,
      description: 'Office rent - October',
      category: 'rent',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay - 3)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 165000,
      description: 'Consulting hours - Small Business LLC',
      category: 'payment',
      source: 'stripe',
      date: new Date(currentYear, currentMonth, currentDay - 4)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 18000,
      description: 'Software licenses - Adobe',
      category: 'software',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay - 4)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 275000,
      description: 'Website project - Manufacturing Plus',
      category: 'payment',
      source: 'quickbooks',
      date: new Date(currentYear, currentMonth, currentDay - 5)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 42000,
      description: 'Utilities & Internet',
      category: 'utilities',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay - 5)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 240000,
      description: 'Maintenance contract - Enterprise Client',
      category: 'payment',
      source: 'stripe',
      date: new Date(currentYear, currentMonth, currentDay - 6)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 38000,
      description: 'Insurance payment - Business liability',
      category: 'insurance',
      source: 'manual',
      date: new Date(currentYear, currentMonth, currentDay - 6)
    },
    // Older transactions for historical data
    {
      userId,
      type: 'payment' as const,
      amount: 380000,
      description: 'System integration - Manufacturing Plus',
      category: 'payment',
      source: 'stripe',
      date: new Date(currentYear, currentMonth - 1, 22)
    },
    {
      userId,
      type: 'expense' as const,
      amount: 95000,
      description: 'Professional development - Conference',
      category: 'training',
      source: 'manual',
      date: new Date(currentYear, currentMonth - 1, 15)
    },
    {
      userId,
      type: 'payment' as const,
      amount: 520000,
      description: 'Major project milestone - Enterprise Client',
      category: 'payment',
      source: 'quickbooks',
      date: new Date(currentYear, currentMonth - 2, 30)
    }
  ];
  
  for (const transaction of transactions) {
    await storage.createTransaction(transaction);
  }
  
  // Create sample invoices (amounts in cents) - More realistic variety
  const invoices = [
    {
      userId,
      amount: 450000,
      dueDate: new Date(currentYear, currentMonth, 15),
      status: 'due' as const,
      client: 'Tech Solutions Inc',
      description: 'Q4 Consulting Services',
      source: 'manual'
    },
    {
      userId,
      amount: 325000,
      dueDate: new Date(currentYear, currentMonth, 25),
      status: 'due' as const,
      client: 'Acme Corp',
      description: 'Monthly retainer - October',
      source: 'quickbooks'
    },
    {
      userId,
      amount: 185000,
      dueDate: new Date(currentYear, currentMonth - 1, 30),
      status: 'overdue' as const,
      client: 'Startup Ventures LLC',
      description: 'Website redesign project',
      source: 'manual'
    },
    {
      userId,
      amount: 275000,
      dueDate: new Date(currentYear, currentMonth - 1, 15),
      status: 'overdue' as const,
      client: 'Global Industries',
      description: 'System audit and recommendations',
      source: 'quickbooks'
    },
    {
      userId,
      amount: 520000,
      dueDate: new Date(currentYear, currentMonth - 3, 28),
      status: 'paid' as const,
      client: 'Enterprise Client',
      description: 'Major project milestone payment',
      source: 'quickbooks'
    },
    {
      userId,
      amount: 380000,
      dueDate: new Date(currentYear, currentMonth - 2, 20),
      status: 'paid' as const,
      client: 'Manufacturing Plus',
      description: 'System integration services',
      source: 'stripe'
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
