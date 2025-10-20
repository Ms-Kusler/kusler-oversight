# Kusler Oversight

Multi-tenant financial operations dashboard for Kusler Consulting clients.

## Project Overview
- **Name**: Kusler Oversight (formerly "Operations Hub")
- **Purpose**: Financial operations management platform for small business clients with ACTIONABLE automations
- **Tech Stack**: React + TypeScript frontend, Express backend, PostgreSQL database (Neon)
- **Domain**: kuslerconsulting.com (Squarespace)
- **Philosophy**: Automations must DO things (not just notify) - actively manage business operations

## Authentication & Security
- ✅ Proper session-based authentication with bcrypt password hashing (salt rounds: 10)
- ✅ Session regeneration on login to prevent session fixation attacks
- ✅ Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- ✅ Multi-tenant data isolation (all queries scoped by userId)
- ✅ Role-based authorization (admin/client roles)
- ✅ **Enhanced password policies**:
  - Minimum 8 characters
  - Requires uppercase and lowercase letters
  - Requires number OR special character
  - Password strength validation on change
- ✅ **Security headers**:
  - X-Frame-Options: DENY (clickjacking protection)
  - X-Content-Type-Options: nosniff (MIME sniffing protection)
  - X-XSS-Protection: enabled
  - Referrer-Policy: strict-origin-when-cross-origin
- ✅ **Integration credential encryption**: AES-256-CBC encryption for all API keys/secrets
  - Credentials encrypted before storage in database
  - Unique IV per credential for security
  - Frontend never receives decrypted credentials
  - Production deployment validation: fails fast if default encryption key detected
- ✅ Session security:
  - httpOnly cookies (prevents XSS access)
  - Secure cookies in production (HTTPS only)
  - SameSite protection (lax in dev, none in production for Railway)
  - 7-day session lifetime
  - PostgreSQL-backed session storage

## Email Integration
- **Service**: Resend (free tier: 3,000 emails/month, 100/day)
- **Domain**: kuslerconsulting.com
- **Setup Required**: Add DNS records in Squarespace to verify domain with Resend
  - Go to Resend dashboard → Domains → Add kuslerconsulting.com
  - Copy DNS records (TXT, MX, CNAME) to Squarespace DNS settings
- **Email Types**:
  - Weekly financial summaries (Mondays at 8 AM)
  - Low cash alerts (hourly check, threshold: $5,000)
  - Overdue invoice reminders
  - Integration failure notifications
- **User Preferences**: Clients can opt in/out of each email type

## Default Accounts
- **Admin**: username `admin`, password `admin123`
- **Demo Client**: username `demo`, password `demo123` (Acme Plumbing LLC with sample data)

## Native Automations (NO Zapier multi-step costs!)
The platform includes 7 core ACTIONABLE automations that actively DO things for business owners. **All automations are now visible to clients** in the Workflows page with descriptions and schedules:

### 1. Smart Task Creation (runs hourly)
- **What it does**: Automatically creates actionable tasks for business owners
- **Features**:
  - Detects overdue invoices and updates status → creates "Follow up" tasks
  - Monitors cash balance → creates "Low cash alert" task when below $5k
  - Tracks upcoming invoice due dates → creates "Send reminder" tasks 3 days before due
- **Impact**: Business owners get prioritized action items without manual tracking

### 2. Auto-Reconciliation (runs every 30 minutes)
- **What it does**: Automatically matches payments to invoices and marks them paid
- **Matching Logic**:
  - Amount matching (within $1 for rounding)
  - Date proximity (within 7 days of due date)
  - Client name matching (in payment description)
  - Tracks reconciled transactions to prevent duplicate matches
- **Impact**: Eliminates manual invoice reconciliation work

### 3. Automatic Financial Reports (runs monthly on 1st at midnight)
- **What it does**: Generates comprehensive financial statements automatically
- **Reports Generated**:
  - **P&L Statement**: Revenue, expenses, net income, profit margin, expense breakdown by category
  - **Balance Sheet**: Cash, accounts receivable, total assets, liabilities, equity
  - **Cash Flow Statement**: Operating/investing/financing activities, beginning/ending cash
- **Impact**: Monthly financial review ready without manual data entry

### Task Management
- Tasks displayed on Dashboard with priority badges (high/medium/low)
- One-click completion tracking
- Related to invoices, cash alerts, or general business operations
- Full CRUD API at `/api/tasks`

### Financial Reports
- Historical reports accessible via API at `/api/financial-reports`
- Query by report type (profit_loss, balance_sheet, cash_flow)
- JSON data format for easy integration
- Automatic deduplication prevents re-generating same month

## Integrations (All Implemented!)
- ✅ **QuickBooks**: OAuth2 ready - webhook handler for invoices/payments (requires user OAuth authorization for full sync)
- ✅ **Stripe**: Full sync - fetches charges, customers, payment intents
- ✅ **PayPal**: Full sync - fetches transactions from last 30 days
- ✅ **Asana**: Full sync - fetches tasks from all workspaces
- ✅ **Monday.com**: Full sync via GraphQL - fetches board items
- ✅ **Xero**: OAuth2 ready (requires user authorization)
- ✅ **Zapier**: Generic webhook handler for custom integrations
- ⚡ **Auto-sync**: All integrations sync every 15 minutes automatically via automation system

