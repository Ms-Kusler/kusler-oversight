import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
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

// ✅ Required behind Railway/other proxies so secure cookies work
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create PostgreSQL connection pool for session storage
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

app.use(
  session({
    store: new pgSession({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
    }),
    secret:
      process.env.SESSION_SECRET ||
      "operations-hub-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // requires trust proxy
      httpOnly: true,
      sameSite: "lax", // if API & frontend are on different domains, switch to 'none' and keep secure: true
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    name: "sessionId"
  })
);

// API request logger (compact)
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {}
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
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

  // Dev uses Vite middleware; prod serves built static files
  if (app.get("env") === "development") {
    const { setupVite, log } = await import("./vite");
    await setupVite(app, server);
    (globalThis as any).__viteLog = log;
  } else {
    // Production: serve static files with import.meta.dirname fallback
    const serverDir =
      typeof import.meta.dirname === "string"
        ? (import.meta as any).dirname
        : path.dirname(fileURLToPath(import.meta.url));

    const distPath = path.resolve(serverDir, "public");
    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`
      );
    }

    app.use(express.static(distPath));

    // SPA fallback
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // ALWAYS serve the app on the port specified in env PORT (default 5000)
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    async () => {
      const logFn = (globalThis as any).__viteLog || simpleLog;
      logFn(`serving on port ${port}`);
      await seedAdminUser();
      await seedDemoClient();
      startAutomations();
    }
  );

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    const logFn = (globalThis as any).__viteLog || simpleLog;
    logFn("SIGTERM signal received: closing HTTP server and database connections");
    server.close(() => {
      logFn("HTTP server closed");
    });
    await sessionPool.end();
    logFn("Database pool closed");
    process.exit(0);
  });
})();

