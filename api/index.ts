import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import session from 'express-session';
import { registerRoutes } from '../server/routes';
import { seedAdminUser, seedDemoClient } from '../server/seed';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'operations-hub-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}));

// Initialize routes
let routesRegistered = false;
async function ensureInitialized() {
  if (!routesRegistered) {
    await registerRoutes(app);
    
    // Seed database once
    try {
      await seedAdminUser();
      await seedDemoClient();
    } catch (err) {
      // Users might already exist
    }
    
    routesRegistered = true;
  }
}

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureInitialized();
  return app(req as any, res as any);
}
