# Railway Deployment Guide

## Why Railway (Not Vercel)

Vercel is designed for serverless functions. Our app uses:
- Express with session middleware (requires persistent memory)
- Traditional server structure (server/ directory imports)
- Long-running processes

Railway supports traditional Node.js servers perfectly.

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub Repository**: Already at https://github.com/Ms-Kusler/kusler-oversight
3. **Neon Database**: Already created with connection string

## Deployment Steps

### 1. Create Railway Project

1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select **Ms-Kusler/kusler-oversight**
4. Railway will auto-detect Node.js

### 2. Configure Environment Variables

In Railway project settings → Variables, add:

```
DATABASE_URL=<your-neon-connection-string>
SESSION_SECRET=<generate-random-string>
RESEND_API_KEY=<your-resend-api-key>
NODE_ENV=production
```

### 3. Configure Build Settings

Railway should auto-detect from `railway.json`:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

If not, set manually in Settings → Deploy.

### 4. Deploy

1. Railway will automatically deploy on push to main branch
2. Wait for build to complete (~2-3 minutes)
3. Railway will provide a public URL: `https://<your-app>.railway.app`

### 5. Initialize Database

After first deployment, the seed script will automatically create:
- Admin user: `admin` / `admin123`
- Demo client: `demo` / `demo123`

## Verify Deployment

1. Visit your Railway URL
2. Login with `demo` / `demo123`
3. Check dashboard loads with sample data

## Custom Domain (Optional)

1. In Railway project → Settings → Domains
2. Add custom domain: `app.kuslerconsulting.com`
3. Add DNS records in Squarespace

## Troubleshooting

**Check Logs**: Railway → Deployments → View Logs

**Common Issues**:
- Database connection: Verify `DATABASE_URL` is set
- Session errors: Verify `SESSION_SECRET` is set
- Port binding: Railway automatically sets `PORT` variable

## Cost

- **Railway**: $5/month credit (free tier)
- **Neon DB**: Free tier (500MB, plenty for this app)
- **Resend**: Free tier (3,000 emails/month)

Total: **$0** with free tiers