### Webhook Endpoints
All webhook handlers implemented and secured:
- `/api/webhooks/stripe` - Handles payment_intent.succeeded events
- `/api/webhooks/quickbooks` - Processes invoice/payment events
- `/api/webhooks/paypal` - Handles PAYMENT.CAPTURE.COMPLETED
- `/api/webhooks/asana` - Processes task events
- `/api/webhooks/zapier` - Custom integration fallback

## Admin Features (New!)
- ✅ **Client Impersonation**: Admins can view client dashboards as if they're the client
  - POST `/api/admin/impersonate/:clientId` - Start impersonation session
  - POST `/api/admin/exit-impersonation` - Return to admin view
  - Secure session management with originalAdminId tracking
- ✅ **Audit Log Viewer**: Track all admin actions in real-time
  - GET `/api/admin/audit-logs` - View last 100 admin actions
  - Logs user management, impersonation, demo resets, etc.
- ✅ **Security Settings Panel**: Visual display of active security features
  - Password policies enforcement
  - Rate limiting status
  - Credential encryption info
  - Audit logging status
- ✅ **Support Request System**: Full-featured ticketing system for client assistance
  - Clients can submit requests via "Request Developer Assistance" in user menu
  - Category selection: integration_setup, billing, technical_issue, feature_request
  - Unique ticket ID generation (e.g., TICKET-1760957558485-P4MQK11FN)
  - POST `/api/support/request-assistance` - Submit support tickets
  - GET `/api/admin/support-requests` - View all/pending support requests
  - PATCH `/api/admin/support-requests/:id/resolve` - Mark requests as resolved
  - Admin dashboard shows pending requests with client details and one-click resolution
  - Database table: support_requests (id, userId, ticketId, category, description, status, resolvedAt, createdAt)
- ✅ **Payment Status Management**: Flag and pause non-paying clients
  - Three payment states: current, overdue, paused
  - Paused accounts blocked at middleware level (403 error on API calls)
  - Admin dashboard shows payment status with visual badges
  - One-click status changes via dropdown menu
  - PATCH `/api/admin/users/:id/payment-status` - Update payment status
  - All status changes audit-logged for compliance

## Deployment
- **Platform**: Railway (with trust proxy configured for sessions)
- **Database**: PostgreSQL via Neon (persistent, production-ready)
- **Tables**: users, transactions, invoices, integrations, automations, audit_logs, tasks, financial_reports, support_requests
- **Default Railway URL**: `kusler-oversight-production.up.railway.app`
- **Custom Domain**: Can link kuslerconsulting.com via Railway Settings → Domains → Add Custom Domain
  - Add CNAME record in Squarespace: `oversight` → `kusler-oversight-production.up.railway.app`
  - Access app at `oversight.kuslerconsulting.com`
- **Required Secrets**: 
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - Session encryption key
  - `RESEND_API_KEY` - Email service API key
  - `ENCRYPTION_KEY` - **CRITICAL for production**: Strong unique key for credential encryption (app will fail to start without this in production)
- **Session Configuration**: 
  - Session cookies use `secure: true` and `sameSite: 'none'` in production for Railway proxy compatibility
  - `trust proxy: 1` configured to handle Railway's proxy layer
  - 7-day session lifetime with PostgreSQL-backed session storage
  - Admin impersonation support with originalAdminId session field

### Production Deployment Checklist
1. ✅ Set strong unique `ENCRYPTION_KEY` environment variable (required - app fails without it)
2. ✅ Deploy session cookie fix (sameSite: 'none' for Railway) to resolve authentication issues
3. ✅ Run staging smoke test to verify ProfitChart renders accurate trend values
4. ✅ Monitor first production integration sync to verify encrypted credentials work correctly
5. ✅ Verify Resend DNS records configured in Squarespace
6. ✅ Test login and password change functionality after deployment

## Dashboard Features (Production Ready)
- ✅ **AI Assistant**: Real-time financial recommendations based on:
  - Overdue invoices analysis
  - Upcoming payment deadlines
  - Tax planning suggestions based on revenue
  - High-priority task alerts
- ✅ **Recent Activity Feed**: Shows actual system activity including:
  - Automation-created tasks (overdue invoices, low cash alerts, reminders)
  - Recent transactions (payments and expenses)
  - Invoice updates (created/paid status)
  - Financial report generations
- ✅ **Task Management**: Display of pending/completed tasks with priority levels
- ✅ **Financial Metrics**: Real-time dashboard with money in/out, available cash, profit trends
  - All metrics calculated from real transaction data
  - 7-day profit trend with 2-decimal precision (no data loss)
  - `/api/dashboard` endpoint returns live financial data
- ✅ **Debug Panel**: Development-only diagnostic tool (hidden in production)

## Notes
- Resend integration: User dismissed native Replit integration, using manual API key setup instead
- Design choice: Client business name replaces generic branding in header
- All admin actions are audit-logged for compliance
- All dashboard components use real data from backend APIs (no mock data)
- Session persistence: 100ms delay + auth verification after login ensures cookie is fully set before navigation
- Payment status enforcement: Paused accounts receive 403 errors on all API calls (except logout)

## Production Readiness Status
- ✅ **Security**: All integration credentials encrypted with AES-256-CBC
- ✅ **Data Quality**: All dashboard metrics calculated from real transactions (no mock data)
- ✅ **Precision**: Financial calculations preserve 2-decimal precision for accurate reporting
- ✅ **Validation**: Production deployment enforces unique encryption key (fails fast if default)
- ✅ **Multi-tenant**: All data properly isolated by userId
- ✅ **Architecture Review**: Passed comprehensive production readiness review (Oct 2025)
