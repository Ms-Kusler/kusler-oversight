import express, { type Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';
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

// Shared initialization promise
let initPromise: Promise<void> | null = null;

async function initServer() {
  if (!initPromise) {
    initPromise = (async () => {
      await registerRoutes(app);
      
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });
      
      // Serve static files in production
      serveStatic(app);
      
      // Seed database once
      try {
        await seedAdminUser();
        await seedDemoClient();
      } catch (err) {
        // Users might already exist - ignore
      }
    })();
  }
  return initPromise;
}

// Request-level guard: wait for initialization before handling requests
app.use(async (req, res, next) => {
  try {
    await initServer();
    next();
  } catch (err) {
    console.error('Initialization error:', err);
    res.status(500).json({ message: 'Server initialization failed' });
  }
});

// Export app for Vercel
export default app;
