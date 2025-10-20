/**
 * Kusler Oversight - Financial Operations Dashboard
 * Copyright (c) 2025 Kusler Consulting. All rights reserved.
 * Proprietary and confidential.
 */

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { startAutomations } from "./automation";
import { seedAdminUser, seedDemoClient } from "./seed";

const { Pool } = pg;
const pgSession = connectPgSimple(session);

// Simple log function for production (vite.ts is only imported in development)
function simpleLog(msg: string) {
  const time = new Date().toLocaleTimeString("en-US", { 
    hour: "numeric", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: true 
  });
  console.log(`${time} [express] ${msg}`);
}

const app = express();

// Trust Railway's proxy for secure cookies to work correctly
app.set('trust proxy', 1);

// Security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Rate limiting for authentication endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to auth routes
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/change-password', authRateLimiter);

// Create PostgreSQL connection pool for session storage
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

app.use(session({
  store: new pgSession({
    pool: sessionPool,
    tableName: 'session',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  }),
  secret: process.env.SESSION_SECRET || 'operations-hub-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
  name: 'sessionId'
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      simpleLog(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { setupVite, log } = await import("./vite");
    await setupVite(app, server);
    // Use vite's log function in development
    (globalThis as any).__viteLog = log;
  } else {
    // Production: serve static files with import.meta.dirname fallback for Railway/bundled environments
    const serverDir = typeof import.meta.dirname === "string" 
      ? import.meta.dirname 
      : path.dirname(fileURLToPath(import.meta.url));
    
    const distPath = path.resolve(serverDir, "public");

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }

    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    const logFn = (globalThis as any).__viteLog || simpleLog;
    logFn(`serving on port ${port}`);
    
    try {
      await seedAdminUser();
      await seedDemoClient();
      startAutomations();
    } catch (error) {
      logFn(`⚠️  Startup error: ${error}`);
      logFn('Server is running but seeding/automations may have failed.');
      logFn('Please check environment variables (DATABASE_URL, ENCRYPTION_KEY)');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    const logFn = (globalThis as any).__viteLog || simpleLog;
    logFn('SIGTERM signal received: closing HTTP server and database connections');
    server.close(() => {
      logFn('HTTP server closed');
    });
    await sessionPool.end();
    logFn('Database pool closed');
    process.exit(0);
  });
})();
