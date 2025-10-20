import { neon } from '@neondatabase/serverless';

export async function ensureDatabaseSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL not found - skipping schema check');
    return;
  }

  try {
    console.log('🔍 Checking database schema...');
    const sql = neon(databaseUrl);

    // Check which tables exist
    const tableCheck = async (tableName: string) => {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `;
      return result[0]?.exists;
    };

    const usersExist = await tableCheck('users');
    const tasksExist = await tableCheck('tasks');
    const financialReportsExist = await tableCheck('financial_reports');
    const supportRequestsExist = await tableCheck('support_requests');

    console.log(`📊 Table status: users=${usersExist}, tasks=${tasksExist}, financial_reports=${financialReportsExist}, support_requests=${supportRequestsExist}`);

    // Create missing tables (CREATE TABLE IF NOT EXISTS is safe)
    console.log('📦 Creating any missing tables...');
    
    // Create all tables using raw SQL based on schema
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          business_name VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'client',
          is_active BOOLEAN NOT NULL DEFAULT true,
          payment_status VARCHAR(20) DEFAULT 'current',
          email_preferences JSONB DEFAULT '{"weeklyReports": true, "lowCashAlerts": true, "overdueInvoices": true, "integrationFailures": true}'::jsonb,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          amount INTEGER NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          source VARCHAR(100) DEFAULT 'manual',
          reconciled BOOLEAN DEFAULT false,
          date TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          client_name VARCHAR(255) NOT NULL,
          amount INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          due_date TIMESTAMP NOT NULL,
          issue_date TIMESTAMP NOT NULL,
          description TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS integrations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          platform VARCHAR(100) NOT NULL,
          is_connected BOOLEAN NOT NULL DEFAULT false,
          credentials TEXT,
          last_sync TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS automations (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(100) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          trigger_condition JSONB,
          action_config JSONB,
          last_run TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(255) NOT NULL,
          target_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
          details JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'pending',
          related_id VARCHAR,
          related_type TEXT,
          due_date TIMESTAMP,
          completed_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS financial_reports (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          report_type TEXT NOT NULL,
          period TEXT NOT NULL,
          data JSONB NOT NULL,
          generated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS support_requests (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          ticket_id VARCHAR(255) UNIQUE NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          resolved_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `;

    console.log('✅ All tables ensured (created if missing)');
    
    // Now check for missing columns in existing tables
    console.log('📋 Checking for missing columns...');
    
    try {
      // Add payment_status and email_preferences to users table if missing
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'current'
      `;
      
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{"weeklyReports": true, "lowCashAlerts": true, "overdueInvoices": true, "integrationFailures": true}'::jsonb
      `;
      
      await sql`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
      `;
      
      // Fix tasks table if it has wrong columns
      await sql`
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS type TEXT
      `;
      
      await sql`
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS related_id VARCHAR
      `;
      
      await sql`
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS related_type TEXT
      `;
      
      // Fix financial_reports table if it has wrong columns
      await sql`
        ALTER TABLE financial_reports 
        ADD COLUMN IF NOT EXISTS period TEXT
      `;
      
      console.log('✅ Added any missing columns to existing tables');
    } catch (error) {
      console.warn('⚠️  Could not add missing columns (might already exist):', error);
    }
  } catch (error) {
    console.error('❌ Failed to ensure database schema:', error);
    throw error;
  }
}
