// Production database seeding script
// Run this once on Railway to create admin and demo users

import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

async function seedProduction() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🌱 Starting production database seed...\n');

  const sql = neon(databaseUrl);

  try {
    // Check if admin user exists
    const existingAdmin = await sql`
      SELECT id FROM users WHERE username = 'admin'
    `;

    if (existingAdmin.length > 0) {
      console.log('✓ Admin user already exists');
    } else {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      await sql`
        INSERT INTO users (id, username, password, email, business_name, role, is_active, payment_status, email_preferences)
        VALUES (
          gen_random_uuid(),
          'admin',
          ${adminPassword},
          'admin@kuslerconsulting.com',
          'Kusler Consulting',
          'admin',
          true,
          'current',
          '{"weeklyReports": true, "lowCashAlerts": true, "overdueInvoices": true, "integrationFailures": true}'::jsonb
        )
      `;
      console.log('✓ Created admin user (username: admin, password: admin123)');
    }

    // Check if demo user exists
    const existingDemo = await sql`
      SELECT id FROM users WHERE username = 'demo'
    `;

    if (existingDemo.length > 0) {
      console.log('✓ Demo user already exists');
    } else {
      // Create demo user
      const demoPassword = await bcrypt.hash('demo123', 10);
      const demoResult = await sql`
        INSERT INTO users (id, username, password, email, business_name, role, is_active, payment_status, email_preferences)
        VALUES (
          gen_random_uuid(),
          'demo',
          ${demoPassword},
          'demo@acmeplumbing.com',
          'Acme Plumbing LLC',
          'client',
          true,
          'current',
          '{"weeklyReports": true, "lowCashAlerts": true, "overdueInvoices": true, "integrationFailures": true}'::jsonb
        )
        RETURNING id
      `;
      const demoUserId = demoResult[0].id;
      console.log('✓ Created demo user (username: demo, password: demo123)');

      // Add sample data for demo user
      console.log('\n📊 Adding sample data for demo user...');

      // Sample transactions
      await sql`
        INSERT INTO transactions (id, user_id, type, amount, description, category, date)
        VALUES
          (gen_random_uuid(), ${demoUserId}, 'income', 2500.00, 'Johnson Residence - Bathroom Renovation', 'service_revenue', NOW() - INTERVAL '2 days'),
          (gen_random_uuid(), ${demoUserId}, 'income', 850.00, 'Emergency Pipe Repair - Smith Property', 'service_revenue', NOW() - INTERVAL '5 days'),
          (gen_random_uuid(), ${demoUserId}, 'expense', 450.00, 'Plumbing Supplies - Home Depot', 'materials', NOW() - INTERVAL '3 days'),
          (gen_random_uuid(), ${demoUserId}, 'expense', 125.00, 'Vehicle Fuel', 'operating_expenses', NOW() - INTERVAL '4 days')
      `;
      console.log('  ✓ Added 4 sample transactions');

      // Sample invoices
      await sql`
        INSERT INTO invoices (id, user_id, client_name, amount, status, due_date, issue_date, description)
        VALUES
          (gen_random_uuid(), ${demoUserId}, 'Johnson Residence', 2500.00, 'paid', NOW() - INTERVAL '2 days', NOW() - INTERVAL '32 days', 'Bathroom renovation - labor and materials'),
          (gen_random_uuid(), ${demoUserId}, 'Smith Property', 850.00, 'paid', NOW() - INTERVAL '5 days', NOW() - INTERVAL '35 days', 'Emergency pipe repair'),
          (gen_random_uuid(), ${demoUserId}, 'Davis Commercial', 4200.00, 'pending', NOW() + INTERVAL '10 days', NOW() - INTERVAL '5 days', 'Office building plumbing installation')
      `;
      console.log('  ✓ Added 3 sample invoices');

      console.log('\n✅ Demo data seeded successfully!');
    }

    console.log('\n🎉 Production database seed complete!\n');
    console.log('You can now log in with:');
    console.log('  Admin: username=admin, password=admin123');
    console.log('  Demo:  username=demo, password=demo123');
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seedProduction();
