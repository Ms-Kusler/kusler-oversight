# Kusler Oversight

Multi-tenant financial operations dashboard for Kusler Consulting clients.

## Project Overview
- **Name**: Kusler Oversight (formerly "Operations Hub")
- **Purpose**: Financial operations management platform for small business clients
- **Tech Stack**: React + TypeScript frontend, Express backend, in-memory storage
- **Domain**: kuslerconsulting.com (Squarespace)

## Authentication & Security
- ✅ Proper session-based authentication with bcrypt password hashing
- ✅ Multi-tenant data isolation (all queries scoped by userId)
- ✅ Role-based authorization (admin/client roles)
- ✅ Password change functionality for privacy
- ✅ Admin can still access client dashboards for support

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

## Integrations
- QuickBooks (planned)
- Stripe (planned)
- PayPal (planned)
- Asana/Monday.com (planned)
- Zapier fallback for other tools

## Deployment
- Target: Vercel (not Replit-specific deployment)
- Database: In-memory (consider PostgreSQL for production)
- Secrets: SESSION_SECRET, RESEND_API_KEY

## Notes
- Resend integration: User dismissed native Replit integration, using manual API key setup instead
- Design choice: Client business name replaces generic branding in header
- All admin actions are audit-logged for compliance
